# Architecture: canonical Workbrain files, optional Obsidian view

## Context

Agents Workbrain creates one portable Markdown vault at `~/workbrain`. Its project and task files
must remain useful without Obsidian or this plugin.

## Decision

Agents Workbrain Kanban is a thin Obsidian view over the canonical files created by Agents
Workbrain. It discovers only `02_projects/<slug>/project.md` and
`02_tasks/<slug>/task.md`; it never creates a second task database or board document.

- Status is the horizontal axis.
- Project, parent, priority, or no grouping can be the swimlane axis.
- Every permitted status mutation updates lifecycle frontmatter and appends an audit comment.
- `done` requires `completion_evidence`; blocked and cancelled transitions require a reason.
- The plugin has no Dataview dependency.

## Consequences

The board refreshes from Obsidian metadata and vault events. Agents and people can continue to use
the same Markdown files directly. Changes to the Agents Workbrain task or project schema require a
matching update to this plugin and its tests.
