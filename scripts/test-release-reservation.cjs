const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/screens/MyReservationsScreen/index.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
function harness(cancel = async () => {}, uid = 'buyer', refresh = async () => {}) {
  const slots = []; let cursor = 0; const calls = []; const refreshes = [];
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], v => { slots[i] = v; }]; },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useMemo: fn => fn(), useCallback: fn => fn, useEffect() {}
  };
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, require(name) {
    if (name === 'react') return { ...react, default: react };
    if (name === 'react-native') return { View: 'View', Text: 'Text', FlatList: 'FlatList', Modal: 'Modal', Pressable: 'Pressable', StyleSheet: { create: v => v }, Alert: { alert() { throw Error('Native alert cannot confirm on web'); } } };
    if (name === '@react-navigation/native') return { useFocusEffect() {} };
    if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
    if (name.endsWith('/useAuth')) return { useAuth: () => ({ user: uid ? { uid } : null }) };
    if (name.endsWith('/useReservations')) return { useReservations: () => ({ reservations: [{ id: 'reservation', status: 'active' }], cancelReservation: async args => { calls.push(args); await cancel(); }, loadMyReservations: async id => { refreshes.push(id); await refresh(); } }) };
    if (name.endsWith('/useTransactions')) return { useTransactions: () => ({}) };
    if (name.endsWith('/reservationStatus')) return { RESERVATION_STATUS: { ACTIVE: 'active' } };
    if (name.endsWith('/paymentMethods')) return { PAYMENT_METHODS: {}, getPaymentMethodLabel: () => '' };
    if (name.endsWith('/errors')) return { getErrorMessage: err => err.message };
    if (name.includes('/theme/')) return new Proxy({}, { get: () => ({}) });
    return { default: name.split('/').pop() };
  } });
  function render() { cursor = 0; return module.exports.default(); }
  const nodes = node => !node || typeof node !== 'object' ? [] : [node, ...(node.children || []).flat(Infinity).flatMap(nodes)];
  const find = predicate => nodes(render()).find(predicate);
  const button = title => find(n => n.props.title === title).props;
  const modal = () => find(n => n.type === 'Modal').props;
  const open = () => find(n => n.type === 'FlatList').props.renderItem({ item: { id: 'reservation', productModel: 'Air', status: 'active' } }).props.onCancel({ id: 'reservation', productModel: 'Air' });
  return { render, button, modal, open, calls, refreshes };
}
(async () => {
  const h = harness(); h.open(); assert.equal(h.modal().visible, true); assert.equal(h.calls.length, 0);
  h.button('Manter reserva').onPress(); assert.equal(h.modal().visible, false); assert.equal(h.calls.length, 0);
  h.open(); h.modal().onRequestClose(); assert.equal(h.modal().visible, false);
  h.open(); await h.button('Confirmar liberação').onPress(); assert.equal(h.calls[0].reservationId, 'reservation'); assert.equal(h.calls[0].userId, 'buyer'); assert.equal(h.modal().visible, false); assert.deepEqual(h.refreshes, ['buyer']); assert.match(JSON.stringify(h.render()), /Reserva liberada/);
  const seller = harness(undefined, 'seller'); seller.open(); await seller.button('Confirmar liberação').onPress(); assert.equal(seller.calls[0].userId, 'seller');
  const bad = harness(async () => { throw Error('Sem conexão'); }); bad.open(); await bad.button('Confirmar liberação').onPress(); assert.equal(bad.modal().visible, true); assert.match(JSON.stringify(bad.render()), /Sem conexão/); await bad.button('Confirmar liberação').onPress(); assert.equal(bad.calls.length, 2);
  let release; const pending = harness(() => new Promise(resolve => { release = resolve; })); pending.open(); const click = pending.button('Confirmar liberação').onPress; const first = click(); await click(); assert.equal(pending.calls.length, 1); assert.equal(pending.button('Manter reserva').disabled, true); pending.modal().onRequestClose(); assert.equal(pending.modal().visible, true); release(); await first;
  const missing = harness(undefined, null); missing.open(); assert.equal(missing.modal().visible, false); assert.equal(missing.calls.length, 0);
  const stale = harness(undefined, 'buyer', async () => { throw Error('Refresh failed'); }); stale.open(); await stale.button('Confirmar liberação').onPress(); assert.equal(stale.modal().visible, false); assert.match(JSON.stringify(stale.render()), /Reserva liberada/);
  console.log('PASS: release confirmation, dismiss, buyer/seller, success, retry, double click, missing session, refresh failure');
})().catch(err => { console.error(err); process.exitCode = 1; });
