/**
 * Neural Alarm Audio Service
 * Generates high-fidelity cyber-alerts using Web Audio API
 */

class AlarmService {
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.interval = null;
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playAlarm() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Create a pulsing high-tech alarm sound
    const pulse = () => {
      if (!this.isPlaying) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square'; // Cyber-y square wave
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.2);
    };

    // Pulse every 500ms
    pulse();
    this.interval = setInterval(pulse, 500);
  }

  stopAlarm() {
    this.isPlaying = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const alarmService = new AlarmService();
