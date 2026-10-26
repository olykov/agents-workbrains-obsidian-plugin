import { App, PluginSettingTab, Setting } from 'obsidian';

import WorkbrainKanbanPlugin from './main';
import { SwimlaneMode } from './domain';

export interface WorkbrainKanbanSettings {
  tasksRoot: string;
  projectsRoot: string;
  defaultSwimlane: SwimlaneMode;
  showTerminalColumns: boolean;
  showArchivedTasks: boolean;
  allowStatusChanges: boolean;
}

export const DEFAULT_SETTINGS: WorkbrainKanbanSettings = {
  tasksRoot: '02_work',
  projectsRoot: '02_work',
  defaultSwimlane: 'project',
  showTerminalColumns: false,
  showArchivedTasks: false,
  allowStatusChanges: true,
};

export class WorkbrainKanbanSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: WorkbrainKanbanPlugin) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();

    new Setting(this.containerEl)
      .setName('Tasks root')
      .setDesc('Vault-relative folder containing canonical task files.')
      .addText((text) =>
        text.setValue(this.plugin.settings.tasksRoot).onChange(async (value) => {
          const normalized = value.replace(/^\/+|\/+$/g, '') || '02_work';
          this.plugin.settings.tasksRoot = normalized;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
        }),
      );

    new Setting(this.containerEl)
      .setName('Projects root')
      .setDesc('Vault-relative folder containing project.md manifests.')
      .addText((text) =>
        text.setValue(this.plugin.settings.projectsRoot).onChange(async (value) => {
          this.plugin.settings.projectsRoot = value.replace(/^\/+|\/+$/g, '') || '02_work';
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
        }),
      );

    new Setting(this.containerEl)
      .setName('Default swimlane')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({ project: 'Project', epic: 'Epic', parent: 'Parent', priority: 'Priority', none: 'None' })
          .setValue(this.plugin.settings.defaultSwimlane)
          .onChange(async (value) => {
            this.plugin.settings.defaultSwimlane = value as SwimlaneMode;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          }),
      );

    new Setting(this.containerEl)
      .setName('Show terminal columns by default')
      .setDesc('Show Closed and Cancelled when the board opens.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showTerminalColumns).onChange(async (value) => {
          this.plugin.settings.showTerminalColumns = value;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
        }),
      );

    new Setting(this.containerEl)
      .setName('Show archived tasks by default')
      .setDesc('Show tasks from the archive folder.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showArchivedTasks).onChange(async (value) => {
          this.plugin.settings.showArchivedTasks = value;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
        }),
      );

    new Setting(this.containerEl)
      .setName('Allow status changes')
      .setDesc('Enable guarded drag-and-drop and status selects.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.allowStatusChanges).onChange(async (value) => {
          this.plugin.settings.allowStatusChanges = value;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
        }),
      );
  }
}
