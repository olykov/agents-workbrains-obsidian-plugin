import { App, PluginSettingTab, Setting } from 'obsidian';

import WorkbrainKanbanPlugin from './main';
import { SwimlaneMode } from './domain';

export interface WorkbrainKanbanSettings {
  defaultSwimlane: SwimlaneMode;
  showTerminalColumns: boolean;
  showArchivedProjects: boolean;
  allowStatusChanges: boolean;
}

export const TASKS_ROOT = '02_tasks';
export const PROJECTS_ROOT = '02_projects';

export const DEFAULT_SETTINGS: WorkbrainKanbanSettings = {
  defaultSwimlane: 'project',
  showTerminalColumns: false,
  showArchivedProjects: false,
  allowStatusChanges: true,
};

export class WorkbrainKanbanSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: WorkbrainKanbanPlugin) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();

    new Setting(this.containerEl)
      .setName('Default swimlane')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({ project: 'Project', parent: 'Parent', priority: 'Priority', none: 'None' })
          .setValue(this.plugin.settings.defaultSwimlane)
          .onChange(async (value) => {
            this.plugin.settings.defaultSwimlane = value as SwimlaneMode;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          }),
      );

    new Setting(this.containerEl)
      .setName('Show terminal columns by default')
      .setDesc('Show done and cancelled when the board opens.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showTerminalColumns).onChange(async (value) => {
          this.plugin.settings.showTerminalColumns = value;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
        }),
      );

    new Setting(this.containerEl)
      .setName('Show archived projects by default')
      .setDesc('Include archived project manifests in the project filter.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showArchivedProjects).onChange(async (value) => {
          this.plugin.settings.showArchivedProjects = value;
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
