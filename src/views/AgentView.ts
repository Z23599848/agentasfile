import type { AgentItem } from '../types';

export class AgentView {
  private container: HTMLElement;
  private onChildClick: (path: string, item: AgentItem) => void;

  constructor(containerId: string, onChildClick: (path: string, item: AgentItem) => void) {
    this.container = document.getElementById(containerId)!;
    this.onChildClick = onChildClick;
  }

  show(agent: AgentItem, path: string) {
    this.container.classList.remove('hidden');
    document.getElementById('agent-name')!.textContent = agent.name;
    document.getElementById('agent-icon')!.textContent = '📁';
    document.getElementById('agent-type')!.textContent = agent.type;

    this.renderProperties(agent);
    this.renderCapabilities(agent);
    this.renderChildren(agent, path);
  }

  hide() {
    this.container.classList.add('hidden');
  }

  private renderProperties(agent: AgentItem) {
    const propsList = document.getElementById('properties-list')!;
    propsList.replaceChildren();

    if (!agent.properties || Object.keys(agent.properties).length === 0) {
      propsList.appendChild(this.createEmptyState('No properties configured.'));
      return;
    }

    Object.entries(agent.properties).forEach(([key, value]) => {
      const row = document.createElement('div');
      row.className = 'property-item';

      const label = document.createElement('div');
      label.className = 'property-label';
      label.textContent = `${this.getIconForKey(key)} ${key}`;

      const content = document.createElement('div');
      content.className = 'property-value';
      content.textContent = this.formatValue(value);

      row.append(label, content);
      propsList.appendChild(row);
    });
  }

  private renderChildren(agent: AgentItem, path: string) {
    const childrenGrid = document.getElementById('children-grid')!;
    childrenGrid.replaceChildren();

    if (!agent.children || Object.keys(agent.children).length === 0) {
      childrenGrid.appendChild(this.createEmptyState('No sub-items yet.'));
      return;
    }

    Object.entries(agent.children).forEach(([childId, childItem]) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'child-card';

      const icon = document.createElement('span');
      icon.className = 'child-icon';
      icon.textContent = childItem.type === 'folder' ? '📁' : '📄';

      const name = document.createElement('span');
      name.className = 'child-name';
      name.textContent = childItem.name;

      card.append(icon, name);
      card.onclick = () => this.onChildClick(`${path}/${childId}`, childItem);
      childrenGrid.appendChild(card);
    });
  }

  private renderCapabilities(agent: AgentItem) {
    const grid = document.getElementById('capabilities-grid');
    if (!grid) return;

    grid.replaceChildren();
    const servers = agent.properties?.mcp_servers || agent.mcp_servers || [];

    if (servers.length === 0) {
      grid.appendChild(this.createEmptyState('No specialized capabilities assigned.'));
      return;
    }

    servers.forEach(server => {
      const card = document.createElement('div');
      card.className = 'capability-card active';

      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = `🔌 ${server}`;

      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = 'Agent has access to this capability.';

      card.append(name, desc);
      grid.appendChild(card);
    });
  }

  private createEmptyState(message: string): HTMLElement {
    const empty = document.createElement('p');
    empty.className = 'muted empty-state';
    empty.textContent = message;
    return empty;
  }

  private formatValue(value: unknown): string {
    if (Array.isArray(value)) return value.join(', ');
    if (value && typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value ?? '');
  }

  private getIconForKey(key: string): string {
    const icons: Record<string, string> = {
      role: '👤',
      tools: '🛠️',
      secrets: '🔒',
      behavior: '🧠',
      mcp_servers: '🔌'
    };
    return icons[key.toLowerCase()] || '•';
  }
}
