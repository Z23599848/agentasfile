import type { AgentItem, ChatMessage } from '../types';

export class ChatView {
  private container: HTMLElement;
  private messagesList: HTMLElement;
  private nameEl: HTMLElement;
  private iconEl: HTMLElement;
  private input: HTMLInputElement;
  private sendBtn: HTMLButtonElement;
  private onSendMessage: (text: string) => void;

  constructor(onSendMessage: (text: string) => void) {
    this.onSendMessage = onSendMessage;
    this.container = document.getElementById('chat-view')!;
    this.messagesList = document.getElementById('chat-messages')!;
    this.nameEl = document.getElementById('chat-agent-name')!;
    this.iconEl = document.getElementById('chat-agent-icon')!;
    this.input = document.getElementById('chat-input') as HTMLInputElement;
    this.sendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement;

    this.setupListeners();
  }

  show(agent: AgentItem, history: ChatMessage[]) {
    this.container.classList.remove('hidden');
    this.nameEl.textContent = agent.name;
    this.iconEl.textContent = agent.type === 'folder' ? '📁' : '📄';
    this.renderHistory(history);
    this.scrollToBottom();
  }

  hide() {
    this.container.classList.add('hidden');
    this.showTyping(false);
  }

  renderHistory(history: ChatMessage[]) {
    this.messagesList.replaceChildren();
    history.forEach(msg => this.addMessage(msg));
  }

  addMessage(msg: ChatMessage) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${msg.sender}`;

    const text = document.createElement('div');
    text.className = 'message-text';
    text.textContent = msg.text;

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date(msg.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    bubble.append(text, time);
    this.messagesList.appendChild(bubble);
    this.scrollToBottom();
  }

  showTyping(isTyping: boolean) {
    const existing = this.messagesList.querySelector('.typing-indicator');
    if (isTyping && !existing) {
      const div = document.createElement('div');
      div.className = 'typing-indicator';
      div.textContent = 'Agent is typing...';
      this.messagesList.appendChild(div);
      this.scrollToBottom();
    } else if (!isTyping && existing) {
      existing.remove();
    }
  }

  setSending(isSending: boolean) {
    this.input.disabled = isSending;
    this.sendBtn.disabled = isSending;
  }

  private setupListeners() {
    this.sendBtn.onclick = () => this.handleSend();
    this.input.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    };
  }

  private handleSend() {
    const text = this.input.value.trim();
    if (!text) return;

    this.onSendMessage(text);
    this.input.value = '';
  }

  private scrollToBottom() {
    this.messagesList.scrollTop = this.messagesList.scrollHeight;
  }
}
