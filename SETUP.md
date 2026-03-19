# 안면인식 모바일웹 - 세팅 가이드

## 1. 의존성 설치

```bash
cd face-auth-app
npm install
```

## 2. face-api.js 모델 다운로드

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/download-models.ps1
```

**Mac/Linux:**
```bash
bash scripts/download-models.sh
```

## 3. Supabase 프로젝트 설정

### 3-1. Supabase 프로젝트 생성
1. https://supabase.com 접속 → 새 프로젝트 생성
2. 프로젝트 URL, anon key, service role key 복사

### 3-2. pgvector 확장 활성화
Supabase 대시보드 → Database → Extensions → `vector` 활성화

### 3-3. 마이그레이션 실행
Supabase 대시보드 → SQL Editor → `supabase/migrations/001_initial.sql` 내용 붙여넣기 → 실행

## 4. 환경변수 설정

`.env.local` 파일 수정:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
FACE_SIMILARITY_THRESHOLD=0.6
```

## 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속 (HTTPS 필요 시 ngrok 사용)

## 6. Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경변수 설정 (Vercel 대시보드에서도 가능)
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add FACE_SIMILARITY_THRESHOLD
```

## 주요 파일 구조

```
face-auth-app/
├── app/
│   ├── (auth)/login        # 로그인 페이지
│   ├── (auth)/signup       # 회원가입 페이지
│   ├── (app)/dashboard     # 대시보드 (인증 필요)
│   ├── (app)/register-face # 얼굴 등록 (인증 필요)
│   ├── (app)/verify        # 얼굴 인증 (인증 필요)
│   └── api/face/           # 얼굴 등록/인증 API
├── components/
│   ├── camera/             # 카메라 뷰, 오버레이
│   └── face/               # 등록/인증 플로우
├── hooks/                  # 카메라, 감지, 라이브니스 훅
├── lib/
│   ├── face-api/           # 모델 로더, 감지, 라이브니스
│   └── supabase/           # 클라이언트/서버 설정
├── public/models/          # face-api.js 모델 파일
└── supabase/migrations/    # DB 마이그레이션 SQL
```

## 주의사항

- 카메라는 **HTTPS** 또는 **localhost**에서만 동작합니다
- 로컬 개발 시 `http://localhost:3000` 사용 가능
- 외부 기기 테스트 시 ngrok으로 HTTPS 터널 생성 필요
- iOS Safari는 카메라 권한 팝업이 매번 표시될 수 있습니다
