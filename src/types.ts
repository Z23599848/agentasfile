export interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export interface McpServerConfig {
  command: string;
  args: string[];
  description?: string;
}

export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

export interface AgentItem {
  name: string;
  type: 'folder' | 'file';
  properties?: {
    role?: string;
    tools?: string[];
    secrets?: string[];
    behavior?: string;
    mcp_servers?: string[];
    [key: string]: unknown;
  };
  children?: {
    [key: string]: AgentItem;
  };
  content?: string;
  mcp_servers?: string[];
  chatHistory?: ChatMessage[];
}

export interface AgentRegistry {
  [key: string]: AgentItem;
}

export type ModalMode = 'add-folder' | 'add-file' | 'edit-agent';
