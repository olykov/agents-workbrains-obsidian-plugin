import assert from 'node:assert/strict';
import test from 'node:test';

import { applyStatusTransition } from '../src/task-transition';

const original = '---\nstatus: todo\nupdated: "old"\nfinish_date: null\n---\n\n## Comments\n\nExisting history.\n';
const time = '2026-10-26T08:00:00Z';

test('Closed updates the card and archives its folder', async () => {
  let content = original;
  let location = '02_work/example/tasks/ex_0001';
  await applyStatusTransition('Closed', time, 'Closed by user.', {
    read: async () => content,
    write: async (value) => { content = value; },
    moveToArchive: async () => { location = 'archive/example/ex_0001'; },
    restorePath: async () => { location = '02_work/example/tasks/ex_0001'; },
  });
  assert.equal(location, 'archive/example/ex_0001');
  assert.match(content, /^status: "Closed"$/m);
  assert.match(content, /Existing history\.\n\n### .*Closed by user\./s);
});

test('failed archive restores both location and original card bytes', async () => {
  let content = original;
  let location = '02_work/example/tasks/ex_0001';
  await assert.rejects(
    applyStatusTransition('Cancelled', time, 'Cancelled by user.', {
      read: async () => content,
      write: async (value) => { content = value; },
      moveToArchive: async () => { location = 'archive/example/ex_0001'; throw new Error('move failed'); },
      restorePath: async () => { location = '02_work/example/tasks/ex_0001'; },
    }),
    /move failed/,
  );
  assert.equal(location, '02_work/example/tasks/ex_0001');
  assert.equal(content, original);
});
