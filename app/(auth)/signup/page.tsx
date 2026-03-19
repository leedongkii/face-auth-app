'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (authError) throw authError;

      // identities가 비어있으면 이미 가입된 이메일
      if (data.user && data.user.identities?.length === 0) {
        setError('이미 등록된 이메일입니다.');
        return;
      }

      // 이메일 확인 대기 화면으로 전환
      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '회원가입에 실패했습니다.';
      setError(
        msg.includes('already registered') || msg.includes('already been registered')
          ? '이미 등록된 이메일입니다.'
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  // 이메일 확인 안내 화면
  if (done) {
    return (
      <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-white text-center">
          <div className="w-20 h-20 rounded-full bg-primary-600/20 flex items-center justify-center text-4xl">
            ✉️
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">이메일을 확인해 주세요</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              <span className="text-white font-medium">{email}</span>로<br />
              인증 링크를 보냈습니다.<br />
              이메일의 링크를 클릭하면 로그인할 수 있습니다.
            </p>
          </div>
          <div className="w-full bg-white/5 rounded-2xl p-4 text-sm text-gray-400 text-left space-y-1">
            <p>📌 이메일이 오지 않는 경우:</p>
            <p className="pl-4">• 스팸 메일함을 확인해 주세요</p>
            <p className="pl-4">• 몇 분 후 다시 시도해 주세요</p>
          </div>
          <Link
            href="/login"
            className="w-full py-4 bg-primary-600 rounded-2xl font-semibold text-center"
          >
            로그인 페이지로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">회원가입</h1>
          <p className="text-gray-400 text-sm mt-1">새 계정을 만드세요</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-300">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              required
              className="w-full px-4 py-3.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

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
              placeholder="8자 이상 입력"
              minLength={8}
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
            className="w-full py-4 bg-primary-600 disabled:opacity-50 rounded-2xl text-white font-semibold text-lg"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary-400 font-medium">
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
