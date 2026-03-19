'use client';

import * as faceapi from 'face-api.js';

let modelsLoaded = false;

const MODEL_URL = '/models';

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;

  await Promise.all([
    // 얼굴 감지 (경량 모델)
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    // 68개 랜드마크 감지 (눈, 코, 입 위치)
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    // 128차원 얼굴 벡터 추출
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
}

export function isModelsLoaded(): boolean {
  return modelsLoaded;
}
