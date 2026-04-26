import type { McpConfig, McpServerConfig } from '../types';

export class McpView {
  private overlay: HTMLElement;
  private list: HTMLElement;
  private closeBtn: HTMLElement;
  private saveBtn: HTMLElement;
  private nameInput: HTMLInputElement;
  private commandInput: HTMLInputElement;
  private argsInput: HTMLInputElement;
  private onSave: (data: { name: string, command: string, args: string[] }) => void;
  private onRemove: (name: string) => void;

  constructor(
    onSave: (data: { name: string, command: string, args: string[] }) => void,
    onRemove: (name: string) => void
  ) {
    this.onSave = onSave;
    this.onRemove = onRemove;
    this.overlay = document.getElementById('mcp-modal-overlay')!;
    this.list = document.getElementById('mcp-servers-list')!;
    this.closeBtn = document.getElementById('mcp-modal-close')!;
    this.saveBtn = document.getElementById('mcp-modal-save')!;
    this.nameInput = document.getElementById('new-mcp-name') as HTMLInputElement;
    this.commandInput = document.getElementById('new-mcp-command') as HTMLInputElement;
    this.argsInput = document.getElementById('new-mcp-args') as HTMLInputElement;

    this.closeBtn.onclick = () => this.hide();
    this.saveBtn.onclick = () => this.handleSave();
    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) this.hide();
    };
  }

  show(config: McpConfig) {
    this.overlay.classList.remove('hidden');
    this.renderServers(config.mcpServers || {});
    this.nameInput.focus();
  }

  hide() {
    this.overlay.classList.add('hidden');
  }

  private handleSave() {
    const name = this.nameInput.value.trim();
    const command = this.commandInput.value.trim();
    const args = this.argsInput.value
      .split(',')
      .map(arg => arg.trim())
      .filter(Boolean);

    if (!name || !command) {
      alert('Please provide at least a name and a command.');
      return;
    }

    this.onSave({ name, command, args });
    this.nameInput.value = '';
    this.commandInput.value = '';
    this.argsInput.value = '';
    this.hide();
  }

  private renderServers(servers: Record<string, McpServerConfig>) {
    this.list.replaceChildren();

    const entries = Object.entries(servers);
    if (entries.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = 'No MCP servers configured.';
      this.list.appendChild(empty);
      return;
    }

    entries.forEach(([name, info]) => {
      const item = document.createElement('div');
      item.className = 'mcp-server-item';

      const header = document.createElement('div');
      header.className = 'mcp-server-header';

      const title = document.createElement('strong');
      title.textContent = name;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'danger remove-btn';
      removeBtn.textContent = 'Remove';
      removeBtn.onclick = () => {
        if (confirm(`Remove ${name} server?`)) {
          this.onRemove(name);
        }
      };

      const command = document.createElement('code');
      command.textContent = [info.command, ...(info.args || [])].join(' ');

      const commandWrap = document.createElement('div');
      commandWrap.className = 'muted mcp-command';
      commandWrap.appendChild(command);

      item.append(header, commandWrap);
      header.append(title, removeBtn);
      this.list.appendChild(item);
    });
  }
}
