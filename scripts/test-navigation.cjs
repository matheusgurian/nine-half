// Isolated navigation interactions; no Firebase or browser session required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/layout/BottomNav/index.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React }
}).outputText;
const routesSource = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/app/routes/routeNames.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText;
const routesModule = { exports: {} };
vm.runInNewContext(routesSource, { exports: routesModule.exports });
const { ROUTES } = routesModule.exports;
let currentRoute = ROUTES.DASHBOARD;
let keyboardOpen = false;
const calls = [], listeners = {};
const react = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  useState: () => [keyboardOpen, value => { keyboardOpen = value; }],
  useEffect: callback => callback()
};
const moduleMock = { exports: {} };
const requireMock = name => {
  if (name === 'react') return { ...react, default: react };
  if (name === 'react-native') return {
    Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: value => value },
    Keyboard: { addListener: (event, callback) => { listeners[event] = callback; return { remove() {} }; } }
  };
  if (name === '@react-navigation/native') return {
    useNavigation: () => ({ navigate: destination => calls.push(destination) }),
    useRoute: () => ({ name: currentRoute })
  };
  if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ bottom: 0 }) };
  if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
  if (name.endsWith('/routeNames')) return { ROUTES };
  return { colors: {} };
};
vm.runInNewContext(source, { require: requireMock, exports: moduleMock.exports });
const render = () => moduleMock.exports.default();
const nodes = node => !node || typeof node !== 'object' ? [] : [node, ...(node.children || []).flat(Infinity).flatMap(nodes)];
let tabs = nodes(render()).filter(node => node.props.accessibilityRole === 'tab');
assert.equal(tabs.length, 5);
assert.equal(tabs[0].props.accessibilityState.selected, true);
tabs[0].props.onPress();
assert.equal(calls.length, 0, 'Current destination must not be pushed again');
tabs[1].props.onPress();
assert.deepEqual(calls, [ROUTES.GLOBAL_STOCK]);
currentRoute = ROUTES.PROFILE;
tabs = nodes(render()).filter(node => node.props.accessibilityRole === 'tab');
assert.equal(tabs[4].props.accessibilityState.selected, true);
for (const route of [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.CHECKOUT, ROUTES.PRODUCT_FORM, ROUTES.PRODUCT_DETAILS, ROUTES.CHAT_ROOM]) {
  currentRoute = route;
  assert.equal(render(), null, 'Dock must not intrude on focused flows: ' + route);
}
currentRoute = ROUTES.GLOBAL_STOCK;
render();
listeners.keyboardDidShow();
assert.equal(render(), null);
listeners.keyboardDidHide();
assert.ok(render());
console.log('PASS: destinations, selected tab, duplicate navigation, focused flows, keyboard');
