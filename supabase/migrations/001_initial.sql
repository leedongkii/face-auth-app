-- =============================================
-- 안면인식 모바일웹 초기 마이그레이션
-- =============================================

-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- profiles 테이블 (Supabase Auth 연동)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 신규 사용자 자동 프로필 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- face_embeddings 테이블 (128차원 얼굴 벡터)
-- =============================================
CREATE TABLE IF NOT EXISTS public.face_embeddings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  embedding  VECTOR(128) NOT NULL,
  label      TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 벡터 유사도 검색 인덱스 (코사인 거리)
CREATE INDEX IF NOT EXISTS face_embeddings_embedding_idx
  ON public.face_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 사용자별 조회 인덱스
CREATE INDEX IF NOT EXISTS face_embeddings_user_id_idx
  ON public.face_embeddings (user_id);

-- =============================================
-- auth_logs 테이블 (인증 이력)
-- =============================================
CREATE TABLE IF NOT EXISTS public.auth_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  success     BOOLEAN NOT NULL,
  similarity  FLOAT,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_logs_user_id_idx
  ON public.auth_logs (user_id);

CREATE INDEX IF NOT EXISTS auth_logs_created_at_idx
  ON public.auth_logs (created_at DESC);

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 프로필만 조회"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "본인 프로필만 수정"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- face_embeddings
ALTER TABLE public.face_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 벡터만 조회"
  ON public.face_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 벡터만 등록"
  ON public.face_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 벡터만 삭제"
  ON public.face_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- auth_logs
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 로그만 조회"
  ON public.auth_logs FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- 얼굴 유사도 검색 함수 (pgvector)
-- =============================================
CREATE OR REPLACE FUNCTION public.match_face(
  query_embedding VECTOR(128),
  match_threshold FLOAT DEFAULT 0.6,
  match_count     INT DEFAULT 1
)
RETURNS TABLE (
  user_id    UUID,
  similarity FLOAT
)
LANGUAGE SQL STABLE AS $$
  SELECT
    fe.user_id,
    1 - (fe.embedding <=> query_embedding) AS similarity
  FROM public.face_embeddings fe
  WHERE 1 - (fe.embedding <=> query_embedding) > match_threshold
  ORDER BY fe.embedding <=> query_embedding
  LIMIT match_count;
$$;
