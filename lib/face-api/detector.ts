'use client';

import * as faceapi from 'face-api.js';

export interface FaceDetectionResult {
  detected: boolean;
  descriptor: Float32Array | null;
  landmarks: faceapi.FaceLandmarks68 | null;
  detection: faceapi.FaceDetection | null;
  quality: FaceQuality;
}

export interface FaceQuality {
  score: number;       // 0~1 종합 품질 점수
  tooSmall: boolean;   // 얼굴이 너무 작음
  tooBig: boolean;     // 얼굴이 너무 큼
  offCenter: boolean;  // 중앙에서 벗어남
  message: string;     // 사용자 안내 메시지
}

const TINY_FACE_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 320,
  scoreThreshold: 0.5,
});

export async function detectFace(
  video: HTMLVideoElement
): Promise<FaceDetectionResult> {
  const result = await faceapi
    .detectSingleFace(video, TINY_FACE_OPTIONS)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!result) {
    return {
      detected: false,
      descriptor: null,
      landmarks: null,
      detection: null,
      quality: {
        score: 0,
        tooSmall: false,
        tooBig: false,
        offCenter: false,
        message: '얼굴을 원 안에 위치시켜 주세요',
      },
    };
  }

  const quality = evaluateQuality(result.detection, video);

  return {
    detected: true,
    descriptor: result.descriptor,
    landmarks: result.landmarks,
    detection: result.detection,
    quality,
  };
}

function evaluateQuality(
  detection: faceapi.FaceDetection,
  video: HTMLVideoElement
): FaceQuality {
  const { box } = detection;
  const videoW = video.videoWidth;
  const videoH = video.videoHeight;

  const faceArea = (box.width * box.height) / (videoW * videoH);
  const centerX = (box.x + box.width / 2) / videoW;
  const centerY = (box.y + box.height / 2) / videoH;

  const tooSmall = faceArea < 0.05;
  const tooBig = faceArea > 0.6;
  const offCenter =
    Math.abs(centerX - 0.5) > 0.2 || Math.abs(centerY - 0.5) > 0.2;

  let message = '좋습니다! 잠시 기다려 주세요';
  if (tooSmall) message = '카메라에 더 가까이 다가와 주세요';
  else if (tooBig) message = '카메라에서 조금 멀어져 주세요';
  else if (offCenter) message = '얼굴을 화면 중앙에 맞춰 주세요';

  const score = tooSmall || tooBig || offCenter ? 0.3 : detection.score;

  return { score, tooSmall, tooBig, offCenter, message };
}

// 여러 프레임의 벡터를 평균내어 안정적인 벡터 생성
export function averageDescriptors(descriptors: Float32Array[]): Float32Array {
  if (descriptors.length === 0) return new Float32Array(128);

  const avg = new Float32Array(128);
  for (const desc of descriptors) {
    for (let i = 0; i < 128; i++) {
      avg[i] += desc[i];
    }
  }
  for (let i = 0; i < 128; i++) {
    avg[i] /= descriptors.length;
  }
  return avg;
}

// 두 벡터 간 코사인 유사도 (0~1)
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
