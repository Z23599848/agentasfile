import type { AgentItem, ChatMessage } from '../types';

export class ChatView {
  private container: HTMLElement;
  private messagesList: HTMLElement;
  private nameEl: HTMLElement;
  private iconEl: HTMLElement;
  private input: HTMLInputElement;
  private sendBtn: HTMLButtonElement;
  private voiceBtn: HTMLButtonElement;
  private speechStatus: HTMLElement;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isTranscribing = false;
  private onSendMessage: (text: string) => void;
  private onTranscribeAudio: (audio: Blob) => Promise<string>;

  constructor(
    onSendMessage: (text: string) => void,
    onTranscribeAudio: (audio: Blob) => Promise<string>
  ) {
    this.onSendMessage = onSendMessage;
    this.onTranscribeAudio = onTranscribeAudio;
    this.container = document.getElementById('chat-view')!;
    this.messagesList = document.getElementById('chat-messages')!;
    this.nameEl = document.getElementById('chat-agent-name')!;
    this.iconEl = document.getElementById('chat-agent-icon')!;
    this.input = document.getElementById('chat-input') as HTMLInputElement;
    this.sendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement;
    this.voiceBtn = document.getElementById('chat-voice-btn') as HTMLButtonElement;
    this.speechStatus = document.getElementById('chat-speech-status')!;

    this.setupListeners();
  }

  show(agent: AgentItem, history: ChatMessage[]) {
    this.container.classList.remove('hidden');
    this.nameEl.textContent = agent.name;
    this.iconEl.textContent = agent.type === 'folder' ? 'A' : 'F';
    this.renderHistory(history);
    this.scrollToBottom();
  }

  hide() {
    this.stopRecording();
    this.container.classList.add('hidden');
    this.showTyping(false);
    this.setSpeechStatus('');
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
    this.voiceBtn.onclick = () => void this.toggleRecording();
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

  private async toggleRecording() {
    if (this.isTranscribing) return;

    if (this.mediaRecorder?.state === 'recording') {
      this.stopRecording();
      return;
    }

    await this.startRecording();
  }

  private async startRecording() {
    try {
      this.audioChunks = [];
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };
      this.mediaRecorder.onstop = () => void this.handleRecordingComplete();
      this.mediaRecorder.start();

      this.voiceBtn.classList.add('recording');
      this.voiceBtn.textContent = 'Stop';
      this.setSpeechStatus('Listening...');
    } catch (err) {
      console.error('Failed to start recording:', err);
      this.setSpeechStatus('Microphone unavailable.');
    }
  }

  private stopRecording() {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.stopStream();
  }

  private async handleRecordingComplete() {
    const audio = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
    this.audioChunks = [];
    this.mediaRecorder = null;
    this.stopStream();

    if (audio.size === 0) {
      this.resetVoiceButton();
      this.setSpeechStatus('');
      return;
    }

    this.isTranscribing = true;
    this.voiceBtn.disabled = true;
    this.voiceBtn.textContent = '...';
    this.setSpeechStatus('Loading speech model...');

    try {
      const transcript = await this.onTranscribeAudio(audio);
      if (transcript) {
        this.input.value = this.input.value ? `${this.input.value} ${transcript}` : transcript;
        this.input.focus();
        this.setSpeechStatus('Transcribed.');
      } else {
        this.setSpeechStatus('No speech detected.');
      }
    } catch (err) {
      console.error('Failed to transcribe audio:', err);
      this.setSpeechStatus('Transcription failed.');
    } finally {
      this.isTranscribing = false;
      this.voiceBtn.disabled = false;
      this.resetVoiceButton();
    }
  }

  private stopStream() {
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.mediaStream = null;
  }

  private resetVoiceButton() {
    this.voiceBtn.classList.remove('recording');
    this.voiceBtn.textContent = 'Mic';
  }

  private setSpeechStatus(message: string) {
    this.speechStatus.textContent = message;
    this.speechStatus.classList.toggle('hidden', !message);
  }

  private scrollToBottom() {
    this.messagesList.scrollTop = this.messagesList.scrollHeight;
  }
}
