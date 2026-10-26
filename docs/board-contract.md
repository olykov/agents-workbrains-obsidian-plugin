# Board contract — v2

The board reads the layout defined by Agents Workbrain v2:

- Projects: `02_work/<project>/project.md` and `archive/<project>/project.md`.
- Tasks: `02_work/<project>/tasks/<task>/task.md`, `archive/<project>/<task>/task.md`, and `archive/<project>/tasks/<task>/task.md` for whole-project archives.
- Task metadata uses scalar `project:` and `parent:`. Membership follows the physical project folder.
- Status order: `backlog`, `todo`, `in_progress`, `review`, `Blocked`, `Closed`, `Cancelled`.
- Archived tasks are excluded from the default view and open-task counts, regardless of their status. An archived whole project retains original statuses.
- Terminal status actions move the entire task folder to `archive/<project>/<task>/`. `Blocked` remains active. A failed archive move restores the original content and path.
- `Closed` requires a commit or completion evidence for a task without a code workspace; `Blocked` and `Cancelled` require a reason.
- Every status mutation updates timestamps and appends a dated comment. `sources/`, `meetings/`, `notes/`, and `results/` are optional task-local folders.

The task and project schemas in Agents Workbrain are normative. Change both packages and their tests together when the contract changes.
