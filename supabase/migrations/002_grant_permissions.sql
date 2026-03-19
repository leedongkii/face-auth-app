-- =============================================
-- 기존 DB에 권한 부여 (001 이후 배포된 경우 실행)
-- Supabase SQL Editor에서 실행하세요
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.face_embeddings TO authenticated;
GRANT SELECT, INSERT ON public.auth_logs TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON FUNCTION public.match_face TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_face TO anon;
