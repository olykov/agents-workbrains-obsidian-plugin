import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendAuditComment,
  canMoveToDone,
  matchesQuery,
  normalizePriority,
  normalizeStatus,
  normalizeType,
  swimlaneKeys,
  TaskCard,
  visibleProjects,
} from '../src/domain';
import { isCandidatePath } from '../src/task-index';
import { isProjectPath } from '../src/project-index';

const task: TaskCard = {
  path: '02_tasks/example/task.md',
  id: 'EX-1',
  title: 'Example task',
  status: 'in_progress',
  priority: 'high',
  type: 'feature',
  parent: null,
  projects: ['PRJ-ONE', 'PRJ-TWO'],
  labels: ['ui'],
  assignee: null,
  reporter: 'example-user',
  completionEvidence: [],
};

test('accepts only canonical Agents Workbrain statuses', () => {
  assert.equal(normalizeStatus('todo'), 'todo');
  assert.equal(normalizeStatus('planned'), null);
  assert.equal(normalizeStatus('unknown'), null);
});

test('accepts only canonical Agents Workbrain types', () => {
  assert.equal(normalizeType('documentation'), 'documentation');
  assert.equal(normalizeType('docs'), null);
  assert.equal(normalizeType('implementation'), null);
});

test('accepts only canonical Agents Workbrain priorities', () => {
  assert.equal(normalizePriority('critical'), 'critical');
  assert.equal(normalizePriority('normal'), null);
});

test('groups tasks into requested swimlanes', () => {
  assert.deepEqual(swimlaneKeys(task, 'project'), ['PRJ-ONE', 'PRJ-TWO']);
  assert.deepEqual(swimlaneKeys(task, 'parent'), ['Top-level']);
  assert.deepEqual(swimlaneKeys(task, 'priority'), ['high']);
});

test('filters across identifiers and metadata', () => {
  assert.equal(matchesQuery(task, 'EX-1'), true);
  assert.equal(matchesQuery(task, 'UI'), true);
  assert.equal(matchesQuery(task, 'missing'), false);
});

test('discovers only the canonical Agents Workbrain task path', () => {
  assert.equal(isCandidatePath('02_tasks/example/task.md', '02_tasks'), true);
  assert.equal(isCandidatePath('02_tasks/example/subtasks/child.md', '02_tasks'), false);
  assert.equal(isCandidatePath('02_tasks/example/nested/task.md', '02_tasks'), false);
  assert.equal(isCandidatePath('02_tasks/example/other.md', '02_tasks'), false);
  assert.equal(isCandidatePath('02_tasks/example/notes/not-a-task.md', '02_tasks'), false);
  assert.equal(isCandidatePath('02_tasks/example/README.md', '02_tasks'), false);
  assert.equal(isCandidatePath('02_tasks/example/_index.md', '02_tasks'), false);
});

test('discovers project manifests separately from tasks', () => {
  assert.equal(isProjectPath('02_projects/example_project/project.md', '02_projects'), true);
  assert.equal(isProjectPath('02_projects/group/example_project/project.md', '02_projects'), false);
  assert.equal(isProjectPath('02_tasks/example_project/task.md', '02_projects'), false);
});

test('hides archived projects until archived content is requested', () => {
  const projects = [
    { path: '02_projects/active/project.md', id: 'PRJ-ACTIVE', name: 'Active', status: 'active' },
    { path: '02_projects/old/project.md', id: 'PRJ-OLD', name: 'Old', status: 'archived' },
  ];
  assert.deepEqual(visibleProjects(projects, false).map((project) => project.id), ['PRJ-ACTIVE']);
  assert.deepEqual(visibleProjects(projects, true).map((project) => project.id), ['PRJ-ACTIVE', 'PRJ-OLD']);
});

test('guards done without a valid evidence path', () => {
  assert.equal(canMoveToDone(task), false);
  assert.equal(canMoveToDone({ ...task, completionEvidence: ['reviewed'] }), true);
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
