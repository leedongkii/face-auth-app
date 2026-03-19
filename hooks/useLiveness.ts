'use client';

import { useRef, useState, useEffect } from 'react';
import { LivenessDetector, type LivenessState } from '@/lib/face-api/liveness';
import type { FaceDetectionResult } from '@/lib/face-api/detector';

export function useLiveness(detectionResult: FaceDetectionResult | null) {
  const detectorRef = useRef(new LivenessDetector());
  const [liveness, setLiveness] = useState<LivenessState>({
    passed: false,
    blinkCount: 0,
    message: '눈을 2번 깜빡여 주세요',
  });

  useEffect(() => {
    if (!detectionResult?.detected || !detectionResult.landmarks) return;

    const state = detectorRef.current.process(detectionResult.landmarks);
    setLiveness(state);
  }, [detectionResult]);

  const reset = () => {
    detectorRef.current.reset();
    setLiveness({
      passed: false,
      blinkCount: 0,
      message: '눈을 2번 깜빡여 주세요',
    });
  };

  return { liveness, reset };
}
