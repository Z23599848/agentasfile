export interface AgentItem {
  name: string;
  type: 'folder' | 'file';
  properties?: {
    role?: string;
    tools?: string[];
    secrets?: string[];
    behavior?: string;
    mcp_servers?: string[];
    [key: string]: any;
  };
  children?: {
    [key: string]: AgentItem;
  };
  content?: string;
}

export interface AgentRegistry {
  [key: string]: AgentItem;
}

export type ModalMode = 'add-folder' | 'add-file' | 'edit-agent';
