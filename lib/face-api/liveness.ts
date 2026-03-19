'use client';

import * as faceapi from 'face-api.js';

export interface LivenessState {
  passed: boolean;
  blinkCount: number;
  message: string;
}

const EAR_THRESHOLD = 0.25; // Eye Aspect Ratio 임계값 (눈 감음 감지)
const REQUIRED_BLINKS = 2;  // 필요한 눈 깜빡임 횟수

// Eye Aspect Ratio 계산 (눈 감음 정도 수치화)
function getEAR(eyePoints: faceapi.Point[]): number {
  // 수직 거리
  const v1 = dist(eyePoints[1], eyePoints[5]);
  const v2 = dist(eyePoints[2], eyePoints[4]);
  // 수평 거리
  const h = dist(eyePoints[0], eyePoints[3]);

  return (v1 + v2) / (2.0 * h);
}

function dist(a: faceapi.Point, b: faceapi.Point): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export class LivenessDetector {
  private blinkCount = 0;
  private wasEyesClosed = false;
  private frameHistory: number[] = [];

  reset() {
    this.blinkCount = 0;
    this.wasEyesClosed = false;
    this.frameHistory = [];
  }

  process(landmarks: faceapi.FaceLandmarks68): LivenessState {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const leftEAR = getEAR(leftEye);
    const rightEAR = getEAR(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2;

    this.frameHistory.push(avgEAR);
    if (this.frameHistory.length > 10) this.frameHistory.shift();

    const eyesClosed = avgEAR < EAR_THRESHOLD;

    // 눈 감음 → 뜸 전환 시 깜빡임 카운트
    if (this.wasEyesClosed && !eyesClosed) {
      this.blinkCount++;
    }
    this.wasEyesClosed = eyesClosed;

    const passed = this.blinkCount >= REQUIRED_BLINKS;

    let message = '';
    if (!passed) {
      message = `눈을 ${REQUIRED_BLINKS - this.blinkCount}번 더 깜빡여 주세요`;
    } else {
      message = '라이브니스 인증 완료';
    }

    return {
      passed,
      blinkCount: this.blinkCount,
      message,
    };
  }
}
