import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

const MAX_EMBEDDINGS_PER_USER = 5;

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // 세션 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      return NextResponse.json({ error: `인증 오류: ${authError.message}` }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다. 세션이 만료되었을 수 있습니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { embedding } = body as { embedding: number[] };

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
      return NextResponse.json(
        { error: '유효하지 않은 얼굴 벡터입니다.' },
        { status: 400 }
      );
    }

    // 기존 등록 수 확인
    const { count } = await supabase
      .from('face_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count ?? 0) >= MAX_EMBEDDINGS_PER_USER) {
      return NextResponse.json(
        { error: `최대 ${MAX_EMBEDDINGS_PER_USER}개까지만 등록할 수 있습니다.` },
        { status: 400 }
      );
    }

    // 벡터 저장
    const { data, error: insertError } = await supabase
      .from('face_embeddings')
      .insert({
        user_id: user.id,
        embedding: `[${embedding.join(',')}]`,
        label: 'default',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('face_embeddings insert error:', insertError);
      return NextResponse.json(
        { error: `얼굴 등록에 실패했습니다. (${insertError.code}: ${insertError.message})` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error('face register error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 등록된 얼굴 삭제
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      // 전체 삭제
      await supabase
        .from('face_embeddings')
        .delete()
        .eq('user_id', user.id);
    } else {
      // 개별 삭제
      await supabase
        .from('face_embeddings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('face delete error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
