'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CameraView } from '@/components/camera/CameraView';
import { FaceOverlay } from '@/components/camera/FaceOverlay';
import { useCamera } from '@/hooks/useCamera';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useLiveness } from '@/hooks/useLiveness';

type VerifyStep = 'liveness' | 'verifying' | 'success' | 'failed';

const MAX_RETRIES = 3;

export function VerifyFlow() {
  const router = useRouter();
  const [step, setStep] = useState<VerifyStep>('liveness');
  const [retryCount, setRetryCount] = useState(0);
  const [similarity, setSimilarity] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const { videoRef, status, error, startCamera, stopCamera } = useCamera();
  const { result, isLoading } = useFaceDetection({
    videoRef,
    enabled: step === 'liveness',
    intervalMs: 150,
  });
  const { liveness, reset: resetLiveness } = useLiveness(result);

  const verify = useCallback(async () => {
    if (isVerifying || !result?.descriptor) return;
    setIsVerifying(true);
    setStep('verifying');
    stopCamera();

    try {
      const embedding = Array.from(result.descriptor);
      const res = await fetch('/api/face/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding }),
      });

      const data = await res.json();

      if (data.matched) {
        setSimilarity(data.similarity);
        setStep('success');
      } else {
        setRetryCount((c) => c + 1);
        setStep('failed');
      }
    } catch {
      setRetryCount((c) => c + 1);
      setStep('failed');
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, result, stopCamera]);

  // 라이브니스 통과 시 자동 인증
  useEffect(() => {
    if (liveness.passed && step === 'liveness' && result?.detected) {
      verify();
    }
  }, [liveness.passed, step, result?.detected, verify]);

  const retry = () => {
    resetLiveness();
    setStep('liveness');
    startCamera();
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* 라이브니스 + 감지 화면 */}
      {step === 'liveness' && (
        <div className="flex flex-col items-center p-6 gap-5 flex-1">
          {/* 헤더 */}
          <div className="w-full flex items-center justify-between">
            <button
              onClick={() => { stopCamera(); router.back(); }}
              className="text-gray-400 text-sm px-3 py-1 rounded-lg hover:bg-white/10"
            >
              ← 뒤로
            </button>
            <h2 className="text-white font-semibold">얼굴 인증</h2>
            <div className="w-16" />
          </div>

          {/* 카메라 박스 */}
          <div className="relative w-full max-w-xs rounded-3xl overflow-hidden bg-black"
               style={{ aspectRatio: '3/4' }}>
            <CameraView
              videoRef={videoRef}
              status={status}
              error={error}
              onStart={startCamera}
              className="absolute inset-0"
            />
            <FaceOverlay
              detection={result}
              liveness={liveness}
              isLoading={isLoading}
            />
          </div>

          {/* 라이브니스 안내 */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">{liveness.message}</p>
            <div className="flex justify-center gap-2 mt-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                    i < liveness.blinkCount ? 'bg-primary-500' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 인증 처리 중 */}
      {step === 'verifying' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-6 text-white">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg">인증 확인 중...</p>
        </div>
      )}

      {/* 인증 성공 */}
      {step === 'success' && (
        <div className="flex flex-col items-center justify-center flex-1 p-8 gap-6 text-white animate-fade-in">
          <div className="w-28 h-28 rounded-full bg-success/20 flex items-center justify-center">
            <span className="text-success text-6xl">✓</span>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">인증 성공</h2>
            <p className="text-gray-400 text-sm">
              유사도: {(similarity * 100).toFixed(1)}%
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full max-w-xs py-4 bg-success rounded-2xl font-semibold text-lg"
          >
            계속하기
          </button>
        </div>
      )}

      {/* 인증 실패 */}
      {step === 'failed' && (
        <div className="flex flex-col items-center justify-center flex-1 p-8 gap-6 text-white animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-error/20 flex items-center justify-center">
            <span className="text-error text-5xl">✗</span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">인증 실패</h2>
            <p className="text-gray-400 text-sm">
              {retryCount >= MAX_RETRIES
                ? '인증 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.'
                : `남은 시도: ${MAX_RETRIES - retryCount}회`}
            </p>
          </div>
          {retryCount < MAX_RETRIES ? (
            <button
              onClick={retry}
              className="w-full max-w-xs py-4 bg-primary-600 rounded-2xl font-semibold"
            >
              다시 시도
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="w-full max-w-xs py-4 bg-gray-700 rounded-2xl font-semibold"
            >
              로그인 페이지로
            </button>
          )}
        </div>
      )}
    </div>
  );
}
