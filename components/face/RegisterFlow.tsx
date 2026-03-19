'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CameraView } from '@/components/camera/CameraView';
import { FaceOverlay } from '@/components/camera/FaceOverlay';
import { useCamera } from '@/hooks/useCamera';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { averageDescriptors } from '@/lib/face-api/detector';

type RegisterStep = 'guide' | 'capturing' | 'processing' | 'done' | 'error';

const REQUIRED_SAMPLES = 5; // 수집할 프레임 수

export function RegisterFlow() {
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>('guide');
  const [errorMsg, setErrorMsg] = useState('');
  const samplesRef = useRef<Float32Array[]>([]);
  const [sampleCount, setSampleCount] = useState(0);

  const { videoRef, status, error, startCamera, stopCamera } = useCamera();
  const { result, isLoading } = useFaceDetection({
    videoRef,
    enabled: step === 'capturing',
    intervalMs: 300,
  });

  // 샘플 수집 로직
  const handleCapture = useCallback(async () => {
    if (
      step !== 'capturing' ||
      !result?.detected ||
      result.quality.score < 0.5 ||
      !result.descriptor
    )
      return;

    samplesRef.current.push(result.descriptor);
    setSampleCount(samplesRef.current.length);

    if (samplesRef.current.length >= REQUIRED_SAMPLES) {
      setStep('processing');
      stopCamera();

      try {
        const avgDescriptor = averageDescriptors(samplesRef.current);
        const embedding = Array.from(avgDescriptor);

        const res = await fetch('/api/face/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embedding }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? '등록 실패');
        }

        setStep('done');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : '등록에 실패했습니다.');
        setStep('error');
      }
    }
  }, [step, result, stopCamera]);

  // 감지될 때마다 자동 캡처
  if (step === 'capturing' && result?.detected) {
    handleCapture();
  }

  const progress = Math.min((sampleCount / REQUIRED_SAMPLES) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* 가이드 화면 */}
      {step === 'guide' && (
        <div className="flex flex-col items-center justify-center flex-1 p-8 gap-8 text-white">
          <div className="text-6xl">🪪</div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-3">얼굴 등록</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              카메라가 시작되면 얼굴을 가이드 원 안에 맞춰주세요.
              <br />
              밝은 조명 아래에서 진행해 주세요.
            </p>
          </div>
          <ul className="text-sm text-gray-400 space-y-2 text-left">
            <li>✅ 정면을 바라봐 주세요</li>
            <li>✅ 안경을 벗어주세요 (선택)</li>
            <li>✅ 조명이 밝은 곳에서 진행하세요</li>
          </ul>
          <button
            onClick={() => setStep('capturing')}
            className="w-full max-w-xs py-4 bg-primary-600 rounded-2xl text-white font-semibold text-lg"
          >
            등록 시작
          </button>
        </div>
      )}

      {/* 캡처 화면 */}
      {step === 'capturing' && (
        <div className="flex flex-col items-center p-6 gap-5 flex-1">
          {/* 헤더 */}
          <div className="w-full flex items-center justify-between">
            <button
              onClick={() => { stopCamera(); setStep('guide'); }}
              className="text-gray-400 text-sm px-3 py-1 rounded-lg hover:bg-white/10"
            >
              ← 뒤로
            </button>
            <h2 className="text-white font-semibold">얼굴 등록</h2>
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
              isLoading={isLoading}
              statusMessage={
                result?.detected
                  ? `수집 중... (${sampleCount}/${REQUIRED_SAMPLES})`
                  : undefined
              }
            />
            {/* 진행률 바 */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 안내 텍스트 */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              얼굴을 원 안에 맞추고 정면을 바라봐 주세요
            </p>
            <p className="text-primary-400 text-xs mt-1">
              샘플 {sampleCount} / {REQUIRED_SAMPLES} 수집됨
            </p>
          </div>
        </div>
      )}

      {/* 처리 중 */}
      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-6 text-white">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg">얼굴 데이터 저장 중...</p>
        </div>
      )}

      {/* 완료 */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center flex-1 p-8 gap-6 text-white animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center">
            <span className="text-success text-5xl">✓</span>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">등록 완료!</h2>
            <p className="text-gray-400 text-sm">얼굴이 성공적으로 등록되었습니다.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full max-w-xs py-4 bg-primary-600 rounded-2xl font-semibold text-lg"
          >
            대시보드로 이동
          </button>
        </div>
      )}

      {/* 에러 */}
      {step === 'error' && (
        <div className="flex flex-col items-center justify-center flex-1 p-8 gap-6 text-white">
          <div className="text-5xl">❌</div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">등록 실패</h2>
            <p className="text-gray-400 text-sm">{errorMsg}</p>
          </div>
          <button
            onClick={() => {
              samplesRef.current = [];
              setSampleCount(0);
              setStep('capturing');
            }}
            className="w-full max-w-xs py-4 bg-primary-600 rounded-2xl font-semibold"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
