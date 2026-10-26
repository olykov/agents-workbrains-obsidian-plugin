# Agents Workbrain Kanban

An optional Obsidian board for the portable Markdown vault created by [Agents Workbrain](https://github.com/olykov/agents-workbrain). It reads canonical `project.md` and `task.md` files; it does not create a second task database or require Dataview.

## Current layout

- Active projects: `02_work/<project>/project.md`.
- Active tasks: `02_work/<project>/tasks/<task>/task.md`.
- Tasks without a project: `02_work/_no_project/tasks/<task>/task.md`.
- Individually archived tasks: `archive/<project>/<task>/task.md`.
- Whole archived projects: `archive/<project>/project.md` and their `tasks/` subtree.
- Scalar `project:` and `parent:` fields; child ID levels use `DEMO-0001-001` and `DEMO-0001-001-01`.

The board filters by project, parent, epic or priority. Archive content is hidden by default and can be shown explicitly. Dragging a task to `Closed` or `Cancelled` updates its status and moves its whole folder into `archive/`. `Blocked` keeps the task active. Closing requires a commit or completion evidence for a task without a code workspace. A cancelled or blocked transition asks for a reason. Archived projects retain their task statuses.

## Development and demo

```bash
npm install
npm run check
```

The tests include generic task and project fixtures plus closure and rollback scenarios. For an end-to-end Markdown vault demo, run `node plugins/agents-workbrain/tests/demo.mjs` in the [Agents Workbrain](https://github.com/olykov/agents-workbrain) repository; it creates and removes a temporary sample vault. Pass `--keep` to print a sample vault path that can be opened in Obsidian for a board demo. Open that repository's generated layout contract alongside this board's tests before updating either package.

A production build yields `main.js`, `manifest.json`, and `styles.css`. To install manually, place them under `<vault>/.obsidian/plugins/agents-workbrain-kanban/`. Building does not install or enable this plugin in any vault.

Version 0.2 expects the v2 layout. Migrate an existing v1 vault before switching its board to this version.
