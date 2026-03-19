'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      setError(msg === 'Invalid login credentials'
        ? '이메일 또는 비밀번호가 올바르지 않습니다.'
        : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">로그인</h1>
          <p className="text-gray-400 text-sm mt-1">계정에 접속하세요</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-300">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-3.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-300">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              required
              className="w-full px-4 py-3.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-error text-sm bg-error/10 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary-600 disabled:opacity-50 rounded-2xl text-white font-semibold text-lg transition-opacity"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 얼굴 인증 로그인 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs">또는</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <Link
            href="/verify"
            className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-semibold text-center flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <span>🪪</span>
            <span>얼굴 인식으로 로그인</span>
          </Link>
        </div>

        <p className="text-center text-gray-500 text-sm">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-primary-400 font-medium">
            회원가입
          </Link>
        </p>
      </div>
    </main>
  );
}
