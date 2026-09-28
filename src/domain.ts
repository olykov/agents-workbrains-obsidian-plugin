export const CANONICAL_STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'review',
  'blocked',
  'done',
  'cancelled',
] as const;

export const CANONICAL_TYPES = [
  'research',
  'discovery',
  'feature',
  'bug-fix',
  'refactor',
  'chore',
  'incident',
  'documentation',
] as const;

export const CANONICAL_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;

export type TaskStatus = (typeof CANONICAL_STATUSES)[number];
export type TaskType = (typeof CANONICAL_TYPES)[number];
export type TaskPriority = (typeof CANONICAL_PRIORITIES)[number];
export type SwimlaneMode = 'project' | 'parent' | 'priority' | 'none';

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
  priority: TaskPriority;
  type: TaskType;
  parent: string | null;
  projects: string[];
  labels: string[];
  assignee: string | null;
  reporter: string | null;
  completionEvidence: unknown[];
}

export function normalizeStatus(value: unknown): TaskStatus | null {
  return CANONICAL_STATUSES.includes(value as TaskStatus) ? (value as TaskStatus) : null;
}

export function normalizeType(value: unknown): TaskType | null {
  return CANONICAL_TYPES.includes(value as TaskType) ? (value as TaskType) : null;
}

export function normalizePriority(value: unknown): TaskPriority | null {
  return CANONICAL_PRIORITIES.includes(value as TaskPriority) ? (value as TaskPriority) : null;
}

export function swimlaneKeys(task: TaskCard, mode: SwimlaneMode): string[] {
  switch (mode) {
    case 'project':
      return task.projects.length ? task.projects : ['No project'];
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
    task.parent,
    ...task.projects,
    task.assignee,
    task.reporter,
    ...task.labels,
  ]
    .filter((value): value is string => typeof value === 'string')
    .some((value) => value.toLocaleLowerCase().includes(needle));
}

export function canMoveToDone(task: TaskCard): boolean {
  return task.completionEvidence.length > 0;
}

export function isTerminal(status: TaskStatus): boolean {
  return status === 'done' || status === 'cancelled';
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
