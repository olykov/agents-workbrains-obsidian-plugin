import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendAuditComment,
  canMoveToClosed,
  matchesQuery,
  normalizeStatus,
  normalizeType,
  swimlaneKeys,
  TaskCard,
  updateStatusContent,
  visibleProjects,
} from '../src/domain';
import { isCandidatePath } from '../src/task-index';
import { isProjectPath } from '../src/project-index';

const task: TaskCard = {
  path: '02_work/example/tasks/ex_0001/task.md',
  id: 'EX-0001',
  title: 'Example task',
  status: 'in_progress',
  priority: 'high',
  type: 'feature',
  epic: 'board',
  parent: null,
  project: 'example',
  labels: ['ui'],
  assignee: null,
  reporter: 'demo_user',
  model: null,
  dependsOn: [],
  blocks: [],
  related: [],
  commits: [],
  workspaces: [],
  completionEvidence: [],
  archived: false,
};

test('uses the migrated status names', () => {
  assert.equal(normalizeStatus('Closed'), 'Closed');
  assert.equal(normalizeStatus('done'), null);
  assert.equal(normalizeStatus('unknown'), null);
});

test('normalizes canonical type aliases', () => {
  assert.equal(normalizeType('docs'), 'documentation');
  assert.equal(normalizeType('implementation'), 'feature');
  assert.equal(normalizeType('maintenance'), 'chore');
});

test('groups tasks into requested swimlanes', () => {
  assert.deepEqual(swimlaneKeys(task, 'project'), ['example']);
  assert.deepEqual(swimlaneKeys(task, 'epic'), ['board']);
  assert.deepEqual(swimlaneKeys(task, 'parent'), ['Top-level']);
  assert.deepEqual(swimlaneKeys(task, 'priority'), ['high']);
});

test('filters across identifiers and metadata', () => {
  assert.equal(matchesQuery(task, 'EX-0001'), true);
  assert.equal(matchesQuery(task, 'UI'), true);
  assert.equal(matchesQuery(task, 'missing'), false);
});

test('discovers active and archived task folders only', () => {
  assert.equal(isCandidatePath('02_work/example/tasks/ex_0001/task.md', '02_work'), true);
  assert.equal(isCandidatePath('archive/example/ex_0002/task.md', '02_work'), true);
  assert.equal(isCandidatePath('archive/example/tasks/ex_0003/task.md', '02_work'), true);
  assert.equal(isCandidatePath('02_work/example/tasks/ex_0001/notes/old.md', '02_work'), false);
  assert.equal(isCandidatePath('02_tasks/example/task.md', '02_work'), false);
});

test('discovers project manifests separately from tasks', () => {
  assert.equal(isProjectPath('02_work/sample_project/project.md', '02_work'), true);
  assert.equal(isProjectPath('archive/sample_project/project.md', '02_work'), true);
  assert.equal(isProjectPath('02_work/sample_project/tasks/task.md', '02_work'), false);
});

test('hides archived projects until archived content is requested', () => {
  const projects = [
    { path: '02_work/active/project.md', id: 'active', name: 'Active', status: 'active' },
    { path: 'archive/old/project.md', id: 'old', name: 'Old', status: 'archived' },
  ];
  assert.deepEqual(visibleProjects(projects, false).map((project) => project.id), ['active']);
  assert.deepEqual(visibleProjects(projects, true).map((project) => project.id), ['active', 'old']);
});

test('guards Closed without a valid evidence path', () => {
  assert.equal(canMoveToClosed(task), false);
  assert.equal(canMoveToClosed({ ...task, commits: ['abcdef0'] }), true);
  assert.equal(canMoveToClosed({ ...task, completionEvidence: ['reviewed'] }), true);
  assert.equal(
    canMoveToClosed({ ...task, workspaces: [{ path: '/tmp/repo' }], completionEvidence: ['reviewed'] }),
    false,
  );
});

test('updates status and appends its audit entry in one content transformation', () => {
  const before = '---\nstatus: todo\nupdated: "old"\nfinish_date: null\n---\n\n## Comments\n\nOld comment.\n';
  const after = updateStatusContent(before, 'Closed', '2026-10-26T08:00:00Z', 'Closed by user.');
  assert.match(after, /^status: "Closed"$/m);
  assert.match(after, /^finish_date: "2026-10-26T08:00:00Z"$/m);
  assert.match(after, /Old comment\.\n\n### 2026-10-26T08:00:00Z — agents-workbrain-kanban\nClosed by user\./);
});

test('appends audit comments inside the comments section', () => {
  const content = '# Task\n\n## Comments\n\nOld comment.\n\n## Appendix\n\nKeep me.';
  const result = appendAuditComment(content, '2026-09-23T10:00:00Z', 'Status changed.');
  assert.match(
    result,
    /Old comment\.\n\n### 2026-09-23T10:00:00Z — agents-workbrain-kanban\nStatus changed\.\n\n## Appendix/,
  );
});

test('creates a comments section when missing', () => {
  const result = appendAuditComment('# Task', '2026-09-23T10:00:00Z', 'Status changed.');
  assert.match(result, /## Comments\n\n### 2026-09-23T10:00:00Z/);
});
