# Architecture

Agents Workbrain Kanban is a thin Obsidian view over canonical Markdown files. It discovers v2 project and task paths in `02_work/` and `archive/`; no board document or secondary task database is created.

Status is the horizontal axis. Project, parent, epic, priority, or no grouping can be the swimlane axis. The view refreshes from Obsidian metadata and vault events. Status changes update task frontmatter and an audit comment. Terminal transitions also move the task folder; the transition helper restores the original path and content when moving fails. `Blocked` and `Cancelled` require a reason. The plugin has no Dataview dependency.

Public tests use generic fixtures. Local production vaults and their contents are outside this repository.
