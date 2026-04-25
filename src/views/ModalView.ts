import type { ModalMode } from '../types';

export class ModalView {
  private overlay: HTMLElement;
  private title: HTMLElement;
  private nameInput: HTMLInputElement;
  private propsEditor: HTMLElement;
  private propsInput: HTMLTextAreaElement;
  private confirmBtn: HTMLElement;
  private cancelBtn: HTMLElement;

  private onConfirm: (data: { name: string, props?: string }) => void;

  constructor(onConfirm: (data: { name: string, props?: string }) => void) {
    this.overlay = document.getElementById('modal-overlay')!;
    this.title = document.getElementById('modal-title')!;
    this.nameInput = document.getElementById('item-name-input') as HTMLInputElement;
    this.propsEditor = document.getElementById('agent-props-editor')!;
    this.propsInput = document.getElementById('item-props-input') as HTMLTextAreaElement;
    this.confirmBtn = document.getElementById('modal-confirm')!;
    this.cancelBtn = document.getElementById('modal-cancel')!;
    this.onConfirm = onConfirm;

    this.cancelBtn.onclick = () => this.hide();
    this.confirmBtn.onclick = () => {
      this.onConfirm({
        name: this.nameInput.value.trim(),
        props: this.propsInput.value.trim()
      });
    };
    this.overlay.onclick = (e) => { if (e.target === this.overlay) this.hide(); };
  }

  show(mode: ModalMode, initialData?: { name: string, props: string }) {
    this.overlay.classList.remove('hidden');
    this.nameInput.value = initialData?.name || '';
    this.propsInput.value = initialData?.props || '';

    if (mode === 'add-folder') {
      this.title.innerText = 'New Agent';
      this.propsEditor.classList.remove('hidden');
      if (!initialData) this.propsInput.value = '{\n  "role": "Assistant",\n  "tools": [],\n  "behavior": ""\n}';
    } else if (mode === 'add-file') {
      this.title.innerText = 'New File';
      this.propsEditor.classList.add('hidden');
    } else if (mode === 'edit-agent') {
      this.title.innerText = 'Edit Properties';
      this.propsEditor.classList.remove('hidden');
    }
    this.nameInput.focus();
  }

  hide() {
    this.overlay.classList.add('hidden');
  }
}
