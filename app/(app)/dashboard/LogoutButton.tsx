'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/20 transition-colors"
    >
      로그아웃
    </button>
  );
}
