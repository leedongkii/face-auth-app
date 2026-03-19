'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { loadModels } from '@/lib/face-api/loader';
import { detectFace, type FaceDetectionResult } from '@/lib/face-api/detector';

export interface UseFaceDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  enabled: boolean;
  intervalMs?: number;
}

export interface UseFaceDetectionReturn {
  result: FaceDetectionResult | null;
  isLoading: boolean;
  isDetecting: boolean;
}

export function useFaceDetection({
  videoRef,
  enabled,
  intervalMs = 200,
}: UseFaceDetectionOptions): UseFaceDetectionReturn {
  const [result, setResult] = useState<FaceDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);

  // 모델 로드
  useEffect(() => {
    loadModels().then(() => setIsLoading(false));
  }, []);

  // 감지 루프
  const runDetection = useCallback(async () => {
    if (isRunningRef.current) return;
    if (!videoRef.current || videoRef.current.readyState < 2) return;

    isRunningRef.current = true;
    setIsDetecting(true);

    try {
      const detection = await detectFace(videoRef.current);
      setResult(detection);
    } finally {
      isRunningRef.current = false;
      setIsDetecting(false);
    }
  }, [videoRef]);

  useEffect(() => {
    if (!enabled || isLoading) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(runDetection, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isLoading, intervalMs, runDetection]);

  return { result, isLoading, isDetecting };
}
