import { App, ButtonComponent, Modal, Setting, TextAreaComponent } from 'obsidian';

export class StatusReasonModal extends Modal {
  private reason = '';
  private resolvePromise: (value: string | null) => void;
  private resolved = false;

  constructor(app: App, private readonly targetStatus: string) {
    let resolver: (value: string | null) => void = () => undefined;
    super(app);
    this.promise = new Promise((resolve) => {
      resolver = resolve;
    });
    this.resolvePromise = resolver;
  }

  readonly promise: Promise<string | null>;

  onOpen(): void {
    this.titleEl.setText(`Reason for ${this.targetStatus}`);
    this.contentEl.createEl('p', {
      text: 'This transition requires an append-only audit comment.',
      cls: 'agents-workbrain-kanban-modal-copy',
    });

    const setting = new Setting(this.contentEl).setName('Reason');
    setting.addTextArea((text: TextAreaComponent) => {
      text.setPlaceholder('Explain why this task is changing state.');
      text.onChange((value) => {
        this.reason = value.trim();
      });
      text.inputEl.rows = 4;
      text.inputEl.focus();
    });

    const actions = this.contentEl.createDiv({ cls: 'agents-workbrain-kanban-modal-actions' });
    new ButtonComponent(actions).setButtonText('Cancel').onClick(() => this.close());
    new ButtonComponent(actions)
      .setButtonText('Apply status')
      .setCta()
      .onClick(() => {
        if (!this.reason) return;
        this.finish(this.reason);
        this.close();
      });
  }

  onClose(): void {
    this.contentEl.empty();
    this.finish(null);
  }

  private finish(value: string | null): void {
    if (this.resolved) return;
    this.resolved = true;
    this.resolvePromise(value);
  }
}
