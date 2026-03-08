
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import masterCard from '$lib/images/masterCard.svg';
    import receipt from '$lib/images/receipt.svg';
    import pointer from '$lib/images/pointer.svg';
    import pointer_clicked from '$lib/images/pointer_clicked.svg';
    import { getDashboard } from '$lib/api/dashboard';
    import { clickBatch, clickEarn, clickUpgrade, getClickInfo } from '$lib/api/click';
    import { getGlobalEvents } from '$lib/api/macro';
    import type { DashboardData } from '$lib/api/dashboard';
    import type { ClickInfo } from '$lib/api/click';
    import type { GlobalEvent } from '$lib/api/macro';
    import Skeleton from '$lib/components/Skeleton.svelte';
    import { toast } from 'svelte-sonner';

    let dashboardData = $state<DashboardData | null>(null);
    let clickInfo = $state<ClickInfo | null>(null);
    let globalEvents = $state<GlobalEvent[]>([]);
    let isLoading = $state(true);

    let balance = $state(0);
    let isReceiptClicked = $state(false);
    let showIncomePopup = $state(false);
    let incomeAmount = $state(0);
    let isMouseDown = $state(false);
    let upgradeLoading = $state(false);

    // Batch click — 로컬 즉시 반영, 서버에는 3초마다 배치 전송
    let pendingClicks = 0;
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    let isFlushing = false;
    const BATCH_INTERVAL = 3000;

    function formatNumber(num: number) {
        return num.toLocaleString('en-US');
    }

    function formatCurrency(num: number) {
        return `$ ${formatNumber(num)}`;
    }

    function formatSignedCurrency(num: number): string {
        if (num > 0) return `+$${formatNumber(num)}`;
        if (num < 0) return `-$${formatNumber(Math.abs(num))}`;
        return `$0`;
    }

    function signClass(num: number): string {
        if (num > 0) return 'positive';
        if (num < 0) return 'negative';
        return 'neutral';
    }

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

    async function flushClicks() {
        if (isFlushing || pendingClicks === 0) return;
        isFlushing = true;
        const count = pendingClicks;
        pendingClicks = 0;

        try {
            const result = await clickBatch(count);
            // flush 중 새로 쌓인 낙관적 클릭분 보존
            const optimisticPending = pendingClicks * (clickInfo?.incomePerClick ?? 0);
            balance = result.newBalance + optimisticPending;
        } catch {
            try {
                const result = await clickEarn();
                const optimisticPending = pendingClicks * (clickInfo?.incomePerClick ?? 0);
                balance = result.newBalance + optimisticPending;
            } catch { /* 로컬 값 유지 */ }
        } finally {
            isFlushing = false;
            if (pendingClicks > 0) scheduleFlush();
        }
    }

    function scheduleFlush() {
        if (flushTimer) return;
        flushTimer = setTimeout(() => {
            flushTimer = null;
            flushClicks();
        }, BATCH_INTERVAL);
    }

    function handleReceiptClick() {
        const earned = clickInfo?.incomePerClick ?? 0;
        balance += earned;
        incomeAmount = earned;
        showIncomePopup = true;
        if (!isReceiptClicked) isReceiptClicked = true;
        setTimeout(() => { showIncomePopup = false; }, 1500);

        pendingClicks++;
        scheduleFlush();
    }

    async function handleUpgrade() {
        if (upgradeLoading || !clickInfo || clickInfo.isMaxLevel) return;
        upgradeLoading = true;
        try {
            const result = await clickUpgrade();
            balance = result.remainingBalance;
            clickInfo = await getClickInfo();
            toast.success('업그레이드 완료!');
        } catch (e: any) {
            toast.error(e.message || '업그레이드에 실패했습니다.');
        } finally {
            upgradeLoading = false;
        }
    }

    function handleMouseDown() {
        isMouseDown = true;
    }

    function handleMouseUp() {
        isMouseDown = false;
    }

    onMount(async () => {
        try {
            const [dashboard, click, events] = await Promise.allSettled([
                getDashboard(),
                getClickInfo(),
                getGlobalEvents()
            ]);

            if (dashboard.status === 'fulfilled') {
                dashboardData = dashboard.value;
                balance = dashboard.value.account.cashBalance;
            } else {
                toast.error('대시보드 정보를 불러오지 못했습니다.');
            }
            if (click.status === 'fulfilled') {
                clickInfo = click.value;
                if (!dashboardData) balance = click.value.currentBalance;
            }
            if (events.status === 'fulfilled') {
                globalEvents = events.value.active_events ?? [];
            }
        } finally {
            isLoading = false;
        }
    });

    onDestroy(() => {
        if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
        if (pendingClicks > 0) flushClicks();
    });
</script>

<div class="dashboard-body">
    <div class="layout-wrapper">
        <div class="left-section">
            <div class="small-cards-row">
                <div class="card small-card">
                    <h2 class="card-title">실시간 수익 현황</h2>
                    <div class="income-item">
                        <span class="label">초당 수익</span>
                        <span class="value {signClass(dashboardData?.account.passiveIncomePerSecond ?? 0)}">
                            {#if isLoading}
                                <Skeleton width="5rem" height="1rem" />
                            {:else}
                                {formatSignedCurrency(dashboardData?.account.passiveIncomePerSecond ?? 0)}
                            {/if}
                        </span>
                    </div>
                    <div class="income-item del-bottom-margin">
                        <span class="label">클릭당 수익</span>
                        <span class="value theme-blue">
                            {#if isLoading}
                                <Skeleton width="5rem" height="1rem" />
                            {:else}
                                +${formatNumber(dashboardData?.account.clickIncomePerClick ?? clickInfo?.incomePerClick ?? 0)}
                            {/if}
                        </span>
                    </div>
                </div>

                <div class="card small-card">
                    <h2 class="card-title">핵심 지표</h2>
                    <div class="metric-item">
                        <span class="label">비지니스 :</span>
                        <span class="value">
                            {#if isLoading}<Skeleton width="3rem" height="1rem" style="display: inline-block;" />{:else}{dashboardData?.business.companyCount ?? 0}개{/if}
                        </span>
                    </div>
                    <div class="metric-item">
                        <span class="label">투자 수익률 :</span>
                        <span class="value {signClass((dashboardData?.income.stockTradingIncome ?? 0) + (dashboardData?.income.cryptoTradingIncome ?? 0) + (dashboardData?.income.dividendIncome ?? 0))}">
                            {#if isLoading}<Skeleton width="5rem" height="1rem" style="display: inline-block;" />{:else}{formatSignedCurrency((dashboardData?.income.stockTradingIncome ?? 0) + (dashboardData?.income.cryptoTradingIncome ?? 0) + (dashboardData?.income.dividendIncome ?? 0))}{/if}
                        </span>
                    </div>
                    <div class="metric-item del-bottom-margin">
                        <span class="label">부동산 :</span>
                        <span class="value">
                            {#if isLoading}<Skeleton width="3rem" height="1rem" style="display: inline-block;" />{:else}{dashboardData?.assets.realEstateCount ?? 0}개{/if}
                        </span>
                    </div>
                </div>

            </div>

            <div class="account-cards-wrapper">
                <div class="account-card account-card-back">
                    <div class="card-type-badge">Silver</div>
                </div>
                <div class="account-card account-card-front">
                    <div class="card-header-row">
                        <div class="account-info">
                            <img src={masterCard} alt="mastercard" class="mastercard-icon" />
                            <span class="account-number">**** 7439</span>
                        </div>
                        <span class="account-date">05/26</span>
                    </div>
                    <div class="card-balance-section">
                        <span class="balance-label">잔고:</span>
                        <span class="balance-value">{isLoading ? '로딩 중...' : formatCurrency(balance)}</span>
                    </div>
                    <div class="click-info-row">
                        <div class="click-level">
                            <span class="click-level-badge">Lv.{clickInfo?.currentLevel ?? '—'}</span>
                            <span class="click-income">${formatNumber(clickInfo?.incomePerClick ?? 0)} / 클릭</span>
                        </div>
                        {#if clickInfo && !clickInfo.isMaxLevel}
                            <button
                                class="upgrade-fab"
                                onclick={handleUpgrade}
                                disabled={upgradeLoading}
                            >
                                {#if upgradeLoading}
                                    처리중...
                                {:else}
                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                                        <path d="M10 3L13 9H17L14 13L15 19L10 16L5 19L6 13L3 9H7L10 3Z" fill="currentColor"/>
                                    </svg>
                                    {formatCurrency(clickInfo.upgradeCost)}로 업그레이드
                                {/if}
                            </button>
                        {:else if clickInfo?.isMaxLevel}
                            <span class="upgrade-max-badge">MAX</span>
                        {/if}
                    </div>
                </div>

                <div
                    class="receipt-wrapper"
                    onclick={handleReceiptClick}
                    onmousedown={handleMouseDown}
                    onmouseup={handleMouseUp}
                    onmouseleave={handleMouseUp}
                >
                    <img
                        src={receipt}
                        alt="receipt"
                        class="receipt-icon"
                        draggable="false"
                    />
                    <img
                        src={isMouseDown ? pointer_clicked : pointer}
                        alt="pointer"
                        class="pointer-icon"
                        class:pulse={!isReceiptClicked}
                        draggable="false"
                    />
                    {#if showIncomePopup}
                        <div class="income-popup">
                            +{formatCurrency(incomeAmount)}
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <div class="right-section">
            <div class="card asset-card">
                <div class="card-header">
                    <h2 class="card-title">자산 현황</h2>
                    <button class="view-all">모두 보기</button>
                </div>
                <div class="asset-row">
                    <div class="asset-column">
                        <span class="label">총 자산</span>
                        <span class="value">
                            {#if isLoading}-{:else}${formatNumber(dashboardData?.assets.totalAssetValue ?? 0)}{/if}
                        </span>
                    </div>
                    <div class="asset-column">
                        <span class="label-sub">투자 수익</span>
                        <span class="value {signClass((dashboardData?.income.stockTradingIncome ?? 0) + (dashboardData?.income.cryptoTradingIncome ?? 0) + (dashboardData?.income.dividendIncome ?? 0))}">
                            {#if isLoading}-{:else}{formatSignedCurrency((dashboardData?.income.stockTradingIncome ?? 0) + (dashboardData?.income.cryptoTradingIncome ?? 0) + (dashboardData?.income.dividendIncome ?? 0))} <small>지난 24시간</small>{/if}
                        </span>
                    </div>
                </div>
                <div class="asset-row mt">
                    <div class="asset-column">
                        <span class="label">순위</span>
                        <span class="value">
                            {#if isLoading}-{:else}#{formatNumber(dashboardData?.rank.rank ?? 0)}{/if}
                        </span>
                    </div>
                    <div class="asset-column">
                        <span class="label-sub">자산 가치</span>
                        <span class="value positive">
                            {#if isLoading}-{:else}${formatNumber(dashboardData?.account.totalAssetValue ?? 0)} <small>지난 7일</small>{/if}
                        </span>
                    </div>
                </div>
            </div>

            <div class="card news-card">
                <div class="card-header">
                    <h2 class="card-title">최근 뉴스 및 이벤트</h2>
                    <button class="view-all">모두 보기</button>
                </div>
                <div class="news-list">
                    {#if isLoading}
                        <div class="news-item">
                            <div class="news-content">
                                <div class="news-title">로딩 중...</div>
                            </div>
                        </div>
                    {:else if globalEvents.length === 0}
                        <div class="news-item">
                            <div class="news-content">
                                <div class="news-title">현재 진행 중인 이벤트가 없습니다.</div>
                            </div>
                        </div>
                    {:else}
                        {#each globalEvents.slice(0, 5) as event, i}
                            <div class="news-item">
                                <div class="news-icon {i % 2 === 0 ? 'blue' : 'red'}">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        {#if i % 2 === 0}
                                            <rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
                                        {:else}
                                            <path d="M10 3L12 8L17 9L13 13L14 18L10 15L6 18L7 13L3 9L8 8L10 3Z" stroke="currentColor" stroke-width="2"/>
                                        {/if}
                                    </svg>
                                </div>
                                <div class="news-content">
                                    <div class="news-title">{event.name}</div>
                                    <div class="news-time">{formatTimeRemaining(event.end_time)}</div>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .layout-wrapper {
        display: grid;
        grid-template-columns: calc(66.666% + 1rem) calc(33.333% - 1rem);
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .left-section {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .small-cards-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    .right-section {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .right-section > .card {
        width: 100%;
    }

    .card {
        border-radius: 0.6rem;
        padding: 1.4rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 5%);
        border: 1px solid var(--color-border);
    }

    .small-card {
        min-height: 7rem;
    }

    .asset-card {
        min-height: 13rem;
    }

    .card-title {
        font-size: 1.4rem;
        font-weight: var(--font-semiBold);
        margin-bottom: 1rem;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .view-all {
        background: none;
        border: none;
        color: var(--color-theme-1);
        font-size: 1rem;
        cursor: pointer;
        padding: 0;
    }

    .income-item, .metric-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .del-bottom-margin {
        margin-bottom: -0.2rem;
    }

    .asset-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .asset-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
    }

    .mt {
        margin-top: 20px;
    }

    .label {
        font-size: 1rem;
        color: var(--color-text-gray);
    }

    .label-sub {
        font-size: 1rem;
        color: var(--color-text-gray);
    }

    .value {
        font-size: 1.2rem;
        color: #1a1a1a;
    }

    .value.positive {
        font-size: 1.2rem;
        font-weight: var(--font-bold);
        color: #10b981;
    }

    .value.negative {
        font-size: 1.2rem;
        font-weight: var(--font-bold);
        color: #ef4444;
    }

    .value.neutral {
        font-size: 1.2rem;
        font-weight: var(--font-bold);
        color: var(--color-text-gray);
    }

    .value.theme-blue {
        font-size: 1.2rem;
        font-weight: var(--font-bold);
        color: var(--color-theme-1);
    }

    .value small {
        font-size: 12px;
        color: #999;
        font-weight: 400;
    }

    .account-cards-wrapper {
        position: relative;
        min-height: 30rem;
        padding-bottom: 2rem;
    }

    .account-card {
        position: absolute;
        width: 100%;
        min-height: 10rem;
        border-radius: 30px;
    }

    .account-card-back {
        background: rgba(100, 117, 139, 0.5);
        top: 0;
        left: 0;
        z-index: 1;
        padding-left: 0.5rem;
    }

    .account-card-front {
        background: #222222;
        top: 2rem;
        left: 0;
        z-index: 3;
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 1rem 2rem 1rem;
        box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
    }

    .receipt-wrapper {
        position: absolute;
        top: calc(2rem + 13rem);
        left: 2rem;
        width: calc(100% - 4rem);
        height: auto;
        z-index: 2;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .account-cards-wrapper .receipt-icon {
        width: 100%;
        height: auto;
        opacity: 0.95;
        user-select: none;
        -webkit-user-drag: none;
    }

    .pointer-icon {
        position: absolute;
        width: 10rem;
        height: 10rem;
        transition: all 0.3s ease;
        user-select: none;
        -webkit-user-drag: none;
    }

    .pointer-icon.pulse {
        animation: pulsePointer 2s ease-in-out infinite;
    }

    @keyframes pulsePointer {
        0%, 100% {
            transform: scale(1);
            filter: brightness(1);
        }
        50% {
            transform: scale(1.1);
            filter: brightness(1.2);
        }
    }



    .income-popup {
        position: absolute;
        top: -3rem;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 20px;
        font-size: 1.5rem;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        animation: popupFloat 2s ease-out forwards;
        z-index: 10;
    }

    @keyframes popupFloat {
        0% {
            opacity: 0;
            transform: translateX(-50%) translateY(20px) scale(0.5);
        }
        20% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1.1);
        }
        50% {
            transform: translateX(-50%) translateY(-10px) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-40px) scale(0.8);
        }
    }

    .card-type-badge {
        background: transparent;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 1rem;
        font-weight: 600;
        color: #64758B;
        display: inline-block;
        width: fit-content;
    }

    .card-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .account-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .mastercard-icon {
        width: 2rem;
        height: 2rem;
    }

    .account-number {
        font-size: 1rem;
        letter-spacing: 2px;
        color: rgba(177, 186, 197, 0.5);
    }

    .account-date {
        font-size: 1rem;
        color: rgba(177, 186, 197, 0.5);
    }

    .card-balance-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .balance-label {
        font-size: 1.2rem;
        color: rgba(177, 186, 197, 0.5);
    }

    .balance-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: white;
        letter-spacing: -1px;
    }



    .news-card {
        max-height: 500px;
    }

    .news-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .news-item {
        display: flex;
        gap: 12px;
        align-items: flex-start;
    }

    .news-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .news-icon.blue {
        background: #dbeafe;
        color: #3b82f6;
    }

    .news-icon.red {
        background: #fee2e2;
        color: #ef4444;
    }

    .news-content {
        flex: 1;
    }

    .news-title {
        font-size: 1rem;
        font-weight: 500;
        color: #1a1a1a;
        margin-bottom: 4px;
    }

    .news-time {
        font-size: 12px;
        color: #999;
    }

    /* Click info row inside card */
    .click-info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.15);
    }

    .click-level {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .click-level-badge {
        background: var(--color-theme-1, #00529B);
        color: white;
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
    }

    .click-income {
        font-size: 0.8rem;
        font-weight: 600;
        color: rgba(177, 186, 197, 0.7);
    }

    .upgrade-fab {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.35rem 0.8rem;
        background: linear-gradient(135deg, var(--color-theme-1, #00529B) 0%, #0c3b66 100%);
        color: white;
        border: none;
        border-radius: 16px;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 82, 155, 0.3);
        transition: all 0.2s;
    }
    .upgrade-fab:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 82, 155, 0.4); }
    .upgrade-fab:disabled { opacity: 0.6; cursor: not-allowed; }

    .upgrade-max-badge {
        padding: 0.2rem 0.7rem;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
    }

    @media (max-width: 1024px) {
        .layout-wrapper {
            grid-template-columns: 1fr;
        }
        .small-cards-row {
            grid-template-columns: 1fr 1fr;
        }
    }

    @media (max-width: 768px) {
        .dashboard-body {
            padding: 16px;
        }
    }
</style>
