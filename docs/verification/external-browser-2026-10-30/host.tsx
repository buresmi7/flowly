// Test-only host boundary. Production components, queries, parsing and handlers are real.
import { Text, View, Pressable } from 'react-native-web';
export { ScrollView, TextInput } from 'react-native-web';

export const state = window.fixture = {
  calls: [], toasts: [], reads: [], legacy: [], failOpen: false, failRead: false, inClick: false,
};
window.addEventListener('click', () => { state.inClick = true; }, true);
window.addEventListener('click', () => { state.inClick = false; });
export function openExternalUrl(url) {
  state.calls.push({ url, duringClick: state.inClick });
  return state.failOpen ? Promise.reject(new Error('Fixture opener unavailable')) : Promise.resolve();
}
export const Linking = {
  openURL(url) {
    state.legacy.push(url);
    return Promise.reject(new Error('Legacy Linking must not open external links'));
  },
};
const readers = {
  'connectors.connections': async () => ({ connections: [] }),
  'connectors.card': async () => ({ items: [], removed: [] }),
  'artifacts.status': async () => ({ missing: [] }),
  'connectors.read': async () => {
    if (state.failRead) throw new Error('This connection was removed.');
    return { markdown: '## Browser links\nKeep external issue links in the system browser.', stale: false, fetchedAt: new Date().toISOString() };
  },
  'artifacts.preview': async () => ({ type: 'text', text: 'Local file preview stays in Flowly.', markdown: false, size: 40 }),
};
const calls = new Map();
export function useRpc(contract) {
  if (!calls.has(contract.name)) calls.set(contract.name, async (input) => {
    state.reads.push(contract.name);
    if (!readers[contract.name]) throw new Error(`Unexpected fixture RPC: ${contract.name}`);
    return readers[contract.name](input);
  });
  return calls.get(contract.name);
}
export function usePaseo() { throw new Error('No daemon connection in this fixture'); }
export function useSettings() { throw new Error('No settings writes in this fixture'); }
const toast = { show(text, options) { state.toasts.push({ text, ...options }); } };
export const useToast = () => toast;
// Host chrome is deliberately a simple labelled panel, not a replica of Paseo.
export function Modal({ open, title, children, onOpenChange }) {
  return open ? <View accessibilityRole="dialog" accessibilityLabel={title} style={{ padding: 16, gap: 12, borderWidth: 1, borderColor: '#ccd3df', borderRadius: 8, backgroundColor: '#fff' }}>
    <Text style={{ fontSize: 11, color: '#667085' }}>Host modal fixture</Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: '600' }}>{title}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Close preview" onPress={() => onOpenChange(false)}><Text>×</Text></Pressable>
    </View>{children}
  </View> : null;
}
Modal.Content = ({ children }) => <View>{children}</View>;
export function Icon({ name, size = 14, color }) {
  const glyph = { ExternalLink: '↗', Plus: '+', X: '×', Pencil: '✎', Link: '↗', User: '◉', ChevronDown: '⌄', FileText: '▤', RefreshCw: '↻' }[name] || '·';
  return <Text aria-hidden style={{ fontSize: size, color }}>{glyph}</Text>;
}
