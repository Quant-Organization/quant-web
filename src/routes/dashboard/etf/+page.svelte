<script lang="ts">
    import { onMount } from 'svelte';
    import { getETFs, getETFHistory, getETFDetail } from '$lib/api/etf';
    import type { ETF, ETFCandle } from '$lib/api/etf';

    let etfs: ETF[] = $state([]);
    let selectedETF: ETF | null = $state(null);
    let etfHistory: ETFCandle[] = $state([]);
    let loading = $state(true);
    let error = $state('');

    onMount(async () => {
        try {
            const res = await getETFs();
            etfs = res.etfs;
            if (etfs.length > 0) selectedETF = etfs[0];
        } catch (e) {
            error = '데이터를 불러오는 중 오류가 발생했습니다.';
        } finally {
            loading = false;
        }
    });

    // Load history when ETF is selected
    $effect(() => {
        if (!selectedETF) {
            etfHistory = [];
            return;
        }
        const id = selectedETF.id;
        getETFHistory(id, 100).then((history) => {
            etfHistory = history;
        }).catch(() => {
            etfHistory = [];
        });
    });

    // Fetch detail when an ETF is selected (updates the etfs array for freshness)
    async function loadETFDetail(id: string) {
        try {
            const detail = await getETFDetail(id);
            if (detail) {
                const idx = etfs.findIndex(e => e.id === id);
                if (idx >= 0) etfs[idx] = detail;
            }
        } catch { /* ignore */ }
    }

    $effect(() => {
        if (selectedETF) loadETFDetail(selectedETF.id);
    });

    function formatNumber(n: number): string {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
        return n.toFixed(2);
    }

    function formatPct(n: number): string {
        return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
    }

    // SVG chart path from ETF history
    let chartPath = $derived(() => {
        if (etfHistory.length < 2) return '';
        const prices = etfHistory.map(c => c.close);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;
        const w = 500;
        const h = 80;
        return prices.map((p, i) => {
            const x = (i / (prices.length - 1)) * w;
            const y = h - ((p - min) / range) * h;
            return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
        }).join(' ');
    });

    let chartColor: string = $derived(selectedETF && (selectedETF as ETF).change_pct >= 0 ? 'var(--color-positive)' : 'var(--color-negative)');
</script>

<div class="page-container">
    <header class="page-header">
        <div class="header-text">
            <h1>ETF 목록</h1>
            <p>상장지수펀드를 조회하고 구성종목을 확인하세요.</p>
        </div>
    </header>

    {#if loading}
        <div class="loading-state">데이터를 불러오는 중...</div>
    {:else if error}
        <div class="error-state">{error}</div>
    {:else}
        <div class="main-grid">
            <section class="left-section">
                <h3 class="section-title">ETF 목록</h3>
                <div class="panel etf-list">
                    {#each etfs as etf}
                        <button
                            class="etf-item"
                            class:active={selectedETF?.id === etf.id}
                            onclick={() => (selectedETF = etf)}
                        >
                            <div class="etf-item-top">
                                <span class="etf-name">{etf.name}</span>
                                <span class="etf-change" class:positive={etf.change_pct >= 0} class:negative={etf.change_pct < 0}>
                                    {formatPct(etf.change_pct)}
                                </span>
                            </div>
                            <div class="etf-item-bottom">
                                <span class="etf-ticker">{etf.ticker}</span>
                                <span class="etf-nav">NAV {formatNumber(etf.nav)}</span>
                            </div>
                        </button>
                    {/each}
                </div>
            </section>

            <section class="right-section">
                {#if selectedETF}
                    <h3 class="section-title">{selectedETF.name} 상세</h3>
                    <div class="panel detail-panel">
                        <div class="detail-header">
                            <div class="detail-title-row">
                                <span class="detail-ticker">{selectedETF.ticker}</span>
                                <span class="detail-sector-badge">{selectedETF.sector}</span>
                            </div>
                            <div class="detail-price-row">
                                <span class="detail-nav">NAV {formatNumber(selectedETF.nav)}</span>
                                <span class="detail-change" class:positive={selectedETF.change_pct >= 0} class:negative={selectedETF.change_pct < 0}>
                                    {formatPct(selectedETF.change_pct)}
                                    ({selectedETF.change_amount >= 0 ? '+' : ''}{formatNumber(selectedETF.change_amount)})
                                </span>
                            </div>
                        </div>

                        <div class="meta-row">
                            <div class="meta-item">
                                <span class="meta-label">섹터</span>
                                <span class="meta-value">{selectedETF.sector}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">보수율</span>
                                <span class="meta-value">{(selectedETF.expense_ratio * 100).toFixed(2)}%</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">구성종목 수</span>
                                <span class="meta-value">{selectedETF.constituents.length}개</span>
                            </div>
                        </div>

                        {#if selectedETF.description}
                            <p class="detail-desc">{selectedETF.description}</p>
                        {/if}

                        {#if chartPath()}
                            <div class="etf-chart-section">
                                <h4 class="chart-section-title">가격 추이</h4>
                                <div class="etf-chart-wrap">
                                    <svg viewBox="0 0 500 80" class="etf-chart-svg">
                                        <path d={chartPath()} fill="none" stroke={chartColor} stroke-width="2" />
                                    </svg>
                                </div>
                            </div>
                        {/if}

                        <h4 class="holdings-title">구성종목</h4>
                        <div class="table-wrapper">
                            <table class="holdings-table">
                                <thead>
                                    <tr>
                                        <th>종목</th>
                                        <th>목표 비중</th>
                                        <th>실제 비중</th>
                                        <th>가격</th>
                                        <th>평가금액</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each selectedETF.holdings as holding}
                                        <tr>
                                            <td class="holding-id">{holding.id}</td>
                                            <td>
                                                <div class="weight-bar-wrap">
                                                    <div class="weight-bar" style="width: {Math.min(holding.target_weight * 100, 100)}%"></div>
                                                    <span>{(holding.target_weight * 100).toFixed(1)}%</span>
                                                </div>
                                            </td>
                                            <td>{(holding.actual_weight * 100).toFixed(1)}%</td>
                                            <td>{formatNumber(holding.price)}</td>
                                            <td>{formatNumber(holding.value)}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                {:else}
                    <div class="empty-detail">ETF를 선택하세요.</div>
                {/if}
            </section>
        </div>
    {/if}
</div>

<style>
    .page-container {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #333;
        width: 100%;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2rem;
    }

    .header-text h1 { font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0; }
    .header-text p { font-size: 1rem; color: var(--color-text-gray); margin: 0; }

    .loading-state, .error-state, .empty-detail {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 40vh;
        font-size: 1rem;
        color: var(--color-text-gray);
    }

    .error-state { color: var(--color-negative); }

    .main-grid {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 1.5rem;
        align-items: start;
    }

    .section-title { margin: 0 0 1rem 0; font-size: 1.1rem; font-weight: 700; }

    .panel {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        padding: 1.25rem;
    }

    .etf-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 70vh;
        overflow-y: auto;
    }

    .etf-item {
        width: 100%;
        background: none;
        border: 1px solid transparent;
        border-radius: 10px;
        padding: 0.85rem 1rem;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s;
    }

    .etf-item:hover { background: #f9fafb; }
    .etf-item.active { background: #ECF2FE; border-color: var(--color-theme-1); }

    .etf-item-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.3rem;
    }

    .etf-name { font-weight: 700; font-size: 0.9rem; color: #111; }

    .etf-item-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .etf-ticker { font-size: 0.8rem; color: var(--color-text-gray); font-family: 'Fira Mono', monospace; }
    .etf-nav { font-size: 0.8rem; color: #555; }

    .etf-change { font-size: 0.85rem; font-weight: 700; }
    .positive { color: var(--color-positive); }
    .negative { color: var(--color-negative); }

    .detail-header { margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid #e5e7eb; }

    .detail-title-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
    }

    .detail-ticker { font-size: 1.5rem; font-weight: 800; color: #111; font-family: 'Fira Mono', monospace; }

    .detail-sector-badge {
        background: #ECF2FE;
        color: var(--color-theme-1);
        border-radius: 20px;
        padding: 0.25rem 0.85rem;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .detail-price-row {
        display: flex;
        align-items: baseline;
        gap: 1rem;
    }

    .detail-nav { font-size: 1.8rem; font-weight: 800; color: #111; }
    .detail-change { font-size: 1rem; font-weight: 700; }

    .meta-row {
        display: flex;
        gap: 2rem;
        margin-bottom: 1.25rem;
    }

    .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-label { font-size: 0.8rem; color: var(--color-text-gray); }
    .meta-value { font-size: 0.95rem; font-weight: 700; color: #111; }

    .detail-desc {
        font-size: 0.9rem;
        color: #555;
        line-height: 1.6;
        margin: 0 0 1.5rem 0;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 8px;
    }

    .holdings-title { font-size: 1rem; font-weight: 700; margin: 0 0 0.75rem 0; }

    .table-wrapper { overflow-x: auto; }

    .holdings-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
    }

    .holdings-table th {
        text-align: left;
        padding: 0.6rem 0.75rem;
        border-bottom: 2px solid #e5e7eb;
        color: var(--color-text-gray);
        font-weight: 600;
        white-space: nowrap;
    }

    .holdings-table td {
        padding: 0.6rem 0.75rem;
        border-bottom: 1px solid #f0f0f0;
        color: #333;
    }

    .holding-id { font-family: 'Fira Mono', monospace; font-weight: 600; color: var(--color-theme-1); }

    .weight-bar-wrap {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .weight-bar {
        height: 6px;
        background: var(--color-theme-1);
        border-radius: 3px;
        min-width: 2px;
        max-width: 120px;
        opacity: 0.7;
    }

    .etf-chart-section { margin-bottom: 1.5rem; }
    .chart-section-title { font-size: 1rem; font-weight: 700; margin: 0 0 0.75rem 0; }
    .etf-chart-wrap {
        background: #f9fafb;
        border-radius: 8px;
        padding: 1rem;
    }
    .etf-chart-svg { width: 100%; height: 80px; }

    @media (max-width: 900px) {
        .main-grid { grid-template-columns: 1fr; }
    }
</style>
