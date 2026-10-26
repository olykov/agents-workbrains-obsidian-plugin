export const CANONICAL_STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'review',
  'Blocked',
  'Closed',
  'Cancelled',
] as const;

export type TaskStatus = (typeof CANONICAL_STATUSES)[number];
export type SwimlaneMode = 'project' | 'epic' | 'parent' | 'priority' | 'none';

export interface ProjectRecord {
  path: string;
  id: string;
  name: string;
  status: string;
}

export function visibleProjects(projects: ProjectRecord[], showArchived: boolean): ProjectRecord[] {
  return showArchived ? projects : projects.filter((project) => project.status !== 'archived');
}

export interface TaskCard {
  path: string;
  id: string;
  title: string;
  status: TaskStatus;
  priority: string;
  type: string;
  epic: string | null;
  parent: string | null;
  project: string | null;
  labels: string[];
  assignee: string | null;
  reporter: string | null;
  model: string | null;
  dependsOn: string[];
  blocks: string[];
  related: string[];
  commits: string[];
  workspaces: unknown[];
  completionEvidence: unknown[];
  archived: boolean;
}

export function normalizeStatus(value: unknown): TaskStatus | null {
  return CANONICAL_STATUSES.includes(value as TaskStatus) ? (value as TaskStatus) : null;
}

export function normalizeType(value: unknown): string {
  if (value === 'docs') return 'documentation';
  if (value === 'implementation') return 'feature';
  if (value === 'maintenance') return 'chore';
  return typeof value === 'string' && value ? value : 'chore';
}

export function swimlaneKeys(task: TaskCard, mode: SwimlaneMode): string[] {
  switch (mode) {
    case 'project':
      return [task.project || 'No project'];
    case 'epic':
      return [task.epic || 'No epic'];
    case 'parent':
      return [task.parent || 'Top-level'];
    case 'priority':
      return [task.priority || 'Unspecified'];
    case 'none':
      return ['All tasks'];
  }
}

export function matchesQuery(task: TaskCard, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return [
    task.id,
    task.title,
    task.priority,
    task.type,
    task.epic,
    task.parent,
    task.project,
    task.assignee,
    task.reporter,
    task.model,
    ...task.labels,
    ...task.dependsOn,
    ...task.blocks,
    ...task.related,
  ]
    .filter((value): value is string => typeof value === 'string')
    .some((value) => value.toLocaleLowerCase().includes(needle));
}

export function canMoveToClosed(task: TaskCard): boolean {
  if (task.commits.length > 0) return true;
  return task.workspaces.length === 0 && task.completionEvidence.length > 0;
}

export function isTerminal(status: TaskStatus): boolean {
  return status === 'Closed' || status === 'Cancelled';
}

export function appendAuditComment(content: string, timestamp: string, message: string): string {
  const block = `### ${timestamp} — agents-workbrain-kanban\n${message}\n`;
  const comments = /^## Comments\s*$/m.exec(content);
  if (!comments || comments.index === undefined) {
    return `${content.trimEnd()}\n\n## Comments\n\n${block}`;
  }

  const sectionStart = comments.index + comments[0].length;
  const nextSection = /^## (?!Comments\s*$).+$/m.exec(content.slice(sectionStart));
  const insertionPoint = nextSection?.index === undefined ? content.length : sectionStart + nextSection.index;
  const before = content.slice(0, insertionPoint).trimEnd();
  const after = content.slice(insertionPoint).trimStart();
  return after ? `${before}\n\n${block}\n${after}` : `${before}\n\n${block}`;
}

export function updateStatusContent(content: string, status: TaskStatus, timestamp: string, message: string): string {
  const match = /^---\n([\s\S]*?)\n---(?=\n|$)/.exec(content);
  if (!match) throw new Error('Task frontmatter is missing');
  let frontmatter = match[1]!;
  const setField = (field: string, value: string) => {
    const line = new RegExp(`^${field}:[^\\n]*$`, 'm');
    frontmatter = line.test(frontmatter)
      ? frontmatter.replace(line, `${field}: ${JSON.stringify(value)}`)
      : `${frontmatter}\n${field}: ${JSON.stringify(value)}`;
  };
  setField('status', status);
  setField('updated', timestamp);
  if (status === 'in_progress' && !/^start_date:\s*(?!null\s*$|["']?\s*$)/m.test(frontmatter)) {
    setField('start_date', timestamp);
  }
  if (isTerminal(status)) setField('finish_date', timestamp);
  return appendAuditComment(`---\n${frontmatter}\n---${content.slice(match[0].length)}`, timestamp, message);
}
