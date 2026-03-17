<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { toast } from 'svelte-sonner';
    import { goto } from '$app/navigation';
    import Chart from 'chart.js/auto';
    import { getPortfolioDashboard } from '$lib/api/trade';
    import { getProfileStats } from '$lib/api/dashboard';
    import type { PortfolioDashboard, PortfolioHolding } from '$lib/api/trade';
    import type { ProfileStats } from '$lib/api/dashboard';
    import { loadCompanyCurrencies } from '$lib/api/market';
    import { getCachedCurrency, displayPrice, formatPrice, type CurrencyCode } from '$lib/utils/currency';
    import SkeletonDashboard from '$lib/components/SkeletonDashboard.svelte';
    import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
    import { Badge } from '$lib/components/ui/badge';
    import { Progress } from '$lib/components/ui/progress';
    import { Separator } from '$lib/components/ui/separator';

    let portfolio = $state<PortfolioDashboard | null>(null);
    let profile = $state<ProfileStats | null>(null);
    let loading = $state(true);
    let holdingTab = $state<'all' | 'stock' | 'crypto' | 'etf'>('all');
    let sortKey = $state<string>('profit_loss_pct');
    let sortDir = $state<'asc' | 'desc'>('desc');

    let allocationCanvas: HTMLCanvasElement;
    let allocationChart: Chart | null = null;

    type UnifiedHolding = {
        id: string;
        name: string;
        type: 'stock' | 'crypto' | 'etf';
        currency: CurrencyCode;
        quantity: number;
        avgPrice: number;
        currentPrice: number;
        totalInvested: number;
        currentValue: number;
        profitLoss: number;
        profitLossPct: number;
        weightPct: number;
    };

    function toUnified(h: PortfolioHolding): UnifiedHolding {
        let type: 'stock' | 'crypto' | 'etf' = 'stock';
        if (h.sector === 'CRYPTO') type = 'crypto';
        else if (h.sector === 'ETF') type = 'etf';

        return {
            id: h.company_id, name: h.company_name, type,
            currency: type === 'stock' ? getCachedCurrency(h.company_id) : 'KRW',
            quantity: h.quantity ?? 0, avgPrice: h.avg_price ?? 0, currentPrice: h.current_price ?? 0,
            totalInvested: h.total_invested ?? 0, currentValue: h.current_value ?? 0,
            profitLoss: h.profit_loss ?? 0, profitLossPct: h.profit_loss_pct ?? 0, weightPct: h.weight_pct ?? 0
        };
    }

    let holdings = $derived.by(() => {
        const allItems = (portfolio?.holdings ?? []).map(toUnified);

        let filtered: UnifiedHolding[];
        if (holdingTab === 'stock') filtered = allItems.filter(h => h.type === 'stock');
        else if (holdingTab === 'crypto') filtered = allItems.filter(h => h.type === 'crypto');
        else if (holdingTab === 'etf') filtered = allItems.filter(h => h.type === 'etf');
        else filtered = allItems;

        filtered.sort((a, b) => {
            const av = (a as Record<string, unknown>)[sortKey] as number;
            const bv = (b as Record<string, unknown>)[sortKey] as number;
            return sortDir === 'desc' ? bv - av : av - bv;
        });
        return filtered;
    });

    let totalInvestmentValue = $derived(
        (portfolio?.holdings ?? []).reduce((s, h) => s + (h.current_value ?? 0), 0)
    );

    let totalPL = $derived(portfolio?.summary.total_profit_loss ?? 0);
    let totalPLPct = $derived(portfolio?.summary.total_profit_loss_pct ?? 0);

    function toggleSort(key: string) {
        if (sortKey === key) sortDir = sortDir === 'desc' ? 'asc' : 'desc';
        else { sortKey = key; sortDir = 'desc'; }
    }

    function money(n: number): string {
        if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
        if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
        return n.toLocaleString();
    }

    function pct(n: number): string {
        return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
    }

    function goToHolding(h: UnifiedHolding) {
        if (h.type === 'stock') goto(`/dashboard/stock?company=${h.id}`);
        else if (h.type === 'etf') goto(`/dashboard/etf`);
        else goto(`/dashboard/coin?coin=${h.id}`);
    }

    let allocationCategories = $derived.by(() => {
        const allItems = (portfolio?.holdings ?? []).map(toUnified);
        const stockValue = allItems.filter(h => h.type === 'stock').reduce((s, h) => s + h.currentValue, 0);
        const cryptoValue = allItems.filter(h => h.type === 'crypto').reduce((s, h) => s + h.currentValue, 0);
        const etfValue = allItems.filter(h => h.type === 'etf').reduce((s, h) => s + h.currentValue, 0);
        return [
            { label: '현금', value: portfolio?.summary.cash ?? profile?.currentBalance ?? 0, color: '#64748b' },
            { label: '주식', value: stockValue, color: '#2563eb' },
            { label: 'ETF', value: etfValue, color: '#14b8a6' },
            { label: '암호화폐', value: cryptoValue, color: '#f59e0b' },
            { label: '비즈니스', value: profile?.businessValue ?? 0, color: '#10b981' },
            { label: '부동산', value: profile?.realEstateValue ?? 0, color: '#8b5cf6' },
            { label: '운송', value: profile?.transportValue ?? 0, color: '#ec4899' },
            { label: '컬렉션', value: profile?.collectionValue ?? 0, color: '#06b6d4' },
        ].filter(c => c.value > 0);
    });

    function buildAllocationChart() {
        if (!allocationCanvas) return;
        allocationChart?.destroy();
        const categories = allocationCategories;

        allocationChart = new Chart(allocationCanvas, {
            type: 'doughnut',
            data: {
                labels: categories.map(c => c.label),
                datasets: [{
                    data: categories.map(c => c.value),
                    backgroundColor: categories.map(c => c.color),
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                cutout: '65%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = categories.reduce((s, c) => s + c.value, 0);
                                const v = ctx.parsed;
                                return `${ctx.label}: ${formatPrice(v, 'KRW')} (${((v / total) * 100).toFixed(1)}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    onMount(async () => {
        const results = await Promise.allSettled([
            getPortfolioDashboard(),
            getProfileStats()
        ]);

        if (results[0].status === 'fulfilled') portfolio = results[0].value;
        else toast.error('포트폴리오를 불러오지 못했습니다.');

        if (results[1].status === 'fulfilled') profile = results[1].value;

        // 주식 보유 종목의 통화 정보를 서버에서 로드
        const stockIds = (portfolio?.holdings ?? [])
            .filter(h => h.sector !== 'CRYPTO' && h.sector !== 'ETF')
            .map(h => h.company_id);
        if (stockIds.length > 0) await loadCompanyCurrencies(stockIds);

        loading = false;

        // wait for DOM
        requestAnimationFrame(() => buildAllocationChart());
    });

    $effect(() => {
        // re-build when any data source changes
        allocationCategories;
        if (allocationCanvas) buildAllocationChart();
    });

    onDestroy(() => {
        allocationChart?.destroy();
        allocationChart = null;
    });
</script>

{#if loading}
    <SkeletonDashboard />
{:else}
<div class="portfolio-page">
    <!-- Hero Summary -->
    <section class="hero-card">
        <div class="hero-left">
            <p class="hero-label">총 자산</p>
            <h1 class="hero-value">{formatPrice(profile?.totalAssetValue ?? 0, 'KRW')}</h1>
            <div class="hero-metrics">
                <span class="hero-pl" class:positive={totalPL >= 0} class:negative={totalPL < 0}>
                    투자 손익 {totalPL >= 0 ? '+' : ''}{formatPrice(totalPL, 'KRW')} ({pct(totalPLPct)})
                </span>
            </div>
        </div>
        <div class="hero-right">
            <div class="hero-stat">
                <span class="hero-stat-label">투자 평가액</span>
                <strong>{formatPrice(totalInvestmentValue, 'KRW')}</strong>
            </div>
            <div class="hero-stat">
                <span class="hero-stat-label">가용 현금</span>
                <strong>{formatPrice(portfolio?.summary.cash ?? 0, 'KRW')}</strong>
            </div>
            <div class="hero-stat">
                <span class="hero-stat-label">수익/손실 종목</span>
                <strong>{portfolio?.summary.winning_count ?? 0}개 / {portfolio?.summary.losing_count ?? 0}개</strong>
            </div>
        </div>
    </section>

    <Separator />

    <!-- Performance Returns -->
    {#if portfolio?.performance}
    <section class="perf-row">
        {#each [
            { label: '일간', value: portfolio.performance.daily_return ?? 0 },
            { label: '주간', value: portfolio.performance.weekly_return ?? 0 },
            { label: '월간', value: portfolio.performance.monthly_return ?? 0 },
            { label: '누적', value: portfolio.performance.cumulative_return ?? 0 },
        ] as item}
            <div class="perf-card">
                <span class="perf-label">{item.label}</span>
                <strong class="perf-value" class:positive={item.value >= 0} class:negative={item.value < 0}>
                    {pct(item.value)}
                </strong>
            </div>
        {/each}
    </section>
    {/if}

    <Separator />

    <!-- Main Content -->
    <div class="main-grid">
        <!-- Left: Holdings Table -->
        <section class="holdings-section">
            <div class="holdings-header">
                <h2 class="section-title">보유 자산</h2>
                <Tabs value={holdingTab} onValueChange={(v) => holdingTab = v as 'all' | 'stock' | 'crypto' | 'etf'}>
                    <TabsList class="h-auto gap-1 bg-[#f1f5f9] p-[0.1875rem] rounded-lg">
                        <TabsTrigger value="all" class="rounded-md px-3 py-1.5 text-[0.8125rem] font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--color-theme-1)] data-[state=active]:shadow-sm">전체</TabsTrigger>
                        <TabsTrigger value="stock" class="rounded-md px-3 py-1.5 text-[0.8125rem] font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--color-theme-1)] data-[state=active]:shadow-sm">주식</TabsTrigger>
                        <TabsTrigger value="etf" class="rounded-md px-3 py-1.5 text-[0.8125rem] font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--color-theme-1)] data-[state=active]:shadow-sm">ETF</TabsTrigger>
                        <TabsTrigger value="crypto" class="rounded-md px-3 py-1.5 text-[0.8125rem] font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--color-theme-1)] data-[state=active]:shadow-sm">코인</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {#if holdings.length === 0}
                <div class="empty-state">보유 중인 자산이 없습니다</div>
            {:else}
            <div class="holdings-table-wrap">
                <table class="holdings-table">
                    <thead>
                        <tr>
                            <th class="col-name">종목</th>
                            <th class="col-num clickable" onclick={() => toggleSort('currentPrice')}>현재가</th>
                            <th class="col-num clickable" onclick={() => toggleSort('quantity')}>수량</th>
                            <th class="col-num clickable" onclick={() => toggleSort('currentValue')}>평가액</th>
                            <th class="col-num clickable" onclick={() => toggleSort('profitLoss')}>손익</th>
                            <th class="col-num clickable" onclick={() => toggleSort('profitLossPct')}>수익률</th>
                            <th class="col-num clickable" onclick={() => toggleSort('weightPct')}>비중</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each holdings as h}
                        <tr class="holding-row" onclick={() => goToHolding(h)}>
                            <td class="col-name">
                                {#if h.type === 'stock'}
                                    <Badge variant="outline" class="mr-1.5 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50 text-[0.6875rem] font-bold px-1.5 py-0.5 rounded">주식</Badge>
                                {:else if h.type === 'etf'}
                                    <Badge variant="outline" class="mr-1.5 bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-50 text-[0.6875rem] font-bold px-1.5 py-0.5 rounded">ETF</Badge>
                                {:else}
                                    <Badge variant="outline" class="mr-1.5 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50 text-[0.6875rem] font-bold px-1.5 py-0.5 rounded">코인</Badge>
                                {/if}
                                <span class="holding-name">{h.name}</span>
                            </td>
                            <td class="col-num">{displayPrice(h.currentPrice, h.currency)}</td>
                            <td class="col-num">{h.type === 'crypto' ? (h.quantity % 1 === 0 ? h.quantity : h.quantity.toFixed(4)) : h.quantity}{h.type === 'etf' ? '좌' : ''}</td>
                            <td class="col-num">{formatPrice(Math.round(h.currentValue), h.currency)}</td>
                            <td class="col-num" class:positive={h.profitLoss >= 0} class:negative={h.profitLoss < 0}>
                                {h.profitLoss >= 0 ? '+' : ''}{formatPrice(Math.round(h.profitLoss), h.currency)}
                            </td>
                            <td class="col-num" class:positive={h.profitLossPct >= 0} class:negative={h.profitLossPct < 0}>
                                {pct(h.profitLossPct)}
                            </td>
                            <td class="col-num">{h.weightPct.toFixed(1)}%</td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            {/if}
        </section>

        <!-- Right: Allocation + Trades -->
        <aside class="right-panel">
            <!-- Allocation Chart -->
            <div class="card">
                <h3 class="card-title">자산 구성</h3>
                {#if allocationCategories.length > 0}
                <div class="chart-wrap">
                    <canvas bind:this={allocationCanvas}></canvas>
                </div>
                <div class="legend">
                    {#each allocationCategories as c}
                        <div class="legend-item">
                            <span class="legend-dot" style="background: {c.color}"></span>
                            <span class="legend-label">{c.label}</span>
                            <span class="legend-value">{formatPrice(c.value, 'KRW')}</span>
                        </div>
                    {/each}
                </div>
                {:else}
                    <p class="muted">자산 데이터가 없습니다</p>
                {/if}
            </div>

            <!-- Recent Trades -->
            {#if portfolio && portfolio.recent_trades.length > 0}
            <div class="card">
                <h3 class="card-title">최근 거래 <span class="trade-count">{portfolio.total_trades}건</span></h3>
                <div class="trades-list">
                    {#each portfolio.recent_trades as trade}
                        <div class="trade-row">
                            {#if trade.type === 'BUY'}
                                <Badge variant="outline" class="bg-red-50 text-red-600 border-red-200 hover:bg-red-50 text-[0.75rem] font-bold px-1.5 py-0.5 rounded justify-center">매수</Badge>
                            {:else}
                                <Badge variant="outline" class="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50 text-[0.75rem] font-bold px-1.5 py-0.5 rounded justify-center">매도</Badge>
                            {/if}
                            <span class="trade-name">{trade.company_name}</span>
                            <span class="trade-qty">{trade.quantity}주</span>
                            <span class="trade-amount">{displayPrice(trade.total_amount, getCachedCurrency(trade.company_id))}</span>
                        </div>
                    {/each}
                </div>
            </div>
            {/if}

            <!-- Asset Breakdown -->
            {#if allocationCategories.length > 0}
            <div class="card">
                <h3 class="card-title">자산 카테고리</h3>
                <div class="category-list">
                    {#each allocationCategories as cat}
                        {@const total = allocationCategories.reduce((s, c) => s + c.value, 0) || 1}
                        {@const pctVal = Math.min((cat.value / total) * 100, 100)}
                        <div class="category-row">
                            <div class="category-info">
                                <span class="category-label">{cat.label}</span>
                                <span class="category-pct">{pctVal.toFixed(1)}%</span>
                            </div>
                            <Progress value={pctVal} class="h-1.5 bg-slate-100 [&>[data-slot=progress-indicator]]:bg-[var(--color-theme-1)]" />
                            <span class="category-value">{formatPrice(cat.value, 'KRW')}</span>
                        </div>
                    {/each}
                </div>
            </div>
            {/if}

            <!-- 업종별 배분 -->
            {#if portfolio && portfolio.allocation_by_sector.length > 0}
            <div class="card">
                <h3 class="card-title">업종별 비중</h3>
                <div class="category-list">
                    {#each portfolio.allocation_by_sector as sector}
                        <div class="category-row">
                            <div class="category-info">
                                <span class="category-label">{sector.sector}</span>
                                <span class="category-pct">{sector.percentage.toFixed(1)}%</span>
                            </div>
                            <Progress value={Math.min(sector.percentage, 100)} class="h-1.5 bg-slate-100 [&>[data-slot=progress-indicator]]:bg-[var(--color-theme-1)]" />
                        </div>
                    {/each}
                </div>
            </div>
            {/if}
        </aside>
    </div>
</div>
{/if}

<style>
    .portfolio-page {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    /* Hero Card */
    .hero-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--color-theme-1);
        color: #fff;
        padding: 1.5rem 2rem;
        border-radius: 1rem;
    }

    .hero-label {
        font-size: 0.875rem;
        opacity: 0.8;
        margin: 0 0 0.25rem;
    }

    .hero-value {
        font-size: 2rem;
        font-weight: 800;
        margin: 0 0 0.5rem;
        letter-spacing: -0.5px;
    }

    .hero-pl {
        font-size: 0.875rem;
        font-weight: 600;
        padding: 0.25rem 0.625rem;
        border-radius: 0.375rem;
    }

    .hero-pl.positive { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
    .hero-pl.negative { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }

    .hero-right {
        display: flex;
        gap: 1.5rem;
    }

    .hero-stat {
        text-align: right;
    }

    .hero-stat-label {
        display: block;
        font-size: 0.75rem;
        opacity: 0.7;
        margin-bottom: 0.25rem;
    }

    .hero-stat strong {
        font-size: 1rem;
        font-weight: 700;
    }

    /* Performance Row */
    .perf-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.75rem;
    }

    .perf-card {
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 0.75rem;
        padding: 0.875rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .perf-label {
        font-size: 0.8125rem;
        color: var(--color-text-gray);
    }

    .perf-value {
        font-size: 1.125rem;
        font-weight: 800;
    }

    /* Main Grid */
    .main-grid {
        display: flex;
        gap: 1.25rem;
    }

    /* Holdings Section */
    .holdings-section {
        flex: 1;
        min-width: 0;
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 0.75rem;
        padding: 1.25rem;
    }

    .holdings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .section-title {
        font-size: 1.0625rem;
        font-weight: 700;
        margin: 0;
    }

    .holdings-table-wrap {
        overflow-x: auto;
    }

    .holdings-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;
    }

    .holdings-table th {
        text-align: right;
        font-weight: 600;
        color: var(--color-text-gray);
        padding: 0.5rem 0.625rem;
        border-bottom: 1px solid var(--color-border);
        white-space: nowrap;
    }

    .holdings-table th.clickable {
        cursor: pointer;
    }

    .holdings-table th.clickable:hover {
        color: var(--color-theme-1);
    }

    .col-name {
        text-align: left !important;
    }

    .holdings-table td {
        padding: 0.625rem;
        border-bottom: 1px solid #f8fafc;
        white-space: nowrap;
    }

    .col-num {
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    .holding-row {
        cursor: pointer;
        transition: background 0.15s;
    }

    .holding-row:hover {
        background: #f8fafc;
    }

    .holding-name {
        font-weight: 600;
        color: #0f172a;
    }

    .positive { color: var(--color-positive); }
    .negative { color: var(--color-negative); }

    .empty-state {
        text-align: center;
        color: var(--color-text-gray);
        padding: 3rem 0;
        font-size: 0.875rem;
    }

    /* Right Panel */
    .right-panel {
        width: 22rem;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .card {
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 0.75rem;
        padding: 1.125rem;
    }

    .card-title {
        font-size: 0.9375rem;
        font-weight: 700;
        margin: 0 0 0.875rem;
    }

    .trade-count {
        font-weight: 400;
        font-size: 0.8125rem;
        color: var(--color-text-gray);
    }

    /* Chart */
    .chart-wrap {
        height: 11rem;
        margin-bottom: 1rem;
    }

    .legend {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
    }

    .legend-dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .legend-label {
        flex: 1;
        color: var(--color-text-gray);
    }

    .legend-value {
        font-weight: 600;
        color: #0f172a;
    }

    /* Trades */
    .trades-list {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        max-height: 12.5rem;
        overflow-y: auto;
    }

    .trade-row {
        display: grid;
        grid-template-columns: 2.5rem 1fr auto auto;
        gap: 0.5rem;
        align-items: center;
        font-size: 0.8125rem;
        padding: 0.3rem 0;
        border-bottom: 1px solid #f3f4f6;
    }

    .trade-name {
        color: var(--color-text-gray);
        font-size: 0.75rem;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .trade-qty { color: #374151; }
    .trade-amount { font-weight: 600; color: #1a1a1a; }

    /* Categories */
    .category-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .category-row {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .category-info {
        display: flex;
        justify-content: space-between;
        font-size: 0.8125rem;
    }

    .category-label { color: var(--color-text-gray); }
    .category-pct { font-weight: 600; color: #0f172a; }

    .category-value {
        font-size: 0.75rem;
        color: var(--color-text-gray);
    }

    .muted {
        color: var(--color-text-gray);
        font-size: 0.875rem;
        text-align: center;
        padding: 2rem 0;
    }
</style>
