import type { App, TFile } from 'obsidian';

import { normalizePriority, normalizeStatus, normalizeType, TaskCard } from './domain';

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

export function isCandidatePath(path: string, tasksRoot: string): boolean {
  const root = tasksRoot.replace(/^\/+|\/+$/g, '');
  if (!path.startsWith(`${root}/`)) return false;
  const relative = path.slice(root.length + 1);
  const parts = relative.split('/');
  return parts.length === 2 && Boolean(parts[0]) && parts[1] === 'task.md';
}

export function readTask(app: App, file: TFile, tasksRoot: string): TaskCard | null {
  if (!isCandidatePath(file.path, tasksRoot)) return null;
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!frontmatter) return null;

  const status = normalizeStatus(frontmatter.status);
  const priority = normalizePriority(frontmatter.priority);
  const type = normalizeType(frontmatter.type);
  const id = stringValue(frontmatter.id);
  const title = stringValue(frontmatter.title);
  const projects = stringArray(frontmatter.projects);
  if (frontmatter.schema_version !== 1 || !status || !priority || !type || !id || !title || projects.length === 0) {
    return null;
  }

  return {
    path: file.path,
    id,
    title,
    status,
    priority,
    type,
    parent: optionalString(frontmatter.parent),
    projects,
    labels: stringArray(frontmatter.labels),
    assignee: optionalString(frontmatter.assignee),
    reporter: optionalString(frontmatter.reporter),
    completionEvidence: unknownArray(frontmatter.completion_evidence),
  };
}

export function loadTasks(app: App, tasksRoot: string): TaskCard[] {
  return app.vault
    .getMarkdownFiles()
    .map((file) => readTask(app, file, tasksRoot))
    .filter((task): task is TaskCard => task !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
}
