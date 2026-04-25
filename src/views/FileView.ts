import type { AgentItem } from '../types';

export class FileView {
  private container: HTMLElement;
  private editor: HTMLTextAreaElement;
  private content: HTMLElement;
  private saveBtn: HTMLElement;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    this.editor = document.getElementById('file-editor') as HTMLTextAreaElement;
    this.content = document.getElementById('file-content')!;
    this.saveBtn = document.getElementById('save-file-btn')!;
  }

  show(file: AgentItem) {
    this.container.classList.remove('hidden');
    document.getElementById('file-name')!.innerText = file.name;
    this.content.innerText = file.content || 'Empty file.';
    this.content.classList.remove('hidden');
    this.editor.classList.add('hidden');
    this.saveBtn.classList.add('hidden');
  }

  enterEditMode(content: string) {
    this.content.classList.add('hidden');
    this.editor.classList.remove('hidden');
    this.saveBtn.classList.remove('hidden');
    this.editor.value = content;
    this.editor.focus();
  }

  getEditorValue(): string {
    return this.editor.value;
  }

  hide() {
    this.container.classList.add('hidden');
  }
}
