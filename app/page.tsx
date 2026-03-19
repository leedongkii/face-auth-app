import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        {/* 로고 */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-3xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-5xl">
            🪪
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">FaceAuth</h1>
            <p className="text-gray-400 text-sm mt-1">
              얼굴 인식 기반 안전한 인증
            </p>
          </div>
        </div>

        {/* 특징 */}
        <ul className="w-full space-y-3 text-sm">
          {[
            { icon: '🔒', text: '얼굴 벡터만 저장, 원본 이미지 미보관' },
            { icon: '👁️', text: '라이브니스 체크로 사진 스푸핑 방지' },
            { icon: '⚡', text: '클라이언트 처리로 빠른 응답 속도' },
          ].map(({ icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"
            >
              <span className="text-xl">{icon}</span>
              <span className="text-gray-300">{text}</span>
            </li>
          ))}
        </ul>

        {/* 버튼 */}
        <div className="w-full flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 rounded-2xl text-white font-semibold text-center text-lg transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="w-full py-4 bg-white/10 hover:bg-white/15 rounded-2xl text-white font-semibold text-center transition-colors"
          >
            회원가입
          </Link>
        </div>
      </div>
    </main>
  );
}
