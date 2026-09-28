import type { App, TFile } from 'obsidian';

import { ProjectRecord } from './domain';

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function isProjectPath(path: string, projectsRoot: string): boolean {
  const root = projectsRoot.replace(/^\/+|\/+$/g, '');
  if (!path.startsWith(`${root}/`)) return false;
  const relative = path.slice(root.length + 1);
  const parts = relative.split('/');
  return parts.length === 2 && Boolean(parts[0]) && parts[1] === 'project.md';
}

export function readProject(app: App, file: TFile, projectsRoot: string): ProjectRecord | null {
  if (!isProjectPath(file.path, projectsRoot)) return null;
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!frontmatter) return null;
  const id = stringValue(frontmatter.project_id);
  const name = stringValue(frontmatter.name);
  const status = stringValue(frontmatter.status);
  if (
    frontmatter.schema_version !== 1 ||
    frontmatter.vault !== 'workbrain' ||
    !id ||
    !name ||
    !['active', 'paused', 'archived'].includes(status)
  ) return null;
  return { path: file.path, id, name, status };
}

export function loadProjects(app: App, projectsRoot: string): ProjectRecord[] {
  return app.vault
    .getMarkdownFiles()
    .map((file) => readProject(app, file, projectsRoot))
    .filter((project): project is ProjectRecord => project !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}
