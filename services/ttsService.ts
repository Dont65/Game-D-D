export class TtsService {
  private audioQueue: string[] = [];
  private isPlaying: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private currentVolume: number = 1.0;
  private currentRate: number = 1.0;

  constructor() {}

  public speak(text: string, volume: number = 1.0, rate: number = 1.0) {
    this.cancel(); // Stop current
    this.currentVolume = volume;
    this.currentRate = rate;

    // Google TTS has a char limit (around 200). We need to split text.
    // Split by punctuation to keep sentences natural.
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    
    // Further split if a sentence is too long
    this.audioQueue = [];
    sentences.forEach(sentence => {
        if (sentence.length < 180) {
            this.audioQueue.push(sentence.trim());
        } else {
            // Very naive split by comma or space if super long
            const chunks = sentence.match(/.{1,180}(?:\s|$)/g) || [sentence];
            chunks.forEach(c => this.audioQueue.push(c.trim()));
        }
    });

    this.playNext();
  }

  public setVolume(volume: number) {
    this.currentVolume = volume;
    if (this.currentAudio) {
        this.currentAudio.volume = volume;
    }
  }

  public setRate(rate: number) {
    this.currentRate = rate;
    if (this.currentAudio) {
      this.currentAudio.playbackRate = rate;
    }
  }

  private playNext() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const textPart = this.audioQueue.shift();
    if (!textPart) return;

    // Use Google Translate TTS endpoint
    // Note: client=tw-ob is a known open endpoint, but might be rate limited in heavy production.
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textPart)}&tl=ru&client=tw-ob`;

    this.currentAudio = new Audio(url);
    this.currentAudio.volume = this.currentVolume;
    this.currentAudio.playbackRate = this.currentRate;
    // Ensure pitch is preserved when speed changes (usually default true, but being explicit)
    this.currentAudio.preservesPitch = true;
    
    this.currentAudio.onended = () => {
      this.playNext();
    };

    this.currentAudio.onerror = (e) => {
      console.error("TTS Error", e);
      // Skip to next if this one fails
      this.playNext();
    };

    this.currentAudio.play().catch(e => {
      console.error("Auto-play blocked or error", e);
    });
  }

  public cancel() {
    this.audioQueue = [];
    this.isPlaying = false;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }
}

export const ttsService = new TtsService();