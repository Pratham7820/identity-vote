// Face recognition using @vladmandic/face-api
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

let modelsLoaded = false;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

export async function getFaceDescriptor(
  video: HTMLVideoElement
): Promise<Float32Array | null> {
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return detection.descriptor;
}

/**
 * Capture multiple face descriptors and average them.
 * Averaging multiple samples improves robustness against lighting,
 * head pose, and accessories like glasses.
 */
export async function getAveragedFaceDescriptor(
  video: HTMLVideoElement,
  samples = 5,
  delayMs = 250
): Promise<Float32Array | null> {
  const descriptors: Float32Array[] = [];
  for (let i = 0; i < samples; i++) {
    const d = await getFaceDescriptor(video);
    if (d) descriptors.push(d);
    if (i < samples - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  if (descriptors.length === 0) return null;
  const len = descriptors[0].length;
  const avg = new Float32Array(len);
  for (const d of descriptors) {
    for (let i = 0; i < len; i++) avg[i] += d[i];
  }
  for (let i = 0; i < len; i++) avg[i] /= descriptors.length;
  return avg;
}

/**
 * Compare two face descriptors. Threshold raised to 0.6 (from 0.5)
 * to better tolerate accessories like glasses, masks, lighting changes.
 * face-api's standard recommended threshold is 0.6.
 */
export function compareFaces(
  descriptor1: number[] | Float32Array,
  descriptor2: number[] | Float32Array,
  threshold = 0.6
): boolean {
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);
  const distance = faceapi.euclideanDistance(Array.from(d1), Array.from(d2));
  console.log('[FaceRecognition] Euclidean distance:', distance.toFixed(4), '(threshold:', threshold, ')');
  return distance < threshold;
}
