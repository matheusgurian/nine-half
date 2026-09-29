// Isolated profile interactions; no real Firebase sessions are changed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/screens/ProfileScreen/index.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React }
}).outputText;

function harness(logout = async () => {}, authError = '') {
  const slots = [];
  let cursor = 0, calls = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], value => { slots[i] = value; }];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useEffect() {}, useMemo: factory => factory()
  };
  const module = { exports: {} };
  const requireMock = name => {
    if (name === 'react') return { ...react, default: react };
    if (name === 'react-native') return {
      View: 'View', Text: 'Text', Pressable: 'Pressable',
      StyleSheet: { create: value => value }, useWindowDimensions: () => ({ width: 375 }),
      Alert: { alert() { throw new Error('Logout must not depend on a native alert'); } }
    };
    if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
    if (name === 'expo-haptics') return {};
    if (name.endsWith('/useAuth')) return { useAuth: () => ({
      user: { uid: 'user', nome: 'Usuario' }, error: authError,
      logout: async () => { calls++; await logout(); }
    }) };
    if (name.endsWith('/useReservations')) return { useReservations: () => ({ reservations: [] }) };
    if (name.endsWith('/useTransactions')) return { useTransactions: () => ({ transactions: [] }) };
    if (name.endsWith('/errors')) return { getErrorMessage: error => error.message };
    if (name.endsWith('/routeNames')) return { ROUTES: {} };
    if (name.includes('/theme/')) return new Proxy({}, { get: () => ({}) });
    return { default: name.split('/').pop() };
  };
  vm.runInNewContext(source, { require: requireMock, module, exports: module.exports });
  const render = () => { cursor = 0; return module.exports.default({ navigation: {} }); };
  const nodes = node => !node || typeof node !== 'object' ? [] :
    [node, ...(node.children || []).flat(Infinity).flatMap(nodes)];
  const button = title => {
    const found = nodes(render()).find(node => node.props?.title === title);
    assert.ok(found, `Expected button: ${title}`);
    return found.props;
  };
  return { render, button, get calls() { return calls; } };
}

async function main() {
  const success = harness();
  success.button('ENCERRAR SESSÃO').onPress();
  assert.equal(success.calls, 0);
  success.button('CANCELAR').onPress();
  assert.equal(success.calls, 0);
  success.button('ENCERRAR SESSÃO').onPress();
  await success.button('SAIR DA CONTA').onPress();
  assert.equal(success.calls, 1);
  const failure = harness(async () => { throw new Error('Falha ao sair'); });
  failure.button('ENCERRAR SESSÃO').onPress();
  await failure.button('SAIR DA CONTA').onPress();
  assert.match(JSON.stringify(failure.render()), /Falha ao sair/);
  assert.equal(failure.button('SAIR DA CONTA').loading, false);
  await failure.button('SAIR DA CONTA').onPress();
  assert.equal(failure.calls, 2);
  let release;
  const pending = harness(() => new Promise(resolve => { release = resolve; }));
  pending.button('ENCERRAR SESSÃO').onPress();
  const click = pending.button('SAIR DA CONTA').onPress;
  const first = click();
  await click();
  assert.equal(pending.calls, 1);
  assert.equal(pending.button('SAIR DA CONTA').loading, true);
  assert.equal(pending.button('CANCELAR').disabled, true);
  release();
  await first;
  const remounted = harness(undefined, 'Falha persistida pelo AuthProvider');
  assert.match(JSON.stringify(remounted.render()), /Falha persistida pelo AuthProvider/);
  console.log('PASS: confirmation, cancel, logout, error/retry, double click, provider error');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
