'use client';

import { cn } from '@/lib/utils/cn';
import type { FaceDetectionResult } from '@/lib/face-api/detector';
import type { LivenessState } from '@/lib/face-api/liveness';

interface FaceOverlayProps {
  detection: FaceDetectionResult | null;
  liveness?: LivenessState | null;
  isLoading: boolean;
  statusMessage?: string;
  className?: string;
}

export function FaceOverlay({
  detection,
  liveness,
  isLoading,
  statusMessage,
  className,
}: FaceOverlayProps) {
  const detected = detection?.detected ?? false;
  const qualityOk =
    detected &&
    !detection?.quality.tooSmall &&
    !detection?.quality.tooBig &&
    !detection?.quality.offCenter;

  const overlayColor = isLoading
    ? 'border-gray-400'
    : detected && qualityOk
    ? liveness?.passed
      ? 'border-success'
      : 'border-primary-500'
    : detected
    ? 'border-warning'
    : 'border-white/60';

  const message = isLoading
    ? '모델 로딩 중...'
    : statusMessage ??
      (detected ? detection?.quality.message : '얼굴을 원 안에 위치시켜 주세요');

  return (
    <div className={cn('absolute inset-0 flex flex-col items-center justify-center', className)}>
      {/* 배경 어둡게 */}
      <div className="absolute inset-0 bg-black/30" />

      {/* 얼굴 가이드 타원 */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div
          className={cn(
            'w-56 h-72 rounded-full border-4 transition-colors duration-300',
            overlayColor
          )}
          style={{
            boxShadow: detected && qualityOk
              ? `0 0 0 9999px rgba(0,0,0,0.45)`
              : `0 0 0 9999px rgba(0,0,0,0.45)`,
          }}
        >
          {/* 스캔 애니메이션 */}
          {detected && qualityOk && !liveness?.passed && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="w-full h-0.5 bg-primary-500/70 animate-scan" />
            </div>
          )}

          {/* 인식 완료 체크 */}
          {liveness?.passed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-success text-6xl">✓</div>
            </div>
          )}
        </div>

        {/* 상태 메시지 */}
        <div className="bg-black/60 backdrop-blur-sm rounded-full px-5 py-2">
          <p className="text-white text-sm text-center font-medium">
            {message}
          </p>
        </div>

        {/* 라이브니스 진행 표시 */}
        {liveness && !liveness.passed && (
          <div className="flex gap-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full transition-colors duration-300',
                  i < liveness.blinkCount ? 'bg-success' : 'bg-white/40'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
