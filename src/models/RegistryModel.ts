import type { AgentRegistry, AgentItem } from '../types';

export class RegistryModel {
  private data: AgentRegistry = {};
  private onDataChangeCallbacks: (() => void)[] = [];

  constructor() {}

  async load() {
    try {
      const res = await fetch('/public/registry.json');
      this.data = await res.json();
      this.notify();
    } catch (e) {
      console.error('Failed to load registry:', e);
      // Fallback if file doesn't exist
      this.data = {
        root: {
          name: "Root Assistant",
          type: "folder",
          properties: { role: "Orchestrator" },
          children: {}
        }
      };
      this.notify();
    }
  }

  getData() {
    return this.data;
  }

  getItemByPath(path: string): AgentItem | null {
    if (!path) return null;
    const parts = path.split('/');
    let current: any = this.data;
    
    for (const part of parts) {
      if (current && current[part]) {
        current = current[part];
      } else if (current && current.children && current.children[part]) {
        current = current.children[part];
      } else {
        return null;
      }
    }
    return current;
  }

  addItem(parentPath: string | null, id: string, item: AgentItem) {
    // Logic fix: if no path, add to root children
    if (!parentPath) {
      if (this.data['root']) {
        if (!this.data['root'].children) this.data['root'].children = {};
        this.data['root'].children[id] = item;
      } else {
        this.data[id] = item;
      }
    } else {
      const parent = this.getItemByPath(parentPath);
      if (parent && parent.type === 'folder') {
        if (!parent.children) parent.children = {};
        parent.children[id] = item;
      }
    }
    this.notify();
  }

  updateItem(path: string, updates: Partial<AgentItem>) {
    const item = this.getItemByPath(path);
    if (item) {
      Object.assign(item, updates);
      this.notify();
    }
  }

  deleteItem(path: string) {
    const parts = path.split('/');
    const targetId = parts.pop()!;
    const parentPath = parts.join('/');
    
    if (!parentPath) {
      delete this.data[targetId];
    } else {
      const parent = this.getItemByPath(parentPath);
      if (parent && parent.children) {
        delete parent.children[targetId];
      }
    }
    this.notify();
  }

  onDataChange(cb: () => void) {
    this.onDataChangeCallbacks.push(cb);
  }

  private notify() {
    this.onDataChangeCallbacks.forEach(cb => cb());
  }

  async save() {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.data)
    });
  }
}
