import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import { TaskArtifacts } from '../../../client/task-artifacts';
import { SessionMarkdown } from '../../../client/session-content';
import { CardDetailContext } from '../../../client/card-detail-query';
import { Theme, Label } from '../../../client/ui';

const task = { id: 'fixture-task', projectId: 'fixture-project', workspaceId: 'fixture-workspace' };
const common = { taskId: task.id, role: 'input', createdBy: 'user', createdAt: '2026-10-30T00:00:00Z', updatedAt: '2026-10-30T00:00:00Z', note: '' };
const artifacts = [
  { ...common, id: 'url', kind: 'url', title: 'Paseo documentation', target: 'https://paseo.sh/docs?source=flowly#links' },
  { ...common, id: 'external', kind: 'url', title: 'GitHub issue #42', target: 'https://github.com/example/project/issues/42', external: { connectionId: 'fixture', provider: 'github', key: 'example/project#42', remoteId: '42', itemType: 'issue' } },
  { ...common, id: 'file', kind: 'file', title: 'Implementation notes', target: 'notes.txt' },
];
const theme = { colors: { surface0: '#ffffff', surface1: '#f6f8fa', surface2: '#edf1f5', border: '#d0d7de', foreground: '#1f2328', foregroundMuted: '#636c76', accent: '#0969da', accentForeground: '#ffffff', statusSuccess: '#1a7f37', statusWarning: '#9a6700', statusDanger: '#cf222e' } };
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const detail = { artifacts, task };
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={client}>
    <Theme.Provider value={theme}>
      <CardDetailContext.Provider value={{ hostId: 'fixture', detail, pending: false, error: null, indexError: null, retry() {}, retryIndex() {} }}>
        <View style={{ padding: 20, gap: 20, backgroundColor: theme.colors.surface0, minHeight: '100%' }}>
          <Label bold size={18}>Flowly — external browser links</Label>
          <Label muted>Isolated component fixture · mocked Paseo host</Label>
          <TaskArtifacts task={task} active disabled={false} section={{ open: true, onToggle() {} }} />
          <View style={{ gap: 10, borderTopWidth: 1, borderColor: theme.colors.border, paddingTop: 16 }}>
            <Label bold>Session message</Label>
            <SessionMarkdown text={'Review [HTTPS reference](https://example.org/review?task=42#result) or [HTTP reference](http://example.org/help).\n\nUnsupported schemes: [Email contact](mailto:test@example.org) and [Local reference](file:///tmp/example.txt).'} />
          </View>
        </View>
      </CardDetailContext.Provider>
    </Theme.Provider>
  </QueryClientProvider>,
);
