# Agents Workbrain Kanban

An optional Obsidian interface for the single `~/workbrain` vault created by
[Agents Workbrain](https://github.com/olykov/agents-workbrain). Markdown project and task files
remain canonical; this plugin only reads and updates that existing model.

## Contract

- Projects are `02_projects/<slug>/project.md`.
- Tasks are `02_tasks/<slug>/task.md` and require at least one project in `projects[]`.
- Status columns follow the Agents Workbrain schema: `backlog`, `todo`, `in_progress`, `review`,
  `blocked`, `done`, and `cancelled`.
- Swimlanes group by project, parent, priority, or not at all.
- Terminal tasks are hidden by default. Archived projects can be shown explicitly.
- Cards open the canonical task file and can update status through drag-and-drop or a select.
- Every status change updates lifecycle timestamps and appends a dated audit comment.
- Moving to `done` requires non-empty `completion_evidence`.

The plugin does not create or move a vault, create a second board file, or depend on Dataview. Open
`~/workbrain` as an existing Obsidian vault before installing it.

## Development

```bash
npm install
npm run check
```

Manual installation requires the production build outputs in:

```text
~/workbrain/.obsidian/plugins/agents-workbrain-kanban/
├── manifest.json
├── main.js
└── styles.css
```

Building this repository does not install it into a vault.
