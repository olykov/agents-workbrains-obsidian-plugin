import type { App, TFile } from 'obsidian';

import { normalizeStatus, normalizeType, TaskCard } from './domain';

const SKIPPED_DIRECTORIES = new Set(['sources', 'meetings', 'results', 'evidence', 'notes', '.git', '__pycache__', 'node_modules']);

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function unknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function relationArray(frontmatter: Record<string, unknown>, field: string): string[] {
  const direct = stringArray(frontmatter[field]);
  if (direct.length > 0) return direct;
  const relations =
    typeof frontmatter.relations === 'object' && frontmatter.relations !== null
      ? (frontmatter.relations as Record<string, unknown>)
      : {};
  return stringArray(relations[field]);
}

export function isCandidatePath(path: string, tasksRoot: string): boolean {
  const root = tasksRoot.replace(/^\/+|\/+$/g, '');
  const parts = path.split('/');
  if (parts.some((part) => SKIPPED_DIRECTORIES.has(part.toLocaleLowerCase()))) return false;
  const active = parts[0] === root && parts.length === 5 && parts[2] === 'tasks' && parts[4] === 'task.md';
  const archivedTask = parts[0] === 'archive' && parts.length === 4 && parts[3] === 'task.md';
  const archivedProjectTask = parts[0] === 'archive' && parts.length === 5 && parts[2] === 'tasks' && parts[4] === 'task.md';
  return active || archivedTask || archivedProjectTask;
}

export function readTask(app: App, file: TFile, tasksRoot: string): TaskCard | null {
  if (!isCandidatePath(file.path, tasksRoot)) return null;
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!frontmatter) return null;

  const status = normalizeStatus(frontmatter.status);
  const id = stringValue(frontmatter.id);
  const title = stringValue(frontmatter.title);
  if (!status || !id || !title) return null;

  const implementation =
    typeof frontmatter.implementation === 'object' && frontmatter.implementation !== null
      ? (frontmatter.implementation as Record<string, unknown>)
      : {};

  return {
    path: file.path,
    id,
    title,
    status,
    priority: stringValue(frontmatter.priority, 'medium'),
    type: normalizeType(frontmatter.type),
    epic: optionalString(frontmatter.epic),
    parent: optionalString(frontmatter.parent),
    project: optionalString(frontmatter.project),
    labels: stringArray(frontmatter.labels),
    assignee: optionalString(frontmatter.assignee),
    reporter: optionalString(frontmatter.reporter),
    model: optionalString(frontmatter.model),
    dependsOn: relationArray(frontmatter, 'depends_on'),
    blocks: relationArray(frontmatter, 'blocks'),
    related: relationArray(frontmatter, 'related'),
    commits: stringArray(frontmatter.commits),
    workspaces: unknownArray(implementation.workspaces),
    completionEvidence: unknownArray(frontmatter.completion_evidence),
    archived: file.path.startsWith('archive/'),
  };
}

export function loadTasks(app: App, tasksRoot: string): TaskCard[] {
  const tasks = app.vault
    .getMarkdownFiles()
    .map((file) => readTask(app, file, tasksRoot))
    .filter((task): task is TaskCard => task !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
  return tasks;
}
