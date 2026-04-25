export class McpView {
  private overlay: HTMLElement;
  private list: HTMLElement;
  private closeBtn: HTMLElement;
  private saveBtn: HTMLElement;
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

    this.closeBtn.onclick = () => this.hide();
    this.saveBtn.onclick = () => {
      const name = (document.getElementById('new-mcp-name') as HTMLInputElement).value;
      const command = (document.getElementById('new-mcp-command') as HTMLInputElement).value;
      const argsStr = (document.getElementById('new-mcp-args') as HTMLInputElement).value;

      if (name && command) {
        const args = argsStr.split(',').map(a => a.trim()).filter(a => a);
        this.onSave({ name, command, args });
        (document.getElementById('new-mcp-name') as HTMLInputElement).value = '';
        (document.getElementById('new-mcp-command') as HTMLInputElement).value = '';
        (document.getElementById('new-mcp-args') as HTMLInputElement).value = '';
        this.hide();
      } else {
        alert('Please provide at least a name and a command.');
      }
    };
  }

  show(config: any) {
    this.overlay.classList.remove('hidden');
    this.renderServers(config.mcpServers || {});
  }

  hide() {
    this.overlay.classList.add('hidden');
  }

  private renderServers(servers: any) {
    this.list.innerHTML = '';
    Object.entries(servers).forEach(([name, info]: [string, any]) => {
      const item = document.createElement('div');
      item.className = 'mcp-server-item';
      item.style.marginBottom = '1rem';
      item.style.padding = '1rem';
      item.style.background = 'var(--hover-bg)';
      item.style.borderRadius = '10px';
      item.style.border = '1px solid var(--border-color)';
      
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: var(--accent-color)">${name}</strong>
          <button class="danger remove-btn" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;">Remove</button>
        </div>
        <div class="muted" style="font-size: 0.8rem; margin-top: 0.5rem;">
          <code>${info.command} ${info.args.join(' ')}</code>
        </div>
      `;
      item.querySelector('.remove-btn')?.addEventListener('click', () => {
        if (confirm(`Remove ${name} server?`)) {
          this.onRemove(name);
        }
      });
      this.list.appendChild(item);
    });

    if (Object.keys(servers).length === 0) {
      this.list.innerHTML = '<p class="muted">No MCP servers configured.</p>';
    }
  }
}
