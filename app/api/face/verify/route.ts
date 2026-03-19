import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SIMILARITY_THRESHOLD = parseFloat(
  process.env.FACE_SIMILARITY_THRESHOLD ?? '0.6'
);

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    const body = await request.json();
    const { embedding, userId } = body as {
      embedding: number[];
      userId?: string;
    };

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
      return NextResponse.json(
        { error: '유효하지 않은 얼굴 벡터입니다.' },
        { status: 400 }
      );
    }

    const vectorStr = `[${embedding.join(',')}]`;

    // pgvector match_face 함수로 유사도 검색
    const { data, error } = await supabase.rpc('match_face', {
      query_embedding: vectorStr,
      match_threshold: SIMILARITY_THRESHOLD,
      match_count: 1,
    });

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    if (error || !data || data.length === 0) {
      // 인증 실패 로그
      if (userId) {
        await supabase.from('auth_logs').insert({
          user_id: userId,
          success: false,
          similarity: null,
          ip_address: ip,
          user_agent: userAgent,
        });
      }

      return NextResponse.json({
        matched: false,
        similarity: 0,
        message: '얼굴이 일치하지 않습니다.',
      });
    }

    const match = data[0] as { user_id: string; similarity: number };

    // 인증 성공 로그
    await supabase.from('auth_logs').insert({
      user_id: match.user_id,
      success: true,
      similarity: match.similarity,
      ip_address: ip,
      user_agent: userAgent,
    });

    return NextResponse.json({
      matched: true,
      similarity: match.similarity,
      userId: match.user_id,
      message: '인증에 성공했습니다.',
    });
  } catch (err) {
    console.error('face verify error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
