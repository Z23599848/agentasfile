import type { AutomaticSpeechRecognitionOutput, DeviceType } from '@huggingface/transformers';

const MODEL_ID = 'onnx-community/whisper-tiny.en';
const SAMPLE_RATE = 16_000;

type AsrPipeline = (
  audio: Float32Array,
  options?: {
    chunk_length_s?: number;
    stride_length_s?: number;
    language?: string;
    task?: 'transcribe' | 'translate';
  }
) => Promise<AutomaticSpeechRecognitionOutput>;

type PipelineOptions = {
  device: DeviceType;
  dtype?: 'auto' | 'fp32' | 'fp16' | 'q8' | 'q4' | Record<string, 'fp32' | 'q4' | 'q8'>;
};

export class BrowserWhisperTranscriber {
  private pipelinePromise: Promise<AsrPipeline> | null = null;

  isSupported(): boolean {
    const browserNavigator = navigator as Navigator & {
      mediaDevices?: { getUserMedia?: unknown };
    };

    return (
      typeof browserNavigator.mediaDevices?.getUserMedia === 'function' &&
      'MediaRecorder' in window &&
      'AudioContext' in window
    );
  }

  async transcribe(blob: Blob): Promise<string> {
    if (!this.isSupported()) {
      throw new Error('Browser audio recording is not supported here.');
    }

    const [transcriber, audio] = await Promise.all([
      this.getPipeline(),
      this.blobToAudio(blob)
    ]);

    const output = await transcriber(audio, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: 'english',
      task: 'transcribe'
    });

    return output.text.trim();
  }

  private getPipeline(): Promise<AsrPipeline> {
    this.pipelinePromise = this.pipelinePromise || this.createPipeline();
    return this.pipelinePromise;
  }

  private async createPipeline(): Promise<AsrPipeline> {
    const { pipeline } = await import('@huggingface/transformers');
    const preferWebGpu = this.supportsWebGpu();
    const primaryOptions: PipelineOptions = preferWebGpu
      ? {
          device: 'webgpu',
          dtype: {
            encoder_model: 'fp32',
            decoder_model_merged: 'q4'
          }
        }
      : {
          device: 'wasm',
          dtype: 'q8'
        };

    try {
      return await pipeline('automatic-speech-recognition', MODEL_ID, primaryOptions) as AsrPipeline;
    } catch (err) {
      if (!preferWebGpu) throw err;
      return await pipeline('automatic-speech-recognition', MODEL_ID, {
        device: 'wasm',
        dtype: 'q8'
      }) as AsrPipeline;
    }
  }

  private async blobToAudio(blob: Blob): Promise<Float32Array> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();

    try {
      const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      return await this.toMono16k(decoded);
    } finally {
      await audioContext.close();
    }
  }

  private async toMono16k(buffer: AudioBuffer): Promise<Float32Array> {
    const offline = new OfflineAudioContext(1, Math.ceil(buffer.duration * SAMPLE_RATE), SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = buffer;
    source.connect(offline.destination);
    source.start(0);

    const rendered = await offline.startRendering();
    return rendered.getChannelData(0).slice();
  }

  private supportsWebGpu(): boolean {
    return Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
  }
}
