import type { App, TFile } from 'obsidian';

import { ProjectRecord } from './domain';

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function isProjectPath(path: string, projectsRoot: string): boolean {
  const root = projectsRoot.replace(/^\/+|\/+$/g, '');
  const parts = path.split('/');
  return parts.length === 3 && parts[2] === 'project.md' && (parts[0] === root || parts[0] === 'archive');
}

export function readProject(app: App, file: TFile, projectsRoot: string): ProjectRecord | null {
  if (!isProjectPath(file.path, projectsRoot)) return null;
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!frontmatter) return null;
  const id = stringValue(frontmatter.slug);
  const name = stringValue(frontmatter.name);
  if (!id || !name) return null;
  return { path: file.path, id, name, status: file.path.startsWith('archive/') ? 'archived' : stringValue(frontmatter.status, 'active') };
}

export function loadProjects(app: App, projectsRoot: string): ProjectRecord[] {
  return app.vault
    .getMarkdownFiles()
    .map((file) => readProject(app, file, projectsRoot))
    .filter((project): project is ProjectRecord => project !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}
