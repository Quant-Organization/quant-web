<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { getDashboard, getProfileStats } from '$lib/api/dashboard';
    import type { DashboardData, ProfileStats } from '$lib/api/dashboard';
    import { getLuxuryItems, type LuxuryItem, type PageResponse } from '$lib/api/asset';
    import { getActiveAuctions, type AuctionResponse } from '$lib/api/auction';
    import { auth } from '$lib/stores/auth';
    import luxury_car from '$lib/images/luxury_car.png';
    import luxury_jet from '$lib/images/luxury_jet.png';
    import luxury_house from '$lib/images/luxury_house.png';
    import luxury_yacht from '$lib/images/luxury_yacht.png';

    let dashboard = $state<DashboardData | null>(null);
    let profile = $state<ProfileStats | null>(null);
    let loading = $state(true);
    let recommendedLuxury = $state<LuxuryItem | null>(null);
    let activeAuction = $state<AuctionResponse | null>(null);

    let currentUser = $state<{ fame?: number } | null>(null);
    const unsubUser = auth.user.subscribe((u) => { currentUser = u; });

    onDestroy(() => {
        unsubUser();
    });

    function formatTimeRemaining(endTime: string): string {
        const end = new Date(endTime);
        const now = new Date();
        const diffMs = end.getTime() - now.getTime();
        if (diffMs <= 0) return '종료됨';
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (diffDays > 0) return `${diffDays}일 ${diffHours}시간 남음`;
        return `${diffHours}시간 남음`;
    }

    onMount(async () => {
        try {
            const [dashboardResult, profileResult, luxuryResult, auctionResult] = await Promise.all([
                getDashboard(),
                getProfileStats(),
                getLuxuryItems(0, 5).catch(() => ({ content: [] }) as PageResponse<LuxuryItem>),
                getActiveAuctions().catch(() => [] as AuctionResponse[])
            ]);
            dashboard = dashboardResult;
            profile = profileResult;
            if (luxuryResult.content.length > 0) {
                recommendedLuxury = luxuryResult.content[Math.floor(Math.random() * luxuryResult.content.length)];
            }
            if (auctionResult.length > 0) {
                activeAuction = auctionResult[0];
            }
        } catch (e) {
            console.error('자산 데이터 로드 실패:', e);
        } finally {
            loading = false;
        }
    });

    function formatCurrency(value: number): string {
        return '$' + (value ?? 0).toLocaleString();
    }

    function formatNumber(value: number): string {
        return (value ?? 0).toLocaleString();
    }

    // 컬렉션 완성도: 자산 카테고리 중 보유한 것의 비율
    let collectionPercent = $derived.by(() => {
        if (!dashboard) return 0;
        const { vehicleCount, jetCount, yachtCount, realEstateCount, luxuryCount } = dashboard.assets;
        const total = vehicleCount + jetCount + yachtCount + realEstateCount + luxuryCount;
        // 전체 최대치 대비 비율 (임의 기준: 각 카테고리 최대 10개 기준)
        const max = 50;
        return Math.min(Math.round((total / max) * 100), 100);
    });

    let assets = $derived.by(() => [
        {
            type: '고급 차량',
            count: `${dashboard?.assets.vehicleCount ?? 0}대`,
            totalValue: formatCurrency(profile?.transportValue ?? 0),
            image: luxury_car,
            link: '/asset/vehicles'
        },
        {
            type: '전용기',
            count: `${dashboard?.assets.jetCount ?? 0}대`,
            totalValue: formatCurrency(0),
            image: luxury_jet,
            link: '/asset/jet'
        },
        {
            type: '개인 부동산',
            count: `${dashboard?.assets.realEstateCount ?? 0}채`,
            totalValue: formatCurrency(profile?.realEstateValue ?? 0),
            image: luxury_house,
            link: '/asset/realestate'
        },
        {
            type: '요트',
            count: `${dashboard?.assets.yachtCount ?? 0}대`,
            totalValue: formatCurrency(0),
            image: luxury_yacht,
            link: '/asset/yacht'
        }
    ]);
</script>

<div class="dashboard-content">
    <h1 class="page-title">내 자산 대시보드</h1>

    <section class="metrics-grid">
        <div class="card metric-card">
            <div class="card-header">
                <span class="metric-title">실시간 수익 현황</span>
            </div>
            <div class="card-body">
                {#if loading}
                    <span class="metric-value">--</span>
                {:else}
                    <span class="metric-value">{formatCurrency(dashboard?.account.passiveIncomePerSecond ?? 0)}/s</span>
                    <span class="metric-change positive">+{formatNumber(dashboard?.income.passiveIncome ?? 0)}</span>
                {/if}
            </div>
        </div>

        <div class="card metric-card">
            <div class="card-header">
                <span class="metric-title">획득 명성 점수</span>
            </div>
            <div class="card-body">
                {#if loading}
                    <span class="metric-value">--</span>
                {:else}
                    <span class="metric-value">{formatNumber(currentUser?.fame ?? 0)}P</span>
                    <span class="metric-change positive">명성</span>
                {/if}
            </div>
        </div>

        <div class="card metric-card">
            <div class="card-header">
                <span class="metric-title">컬렉션 완성도</span>
            </div>
            <div class="card-body">
                {#if loading}
                    <span class="metric-value">--</span>
                {:else}
                    <span class="metric-value">{collectionPercent}%</span>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: {collectionPercent}%"></div>
                    </div>
                {/if}
            </div>
        </div>
    </section>

    <section class="assets-section">
        <h2 class="section-title">보유 자산 요약</h2>
        <div class="assets-grid">
            {#each assets as asset}
                <a href={asset.link} class="asset-card" style="background-image: url('{asset.image}')">
                    <div class="asset-overlay">
                        <h3>{asset.type}</h3>
                        {#if loading}
                            <p>로딩 중...</p>
                        {:else}
                            <p>{asset.count} / 총 가치 : {asset.totalValue}</p>
                        {/if}
                    </div>
                </a>
            {/each}
        </div>
    </section>

    <section class="bottom-grid">
        {#if recommendedLuxury}
            <div class="card wide-card recommendation">
                <div class="img-wrapper">
                    {#if recommendedLuxury.imageUrl}
                        <img src={recommendedLuxury.imageUrl} alt={recommendedLuxury.name}>
                    {:else}
                        <div class="img-placeholder">💎</div>
                    {/if}
                </div>
                <div class="content-wrapper">
                    <h3>새로운 럭셔리 아이템 추천</h3>
                    <p>{recommendedLuxury.brand} '{recommendedLuxury.name}' — {formatCurrency(recommendedLuxury.price)}</p>
                    <button class="btn btn-primary" onclick={() => goto('/asset/luxury')}>상세 정보 보기</button>
                </div>
            </div>
        {:else}
            <div class="card wide-card recommendation">
                <div class="img-wrapper">
                    <div class="img-placeholder">💎</div>
                </div>
                <div class="content-wrapper">
                    <h3>새로운 럭셔리 아이템 추천</h3>
                    <p>현재 추천할 럭셔리 아이템이 없습니다.</p>
                    <button class="btn btn-primary" onclick={() => goto('/asset/luxury')}>럭셔리 샵 보기</button>
                </div>
            </div>
        {/if}

        {#if activeAuction}
            <div class="card wide-card auction">
                <div class="img-wrapper">
                    {#if activeAuction.itemImageUrl}
                        <img src={activeAuction.itemImageUrl} alt={activeAuction.itemName}>
                    {:else}
                        <div class="img-placeholder">🔨</div>
                    {/if}
                </div>
                <div class="content-wrapper">
                    <h3>진행 중인 경매</h3>
                    <p>'{activeAuction.itemName}' — 현재가 {formatCurrency(activeAuction.currentHighestBid ?? 0)} · {formatTimeRemaining(activeAuction.endTime)}</p>
                    <button class="btn btn-warning" onclick={() => goto('/auction')}>경매 참여하기</button>
                </div>
            </div>
        {:else}
            <div class="card wide-card auction">
                <div class="img-wrapper">
                    <div class="img-placeholder">🔨</div>
                </div>
                <div class="content-wrapper">
                    <h3>진행 중인 경매</h3>
                    <p>현재 진행 중인 경매가 없습니다.</p>
                    <button class="btn btn-warning" onclick={() => goto('/auction')}>경매장 보기</button>
                </div>
            </div>
        {/if}
    </section>
</div>

<style>
    /* 기본 레이아웃 및 폰트 설정 */
    .dashboard-content {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #333;
        width: 100%;
    }

    .page-title {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 1.5rem;
    }

    .section-title {
        font-size: 1.7rem;
        font-weight: 700;
        margin: 2rem 0 1rem 0;
    }

    /* 카드 공통 스타일 */
    .card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }

    /* 1. 상단 지표 그리드 */
    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
    }

    .metric-title {
        color: #666;
        font-size: 0.95rem;
        display: block;
        margin-bottom: 0.5rem;
    }

    .metric-value {
        font-size: 2rem;
        font-weight: 800;
        display: block;
        margin-bottom: 0.5rem;
    }

    .metric-change {
        font-size: 1rem;
        font-weight: 600;
    }

    .metric-change.positive {
        color: #2ecc71; /* 녹색 */
    }

    /* 프로그레스 바 스타일 */
    .progress-container {
        background-color: #f3f4f6;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 10px;
    }

    .progress-bar {
        background-color: #0047AB; /* 짙은 파란색 */
        height: 100%;
        border-radius: 4px;
    }

    /* 2. 자산 그리드 (이미지 카드) */
    .assets-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
    }

    .asset-card {
        aspect-ratio: 240 / 290;
        border-radius: 12px;
        background-size: cover;
        background-position: center;
        position: relative;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s;
        text-decoration: none;
        display: block;
    }

    .asset-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.2);
        pointer-events: none;
    }

    .asset-card:hover {
        transform: translateY(-5px);
    }

    /* 이미지 위 텍스트 오버레이 (그라데이션 처리) */
    .asset-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        padding: 2rem 1.5rem 1.5rem 1.5rem;
        color: white;
    }

    .asset-overlay h3 {
        margin: 0 0 5px 0;
        font-size: 1.5rem;
        font-weight: 700;
    }

    .asset-overlay p {
        margin: 0;
        font-size: 1rem;
    }

    /* 3. 하단 그리드 (추천/경매) */
    .bottom-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-top: 2rem;
    }

    .wide-card {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 1.5rem;
    }

    .img-wrapper img {
        width: 150px;
        aspect-ratio: 150 / 113;
        object-fit: cover;
        border-radius: 8px;
    }

    .img-placeholder {
        width: 150px;
        aspect-ratio: 150 / 113;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        background: #f3f4f6;
        border-radius: 8px;
    }

    .content-wrapper h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 700;
    }

    .content-wrapper p {
        margin: 0 0 1rem 0;
        color: #666;
        font-size: 0.95rem;
        line-height: 1.4;
    }

    /* 버튼 스타일 */
    .btn {
        border: none;
        padding: 0.6rem 1.2rem;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: opacity 0.2s;
        text-align: center;
    }

    .btn:hover {
        opacity: 0.9;
    }

    .btn-primary {
        background-color: #0e4c92;
        color: white;
    }

    .btn-warning {
        background-color: #f1c40f;
        color: #2c3e50;
    }

    /* 반응형 처리 (모바일/태블릿) */
    @media (max-width: 1024px) {
        .metrics-grid, .assets-grid, .bottom-grid {
            grid-template-columns: 1fr; /* 모바일에서는 1열로 변경 */
        }

        .assets-grid {
            grid-template-columns: repeat(2, 1fr); /* 태블릿에선 자산 2열 */
        }
    }
</style>
