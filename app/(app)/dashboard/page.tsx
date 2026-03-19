import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogoutButton } from './LogoutButton';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  // 등록된 얼굴 수 조회
  const { count: faceCount } = await supabase
    .from('face_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // 최근 인증 로그
  const { data: recentLogs } = await supabase
    .from('auth_logs')
    .select('success, similarity, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <main className="min-h-screen bg-gray-950 p-6 safe-top safe-bottom">
      <div className="max-w-sm mx-auto flex flex-col gap-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-gray-400 text-sm">안녕하세요 👋</p>
            <h1 className="text-xl font-bold text-white">
              {profile?.name ?? user.email}
            </h1>
          </div>
          <LogoutButton />
        </div>

        {/* 얼굴 등록 현황 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">얼굴 등록 현황</h2>
            <span className="text-primary-400 text-sm font-medium">
              {faceCount ?? 0} / 5
            </span>
          </div>
          <div className="flex gap-1.5 mb-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${
                  i < (faceCount ?? 0) ? 'bg-primary-500' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <Link
            href="/register-face"
            className="block w-full py-3 bg-primary-600 rounded-xl text-white font-medium text-center text-sm"
          >
            + 얼굴 등록하기
          </Link>
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/verify"
            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 hover:bg-white/10 transition-colors"
          >
            <span className="text-2xl">🔍</span>
            <span className="text-sm font-medium">얼굴 인증</span>
            <span className="text-xs text-gray-500">실시간 인증 테스트</span>
          </Link>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <span className="text-2xl">📊</span>
            <span className="text-sm font-medium">인증 기록</span>
            <span className="text-xs text-gray-500">
              총 {recentLogs?.length ?? 0}건
            </span>
          </div>
        </div>

        {/* 최근 인증 로그 */}
        {recentLogs && recentLogs.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">최근 인증 내역</h2>
            <div className="flex flex-col gap-2">
              {recentLogs.map((log, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={log.success ? 'text-success' : 'text-error'}>
                      {log.success ? '✓' : '✗'}
                    </span>
                    <span className="text-sm text-gray-300">
                      {log.success ? '인증 성공' : '인증 실패'}
                    </span>
                  </div>
                  <div className="text-right">
                    {log.similarity && (
                      <p className="text-xs text-primary-400">
                        {(log.similarity * 100).toFixed(1)}%
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
