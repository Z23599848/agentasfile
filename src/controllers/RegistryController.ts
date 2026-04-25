import { RegistryModel } from '../models/RegistryModel';
import { TreeView } from '../views/TreeView';
import { AgentView } from '../views/AgentView';
import { FileView } from '../views/FileView';
import { ModalView } from '../views/ModalView';
import { McpView } from '../views/McpView';
import type { AgentItem, ModalMode } from '../types';

export class RegistryController {
  private model: RegistryModel;
  private treeView: TreeView;
  private agentView: AgentView;
  private fileView: FileView;
  private modalView: ModalView;
  private mcpView: McpView;

  private currentPath: string | null = null;
  private currentItem: AgentItem | null = null;
  private modalMode: ModalMode = 'add-folder';

  // State
  private paletteOpen = false;
  private paletteResults: { path: string, item: AgentItem }[] = [];
  private paletteIndex = 0;
  private recentPaths: string[] = [];

  constructor() {
    this.model = new RegistryModel();
    this.treeView = new TreeView('tree-view', this.handleSelect.bind(this));
    this.agentView = new AgentView('agent-view', this.handleSelect.bind(this));
    this.fileView = new FileView('file-view');
    this.modalView = new ModalView(this.handleModalConfirm.bind(this));
    this.mcpView = new McpView(this.handleMcpSave.bind(this));

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

    const welcomeMessage = document.getElementById('welcome-message');
    const breadcrumb = document.getElementById('breadcrumb');
    const editBtn = document.getElementById('edit-btn');
    const pageCover = document.getElementById('page-cover');

    if (this.currentPath && this.currentItem) {
      if (welcomeMessage) welcomeMessage.classList.add('hidden');
      if (breadcrumb) {
        breadcrumb.innerHTML = '';
        const parts = this.currentPath.split('/');
        let buildPath = '';
        parts.forEach((part, i) => {
          buildPath += (i === 0 ? '' : '/') + part;
          const span = document.createElement('span');
          span.innerText = part.charAt(0).toUpperCase() + part.slice(1);
          span.style.cursor = 'pointer';
          const currentBuildPath = buildPath;
          span.onclick = () => {
            const item = this.model.getItemByPath(currentBuildPath);
            if (item) this.handleSelect(currentBuildPath, item);
          };
          breadcrumb.appendChild(span);
          if (i < parts.length - 1) {
            const sep = document.createElement('span');
            sep.innerText = ' / ';
            sep.style.margin = '0 0.5rem';
            sep.style.color = 'var(--text-muted)';
            breadcrumb.appendChild(sep);
          }
        });
      }
      if (editBtn) editBtn.classList.remove('hidden');
      if (pageCover) pageCover.style.background = this.generateGradient(this.currentItem.name);

      if (this.currentItem.type === 'folder') {
        this.agentView.show(this.currentItem, this.currentPath);
        this.fileView.hide();
      } else {
        this.fileView.show(this.currentItem);
        this.agentView.hide();
      }
    } else {
      if (welcomeMessage) welcomeMessage.classList.remove('hidden');
      this.agentView.hide();
      this.fileView.hide();
      if (editBtn) editBtn.classList.add('hidden');
      if (breadcrumb) breadcrumb.innerText = 'Root';
      if (pageCover) pageCover.style.background = 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)';
    }

    this.renderRecent();
  }

  private generateGradient(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
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
    const saved = localStorage.getItem('recentAgents');
    if (saved) this.recentPaths = JSON.parse(saved);
  }

  private renderRecent() {
    const container = document.getElementById('recent-list');
    if (!container) return;
    container.innerHTML = '';
    
    this.recentPaths.forEach(path => {
      const item = this.model.getItemByPath(path);
      if (!item) return;

      const div = document.createElement('div');
      div.className = 'recent-item';
      div.innerHTML = `<span>${item.type === 'folder' ? '📁' : '📄'}</span> <span>${item.name}</span>`;
      div.onclick = () => this.handleSelect(path, item);
      container.appendChild(div);
    });
  }

  private togglePalette(force?: boolean) {
    this.paletteOpen = force !== undefined ? force : !this.paletteOpen;
    const palette = document.getElementById('command-palette');
    const input = document.getElementById('palette-input') as HTMLInputElement;
    
    if (!palette || !input) return;

    if (this.paletteOpen) {
      palette.classList.remove('hidden');
      input.focus();
      this.updatePaletteResults('');
    } else {
      palette.classList.add('hidden');
      input.value = '';
    }
  }

  private updatePaletteResults(query: string) {
    const results: { path: string, item: AgentItem }[] = [];
    const flatRegistry = this.flattenRegistry(this.model.getData());
    const lowerQuery = query.toLowerCase();
    
    flatRegistry.forEach(res => {
      if (res.item.name.toLowerCase().includes(lowerQuery) || res.path.toLowerCase().includes(lowerQuery)) {
        results.push(res);
      }
    });

    this.paletteResults = results.slice(0, 8);
    this.paletteIndex = 0;
    this.renderPaletteResults();
  }

  private flattenRegistry(data: any, path = ''): { path: string, item: AgentItem }[] {
    let results: any[] = [];
    Object.entries(data).forEach(([key, item]: [string, any]) => {
      const fullPath = path ? `${path}/${key}` : key;
      results.push({ path: fullPath, item });
      if (item.children) {
        results = results.concat(this.flattenRegistry(item.children, fullPath));
      }
    });
    return results;
  }

  private renderPaletteResults() {
    const container = document.getElementById('palette-results');
    if (!container) return;
    container.innerHTML = '';
    
    this.paletteResults.forEach((res, i) => {
      const div = document.createElement('div');
      div.className = `palette-result ${i === this.paletteIndex ? 'active' : ''}`;
      div.innerHTML = `
        <span class="icon">${res.item.type === 'folder' ? '📁' : '📄'}</span>
        <div class="info">
          <div class="name">${res.item.name}</div>
          <div class="path muted" style="font-size: 0.7rem;">${res.path}</div>
        </div>
      `;
      div.onclick = () => {
        this.handleSelect(res.path, res.item);
        this.togglePalette(false);
      };
      container.appendChild(div);
    });
  }

  private handleModalConfirm(data: { name: string, props?: string }) {
    if (!data.name) return;
    const id = data.name.toLowerCase().replace(/\s+/g, '_');

    if (this.modalMode === 'add-folder' || this.modalMode === 'add-file') {
      const newItem: AgentItem = {
        name: data.name,
        type: this.modalMode === 'add-folder' ? 'folder' : 'file'
      };

      if (this.modalMode === 'add-folder' && data.props) {
        try {
          newItem.properties = JSON.parse(data.props);
          newItem.children = {};
        } catch (e) { alert('Invalid JSON'); return; }
      } else {
        newItem.content = '';
      }

      this.model.addItem(this.currentPath, id, newItem);
    } else if (this.modalMode === 'edit-agent' && this.currentPath && data.props) {
      try {
        const properties = JSON.parse(data.props);
        this.model.updateItem(this.currentPath, { name: data.name, properties });
      } catch (e) { alert('Invalid JSON'); return; }
    }

    this.modalView.hide();
    this.model.save();
  }

  private handleMcpSave(config: any) {
    // In a real app, this would send a POST to /api/save-mcp
    console.log('Saving MCP Config:', config);
  }

  private setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.togglePalette();
      }
      if (e.key === 'Escape') {
        this.togglePalette(false);
        this.modalView.hide();
        this.mcpView.hide();
      }
      if (this.paletteOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.paletteIndex = (this.paletteIndex + 1) % this.paletteResults.length;
          this.renderPaletteResults();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.paletteIndex = (this.paletteIndex - 1 + this.paletteResults.length) % this.paletteResults.length;
          this.renderPaletteResults();
        } else if (e.key === 'Enter') {
          const res = this.paletteResults[this.paletteIndex];
          if (res) {
            this.handleSelect(res.path, res.item);
            this.togglePalette(false);
          }
        }
      }
    });

    const paletteInput = document.getElementById('palette-input');
    if (paletteInput) {
      paletteInput.addEventListener('input', (e) => {
        this.updatePaletteResults((e.target as HTMLInputElement).value);
      });
    }

    const sidebarSearch = document.getElementById('sidebar-search-input');
    if (sidebarSearch) {
      sidebarSearch.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        const items = document.querySelectorAll('.tree-item');
        items.forEach(item => {
          const name = (item as HTMLElement).innerText.toLowerCase();
          (item as HTMLElement).style.display = name.includes(query) ? 'flex' : 'none';
        });
      });
    }

    document.getElementById('mcp-settings-btn')?.addEventListener('click', () => {
      this.mcpView.show(this.model.getMcpConfig());
    });

    document.getElementById('search-btn')?.addEventListener('click', () => this.togglePalette(true));
    document.getElementById('toggle-sidebar')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('collapsed');
    });

    document.getElementById('add-agent-btn')?.addEventListener('click', () => {
      this.modalMode = 'add-folder';
      this.modalView.show('add-folder');
    });

    document.getElementById('add-file-btn')?.addEventListener('click', () => {
      this.modalMode = 'add-file';
      this.modalView.show('add-file');
    });

    document.getElementById('quick-add-btn')?.addEventListener('click', () => {
      this.modalMode = 'add-folder';
      this.modalView.show('add-folder');
    });

    document.getElementById('edit-btn')?.addEventListener('click', () => {
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
    });

    document.getElementById('delete-btn')?.addEventListener('click', () => {
      if (this.currentPath && confirm(`Delete ${this.currentItem?.name}?`)) {
        if (this.currentPath === 'root') {
          alert('Cannot delete the root folder.');
          return;
        }
        this.model.deleteItem(this.currentPath);
        this.currentPath = null;
        this.currentItem = null;
        this.updateUI();
        this.model.save();
      }
    });

    document.getElementById('save-file-btn')?.addEventListener('click', () => {
      if (this.currentPath && this.currentItem && this.currentItem.type === 'file') {
        const content = this.fileView.getEditorValue();
        this.model.updateItem(this.currentPath, { content });
        this.model.save();
      }
    });
  }
}
