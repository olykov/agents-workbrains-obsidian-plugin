import { ItemView, Notice, setIcon, TFile, WorkspaceLeaf } from 'obsidian';

import {
  appendAuditComment,
  CANONICAL_STATUSES,
  canMoveToDone,
  isTerminal,
  matchesQuery,
  swimlaneKeys,
  SwimlaneMode,
  TaskCard,
  TaskStatus,
  visibleProjects,
} from './domain';
import WorkbrainKanbanPlugin from './main';
import { TASKS_ROOT } from './settings';
import { StatusReasonModal } from './status-reason-modal';

export const WORKBRAIN_KANBAN_VIEW = 'agents-workbrain-kanban-view';

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In progress',
  review: 'Review',
  blocked: 'Blocked',
  done: 'Done',
  cancelled: 'Cancelled',
};

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export class WorkbrainKanbanView extends ItemView {
  private query = '';
  private swimlane: SwimlaneMode;
  private showTerminal: boolean;
  private showArchivedProjects: boolean;
  private selectedProject = '';
  private readonly collapsed = new Set<string>();

  constructor(leaf: WorkspaceLeaf, private readonly plugin: WorkbrainKanbanPlugin) {
    super(leaf);
    this.swimlane = plugin.settings.defaultSwimlane;
    this.showTerminal = plugin.settings.showTerminalColumns;
    this.showArchivedProjects = plugin.settings.showArchivedProjects;
  }

  getViewType(): string {
    return WORKBRAIN_KANBAN_VIEW;
  }

  getDisplayText(): string {
    return 'Agents Workbrain Kanban';
  }

  getIcon(): string {
    return 'columns-3';
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  refresh(): void {
    if (!this.containerEl.isConnected) return;
    this.render();
  }

  private render(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass('agents-workbrain-kanban');

    const tasks = this.plugin.getTasks();
    const projects = this.plugin.getProjects();
    const selectableProjects = visibleProjects(projects, this.showArchivedProjects);
    if (this.selectedProject && !selectableProjects.some((project) => project.id === this.selectedProject)) {
      this.selectedProject = '';
    }
    const visibleTasks = tasks.filter(
      (task) =>
        (!this.selectedProject || task.projects.includes(this.selectedProject)) &&
        (this.showTerminal || !isTerminal(task.status)) &&
        matchesQuery(task, this.query),
    );
    this.renderToolbar(root, tasks.length, visibleTasks.length, selectableProjects);

    if (tasks.length === 0) {
      this.renderEmpty(root);
      return;
    }

    const groups = new Map<string, TaskCard[]>();
    for (const task of visibleTasks) {
      for (const key of swimlaneKeys(task, this.swimlane)) {
        const group = groups.get(key) ?? [];
        group.push(task);
        groups.set(key, group);
      }
    }

    const board = root.createDiv({ cls: 'agents-workbrain-kanban-board' });
    for (const [name, groupTasks] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      this.renderSwimlane(board, name, groupTasks);
    }
  }

  private renderToolbar(
    root: HTMLElement,
    total: number,
    visible: number,
    projects: Array<{ id: string; name: string; status: string }>,
  ): void {
    const toolbar = root.createDiv({ cls: 'agents-workbrain-kanban-toolbar' });
    const identity = toolbar.createDiv({ cls: 'agents-workbrain-kanban-identity' });
    identity.createEl('h2', { text: 'Task board' });
    identity.createEl('span', { text: `${visible} of ${total}`, cls: 'agents-workbrain-kanban-count' });

    const controls = toolbar.createDiv({ cls: 'agents-workbrain-kanban-controls' });
    const search = controls.createEl('input', {
      attr: { type: 'search', placeholder: 'Filter tasks', 'aria-label': 'Filter tasks' },
      cls: 'agents-workbrain-kanban-search',
    });
    search.value = this.query;
    search.addEventListener('input', () => {
      this.query = search.value;
      this.render();
      const next = this.containerEl.querySelector<HTMLInputElement>('.agents-workbrain-kanban-search');
      next?.focus();
      next?.setSelectionRange(this.query.length, this.query.length);
    });

    const projectSelect = controls.createEl('select', {
      attr: { 'aria-label': 'Project filter' },
      cls: 'dropdown agents-workbrain-kanban-project-select',
    });
    projectSelect.createEl('option', { value: '', text: 'All projects' });
    for (const project of projects) {
      const archived = project.status === 'archived' ? ' — archived' : '';
      projectSelect.createEl('option', { value: project.id, text: `${project.name} (${project.id})${archived}` });
    }
    projectSelect.value = this.selectedProject;
    projectSelect.addEventListener('change', () => {
      this.selectedProject = projectSelect.value;
      this.render();
    });

    const laneSelect = controls.createEl('select', {
      attr: { 'aria-label': 'Swimlane grouping' },
      cls: 'dropdown agents-workbrain-kanban-lane-select',
    });
    const modes: Array<[SwimlaneMode, string]> = [
      ['project', 'Project swimlanes'],
      ['parent', 'Parent swimlanes'],
      ['priority', 'Priority swimlanes'],
      ['none', 'No swimlanes'],
    ];
    for (const [value, label] of modes) {
      laneSelect.createEl('option', { value, text: label });
    }
    laneSelect.value = this.swimlane;
    laneSelect.addEventListener('change', () => {
      this.swimlane = laneSelect.value as SwimlaneMode;
      this.render();
    });

    const terminalToggle = controls.createEl('button', {
      text: this.showTerminal ? 'Hide terminal' : 'Show terminal',
      cls: 'mod-cta agents-workbrain-kanban-terminal-toggle',
      attr: { type: 'button' },
    });
    terminalToggle.addEventListener('click', () => {
      this.showTerminal = !this.showTerminal;
      this.render();
    });

    const archivedToggle = controls.createEl('button', {
      text: this.showArchivedProjects ? 'Hide archived projects' : 'Show archived projects',
      cls: 'agents-workbrain-kanban-archived-toggle',
      attr: { type: 'button' },
    });
    archivedToggle.addEventListener('click', () => {
      this.showArchivedProjects = !this.showArchivedProjects;
      this.render();
    });

    const refresh = controls.createEl('button', {
      cls: 'clickable-icon agents-workbrain-kanban-refresh',
      attr: { type: 'button', 'aria-label': 'Refresh board', title: 'Refresh board' },
    });
    setIcon(refresh, 'refresh-cw');
    refresh.addEventListener('click', () => this.plugin.refreshViews());
  }

  private renderEmpty(root: HTMLElement): void {
    const empty = root.createDiv({ cls: 'agents-workbrain-kanban-empty' });
    empty.createEl('h3', { text: 'No canonical tasks found' });
    empty.createEl('p', {
      text: `Expected canonical task files at ${TASKS_ROOT}/<slug>/task.md.`,
    });
  }

  private renderSwimlane(board: HTMLElement, name: string, tasks: TaskCard[]): void {
    const lane = board.createEl('section', { cls: 'agents-workbrain-kanban-swimlane' });
    const header = lane.createEl('button', {
      cls: 'agents-workbrain-kanban-swimlane-header',
      attr: { type: 'button', 'aria-expanded': String(!this.collapsed.has(name)) },
    });
    header.createEl('span', { text: this.collapsed.has(name) ? '›' : '⌄', cls: 'agents-workbrain-kanban-chevron' });
    header.createEl('strong', { text: name });
    header.createEl('span', { text: String(tasks.length), cls: 'agents-workbrain-kanban-count' });
    header.addEventListener('click', () => {
      if (this.collapsed.has(name)) this.collapsed.delete(name);
      else this.collapsed.add(name);
      this.render();
    });
    if (this.collapsed.has(name)) return;

    const statuses = CANONICAL_STATUSES.filter(
      (status) => this.showTerminal || (status !== 'done' && status !== 'cancelled'),
    );
    const columns = lane.createDiv({ cls: 'agents-workbrain-kanban-columns' });
    columns.style.setProperty('--agents-workbrain-kanban-columns', String(statuses.length));

    for (const status of statuses) {
      const statusTasks = tasks
        .filter((task) => task.status === status)
        .sort((a, b) =>
          (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9) ||
          a.id.localeCompare(b.id),
        );
      this.renderColumn(columns, status, statusTasks);
    }
  }

  private renderColumn(columns: HTMLElement, status: TaskStatus, tasks: TaskCard[]): void {
    const column = columns.createDiv({ cls: `agents-workbrain-kanban-column is-${status}` });
    column.dataset.status = status;
    const header = column.createDiv({ cls: 'agents-workbrain-kanban-column-header' });
    header.createEl('span', { text: STATUS_LABELS[status] });
    header.createEl('span', { text: String(tasks.length), cls: 'agents-workbrain-kanban-count' });

    const stack = column.createDiv({ cls: 'agents-workbrain-kanban-stack' });
    stack.addEventListener('dragover', (event) => {
      if (!this.plugin.settings.allowStatusChanges) return;
      event.preventDefault();
      stack.addClass('is-drop-target');
    });
    stack.addEventListener('dragleave', () => stack.removeClass('is-drop-target'));
    stack.addEventListener('drop', (event) => {
      event.preventDefault();
      stack.removeClass('is-drop-target');
      const path = event.dataTransfer?.getData('text/workbrain-task-path');
      const task = this.plugin.getTasks().find((candidate) => candidate.path === path);
      if (task) void this.changeStatus(task, status);
    });

    if (tasks.length === 0) {
      stack.createDiv({ text: 'Drop task', cls: 'agents-workbrain-kanban-drop-hint' });
    }
    for (const task of tasks) this.renderCard(stack, task);
  }

  private renderCard(stack: HTMLElement, task: TaskCard): void {
    const card = stack.createEl('article', {
      cls: `agents-workbrain-kanban-card priority-${task.priority}`,
      attr: { tabindex: '0', 'aria-label': `${task.id}: ${task.title}` },
    });
    card.draggable = this.plugin.settings.allowStatusChanges && !isTerminal(task.status);
    card.addEventListener('dragstart', (event) => {
      event.dataTransfer?.setData('text/workbrain-task-path', task.path);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('click', (event) => {
      if (event.target instanceof HTMLSelectElement) return;
      void this.app.workspace.openLinkText(task.path, '', false);
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') void this.app.workspace.openLinkText(task.path, '', false);
    });

    const meta = card.createDiv({ cls: 'agents-workbrain-kanban-card-meta' });
    meta.createEl('span', { text: task.id, cls: 'agents-workbrain-kanban-card-id' });
    meta.createEl('span', { text: task.priority, cls: 'agents-workbrain-kanban-priority' });
    card.createDiv({ text: task.title, cls: 'agents-workbrain-kanban-card-title' });

    const footer = card.createDiv({ cls: 'agents-workbrain-kanban-card-footer' });
    footer.createEl('span', { text: task.type });
    if (task.parent) footer.createEl('span', { text: `↳ ${task.parent}` });
    for (const project of task.projects) footer.createEl('span', { text: project });

    if (this.plugin.settings.allowStatusChanges && !isTerminal(task.status)) {
      const select = footer.createEl('select', {
        attr: { 'aria-label': `Change status for ${task.id}` },
        cls: 'dropdown agents-workbrain-kanban-status-select',
      });
      for (const status of CANONICAL_STATUSES) {
        select.createEl('option', { value: status, text: STATUS_LABELS[status] });
      }
      select.value = task.status;
      select.addEventListener('change', () => {
        const next = select.value as TaskStatus;
        select.value = task.status;
        void this.changeStatus(task, next);
      });
    }
  }

  private async changeStatus(task: TaskCard, next: TaskStatus): Promise<void> {
    if (!this.plugin.settings.allowStatusChanges || task.status === next) return;
    if (isTerminal(task.status)) {
      new Notice('Terminal tasks must be reopened through the canonical task workflow.');
      return;
    }
    if (next === 'done' && !canMoveToDone(task)) {
      new Notice('Done requires at least one completion_evidence entry.');
      return;
    }

    let reason: string | null = null;
    if (next === 'blocked' || next === 'cancelled') {
      const modal = new StatusReasonModal(this.app, next);
      modal.open();
      reason = await modal.promise;
      if (!reason) return;
    }

    const file = this.app.vault.getAbstractFileByPath(task.path);
    if (!(file instanceof TFile)) {
      new Notice(`Task file not found: ${task.path}`);
      return;
    }

    const now = new Date().toISOString();
    try {
      await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter.status = next;
        frontmatter.updated = now;
        if (next === 'in_progress' && !frontmatter.start_date) frontmatter.start_date = now;
        if (next === 'done') frontmatter.finish_date = now;
      });
      await this.appendAuditComment(
        file,
        now,
        reason
          ? `Status changed from ${task.status} to ${next}. Reason: ${reason}`
          : `Status changed from ${task.status} to ${next}.`,
      );
      new Notice(`${task.id} → ${STATUS_LABELS[next]}`);
      this.plugin.refreshViews();
    } catch (error) {
      console.error('Agents Workbrain Kanban status update failed', error);
      new Notice(`Could not update ${task.id}. Check the developer console.`);
    }
  }

  private async appendAuditComment(file: TFile, timestamp: string, message: string): Promise<void> {
    await this.app.vault.process(file, (content) => appendAuditComment(content, timestamp, message));
  }
}
