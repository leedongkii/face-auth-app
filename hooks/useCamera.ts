'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error';

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  status: CameraStatus;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setStatus('requesting');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',        // 전면 카메라
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setStatus('active');
        };
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      setStatus('error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return { videoRef, status, error, startCamera, stopCamera };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
        return '카메라 접근이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해 주세요.';
      case 'NotFoundError':
        return '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해 주세요.';
      case 'NotReadableError':
        return '카메라가 다른 앱에서 사용 중입니다.';
      default:
        return `카메라 오류: ${err.message}`;
    }
  }
  return '카메라를 시작할 수 없습니다.';
}
