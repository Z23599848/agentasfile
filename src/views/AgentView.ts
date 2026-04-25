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
    document.getElementById('agent-name')!.innerText = agent.name;
    document.getElementById('agent-icon')!.innerText = '📁';

    const propsList = document.getElementById('properties-list')!;
    propsList.innerHTML = '';
    if (agent.properties) {
      Object.entries(agent.properties).forEach(([key, value]) => {
        const row = document.createElement('div');
        row.className = 'property-item';
        row.innerHTML = `
          <div class="property-label">${this.getIconForKey(key)} ${key}</div>
          <div class="property-value">${Array.isArray(value) ? value.join(', ') : value}</div>
        `;
        propsList.appendChild(row);
      });
    }

    const childrenGrid = document.getElementById('children-grid')!;
    this.renderCapabilities(agent);
    childrenGrid.innerHTML = '';
    if (agent.children) {
      Object.entries(agent.children).forEach(([childId, childItem]) => {
        const card = document.createElement('div');
        card.className = 'child-card';
        card.innerHTML = `
          <span class="child-icon">${childItem.type === 'folder' ? '📁' : '📄'}</span>
          <span class="child-name">${childItem.name}</span>
        `;
        card.onclick = () => this.onChildClick(`${path}/${childId}`, childItem);
        childrenGrid.appendChild(card);
      });
    }
  }

  hide() {
    this.container.classList.add('hidden');
  }

  private renderCapabilities(agent: AgentItem) {
    const grid = document.getElementById('capabilities-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const servers = agent.properties?.mcp_servers || [];
    servers.forEach(server => {
      const card = document.createElement('div');
      card.className = 'capability-card active';
      card.innerHTML = `
        <div class="name">🔌 ${server}</div>
        <div class="desc">Agent has access to this capability.</div>
      `;
      grid.appendChild(card);
    });

    if (servers.length === 0) {
      grid.innerHTML = '<p class="muted" style="grid-column: 1/-1">No specialized capabilities assigned.</p>';
    }
  }

  private getIconForKey(key: string): string {
    const icons: any = { role: '👤', tools: '🛠️', secrets: '🔒', behavior: '🧠' };
    return icons[key.toLowerCase()] || '•';
  }
}
