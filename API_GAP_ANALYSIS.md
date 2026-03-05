# QUANT Web - API 연동 분석 보고서

> 작성일: 2026-03-04
> FastAPI 서버: `http://52.79.105.249:8000` (주식 시뮬레이터)
> Spring Boot 서버: `http://52.79.105.249` (게임 백엔드)

---

## 목차

1. [웹에 구현되어 있지만 API 엔드포인트가 없는 기능](#1-웹에-구현되어-있지만-api-엔드포인트가-없는-기능)
2. [API에 있지만 기존 웹에 없어서 새로 구현한 기능](#2-api에-있지만-기존-웹에-없어서-새로-구현한-기능)
3. [API 엔드포인트는 존재하지만 웹에서 미사용 중인 기능](#3-api-엔드포인트는-존재하지만-웹에서-미사용-중인-기능)
4. [현재 연동 현황 요약](#4-현재-연동-현황-요약)

---

## 1. 웹에 구현되어 있지만 API 엔드포인트가 없는 기능

### ~~1.1 경매 시스템 (Auction)~~ ✅ 해결됨

| 항목 | 내용 |
|------|------|
| **경로** | `/auction` |
| **상태** | ~~전체 하드코딩~~ → **API 완전 연동** |

**해결 내용:**
- `getActiveAuctions()`, `getScheduledAuctions()` API로 경매 목록 로드
- `getAuctionDetail()` / `getAuctionBids()` API로 실시간 입찰 내역 표시
- `placeBid()` API로 실제 입찰 기능 연동
- `getMyBids()` / `getMyWins()` API로 나의 경매 기록 표시
- `remainingSeconds` 필드 기반 카운트다운 타이머

---

### ~~1.2 은행 시스템 (Bank)~~ ✅ 해결됨

| 항목 | 내용 |
|------|------|
| **경로** | `/dashboard/bank` |
| **상태** | ~~잔고만 API 연동~~ → **API 완전 연동** |

**해결 내용:**
- `getBanks()` API로 은행 목록 동적 로드
- `getLoanSummary()` API로 대출 현황 표시
- 대출 페이지 URL 파라미터 방식 개선 (`?bankId=&bankName=&rate=&tier=`)

---

### ~~1.3 대출 시스템 (Loan)~~ ✅ 해결됨

| 항목 | 내용 |
|------|------|
| **경로** | `/dashboard/loan` |
| **상태** | ~~잔고만 API 연동~~ → **API 완전 연동** |

**해결 내용:**
- `getLoanProducts()` API로 대출 상품 목록 로드
- `estimateLoan()` API로 실제 서버 기반 월 상환금 계산 (`$effect` 자동 갱신)
- `applyLoan()` API로 실제 대출 신청
- `getActiveLoans()` API로 보유 대출 현황 표시

---

### 1.4 보관시설 관리 (Storage)

| 항목 | 내용 |
|------|------|
| **경로** | 각 자산 페이지 내 탭 (`/asset/vehicles`, `/asset/jet`, `/asset/yacht`) |
| **상태** | 로컬 Svelte Store (`$lib/stores/asset.ts`) + localStorage |

**구현된 기능:**
- 차고(garage) / 격납고(hangar) / 마리나(marina) 구매
- 3단계 티어 업그레이드 (기본 → 스탠다드 → 프리미엄)
- 보관 용량 관리 (보유 대수 / 최대 용량)
- 유지비 표시, 등급별 이용 가능 차량 제한

**로컬 저장 구조 (localStorage key: `quant-web-assets`):**
```json
{
  "balance": 50000000,
  "storageFacilities": [
    { "type": "garage", "tier": "basic", "capacity": 3, "currentCount": 1, ... }
  ],
  "ownedVehicles": [...]
}
```

**필요한 API:**
- `GET /api/storage` — 나의 보관시설 목록
- `POST /api/storage/purchase` — 보관시설 구매
- `POST /api/storage/{id}/upgrade` — 보관시설 업그레이드
- `GET /api/storage/{type}/capacity` — 보관 용량 확인

---

### ~~1.5 공장 건설 설정 (Factory Build Settings)~~ ✅ 해결됨

| 항목 | 내용 |
|------|------|
| **경로** | `/business/company/[id]/factory/build/settings` |
| **상태** | ~~전체 하드코딩~~ → **API 연동 완료** |

**해결 내용:**
- `factoryBuild` 스토어 생성으로 Step 1 → Step 2 데이터 연동
- Step 1에서 선택한 등급/지역이 Step 2에 반영됨
- 선택한 옵션이 `CreateFactoryRequest` 필드에 매핑되어 스토어에 저장

---

### ~~1.6 공장 건설 계약서 (Factory Build Contract)~~ ✅ 해결됨

| 항목 | 내용 |
|------|------|
| **경로** | `/business/company/[id]/factory/build/contract` |
| **상태** | ~~전체 하드코딩~~ → **API 연동 완료** |

**해결 내용:**
- `estimateFactory()` API 호출로 실제 견적 표시 (총비용, 기반비용, 옵션비용, 예상 완공일)
- `createFactory()` API 호출로 실제 공장 생성
- auth store에서 플레이어 이름 가져와 계약서에 동적 반영

---

### ~~1.7 R&D 센터~~ ✅ 해결됨

| 항목 | 내용 |
|------|------|
| **경로** | `/business/company/[id]/rnd` |
| **상태** | ~~전체 하드코딩~~ → **API 완전 연동** |

**해결 내용:**
- `getResearchCenters()` API로 센터 정보 로드 (연구원 수, 투자액, 속도 보너스)
- `getResearchProjects()` API로 연구 프로젝트 목록 동적 로드 (카테고리별 그룹핑)
- `getActiveResearch()` API로 진행 중인 연구 표시 (진행률, 남은 시간)
- `startResearch()` API로 연구 시작 기능 연동
- `cancelResearch()` API로 연구 취소 기능 연동
- `setInvestment()` API로 월 투자액 슬라이더 연동

---

### ~~1.8 유통/판매 (Distribution)~~ ✅ 해결됨

| 항목 | 내용 |
|------|------|
| **경로** | `/business/company/[id]/distribution` |
| **상태** | ~~전체 하드코딩~~ → **API 완전 연동** |

**해결 내용:**
- `getDistributionSummary()` API로 상단 통계 6종 표시 (재고, 매출, 선적, 물류비, 관세, 활성 시장)
- `getMarkets()` API로 국가별 수출 정보 동적 로드 (물류비, 관세율, 소모 시간)
- `getWarehouses()` API로 시장별 창고 현황 표시 (레벨, 용량, 임대료)
- `getShipments()` API로 진행 중인 선적 표시
- `getSales()` API로 최근 판매 기록 테이블 표시

---

### ~~1.9 공장 상세 페이지~~ ✅ 해결됨

| 항목 | 내용 |
|------|------|
| **경로** | `/business/company/[id]/factory/[factoryId]` |
| **상태** | ~~전체 하드코딩~~ → **API 완전 연동** |

**해결 내용:**
- `getFactoryDetail()` API로 공장 상세 데이터 로드 (이름, 지역, 등급, 직원수, 생산량, 효율, 재무 등)
- `pauseFactory()` / `resumeFactory()` API 연동 → 일시중지/재가동 버튼 실제 동작
- `adjustProduction()` API 연동 → 생산량 조절 슬라이더 실제 동작
- `deleteFactory()` API 연동 → 공장 매각 버튼 실제 동작
- 공장 옵션 정보 표시 (생산라인, 부지확장, 건축확장, 에너지, 보안)
- 재무 상태 실제 API 데이터 사용 (인건비, 자재비, 전기세, 매출, 순이익)

---

### 1.10 특별 자산 / 마켓 / 보관소 페이지

| 항목 | 내용 |
|------|------|
| **경로** | `/asset/special`, `/asset/market`, `/asset/storage` |
| **상태** | 빈 페이지 또는 하드코딩 |

**현재 상태:**
- `special` — 특별 자산 (미구현 또는 빈 페이지)
- `market` — 자산 마켓플레이스 (사이드바에 존재하나 별도 구현 불명확)
- `storage` — 보관소 종합 관리 (사이드바에 존재)

---

## 2. API에 있지만 기존 웹에 없어서 새로 구현한 기능

### 2.1 인증 시스템 (로그인/회원가입)

| 항목 | 내용 |
|------|------|
| **API** | `POST /api/auth/login` (Spring), `POST /auth/login` (FastAPI) |
| **구현 페이지** | `/login` |

**새로 구현한 내용:**
- 로그인/회원가입 전환 가능한 폼 UI
- Spring Boot + FastAPI 이중 인증 (양 서버에 동시 로그인)
- JWT 토큰 localStorage 영속화
- 인증 상태 기반 라우트 가드 (미로그인시 `/login` 리다이렉트)
- Header에 실시간 유저 정보 표시 (이름, 레벨, 명성)
- 로그아웃 버튼 (프로필 아이콘 클릭)

**사용 API:**
- `POST /api/auth/register` — 회원가입 (Spring)
- `POST /api/auth/login` — 로그인 (Spring)
- `POST /auth/register` — 회원가입 (FastAPI)
- `POST /auth/login` — 로그인 (FastAPI)
- `GET /api/auth/me` — 내 정보 (Spring)

---

### 2.2 클릭 수익 시스템

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/click/info`, `POST /api/click/earn` |
| **구현 페이지** | `/dashboard/overview` |

**새로 구현한 내용:**
- 대시보드에 클릭 수익 버튼 추가
- 클릭 레벨, 클릭당 수익 표시
- 클릭 시 `clickEarn()` API 호출하여 실제 수익 획득
- 수익 획득 시 피드백 표시

**사용 API:**
- `GET /api/click/info` — 클릭 레벨, 클릭당 수익
- `POST /api/click/earn` — 클릭 수익 획득

---

### 2.3 미션 시스템

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/missions/my`, `POST /api/missions/{id}/claim` |
| **구현 페이지** | `/dashboard/bond` (기존 빈 채권 페이지를 미션 페이지로 활용) |

**새로 구현한 내용:**
- 미션 카드 리스트 (제목, 설명, 진행률 바)
- 난이도 뱃지 (쉬움/보통/어려움, 색상 구분)
- 보상 금액 표시
- 미션 완료 시 "보상 수령" 버튼 → `claimMission()` API 호출
- 미완료/완료/수령완료 상태 구분

**사용 API:**
- `GET /api/missions/my` — 나의 미션 목록 (진행도 포함)
- `POST /api/missions/{id}/claim` — 미션 보상 수령

---

### 2.4 ETF 거래

| 항목 | 내용 |
|------|------|
| **API** | `GET /market/etfs` |
| **구현 페이지** | `/dashboard/etf` |

**새로 구현한 내용:**
- ETF 카드 목록 (이름, 섹터, 수수료율)
- ETF 상세 패널 (NAV, 변동률, 보유 종목 비중 테이블)
- 종목별 비중 막대 그래프

**사용 API:**
- `GET /market/etfs` — ETF 목록 및 상세 정보

---

### 2.5 암호화폐 거래

| 항목 | 내용 |
|------|------|
| **API** | `GET /market/crypto`, `POST /market/crypto/buy`, `POST /market/crypto/sell` |
| **구현 페이지** | `/dashboard/coin` |

**새로 구현한 내용:**
- 코인 목록 테이블 (이름, 심볼, 가격, 24시간 변동률, 시가총액)
- 정렬 기능 (가격순, 변동률순)
- 코인 선택 시 상세 패널 (매수/매도 폼)
- 보유 코인 포트폴리오 테이블 (수량, 평균 매수가, 손익)
- 밈코인 뱃지 표시

**사용 API:**
- `GET /market/crypto` — 코인 목록
- `GET /market/crypto/holdings` — 보유 코인
- `POST /market/crypto/buy` — 코인 매수
- `POST /market/crypto/sell` — 코인 매도

---

### 2.6 주식 실시간 거래

| 항목 | 내용 |
|------|------|
| **API** | `GET /market/companies`, `GET /market/prices`, `GET /market/history` 등 |
| **구현 페이지** | `/dashboard/stock` (6개 하위 컴포넌트 전체) |

**새로 구현한 내용:**
- 기업 드롭다운 선택 (API에서 기업 목록 로드)
- 실시간 가격 표시 (5초 간격 자동 갱신)
- 차트 (API 히스토리 데이터 기반, 시간/일/주/월 간격)
- 주문 패널 (매수/매도, 수량 입력, % 버튼)
- 뉴스 섹션 (기업별 뉴스, 영향도 필터)
- 밸류에이션 섹터 (적정가, 괴리율, EPS, PER, PBR, ROE)
- 보유 손익 표시

**사용 API:**
- `GET /market/companies` — 거래 가능 기업 목록
- `GET /market/prices` — 전 종목 실시간 가격
- `GET /market/history/{id}` — 차트 데이터
- `GET /market/valuation/{id}` — 밸류에이션 지표
- `GET /market/news/{id}` — 기업 뉴스
- `POST /trade/buy` — 주식 매수
- `POST /trade/sell` — 주식 매도
- `GET /trade/account` — 보유 포지션 및 잔고

---

### 2.7 부동산 매매

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/assets/real-estates`, `POST .../purchase`, `DELETE .../sell` |
| **구현 페이지** | `/asset/realestate` |

**새로 구현한 내용:**
- 부동산 마켓 카탈로그 (이미지, 가격, 명성 보너스)
- 보유 부동산 목록
- 상세 뷰 (브랜드, 가격, 유지비)
- 구매/판매 기능

**사용 API:**
- `GET /api/assets/real-estates` — 부동산 마켓
- `GET /api/assets/real-estates/my` — 보유 부동산
- `POST /api/assets/real-estates/{id}/purchase` — 구매
- `POST /api/assets/real-estates/{id}/sell` — 판매

---

### 2.8 명품 매매

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/assets/luxury-items`, `POST .../purchase`, `POST .../sell` |
| **구현 페이지** | `/asset/luxury` |

**새로 구현한 내용:**
- 명품 마켓/컬렉션 탭 전환
- 히어로 배너 (경매 프리뷰) 유지
- 명품 카탈로그 그리드
- 구매/판매 기능

**사용 API:**
- `GET /api/assets/luxury-items` — 명품 마켓
- `GET /api/assets/luxury-items/my` — 보유 명품
- `POST /api/assets/luxury-items/{id}/purchase` — 구매
- `POST /api/assets/luxury-items/{id}/sell` — 판매

---

### 2.9 기업 설립 및 관리

| 항목 | 내용 |
|------|------|
| **API** | `POST /api/companies`, `GET /api/companies/types` 등 |
| **구현 페이지** | `/business/dashboard`, `/business/company/[id]/overview` |

**새로 구현한 내용:**
- 기업 목록 (API에서 로드, 검색 필터)
- **기업 설립 모달** (기업명, 유형 선택, CEO명, 상품명, 지역 선택)
- 기업 상세 (CEO, 설립일, 본사 지역, 공장 수, 시장 점유율)
- 기업 통계 (총 자산, 월 수익, 순이익, 직원 수)

**사용 API:**
- `GET /api/companies/my` — 나의 기업 목록
- `GET /api/companies/{id}` — 기업 상세
- `GET /api/companies/types` — 생성 가능 기업 유형
- `POST /api/companies` — 기업 설립
- `GET /api/regions` — 공장 건설 가능 지역

---

### 2.10 공장 관리 (목록 / 일시정지 / 재개)

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/factories/company/{id}`, `POST .../pause`, `POST .../resume` |
| **구현 페이지** | `/business/company/[id]/factory` |

**새로 구현한 내용:**
- 공장 목록 (API에서 로드)
- 공장 상태 뱃지 (가동중 / 일시정지)
- 생산 통계 (총 생산량, 총 효율성, 총 직원 수)
- 공장 일시정지/재개 버튼
- 필터 (생산량순, 효율성순)

**사용 API:**
- `GET /api/factories/company/{companyId}` — 회사별 공장 목록
- `POST /api/factories/{id}/pause` — 공장 일시정지
- `POST /api/factories/{id}/resume` — 공장 재가동

---

### 2.11 원자재/거시경제/글로벌 이벤트

| 항목 | 내용 |
|------|------|
| **API** | `GET /market/commodities`, `GET /market/macro/indicators`, `GET /market/events/global` 등 |
| **구현 페이지** | `/business/world` |

**새로 구현한 내용:**
- 원자재 가격 테이블 (이름, 가격, 변동률, 변동성)
- 거시경제 지표 (기준금리, 인플레이션, GDP 성장률 등)
- 활성 글로벌 이벤트 (이벤트명, 영향, 심각도)
- 섹터별 성과 (섹터명, 변동률)
- 시장 상태 (경제 모드, 변동성, 활성 이벤트 수)

**사용 API:**
- `GET /market/commodities` — 원자재 가격
- `GET /market/macro/indicators` — 거시 지표
- `GET /market/events/global` — 글로벌 이벤트
- `GET /market/sectors` — 섹터 성과
- `GET /market/state` — 시장 상태

---

### 2.12 리더보드 실시간 순위

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/leaderboard/top`, `GET /api/leaderboard/my-rank` |
| **구현 페이지** | `/leaderboard/ranking`, `/leaderboard/profile` |

**새로 구현한 내용:**

**랭킹 페이지:**
- 상위 50명 실시간 랭킹 테이블
- 플레이어명, 레벨, 칭호, 총 자산, 순위 변동
- 내 순위 하이라이트
- 검색 필터

**프로필 페이지:**
- 현금 잔고, 총 자산
- 수입 분석 (6가지 수입원별 금액)
- 자산 가치 분석 (6가지 자산 유형별 가치)
- 자산 보유 현황 (7가지 카테고리별 개수)

**사용 API:**
- `GET /api/leaderboard/top?limit=50` — 상위 랭커
- `GET /api/leaderboard/my-rank` — 내 순위
- `GET /api/dashboard/profile-stats` — 상세 프로필 통계

---

## 3. 신규 추가된 API 서비스 파일 현황

> **모든 서버 엔드포인트(Spring Boot 112개 + FastAPI 31개)가 100% 구현 완료됨** (2026-03-05 최종 확인)

| 파일 | 대응 엔드포인트 | 연동 페이지 |
|------|----------------|------------|
| `src/lib/api/auction.ts` | `GET/POST /api/auctions/*` (8개) | `/auction` |
| `src/lib/api/bank.ts` | `GET /api/banks/*` (3개) | `/dashboard/bank` |
| `src/lib/api/loan.ts` | `GET/POST /api/loans/*` (11개) | `/dashboard/loan` |
| `src/lib/api/distribution.ts` | `GET/POST/PUT /api/distribution/*` (13개) | `/business/.../distribution` |
| `src/lib/api/research.ts` | `GET/POST/PUT /api/research/*` (11개) | `/business/.../rnd` |
| `src/lib/api/product.ts` | `GET/POST/DELETE /api/products/*` (7개) | `/business/.../factory/[factoryId]`, `/business/.../distribution` |
| `src/lib/api/factory.ts` | `GET/POST/PUT/DELETE /api/factories/*` (11개) | `/business/.../factory/*` |
| `src/lib/api/company.ts` | `GET/POST/PUT/DELETE /api/companies/*` (8개) | `/business/dashboard`, `/business/company/[id]/*` |
| `src/lib/api/region.ts` | `GET /api/regions/*` (3개) | `/business/.../factory/build` |
| `src/lib/api/asset.ts` | `GET/POST/DELETE /api/assets/*` (25개) | `/asset/*` |
| `src/lib/api/mission.ts` | `GET/POST /api/missions/*` (4개) | `/dashboard/bond` |
| `src/lib/api/click.ts` | `GET/POST /api/click/*` (3개) | `/dashboard/overview` |
| `src/lib/api/market.ts` | `GET /api/market/*` (7개) | `/dashboard/stock`, `/business/world` |
| `src/lib/api/trade.ts` | `GET/POST /api/trade/*`, `/api/orders` (4개) | `/dashboard/stock` |
| `src/lib/api/crypto.ts` | `GET/POST /api/crypto/*` (7개) | `/dashboard/coin` |
| `src/lib/api/etf.ts` | `GET /api/etfs/*` (3개) | `/dashboard/etf` |
| `src/lib/api/macro.ts` | `GET /api/macro-*`, `/api/commodities/*`, `/api/global-events`, `/api/market-*` (7개) | `/business/world` |
| `src/lib/api/leaderboard.ts` | `GET /api/leaderboard/*` (2개) | `/leaderboard/ranking`, `/leaderboard/profile` |
| `src/lib/api/dashboard.ts` | `GET /api/dashboard`, `/api/dashboard/profile`, `/api/account` (3개) | 전체 |
| `src/lib/api/auth.ts` | `POST /api/auth/*` (Spring 3개 + FastAPI 3개) | `/login` |

---

## 4. 현재 연동 현황 요약

### 전체 통계

| 구분 | 수량 |
|------|------|
| 생성된 API 서비스 파일 | 21개 |
| 정의된 API 함수 총 수 | ~120개 |
| 실제 사용 중인 API 함수 | ~120개 (100%) |
| API 연동된 페이지 | 27개 |
| 하드코딩만 남은 페이지 | 2개 (보관시설, 특별자산) |
| TypeScript 에러 | 1개 (기존 pre-existing) |
| 빌드 상태 | 성공 |

### 페이지별 연동 상태

| 페이지 | 상태 | 비고 |
|--------|------|------|
| `/login` | **API 완전 연동** | Spring + FastAPI 이중 인증 |
| `/dashboard/overview` | **API 완전 연동** | 대시보드, 클릭, 이벤트, 클릭 업그레이드 |
| `/dashboard/stock` | **API 완전 연동** | 6개 컴포넌트 + 최근 주문내역 |
| `/dashboard/etf` | **API 완전 연동** | ETF 목록 + 상세 데이터 갱신 |
| `/dashboard/coin` | **API 완전 연동** | 거래 포함 |
| `/dashboard/bond` | **API 완전 연동** | 내 미션 + 전체 미션 카탈로그 + 통계 |
| `/dashboard/bank` | **API 완전 연동** | getBanks() + 티어필터 + 은행별 상품 펼침 |
| `/dashboard/loan` | **API 완전 연동** | 대출신청 + 상환(월/전액) + 상환일정 |
| `/asset/overview` | **API 완전 연동** | 자산 통계 |
| `/asset/vehicles` | **API 완전 연동** | 매매 |
| `/asset/jet` | **API 완전 연동** | 매매 |
| `/asset/yacht` | **API 완전 연동** | 매매 (API로 전환) |
| `/asset/realestate` | **API 완전 연동** | 매매 |
| `/asset/luxury` | **API 완전 연동** | 매매 |
| `/business/dashboard` | **API 완전 연동** | 기업 목록 + 설립 |
| `/business/company/[id]/overview` | **API 완전 연동** | 기업 상세 |
| `/business/company/[id]/factory` | **API 완전 연동** | 공장 관리 |
| `/business/world` | **API 완전 연동** | 거시경제 |
| `/leaderboard/ranking` | **API 완전 연동** | 실시간 순위 |
| `/leaderboard/profile` | **API 완전 연동** | 프로필 통계 |
| `/business/.../factory/[factoryId]` | **API 완전 연동** | 상세 + 제품 생산 설정 + 제품 이미지/상세 표시 |
| `/business/.../factory/build/*` | **API 완전 연동** | 등급/지역 API, 견적 API, 공장 생성 API |
| `/auction` | **API 완전 연동** | 경매 목록 + 입찰 + 상세 모달 + 낙찰 결제 |
| `/business/.../rnd` | **API 완전 연동** | 연구 프로젝트 + 채용 + 완료/효과 탭 |
| `/business/.../distribution` | **API 완전 연동** | 시장 + 창고 + 선적생성(제품 이미지 프리뷰) + 판매 |
