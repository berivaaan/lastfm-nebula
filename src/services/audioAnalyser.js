// src/services/audioAnalyser.js
let audioCtx = null;
let analyser = null;
let sourceNode = null;
let dataArray = null;

export function setupAudioAnalyser(audioElement) {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (!sourceNode) {
      sourceNode = audioCtx.createMediaElementSource(audioElement);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
    }

    return { analyser, dataArray, audioCtx };
  } catch (err) {
    console.warn('Web Audio API Initialisierung fehlgeschlagen:', err);
    return null;
  }
}

export function getAudioFrequencies() {
  if (!analyser || !dataArray) {
    return { bass: 0, midHigh: 0, brightness: 0, energy: 0 };
  }

  analyser.getByteFrequencyData(dataArray);

  // Bass (Bins 0-3)
  let bassSum = 0;
  for (let i = 0; i <= 3; i++) {
    bassSum += dataArray[i];
  }
  const bass = bassSum / (4 * 255);

  // Mitten & Höhen (Bins 4-16)
  let midSum = 0;
  for (let i = 4; i <= 16; i++) {
    midSum += dataArray[i];
  }
  const midHigh = midSum / (13 * 255);

  // Spectral Centroid (Klanghelligkeit)
  let weightedSum = 0;
  let totalMagnitude = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const magnitude = dataArray[i];
    weightedSum += i * magnitude;
    totalMagnitude += magnitude;
  }
  const brightness = totalMagnitude > 0 ? (weightedSum / totalMagnitude) / (dataArray.length - 1) : 0;

  // Energy / RMS
  let energySum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    energySum += Math.pow(dataArray[i] / 255, 2);
  }
  const energy = Math.sqrt(energySum / dataArray.length);

  return { bass, midHigh, brightness, energy };
}