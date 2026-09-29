// Isolated interaction checks: no Firebase connection or real reservations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const filename = path.join(__dirname, '../src/screens/ProductDetailsScreen/index.tsx');
const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React }
}).outputText;

function harness({ user, reserve = async () => ({}), status = 'disponivel' }) {
  const slots = [];
  let cursor = 0;
  const calls = [];
  const navigation = [];
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect() {}
  };
  const module = { exports: {} };
  const requireMock = name => {
    if (name === 'react') return { ...react, default: react };
    if (name === 'react-native') return {
      View: 'View', Text: 'Text', Image: 'Image', Pressable: 'Pressable', ScrollView: 'ScrollView',
      StyleSheet: { create: value => value }, useWindowDimensions: () => ({ width: 375 })
    };
    if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
    if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ bottom: 0 }) };
    if (name === 'expo-haptics') return {};
    if (name.endsWith('/useAuth')) return { useAuth: () => ({ user }) };
    if (name.endsWith('/useProducts')) return { useProducts: () => ({
      selectedProduct: { id: 'product', ownerId: 'seller', status }, loading: false,
      loadProductById: async () => {}
    }) };
    if (name.endsWith('/useReservations')) return { useReservations: () => ({
      loading: false,
      reserveProduct: async args => { calls.push(args); return reserve(args); }
    }) };
    if (name.endsWith('/routeNames')) return { ROUTES: {
      PROFILE: 'Profile', MY_RESERVATIONS: 'MyReservations', GLOBAL_STOCK: 'GlobalStock'
    } };
    if (name.endsWith('/productStatus')) return { PRODUCT_STATUS: {
      AVAILABLE: 'disponivel', RESERVED: 'reservado', SOLD: 'vendido'
    } };
    if (name.endsWith('/errors')) return { getErrorMessage: error => error.message };
    if (name.endsWith('/formatters')) return { formatCurrencyBRL: () => '', formatSizeBR: () => '' };
    if (name.includes('/theme/')) return new Proxy({}, { get: () => ({}) });
    if (name.endsWith('/userService')) return {};
    return { default: name.split('/').pop() };
  };
  vm.runInNewContext(source, { require: requireMock, module, exports: module.exports });
  const render = () => {
    cursor = 0;
    return module.exports.default({
      route: { params: { productId: 'product' } },
      navigation: { navigate: route => navigation.push(route) }
    });
  };
  const nodes = node => !node || typeof node !== 'object' ? [] :
    [node, ...(node.children || []).flat(Infinity).flatMap(nodes)];
  const button = title => {
    const found = nodes(render()).find(node => node.props?.title === title);
    assert.ok(found, `Expected visible button: ${title}`);
    return found.props;
  };
  return { render, button, calls, navigation };
}

async function main() {
  const completeUser = { uid: 'buyer', documento: 'document', endereco: 'address', telefone: 'phone' };
  const incomplete = harness({ user: { uid: 'buyer' } });
  await incomplete.button('RESERVAR AGORA').onPress();
  assert.equal(incomplete.calls.length, 0);
  assert.match(JSON.stringify(incomplete.render()), /CPF\/CNPJ.*Endereço.*WhatsApp/);
  incomplete.button('COMPLETAR MEU PERFIL').onPress();
  assert.deepEqual(incomplete.navigation, ['Profile']);

  const success = harness({ user: completeUser });
  await success.button('RESERVAR AGORA').onPress();
  assert.equal(success.calls.length, 1);
  assert.equal(success.calls[0].productId, 'product');
  assert.equal(success.calls[0].buyerId, 'buyer');
  assert.match(JSON.stringify(success.render()), /Reserva confirmada/);
  success.button('VER MINHAS RESERVAS').onPress();
  assert.deepEqual(success.navigation, ['MyReservations']);

  const failure = harness({ user: completeUser, reserve: async () => { throw new Error('Sem conexão'); } });
  await failure.button('RESERVAR AGORA').onPress();
  assert.match(JSON.stringify(failure.render()), /Sem conexão/);
  await failure.button('RESERVAR AGORA').onPress();
  assert.equal(failure.calls.length, 2, 'A failed request must allow retry');

  let release;
  const pending = harness({ user: completeUser, reserve: () => new Promise(resolve => { release = resolve; }) });
  const click = pending.button('RESERVAR AGORA').onPress;
  const first = click();
  await click();
  assert.equal(pending.calls.length, 1, 'Double click must not create concurrent reservations');
  release({});
  await first;

  const reserved = harness({ user: completeUser, status: 'reservado' });
  assert.equal(reserved.button('SNEAKER RESERVADO').disabled, true);
  console.log('PASS: incomplete profile, success, error/retry, double click, reserved product');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
