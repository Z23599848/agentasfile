import type { AgentItem, AgentRegistry, ChatMessage, McpConfig, McpServerConfig } from '../types';

export class RegistryModel {
  private data: AgentRegistry = {};
  private mcpConfig: McpConfig = { mcpServers: {} };
  private onDataChangeCallbacks: (() => void)[] = [];

  async load() {
    const registry = await this.loadJson<AgentRegistry>('/registry.json', this.createFallbackRegistry());
    const mcpConfig = await this.loadJson<McpConfig>('/mcp_servers.json', { mcpServers: {} });

    this.data = registry;
    this.mcpConfig = this.normalizeMcpConfig(mcpConfig);
    this.notify();
  }

  getData(): AgentRegistry {
    return this.data;
  }

  getMcpConfig(): McpConfig {
    return this.mcpConfig;
  }

  getChildIds(parentPath: string | null): string[] {
    if (!parentPath) {
      return Object.keys(this.data.root?.children || this.data);
    }

    const parent = this.getItemByPath(parentPath);
    return parent?.children ? Object.keys(parent.children) : [];
  }

  addMcpServer(name: string, info: McpServerConfig) {
    this.mcpConfig.mcpServers[name] = info;
    this.notify();
  }

  removeMcpServer(name: string) {
    delete this.mcpConfig.mcpServers[name];
    this.notify();
  }

  addChatMessage(path: string, message: Omit<ChatMessage, 'timestamp'>) {
    const item = this.getItemByPath(path);
    if (!item) return;

    item.chatHistory = item.chatHistory || [];
    item.chatHistory.push({
      ...message,
      timestamp: Date.now()
    });
    this.notify();
  }

  getItemByPath(path: string): AgentItem | null {
    if (!path) return null;

    const parts = path.split('/').filter(Boolean);
    let current: AgentRegistry | AgentItem | undefined = this.data;

    for (const part of parts) {
      if (this.isRegistry(current)) {
        current = current[part];
      } else {
        current = current.children?.[part];
      }

      if (!current) return null;
    }

    return this.isRegistry(current) ? null : current;
  }

  addItem(parentPath: string | null, id: string, item: AgentItem): boolean {
    if (!parentPath) {
      if (this.data.root) {
        this.data.root.children = this.data.root.children || {};
        this.data.root.children[id] = item;
      } else {
        this.data[id] = item;
      }
      this.notify();
      return true;
    }

    const parent = this.getItemByPath(parentPath);
    if (!parent || parent.type !== 'folder') return false;

    parent.children = parent.children || {};
    parent.children[id] = item;
    this.notify();
    return true;
  }

  updateItem(path: string, updates: Partial<AgentItem>): boolean {
    const item = this.getItemByPath(path);
    if (!item) return false;

    Object.assign(item, updates);
    this.notify();
    return true;
  }

  deleteItem(path: string): boolean {
    const parts = path.split('/').filter(Boolean);
    const targetId = parts.pop();
    if (!targetId) return false;

    const parentPath = parts.join('/');
    if (!parentPath) {
      if (!this.data[targetId]) return false;
      delete this.data[targetId];
      this.notify();
      return true;
    }

    const parent = this.getItemByPath(parentPath);
    if (!parent?.children?.[targetId]) return false;

    delete parent.children[targetId];
    this.notify();
    return true;
  }

  onDataChange(cb: () => void) {
    this.onDataChangeCallbacks.push(cb);
  }

  async save(): Promise<boolean> {
    return this.postJson('/api/save', this.data, 'registry');
  }

  async saveMcp(): Promise<boolean> {
    return this.postJson('/api/save-mcp', this.mcpConfig, 'MCP config');
  }

  private async loadJson<T>(url: string, fallback: T): Promise<T> {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json() as T;
    } catch (err) {
      console.error(`Failed to load ${url}:`, err);
      return fallback;
    }
  }

  private async postJson(url: string, payload: unknown, label: string): Promise<boolean> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return true;
    } catch (err) {
      console.error(`Failed to save ${label}:`, err);
      return false;
    }
  }

  private notify() {
    this.onDataChangeCallbacks.forEach(cb => cb());
  }

  private normalizeMcpConfig(config: McpConfig): McpConfig {
    return {
      mcpServers: config?.mcpServers || {}
    };
  }

  private createFallbackRegistry(): AgentRegistry {
    return {
      root: {
        name: 'Root Assistant',
        type: 'folder',
        properties: { role: 'Orchestrator' },
        children: {}
      }
    };
  }

  private isRegistry(value: AgentRegistry | AgentItem | undefined): value is AgentRegistry {
    return Boolean(value && !('type' in value));
  }
}
