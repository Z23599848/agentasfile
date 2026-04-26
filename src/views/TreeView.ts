import type { AgentRegistry, AgentItem } from '../types';

export class TreeView {
  private container: HTMLElement;
  private onSelect: (path: string, item: AgentItem) => void;

  constructor(containerId: string, onSelect: (path: string, item: AgentItem) => void) {
    this.container = document.getElementById(containerId)!;
    this.onSelect = onSelect;
  }

  render(data: AgentRegistry, currentPath: string | null) {
    this.container.innerHTML = '';
    Object.entries(data).forEach(([key, item]) => {
      this.container.appendChild(this.createTreeItem(key, item, 0, '', currentPath));
    });
  }

  private createTreeItem(id: string, item: AgentItem, depth: number, path: string, currentPath: string | null): HTMLElement {
    const fullPath = path ? `${path}/${id}` : id;
    const itemContainer = document.createElement('div');
    
    const itemEl = document.createElement('div');
    itemEl.className = 'tree-item';
    if (currentPath === fullPath) itemEl.classList.add('active');
    itemEl.style.paddingLeft = `${depth * 1 + 1}rem`;

    const toggle = document.createElement('span');
    toggle.className = 'folder-toggle';
    if (item.type === 'folder' && item.children && Object.keys(item.children).length > 0) {
      toggle.textContent = '▶';
      toggle.onclick = (e) => {
        e.stopPropagation();
        const childrenList = itemContainer.querySelector('.tree-children');
        if (childrenList) {
          childrenList.classList.toggle('hidden');
          toggle.classList.toggle('expanded');
        }
      };
    }
    itemEl.appendChild(toggle);

    const icon = document.createElement('span');
    icon.className = 'tree-item-icon';
    icon.textContent = item.type === 'folder' ? '📁' : '📄';
    itemEl.appendChild(icon);

    const name = document.createElement('span');
    name.textContent = item.name;
    itemEl.appendChild(name);

    itemEl.onclick = () => this.onSelect(fullPath, item);
    itemContainer.appendChild(itemEl);

    if (item.type === 'folder' && item.children) {
      const childrenContainer = document.createElement('div');
      const isExpanded = currentPath && currentPath.startsWith(fullPath) && currentPath !== fullPath;
      childrenContainer.className = `tree-children ${isExpanded ? '' : 'hidden'}`;
      if (isExpanded) toggle.classList.add('expanded');
      
      Object.entries(item.children).forEach(([childId, childItem]) => {
        childrenContainer.appendChild(this.createTreeItem(childId, childItem, depth + 1, fullPath, currentPath));
      });
      itemContainer.appendChild(childrenContainer);
    }

    return itemContainer;
  }
}
