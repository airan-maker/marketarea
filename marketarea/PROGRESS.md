# MarketArea - 작업 진행 현황

## 프로젝트 개요
서울 100m 격자 기반 상권 분석 SaaS

## 기술 스택
- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy (async) + GeoAlchemy2
- **Database**: PostgreSQL (asyncpg)
- **ETL**: 공공데이터 수집 파이프라인

## 프로젝트 구조
```
marketarea/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI 앱
│   │   ├── config.py         # 설정 (pydantic-settings)
│   │   ├── database.py       # DB 연결
│   │   ├── api/              # API 라우트
│   │   ├── etl/              # 데이터 수집 파이프라인
│   │   └── models/           # SQLAlchemy 모델 (grid, store, stats)
│   ├── scripts/
│   │   ├── init_grid.py      # 격자 초기화
│   │   └── run_etl.py        # ETL 실행
│   ├── alembic/              # DB 마이그레이션
│   └── .env                  # 환경변수 (API 키 포함)
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # 루트 레이아웃
│   │   │   └── page.tsx      # 메인 페이지
│   │   ├── components/
│   │   │   ├── Map.tsx           # 카카오맵 지도
│   │   │   ├── SearchBar.tsx     # 주소 검색
│   │   │   ├── RadiusSelector.tsx # 반경 선택
│   │   │   ├── IndustrySelector.tsx # 업종 선택
│   │   │   ├── ResultPanel.tsx   # 결과 패널
│   │   │   ├── ScoreCard.tsx     # 점수 카드
│   │   │   └── HealthGauge.tsx   # 건강도 게이지
│   │   ├── lib/api.ts        # API 호출 함수
│   │   └── types/            # TypeScript 타입
│   └── .env                  # NEXT_PUBLIC_KAKAO_MAP_KEY
└── docker-compose.yml
```

## 실행 방법

### 1. Backend
```bash
cd backend
pip install -r requirements.txt

# 격자 초기화
python scripts/init_grid.py

# ETL 실행 (공공데이터 수집)
python scripts/run_etl.py

# 서버 실행
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000 접속
```

### 3. 프록시 설정
- `frontend/next.config.js`에서 `/api/*` 요청을 `http://localhost:8000`으로 프록시

## 완료된 작업

### 1. Backend config.py 수정
- **문제**: `.env`에 `NEXT_PUBLIC_KAKAO_MAP_KEY`가 있어서 pydantic Settings 유효성 검사 실패
- **해결**: `model_config`에 `"extra": "ignore"` 추가
- **파일**: `backend/app/config.py`

### 2. Frontend layout.tsx 정리
- **변경**: `<head>` 안의 `<script>` 태그 제거 (Map 컴포넌트가 직접 SDK 로드)
- **파일**: `frontend/src/app/layout.tsx`

### 3. Map.tsx 개선
- **변경**: 카카오맵 SDK를 컴포넌트 내에서 동적 로드하도록 변경
- SDK 로드 상태 관리 (로딩 중 / 에러 / 정상)
- 디버그 로그 추가 (`[KakaoMap]` prefix)
- **파일**: `frontend/src/components/Map.tsx`

## ETL 실행 결과
| 데이터 | 상태 | 건수 |
|---|---|---|
| Grid (격자) | 정상 | 111,671 |
| Store (상가) | 정상 | 534,978 |
| Sales (매출) | 정상 | 577,025 |
| Population (인구) | 정상 | 10 |
| Floating (유동인구) | 0건 | 0 |
| Rent (임대료) | 에러 | JSON 파싱 실패 |

## 미해결 이슈

### 1. 카카오맵 401 Unauthorized (우선순위: 높음)
- **현상**: SDK 스크립트 로드 시 401 반환
- **확인된 사항**:
  - API 키가 URL에 정상 포함됨 (`appkey=19f629da85b9b9f1d76c81df68250d1e`)
  - JavaScript 키 맞음
  - `http://localhost:3000` 도메인 등록 완료
  - 카카오맵 사용 설정 ON 완료
- **다음 시도할 것**:
  - 카카오 개발자 콘솔에서 앱 키를 재발급 시도
  - 다른 브라우저에서 테스트
  - 카카오 개발자 포럼에서 401 관련 사례 확인
  - 브라우저 캐시 완전 삭제 후 재시도
  - 카카오 앱의 "허용 IP" 설정 확인

### 2. Rent 데이터 수집 실패
- **현상**: `Expecting value: line 1 column 1 (char 0)` JSON 파싱 에러
- **원인**: 공공데이터 API가 빈 응답 반환
- **해결 방향**: `rent_collector.py`에 try-except 및 샘플 데이터 fallback 추가

### 3. Floating Population 0건
- API 키 또는 파라미터 확인 필요

## 환경변수 (.env)
### Backend (.env)
```
DATABASE_URL=postgresql+asyncpg://marketarea:marketarea1234@localhost:5432/marketarea
DATA_GO_KR_API_KEY=(...설정됨)
SEOUL_OPEN_DATA_API_KEY=(...설정됨)
KOSIS_API_KEY=(미설정)
USE_SAMPLE_DATA=false
```

### Frontend (.env)
```
NEXT_PUBLIC_KAKAO_MAP_KEY=19f629da85b9b9f1d76c81df68250d1e
```
