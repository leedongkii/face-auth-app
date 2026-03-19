'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import type { CameraStatus } from '@/hooks/useCamera';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  status: CameraStatus;
  error: string | null;
  onStart: () => void;
  className?: string;
}

export function CameraView({
  videoRef,
  status,
  error,
  onStart,
  className,
}: CameraViewProps) {
  useEffect(() => {
    onStart();
  }, [onStart]);

  return (
    <div className={cn('relative w-full h-full bg-black', className)}>
      {/* 비디오 스트림 */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
        style={{ transform: 'scaleX(-1)' }} // 셀피 미러 효과
      />

      {/* 로딩 상태 */}
      {status === 'requesting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">카메라 시작 중...</p>
        </div>
      )}

      {/* 에러 상태 */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white gap-4 p-6 text-center">
          <div className="text-5xl">📷</div>
          <p className="text-base font-medium">카메라를 사용할 수 없습니다</p>
          <p className="text-sm text-gray-300">{error}</p>
          <button
            onClick={onStart}
            className="mt-2 px-6 py-2 bg-primary rounded-full text-sm font-medium"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
