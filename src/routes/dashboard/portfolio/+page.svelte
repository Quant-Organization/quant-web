<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { toast } from 'svelte-sonner';
    import { goto } from '$app/navigation';
    import Chart from 'chart.js/auto';
    import { getPortfolioDashboard } from '$lib/api/trade';
    import { getCryptoHoldings } from '$lib/api/crypto';
    import { getETFHoldings } from '$lib/api/etf';
    import { getProfileStats } from '$lib/api/dashboard';
    import type { PortfolioDashboard, PortfolioHolding } from '$lib/api/trade';
    import type { CryptoHolding } from '$lib/api/crypto';
    import type { ETFUserHolding } from '$lib/api/etf';
    import type { ProfileStats } from '$lib/api/dashboard';
    import { loadCompanyCurrencies } from '$lib/api/market';
    import { getCachedCurrency, displayPrice, formatPrice, type CurrencyCode } from '$lib/utils/currency';
    import SkeletonDashboard from '$lib/components/SkeletonDashboard.svelte';

    let portfolio = $state<PortfolioDashboard | null>(null);
    let cryptoHoldings = $state<CryptoHolding[]>([]);
    let etfHoldings = $state<ETFUserHolding[]>([]);
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
        return {
            id: h.company_id, name: h.company_name, type: 'stock',
            currency: getCachedCurrency(h.company_id),
            quantity: h.quantity ?? 0, avgPrice: h.avg_price ?? 0, currentPrice: h.current_price ?? 0,
            totalInvested: h.total_invested ?? 0, currentValue: h.current_value ?? 0,
            profitLoss: h.profit_loss ?? 0, profitLossPct: h.profit_loss_pct ?? 0, weightPct: h.weight_pct ?? 0
        };
    }

    function cryptoToUnified(h: CryptoHolding): UnifiedHolding {
        const avgPrice = h.avg_price ?? 0;
        const quantity = h.quantity ?? 0;
        const currentPrice = h.current_price ?? 0;
        const invested = avgPrice * quantity;
        const value = currentPrice * quantity;
        return {
            id: h.crypto_id, name: h.crypto_id, type: 'crypto', currency: 'KRW',
            quantity, avgPrice, currentPrice,
            totalInvested: invested, currentValue: value,
            profitLoss: h.profit_loss ?? 0, profitLossPct: h.profit_loss_pct ?? 0, weightPct: 0
        };
    }

    function etfToUnified(h: ETFUserHolding): UnifiedHolding {
        const avgPrice = h.avg_price ?? 0;
        const quantity = h.quantity ?? 0;
        const currentPrice = h.current_price ?? 0;
        const invested = avgPrice * quantity;
        const value = currentPrice * quantity;
        return {
            id: h.etf_id, name: h.etf_id, type: 'etf', currency: 'KRW',
            quantity, avgPrice, currentPrice,
            totalInvested: invested, currentValue: value,
            profitLoss: h.profit_loss ?? 0, profitLossPct: h.profit_loss_pct ?? 0, weightPct: 0
        };
    }

    let holdings = $derived.by(() => {
        let stockItems = (portfolio?.holdings ?? []).map(toUnified);
        let cryptoItems = cryptoHoldings.map(cryptoToUnified);
        let etfItems = etfHoldings.map(etfToUnified);

        // compute weight across all asset types
        const totalValue = stockItems.reduce((s, h) => s + h.currentValue, 0)
            + cryptoItems.reduce((s, h) => s + h.currentValue, 0)
            + etfItems.reduce((s, h) => s + h.currentValue, 0);
        if (totalValue > 0) {
            stockItems = stockItems.map(h => ({ ...h, weightPct: (h.currentValue / totalValue) * 100 }));
            cryptoItems = cryptoItems.map(h => ({ ...h, weightPct: (h.currentValue / totalValue) * 100 }));
            etfItems = etfItems.map(h => ({ ...h, weightPct: (h.currentValue / totalValue) * 100 }));
        }

        let filtered: UnifiedHolding[];
        if (holdingTab === 'stock') filtered = stockItems;
        else if (holdingTab === 'crypto') filtered = cryptoItems;
        else if (holdingTab === 'etf') filtered = etfItems;
        else filtered = [...stockItems, ...cryptoItems, ...etfItems];

        filtered.sort((a, b) => {
            const av = (a as Record<string, unknown>)[sortKey] as number;
            const bv = (b as Record<string, unknown>)[sortKey] as number;
            return sortDir === 'desc' ? bv - av : av - bv;
        });
        return filtered;
    });

    let totalInvestmentValue = $derived(
        (portfolio?.summary.stock_value ?? 0)
        + cryptoHoldings.reduce((s, h) => s + h.current_price * h.quantity, 0)
        + etfHoldings.reduce((s, h) => s + h.current_price * h.quantity, 0)
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
        const stockValue = portfolio?.summary.stock_value ?? 0;
        const cryptoValue = cryptoHoldings.reduce((s, h) => s + h.current_price * h.quantity, 0);
        const etfValue = etfHoldings.reduce((s, h) => s + h.current_price * h.quantity, 0);
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
            getCryptoHoldings({ suppressAuth: true }),
            getETFHoldings({ suppressAuth: true }),
            getProfileStats()
        ]);

        if (results[0].status === 'fulfilled') portfolio = results[0].value;
        else toast.error('주식 포트폴리오를 불러오지 못했습니다.');

        if (results[1].status === 'fulfilled') cryptoHoldings = results[1].value.holdings;
        if (results[2].status === 'fulfilled') etfHoldings = results[2].value.holdings;
        if (results[3].status === 'fulfilled') profile = results[3].value;

        // 주식 보유 종목의 통화 정보를 서버에서 로드
        const stockIds = (portfolio?.holdings ?? []).map(h => h.company_id);
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

    <!-- Main Content -->
    <div class="main-grid">
        <!-- Left: Holdings Table -->
        <section class="holdings-section">
            <div class="holdings-header">
                <h2 class="section-title">보유 자산</h2>
                <div class="tab-group">
                    {#each [
                        { key: 'all', label: '전체' },
                        { key: 'stock', label: '주식' },
                        { key: 'etf', label: 'ETF' },
                        { key: 'crypto', label: '코인' }
                    ] as tab}
                        <button
                            class="tab-pill"
                            class:active={holdingTab === tab.key}
                            onclick={() => holdingTab = tab.key as 'all' | 'stock' | 'crypto' | 'etf'}
                        >{tab.label}</button>
                    {/each}
                </div>
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
                                <span class="type-badge" class:stock={h.type === 'stock'} class:crypto={h.type === 'crypto'} class:etf={h.type === 'etf'}>
                                    {h.type === 'stock' ? '주식' : h.type === 'etf' ? 'ETF' : '코인'}
                                </span>
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
                            <span class="trade-type" class:buy={trade.type === 'BUY'} class:sell={trade.type === 'SELL'}>
                                {trade.type === 'BUY' ? '매수' : '매도'}
                            </span>
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
                        <div class="category-row">
                            <div class="category-info">
                                <span class="category-label">{cat.label}</span>
                                <span class="category-pct">{((cat.value / total) * 100).toFixed(1)}%</span>
                            </div>
                            <div class="category-bar-bg">
                                <div class="category-bar" style="width: {Math.min((cat.value / total) * 100, 100)}%"></div>
                            </div>
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
                            <div class="category-bar-bg">
                                <div class="category-bar" style="width: {Math.min(sector.percentage, 100)}%"></div>
                            </div>
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

    .tab-group {
        display: flex;
        gap: 0.375rem;
        background: #f1f5f9;
        padding: 0.1875rem;
        border-radius: 0.5rem;
    }

    .tab-pill {
        padding: 0.375rem 0.75rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-text-gray);
        background: transparent;
        cursor: pointer;
    }

    .tab-pill.active {
        background: #fff;
        color: var(--color-theme-1);
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
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

    .type-badge {
        display: inline-block;
        font-size: 0.6875rem;
        font-weight: 700;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        margin-right: 0.375rem;
    }

    .type-badge.stock { background: #eff6ff; color: #2563eb; }
    .type-badge.etf { background: #f0fdfa; color: #0d9488; }
    .type-badge.crypto { background: #fffbeb; color: #d97706; }

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

    .trade-type {
        font-weight: 700;
        font-size: 0.75rem;
        padding: 0.15rem 0.4rem;
        border-radius: 0.25rem;
        text-align: center;
    }

    .trade-type.buy { color: #dc2626; background: #fef2f2; }
    .trade-type.sell { color: #2563eb; background: #eff6ff; }

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

    .category-bar-bg {
        height: 0.375rem;
        background: #f1f5f9;
        border-radius: 0.1875rem;
        overflow: hidden;
    }

    .category-bar {
        height: 100%;
        background: var(--color-theme-1);
        border-radius: 0.1875rem;
        transition: width 0.5s ease;
    }

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
