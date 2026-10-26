import { Plugin, TAbstractFile, TFile, WorkspaceLeaf } from 'obsidian';

import { WorkbrainKanbanView, WORKBRAIN_KANBAN_VIEW } from './board-view';
import { loadTasks } from './task-index';
import { loadProjects } from './project-index';
import {
  DEFAULT_SETTINGS,
  WorkbrainKanbanSettings,
  WorkbrainKanbanSettingTab,
} from './settings';

export default class WorkbrainKanbanPlugin extends Plugin {
  settings: WorkbrainKanbanSettings = DEFAULT_SETTINGS;
  private refreshTimer: number | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerView(
      WORKBRAIN_KANBAN_VIEW,
      (leaf: WorkspaceLeaf) => new WorkbrainKanbanView(leaf, this),
    );

    this.addRibbonIcon('columns-3', 'Open Workbrain Kanban', () => {
      void this.activateView();
    });
    this.addCommand({
      id: 'open-agents-workbrain-kanban',
      name: 'Open task board',
      callback: () => void this.activateView(),
    });
    this.addSettingTab(new WorkbrainKanbanSettingTab(this.app, this));

    this.registerEvent(this.app.metadataCache.on('changed', () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on('create', (file) => this.onVaultChange(file)));
    this.registerEvent(this.app.vault.on('delete', (file) => this.onVaultChange(file)));
    this.registerEvent(this.app.vault.on('rename', (file) => this.onVaultChange(file)));
  }

  onunload(): void {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.app.workspace.detachLeavesOfType(WORKBRAIN_KANBAN_VIEW);
  }

  getTasks() {
    return loadTasks(this.app, this.settings.tasksRoot);
  }

  getProjects() {
    return loadProjects(this.app, this.settings.projectsRoot);
  }

  refreshViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(WORKBRAIN_KANBAN_VIEW)) {
      if (leaf.view instanceof WorkbrainKanbanView) leaf.view.refresh();
    }
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (this.settings.tasksRoot === '02_tasks') this.settings.tasksRoot = '02_work';
    if (this.settings.projectsRoot === '02_projects') this.settings.projectsRoot = '02_work';
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private onVaultChange(file: TAbstractFile): void {
    if (file instanceof TFile && file.extension === 'md') this.scheduleRefresh();
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      this.refreshViews();
    }, 150);
  }

  private async activateView(): Promise<void> {
    let leaf = this.app.workspace.getLeavesOfType(WORKBRAIN_KANBAN_VIEW)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf('tab');
      await leaf.setViewState({ type: WORKBRAIN_KANBAN_VIEW, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }
}
