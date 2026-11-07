// Real-time Audio Visualizer Service with Web Audio API FFT Frequency Analysis

let sharedAudioCtx: AudioContext | null = null;
let sharedAnalyser: AnalyserNode | null = null;
let sourceConnected = false;
let freqDataArray: Uint8Array<ArrayBuffer> | null = null;

/**
 * Initializes and connects Web Audio AnalyserNode to the master HTML5 audio element
 */
export function initAudioAnalyser(audioElement: HTMLAudioElement | null): AnalyserNode | null {
  if (!audioElement) return sharedAnalyser;

  try {
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;
      sharedAudioCtx = new AudioCtxClass();
    }

    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }

    if (!sharedAnalyser) {
      sharedAnalyser = sharedAudioCtx.createAnalyser();
      sharedAnalyser.fftSize = 256; // 128 frequency bins for tight real-time response
      sharedAnalyser.smoothingTimeConstant = 0.88; // high damping for relaxing, silky fluid movement
      freqDataArray = new Uint8Array(new ArrayBuffer(sharedAnalyser.frequencyBinCount));
    }

    // Connect source only once per audio element instance
    if (!sourceConnected && !(audioElement as any).__adoraSourceConnected) {
      const source = sharedAudioCtx.createMediaElementSource(audioElement);
      source.connect(sharedAnalyser);
      sharedAnalyser.connect(sharedAudioCtx.destination);
      (audioElement as any).__adoraSourceConnected = true;
      sourceConnected = true;
    }

    return sharedAnalyser;
  } catch (err) {
    console.warn('[Adora WebAudio Visualizer Init]', err);
    return sharedAnalyser;
  }
}

/**
 * Resumes audio context on user gesture if suspended by browser autoplay policy
 */
export function resumeAudioContext() {
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
}

export interface AudioFrequencyMetrics {
  bass: number;        // Sub-bass & Bass (40 - 250 Hz) normalized [0..1]
  mids: number;        // Vocal presence & acoustic warmth (250 - 2000 Hz) [0..1]
  treble: number;      // Highs & Air (2000 - 10000 Hz) [0..1]
  overall: number;     // Combined energy [0..1]
  pitch: number;       // Spectral Centroid pitch [0..1]: 0 = deep low pitch, 1 = high pitch
  hasRealAudio: boolean;
  rawBins?: Uint8Array;
}

/**
 * Fetches real-time audio energy across frequency bands on each animation frame
 */
export function getAudioFrequencies(): AudioFrequencyMetrics {
  if (!sharedAnalyser || !freqDataArray) {
    return { bass: 0, mids: 0, treble: 0, overall: 0, pitch: 0.35, hasRealAudio: false };
  }

  try {
    sharedAnalyser.getByteFrequencyData(freqDataArray);

    // Bins 0..3: Sub-bass & bass (40 - 250 Hz)
    let bassSum = 0;
    const bassBins = 4;
    for (let i = 0; i < bassBins; i++) {
      bassSum += freqDataArray[i];
    }
    const bass = bassSum / (bassBins * 255);

    // Bins 4..15: Vocals & low-mids (250 - 1800 Hz)
    let midsSum = 0;
    const midsBins = 12;
    for (let i = 4; i < 4 + midsBins; i++) {
      midsSum += freqDataArray[i];
    }
    const mids = midsSum / (midsBins * 255);

    // Bins 16..45: Highs & Treble (1800 - 7000 Hz)
    let trebleSum = 0;
    const trebleBins = 30;
    for (let i = 16; i < 16 + trebleBins; i++) {
      trebleSum += freqDataArray[i];
    }
    const treble = trebleSum / (trebleBins * 255);

    const overall = bass * 0.5 + mids * 0.35 + treble * 0.15;
    const hasRealAudio = bass > 0.015 || mids > 0.015 || treble > 0.015;

    // Multi-spectral Pitch Perception (0 = deep low bass, 1 = soaring high pitch)
    // 1. High-to-Low Harmonic Energy Ratio (vocals & treble vs low-end bass)
    const lowEnergy = bass * 1.4 + 0.04;
    const highEnergy = mids * 1.1 + treble * 1.8;
    const harmonicRatio = Math.min(1, Math.max(0, (highEnergy / (lowEnergy + highEnergy) - 0.15) / 0.7));

    // 2. Peak Melodic Frequency Bin Tracker (locates predominant voice or instrument tone)
    let peakBin = 2;
    let peakMag = 0;
    const vocalMaxBin = Math.min(48, freqDataArray.length);
    for (let i = 2; i < vocalMaxBin; i++) {
      if (freqDataArray[i] > peakMag) {
        peakMag = freqDataArray[i];
        peakBin = i;
      }
    }
    const peakPitch = Math.min(1, Math.max(0, (peakBin - 2) / 28.0));

    // 3. Spectral Centroid
    let weightedSum = 0;
    let totalMagnitude = 0;
    const maxBin = Math.min(64, freqDataArray.length);
    for (let i = 0; i < maxBin; i++) {
      const mag = freqDataArray[i];
      if (mag > 8) {
        weightedSum += i * mag;
        totalMagnitude += mag;
      }
    }
    let centroidPitch = 0.35;
    if (totalMagnitude > 0) {
      const rawCentroid = weightedSum / totalMagnitude;
      centroidPitch = Math.min(1, Math.max(0, (rawCentroid - 1.5) / 16.0));
    }

    // Dynamic pitch: distinctly separates low pitch (<0.25) from high pitch (>0.65)
    const pitch = hasRealAudio
      ? Math.min(1, Math.max(0, harmonicRatio * 0.45 + peakPitch * 0.35 + centroidPitch * 0.20))
      : 0.35;

    return {
      bass,
      mids,
      treble,
      overall,
      pitch,
      hasRealAudio,
      rawBins: freqDataArray
    };
  } catch {
    return { bass: 0, mids: 0, treble: 0, overall: 0, pitch: 0.35, hasRealAudio: false };
  }
}
