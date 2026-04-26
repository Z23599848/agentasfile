import { RegistryModel } from '../models/RegistryModel';
import { TreeView } from '../views/TreeView';
import { AgentView } from '../views/AgentView';
import { FileView } from '../views/FileView';
import { ModalView } from '../views/ModalView';
import { McpView } from '../views/McpView';
import { ChatView } from '../views/ChatView';
import type { AgentItem, ModalMode } from '../types';

type RegistrySearchResult = { path: string; item: AgentItem };

export class RegistryController {
  private model: RegistryModel;
  private treeView: TreeView;
  private agentView: AgentView;
  private fileView: FileView;
  private modalView: ModalView;
  private mcpView: McpView;
  private chatView: ChatView;

  private currentPath: string | null = null;
  private currentItem: AgentItem | null = null;
  private modalMode: ModalMode = 'add-folder';
  private pendingParentPath: string | null = null;
  private viewMode: 'explorer' | 'chat' = 'explorer';
  private paletteOpen = false;
  private paletteResults: RegistrySearchResult[] = [];
  private paletteIndex = 0;
  private recentPaths: string[] = [];
  private sidebarFilter = '';

  constructor() {
    this.model = new RegistryModel();
    this.treeView = new TreeView('tree-view', this.handleSelect.bind(this));
    this.agentView = new AgentView('agent-view', this.handleSelect.bind(this));
    this.fileView = new FileView('file-view');
    this.modalView = new ModalView(this.handleModalConfirm.bind(this));
    this.mcpView = new McpView(this.handleMcpSave.bind(this), this.handleMcpRemove.bind(this));
    this.chatView = new ChatView(this.handleSendMessage.bind(this));

    this.setupEventListeners();
    this.model.onDataChange(this.updateUI.bind(this));
    this.loadRecent();
  }

  async init() {
    await this.model.load();
    this.updateUI();
  }

  private handleSelect(path: string, item: AgentItem) {
    this.currentPath = path;
    this.currentItem = item;
    this.addToRecent(path);
    this.updateUI();
  }

  private updateUI() {
    const data = this.model.getData();
    this.treeView.render(data, this.currentPath);
    this.applySidebarFilter();

    const welcomeMessage = document.getElementById('welcome-message');
    const breadcrumb = document.getElementById('breadcrumb');
    const pageCover = document.getElementById('page-cover');
    const hasSelection = Boolean(this.currentPath && this.currentItem);

    this.setActionState(hasSelection);

    if (this.currentPath && this.currentItem) {
      welcomeMessage?.classList.add('hidden');
      if (breadcrumb) this.renderBreadcrumb(breadcrumb, this.currentPath);
      if (pageCover) pageCover.style.background = this.generateGradient(this.currentItem.name);

      if (this.viewMode === 'chat') {
        this.chatView.show(this.currentItem, this.currentItem.chatHistory || []);
        this.agentView.hide();
        this.fileView.hide();
      } else if (this.currentItem.type === 'folder') {
        this.chatView.hide();
        this.agentView.show(this.currentItem, this.currentPath);
        this.fileView.hide();
      } else {
        this.chatView.hide();
        this.fileView.show(this.currentItem);
        this.agentView.hide();
      }
    } else {
      welcomeMessage?.classList.remove('hidden');
      if (breadcrumb) breadcrumb.textContent = 'Root';
      if (pageCover) pageCover.style.background = 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)';
      this.agentView.hide();
      this.fileView.hide();
      this.chatView.hide();
    }

    this.renderRecent();
    if (this.paletteOpen) this.updatePaletteResults(this.getPaletteQuery());
  }

  private setActionState(hasSelection: boolean) {
    const editBtn = document.getElementById('edit-btn') as HTMLButtonElement | null;
    const deleteBtn = document.getElementById('delete-btn') as HTMLButtonElement | null;
    const exportBtn = document.getElementById('export-btn') as HTMLButtonElement | null;
    const chatBtn = document.getElementById('chat-trigger-btn') as HTMLButtonElement | null;

    if (editBtn) editBtn.disabled = !hasSelection;
    if (deleteBtn) deleteBtn.disabled = !hasSelection || this.currentPath === 'root';
    if (exportBtn) exportBtn.disabled = !hasSelection;
    if (chatBtn) chatBtn.disabled = !hasSelection;
  }

  private renderBreadcrumb(container: HTMLElement, path: string) {
    container.replaceChildren();

    let buildPath = '';
    path.split('/').forEach((part, index, parts) => {
      buildPath += `${index === 0 ? '' : '/'}${part}`;
      const currentBuildPath = buildPath;

      const crumb = document.createElement('button');
      crumb.type = 'button';
      crumb.className = 'breadcrumb-part';
      crumb.textContent = part.charAt(0).toUpperCase() + part.slice(1);
      crumb.onclick = () => {
        const item = this.model.getItemByPath(currentBuildPath);
        if (item) this.handleSelect(currentBuildPath, item);
      };
      container.appendChild(crumb);

      if (index < parts.length - 1) {
        const sep = document.createElement('span');
        sep.className = 'breadcrumb-separator';
        sep.textContent = '/';
        container.appendChild(sep);
      }
    });
  }

  private generateGradient(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h = Math.abs(hash % 360);
    return `linear-gradient(135deg, hsl(${h}, 50%, 20%) 0%, hsl(${(h + 40) % 360}, 50%, 30%) 100%)`;
  }

  private addToRecent(path: string) {
    this.recentPaths = [path, ...this.recentPaths.filter(p => p !== path)].slice(0, 5);
    localStorage.setItem('recentAgents', JSON.stringify(this.recentPaths));
  }

  private loadRecent() {
    try {
      const saved = localStorage.getItem('recentAgents');
      this.recentPaths = saved ? JSON.parse(saved) as string[] : [];
    } catch {
      this.recentPaths = [];
      localStorage.removeItem('recentAgents');
    }
  }

  private renderRecent() {
    const container = document.getElementById('recent-list');
    if (!container) return;

    container.replaceChildren();
    this.recentPaths = this.recentPaths.filter(path => Boolean(this.model.getItemByPath(path)));

    this.recentPaths.forEach(path => {
      const item = this.model.getItemByPath(path);
      if (!item) return;

      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'recent-item';

      const icon = document.createElement('span');
      icon.textContent = item.type === 'folder' ? '📁' : '📄';

      const name = document.createElement('span');
      name.textContent = item.name;

      row.append(icon, name);
      row.onclick = () => this.handleSelect(path, item);
      container.appendChild(row);
    });
  }

  private togglePalette(force?: boolean) {
    this.paletteOpen = force ?? !this.paletteOpen;
    const palette = document.getElementById('command-palette');
    const input = document.getElementById('palette-input') as HTMLInputElement | null;
    if (!palette || !input) return;

    if (this.paletteOpen) {
      palette.classList.remove('hidden');
      input.focus();
      this.updatePaletteResults(input.value);
    } else {
      palette.classList.add('hidden');
      input.value = '';
      this.paletteResults = [];
      this.paletteIndex = 0;
    }
  }

  private updatePaletteResults(query: string) {
    const lowerQuery = query.trim().toLowerCase();
    const flatRegistry = this.flattenRegistry(this.model.getData());

    this.paletteResults = flatRegistry
      .filter(res => {
        const haystack = `${res.item.name} ${res.path} ${res.item.properties?.role || ''}`.toLowerCase();
        return haystack.includes(lowerQuery);
      })
      .slice(0, 8);

    this.paletteIndex = Math.min(this.paletteIndex, Math.max(this.paletteResults.length - 1, 0));
    this.renderPaletteResults();
  }

  private flattenRegistry(data: Record<string, AgentItem>, path = ''): RegistrySearchResult[] {
    return Object.entries(data).flatMap(([key, item]) => {
      const fullPath = path ? `${path}/${key}` : key;
      const children = item.children ? this.flattenRegistry(item.children, fullPath) : [];
      return [{ path: fullPath, item }, ...children];
    });
  }

  private renderPaletteResults() {
    const container = document.getElementById('palette-results');
    if (!container) return;

    container.replaceChildren();

    if (this.paletteResults.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'palette-empty muted';
      empty.textContent = 'No matching agents or files.';
      container.appendChild(empty);
      return;
    }

    this.paletteResults.forEach((result, index) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `palette-result ${index === this.paletteIndex ? 'active' : ''}`;
      row.onclick = () => this.selectPaletteResult(result);

      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.textContent = result.item.type === 'folder' ? '📁' : '📄';

      const info = document.createElement('span');
      info.className = 'info';

      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = result.item.name;

      const resultPath = document.createElement('span');
      resultPath.className = 'path muted';
      resultPath.textContent = result.path;

      info.append(name, resultPath);
      row.append(icon, info);
      container.appendChild(row);
    });
  }

  private selectPaletteResult(result: RegistrySearchResult) {
    this.handleSelect(result.path, result.item);
    this.togglePalette(false);
  }

  private async handleModalConfirm(data: { name: string; props?: string }) {
    const name = data.name.trim();
    if (!name) return;

    if (this.modalMode === 'add-folder' || this.modalMode === 'add-file') {
      const newItem: AgentItem = {
        name,
        type: this.modalMode === 'add-folder' ? 'folder' : 'file'
      };

      if (newItem.type === 'folder') {
        const properties = this.parseProperties(data.props || '{}');
        if (!properties) return;
        newItem.properties = properties;
        newItem.children = {};
      } else {
        newItem.content = '';
      }

      const id = this.createUniqueId(name, this.pendingParentPath);
      const added = this.model.addItem(this.pendingParentPath, id, newItem);
      if (!added) {
        alert('Choose a folder before adding a sub-item.');
        return;
      }

      this.currentPath = this.buildChildPath(this.pendingParentPath, id);
      this.currentItem = newItem;
      this.addToRecent(this.currentPath);
    } else if (this.modalMode === 'edit-agent' && this.currentPath) {
      const properties = this.parseProperties(data.props || '{}');
      if (!properties) return;
      this.model.updateItem(this.currentPath, { name, properties });
      this.currentItem = this.model.getItemByPath(this.currentPath);
    }

    this.modalView.hide();
    this.pendingParentPath = null;
    this.updateUI();
    if (!await this.model.save()) alert('Saved locally, but the server did not persist the change.');
  }

  private parseProperties(value: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Properties must be a JSON object.');
      }
      return parsed as Record<string, unknown>;
    } catch {
      alert('Invalid JSON properties. Please enter a JSON object.');
      return null;
    }
  }

  private handleMcpSave(data: { name: string; command: string; args: string[] }) {
    this.model.addMcpServer(data.name, { command: data.command, args: data.args });
    void this.model.saveMcp().then(saved => {
      if (!saved) alert('Saved locally, but the server did not persist the MCP config.');
    });
  }

  private handleMcpRemove(name: string) {
    this.model.removeMcpServer(name);
    void this.model.saveMcp().then(saved => {
      if (!saved) alert('Removed locally, but the server did not persist the MCP config.');
    });
    this.mcpView.show(this.model.getMcpConfig());
  }

  private handleSendMessage(text: string) {
    if (!this.currentPath || !this.currentItem) return;

    const path = this.currentPath;
    const item = this.currentItem;
    this.model.addChatMessage(path, { sender: 'user', text });
    void this.model.save();
    void this.simulateAgentResponse(path, item);
  }

  private async simulateAgentResponse(path: string, item: AgentItem) {
    this.chatView.setSending(true);
    this.chatView.showTyping(true);

    await new Promise(resolve => setTimeout(resolve, 700));

    const role = item.properties?.role || 'Agent';
    const behavior = item.properties?.behavior || 'standard assistant behavior';
    const servers = item.properties?.mcp_servers || item.mcp_servers || [];
    const capabilities = servers.length > 0 ? servers.join(', ') : 'no specialized MCP servers';
    const responses = [
      `As ${role}, I understand. I will keep ${item.name}'s context in mind.`,
      `Acknowledged. I am following the ${behavior} operating profile.`,
      `I can help from this node with ${capabilities}.`,
      `Logged. You can keep building this agent's memory through this conversation.`
    ];

    this.chatView.showTyping(false);
    this.chatView.setSending(false);
    this.model.addChatMessage(path, {
      sender: 'agent',
      text: responses[Math.floor(Math.random() * responses.length)]
    });
    await this.model.save();
  }

  private setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.togglePalette();
        return;
      }

      if (e.key === 'Escape') {
        this.togglePalette(false);
        this.modalView.hide();
        this.mcpView.hide();
        return;
      }

      if (this.paletteOpen) {
        this.handlePaletteKeydown(e);
        return;
      }

      if (!this.isTextEntryTarget(e.target)) {
        if (e.key.toLowerCase() === 'n') this.openAddModal('add-folder');
        if (e.key.toLowerCase() === 'f') this.openAddModal('add-file');
      }
    });

    document.getElementById('palette-input')?.addEventListener('input', (e) => {
      this.updatePaletteResults((e.target as HTMLInputElement).value);
    });

    document.getElementById('sidebar-search-input')?.addEventListener('input', (e) => {
      this.sidebarFilter = (e.target as HTMLInputElement).value.toLowerCase();
      this.applySidebarFilter();
    });

    document.getElementById('mcp-settings-btn')?.addEventListener('click', () => {
      this.mcpView.show(this.model.getMcpConfig());
    });

    document.getElementById('search-btn')?.addEventListener('click', () => this.togglePalette(true));
    document.getElementById('toggle-sidebar')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('collapsed');
    });

    document.getElementById('chat-trigger-btn')?.addEventListener('click', () => {
      this.viewMode = 'chat';
      this.updateUI();
    });

    document.getElementById('view-details-btn')?.addEventListener('click', () => {
      this.viewMode = 'explorer';
      this.updateUI();
    });

    document.getElementById('add-agent-btn')?.addEventListener('click', () => this.openAddModal('add-folder'));
    document.getElementById('add-file-btn')?.addEventListener('click', () => this.openAddModal('add-file'));
    document.getElementById('quick-add-btn')?.addEventListener('click', () => this.openAddModal('add-folder', this.currentPath));

    document.getElementById('edit-btn')?.addEventListener('click', () => this.handleEdit());
    document.getElementById('delete-btn')?.addEventListener('click', () => this.handleDelete());
    document.getElementById('save-file-btn')?.addEventListener('click', () => void this.handleSaveFile());
    document.getElementById('export-btn')?.addEventListener('click', () => this.handleExport());
  }

  private handlePaletteKeydown(e: KeyboardEvent) {
    if (this.paletteResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.paletteIndex = (this.paletteIndex + 1) % this.paletteResults.length;
      this.renderPaletteResults();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.paletteIndex = (this.paletteIndex - 1 + this.paletteResults.length) % this.paletteResults.length;
      this.renderPaletteResults();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.selectPaletteResult(this.paletteResults[this.paletteIndex]);
    }
  }

  private openAddModal(mode: Extract<ModalMode, 'add-folder' | 'add-file'>, explicitParentPath?: string | null) {
    const selectedFolderPath = this.currentItem?.type === 'folder' ? this.currentPath : null;
    this.pendingParentPath = explicitParentPath ?? selectedFolderPath;
    this.modalMode = mode;
    this.modalView.show(mode);
  }

  private handleEdit() {
    if (!this.currentItem) return;

    if (this.currentItem.type === 'folder') {
      this.modalMode = 'edit-agent';
      this.modalView.show('edit-agent', {
        name: this.currentItem.name,
        props: JSON.stringify(this.currentItem.properties || {}, null, 2)
      });
    } else {
      this.fileView.enterEditMode(this.currentItem.content || '');
    }
  }

  private handleDelete() {
    if (!this.currentPath || !this.currentItem) return;
    if (this.currentPath === 'root') {
      alert('Cannot delete the root folder.');
      return;
    }

    if (!confirm(`Delete ${this.currentItem.name}?`)) return;

    const deletedPath = this.currentPath;
    if (this.model.deleteItem(deletedPath)) {
      this.recentPaths = this.recentPaths.filter(path => path !== deletedPath && !path.startsWith(`${deletedPath}/`));
      localStorage.setItem('recentAgents', JSON.stringify(this.recentPaths));
      this.currentPath = null;
      this.currentItem = null;
      this.viewMode = 'explorer';
      this.updateUI();
      void this.model.save().then(saved => {
        if (!saved) alert('Deleted locally, but the server did not persist the registry.');
      });
    }
  }

  private async handleSaveFile() {
    if (!this.currentPath || !this.currentItem || this.currentItem.type !== 'file') return;

    const content = this.fileView.getEditorValue();
    this.model.updateItem(this.currentPath, { content });
    if (!await this.model.save()) alert('Saved locally, but the server did not persist the file.');
  }

  private handleExport() {
    if (!this.currentItem) return;

    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(this.currentItem, null, 2))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${this.createId(this.currentItem.name)}_config.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  private applySidebarFilter() {
    const items = document.querySelectorAll<HTMLElement>('.tree-item');
    items.forEach(item => {
      const name = item.textContent?.toLowerCase() || '';
      item.style.display = !this.sidebarFilter || name.includes(this.sidebarFilter) ? 'flex' : 'none';
    });
  }

  private createUniqueId(name: string, parentPath: string | null): string {
    const baseId = this.createId(name);
    const existing = new Set(this.model.getChildIds(parentPath));
    let id = baseId;
    let suffix = 2;

    while (existing.has(id)) {
      id = `${baseId}_${suffix}`;
      suffix += 1;
    }

    return id;
  }

  private createId(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '') || `item_${Date.now()}`;
  }

  private buildChildPath(parentPath: string | null, id: string): string {
    if (parentPath) return `${parentPath}/${id}`;
    return this.model.getData().root ? `root/${id}` : id;
  }

  private getPaletteQuery(): string {
    return (document.getElementById('palette-input') as HTMLInputElement | null)?.value || '';
  }

  private isTextEntryTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  }
}
