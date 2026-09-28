# Board contract — v1

Agents Workbrain Kanban consumes the schema distributed by Agents Workbrain:

- Exact project path: `02_projects/<slug>/project.md`.
- Exact task path: `02_tasks/<slug>/task.md`.
- Status order: `backlog`, `todo`, `in_progress`, `review`, `blocked`, `done`, `cancelled`.
- Terminal tasks (`done`, `cancelled`) are hidden by default.
- Archived project manifests are omitted from the selector unless explicitly shown.
- Search covers id, title, priority, type, parent, projects, assignee, reporter, and labels.
- Swimlanes: project, parent, priority, or none. A many-to-many task appears in every matching
  project lane. Cards sort by priority and then id.
- A task can move to `done` only when `completion_evidence` is non-empty.
- Status mutations update `updated`, set `start_date` on first move to `in_progress`, set
  `finish_date` on move to `done`, and append a dated comment.

The task and project JSON schemas in Agents Workbrain are normative. Any schema change requires a
matching plugin and test update.
