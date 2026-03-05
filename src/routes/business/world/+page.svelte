<script lang="ts">
    import { onMount } from 'svelte';
    import { getMarketState, getCommodities, getCommodityHistory, getMacroIndicators, getMacroEconomy, getGlobalEvents, getMarketEvents } from '$lib/api/macro';
    import { getSectorPerformance } from '$lib/api/market';
    import type { MarketState, Commodity, MacroIndicator, GlobalEvent, MarketEvent } from '$lib/api/macro';
    import type { SectorPerformance } from '$lib/api/market';

    let marketState: MarketState | null = $state(null);
    let commodities: Commodity[] = $state([]);
    let macroIndicators: MacroIndicator[] = $state([]);
    let globalEvents: GlobalEvent[] = $state([]);
    let sectorPerf: SectorPerformance | null = $state(null);
    let marketEvents: MarketEvent[] = $state([]);
    let macroEconomy: Record<string, unknown> | null = $state(null);

    // Commodity chart state
    let selectedCommodity: Commodity | null = $state(null);
    let commodityChartData: { close: number }[] = $state([]);

    let loading = $state(true);
    let error = $state('');

    onMount(async () => {
        try {
            const [ms, cm, mi, ge, sp, me, eco] = await Promise.all([
                getMarketState(),
                getCommodities(),
                getMacroIndicators(),
                getGlobalEvents(),
                getSectorPerformance(),
                getMarketEvents(true, 10).catch(() => []),
                getMacroEconomy().catch(() => null)
            ]);
            marketState = ms;
            commodities = cm.commodities;
            macroIndicators = mi.indicators;
            globalEvents = ge.active_events;
            sectorPerf = sp;
            marketEvents = Array.isArray(me) ? me : [];
            macroEconomy = eco as Record<string, unknown> | null;
        } catch (e) {
            error = '데이터를 불러오는 중 오류가 발생했습니다.';
        } finally {
            loading = false;
        }
    });

    // Load commodity history when selected
    $effect(() => {
        if (!selectedCommodity) {
            commodityChartData = [];
            return;
        }
        const id = selectedCommodity.id;
        getCommodityHistory(id, 100).then((data: unknown) => {
            commodityChartData = Array.isArray(data) ? data : [];
        }).catch(() => {
            commodityChartData = [];
        });
    });

    // SVG sparkline for commodity
    let commoditySparkline = $derived(() => {
        if (commodityChartData.length < 2) return '';
        const prices = commodityChartData.map((c: { close: number }) => c.close);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;
        const w = 400;
        const h = 60;
        return prices.map((p: number, i: number) => {
            const x = (i / (prices.length - 1)) * w;
            const y = h - ((p - min) / range) * h;
            return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
        }).join(' ');
    });

    function formatChange(n: number): string {
        return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
    }

    function formatValue(n: number): string {
        if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
        if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(2) + 'K';
        return n.toFixed(2);
    }

    function formatDate(s: string): string {
        try {
            return new Date(s).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return s;
        }
    }

    const impactColors: Record<string, string> = {
        POSITIVE: '#059669',
        NEGATIVE: '#dc2626',
        NEUTRAL: '#6b7280',
    };
</script>

<svelte:head>
    <title>세계 정세</title>
</svelte:head>

<div class="page-container">
    <header class="page-header">
        <div class="header-text">
            <h1>국제 정세 및 경제 분석</h1>
            <p>비즈니스 전략에 영향을 미치는 거시 경제 환경을 파악하세요.</p>
        </div>
        {#if marketState}
            <div class="header-badges">
                <div class="badge-card">
                    <span class="badge-label">경제 상태</span>
                    <span class="badge-val">{marketState.economy_mode}</span>
                </div>
                <div class="badge-card">
                    <span class="badge-label">활성 이벤트</span>
                    <span class="badge-val">{marketState.active_events_count}개</span>
                </div>
                <div class="badge-card">
                    <span class="badge-label">시장 변동성</span>
                    <span class="badge-val">{(marketState.market_volatility * 100).toFixed(1)}%</span>
                </div>
            </div>
        {/if}
    </header>

    {#if loading}
        <div class="loading-state">데이터를 불러오는 중...</div>
    {:else if error}
        <div class="error-state">{error}</div>
    {:else}
        <div class="dashboard-grid">
            <div class="left-column">

                <!-- 원자재 시세 -->
                {#if commodities.length > 0}
                    <div class="card">
                        <h3>주요 원자재 시세</h3>
                        <div class="commodity-list">
                            {#each commodities as c}
                                <button
                                    class="commodity-item"
                                    class:commodity-selected={selectedCommodity?.id === c.id}
                                    onclick={() => { selectedCommodity = selectedCommodity?.id === c.id ? null : c; }}
                                >
                                    <div class="commodity-name-row">
                                        <span class="commodity-name">{c.name}</span>
                                        <span class="commodity-change" class:pos={c.price_change_pct >= 0} class:neg={c.price_change_pct < 0}>
                                            {formatChange(c.price_change_pct)}
                                        </span>
                                    </div>
                                    <div class="commodity-price">{formatValue(c.current_price)}</div>
                                    <div class="commodity-vol">변동성 {(c.volatility * 100).toFixed(1)}%</div>
                                </button>
                            {/each}
                        </div>

                        {#if selectedCommodity && commoditySparkline()}
                            <div class="commodity-chart-section">
                                <h4 class="chart-label">{selectedCommodity.name} 가격 추이</h4>
                                <div class="commodity-chart-wrap">
                                    <svg viewBox="0 0 400 60" class="commodity-chart-svg">
                                        <path d={commoditySparkline()} fill="none" stroke={selectedCommodity.price_change_pct >= 0 ? 'var(--color-positive, #10b981)' : 'var(--color-negative, #ef4444)'} stroke-width="1.5" />
                                    </svg>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- 거시 지표 -->
                {#if macroIndicators.length > 0}
                    <div class="card">
                        <h3>거시 경제 지표</h3>
                        <div class="macro-table-wrap">
                            <table class="macro-table">
                                <thead>
                                    <tr>
                                        <th>지표</th>
                                        <th>현재값</th>
                                        <th>변화</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each macroIndicators as ind}
                                        <tr>
                                            <td class="ind-name">{ind.name}</td>
                                            <td class="ind-val">{formatValue(ind.current_value)}</td>
                                            <td class:pos={ind.change_value >= 0} class:neg={ind.change_value < 0}>
                                                {ind.change_value >= 0 ? '+' : ''}{formatValue(ind.change_value)}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                {/if}

            </div>

            <div class="right-column">

                <!-- 활성 글로벌 이벤트 -->
                {#if globalEvents.length > 0}
                    <div class="card">
                        <h3>활성 글로벌 이벤트</h3>
                        <div class="events-list">
                            {#each globalEvents as ev}
                                <div class="event-item">
                                    <div class="event-header">
                                        <span class="event-name">{ev.name}</span>
                                        <span
                                            class="impact-badge"
                                            style="color: {impactColors[ev.impact] ?? '#6b7280'}; background: {impactColors[ev.impact] ? impactColors[ev.impact] + '18' : '#f3f4f6'};"
                                        >{ev.impact}</span>
                                    </div>
                                    <p class="event-desc">{ev.description}</p>
                                    <div class="event-time">
                                        <span>{formatDate(ev.start_time)}</span>
                                        {#if ev.end_time}
                                            <span> ~ {formatDate(ev.end_time)}</span>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- 섹터 성과 -->
                {#if sectorPerf}
                    <div class="card">
                        <h3>섹터별 성과</h3>
                        <div class="sector-list">
                            {#each Object.entries(sectorPerf.sector_performance) as [sector, pct]}
                                <div class="sector-item">
                                    <span class="sector-name">{sector}</span>
                                    <div class="sector-bar-wrap">
                                        <div
                                            class="sector-bar"
                                            class:bar-pos={pct >= 0}
                                            class:bar-neg={pct < 0}
                                            style="width: {Math.min(Math.abs(pct) * 4, 100)}%"
                                        ></div>
                                    </div>
                                    <span class="sector-pct" class:pos={pct >= 0} class:neg={pct < 0}>{formatChange(pct)}</span>
                                </div>
                            {/each}
                        </div>

                        {#if sectorPerf.top_sectors.length > 0}
                            <div class="top-sectors">
                                <span class="top-label">상위 섹터</span>
                                <div class="top-badges">
                                    {#each sectorPerf.top_sectors.slice(0, 3) as ts}
                                        <span class="top-badge">{ts.sector} {formatChange(ts.change_pct)}</span>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

            </div>

            <!-- 시장 이벤트 -->
            {#if marketEvents.length > 0}
                <div class="card full-width-card">
                    <h3>시장 이벤트</h3>
                    <div class="market-events-list">
                        {#each marketEvents as mev}
                            <div class="market-event-item">
                                <div class="market-event-header">
                                    <span class="market-event-name">{mev.name}</span>
                                    <span class="market-event-type-badge">{mev.event_type}</span>
                                </div>
                                <p class="market-event-desc">{mev.description}</p>
                                <div class="market-event-meta">
                                    <span class="market-event-impact" class:pos={mev.impact >= 0} class:neg={mev.impact < 0}>
                                        영향도: {mev.impact >= 0 ? '+' : ''}{mev.impact.toFixed(1)}
                                    </span>
                                    <span class="market-event-time">{formatDate(mev.start_time)}</span>
                                    {#if mev.end_time}
                                        <span class="market-event-time">~ {formatDate(mev.end_time)}</span>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- 거시경제 종합 -->
            {#if macroEconomy}
                <div class="card full-width-card">
                    <h3>거시경제 종합 현황</h3>
                    <div class="macro-economy-grid">
                        {#each Object.entries(macroEconomy) as [key, value]}
                            <div class="macro-eco-item">
                                <span class="macro-eco-label">{key}</span>
                                <span class="macro-eco-value">
                                    {typeof value === 'number' ? formatValue(value) : String(value)}
                                </span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .page-container {
        background-color: var(--color-bg-0);
        min-height: 100vh;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-md, 1.5rem);
        flex-wrap: wrap;
        gap: 1rem;
    }

    .page-header h1 { font-size: var(--page-title-size, 1.75rem); font-weight: 700; margin: 0 0 0.5rem 0; }
    .page-header p { font-size: var(--page-desc-size, 0.95rem); color: var(--color-text-gray); margin: 0; }

    .header-badges { display: flex; gap: 1rem; flex-wrap: wrap; }

    .badge-card {
        background: var(--color-bg-1, white);
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 10px;
        padding: 0.75rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 110px;
    }

    .badge-label { font-size: 0.78rem; color: var(--color-text-gray); }
    .badge-val { font-size: 1rem; font-weight: 700; }

    .loading-state, .error-state {
        display: flex; align-items: center; justify-content: center;
        min-height: 40vh; font-size: 1rem; color: var(--color-text-gray);
    }
    .error-state { color: var(--color-negative); }

    .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md, 1.5rem);
    }

    .left-column, .right-column { display: flex; flex-direction: column; gap: var(--spacing-md, 1.5rem); }

    .card {
        background: var(--color-bg-1, white);
        border-radius: var(--card-border-radius, 12px);
        border: 1px solid var(--color-border, #e5e7eb);
        padding: var(--card-padding, 1.25rem);
        box-shadow: var(--card-shadow, 0 1px 4px rgba(0,0,0,0.04));
    }

    h3 { font-size: 1rem; font-weight: 700; margin: 0 0 1rem 0; }

    /* Commodities */
    .commodity-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.75rem;
    }

    .commodity-item {
        background: var(--color-bg-2, #f9fafb);
        border-radius: 8px;
        padding: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .commodity-name-row { display: flex; justify-content: space-between; align-items: center; }
    .commodity-name { font-size: 0.85rem; font-weight: 700; }
    .commodity-change { font-size: 0.8rem; font-weight: 700; }
    .commodity-price { font-size: 1rem; font-weight: 800; color: #111; }
    .commodity-vol { font-size: 0.72rem; color: var(--color-text-gray); }

    /* Macro table */
    .macro-table-wrap { overflow-x: auto; }

    .macro-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .macro-table th {
        text-align: left; padding: 0.5rem 0.75rem;
        border-bottom: 2px solid var(--color-border, #e5e7eb);
        color: var(--color-text-gray); font-weight: 600;
    }
    .macro-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #f0f0f0; }
    .ind-name { font-weight: 600; color: #111; }
    .ind-val { font-family: 'Fira Mono', monospace; font-weight: 700; }

    /* Global events */
    .events-list { display: flex; flex-direction: column; gap: 0; }

    .event-item {
        padding: 0.85rem 0;
        border-bottom: 1px solid var(--color-border, #e5e7eb);
    }
    .event-item:last-child { border-bottom: none; }

    .event-header { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap; }
    .event-name { font-size: 0.9rem; font-weight: 700; }

    .impact-badge {
        border-radius: 4px;
        padding: 0.15rem 0.5rem;
        font-size: 0.72rem;
        font-weight: 700;
    }

    .event-desc { font-size: 0.82rem; color: var(--color-text-gray); margin: 0 0 0.4rem 0; line-height: 1.5; }
    .event-time { font-size: 0.75rem; color: var(--color-text-gray); }

    /* Sector performance */
    .sector-list { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem; }

    .sector-item {
        display: grid;
        grid-template-columns: 120px 1fr 60px;
        align-items: center;
        gap: 0.75rem;
    }

    .sector-name { font-size: 0.82rem; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .sector-bar-wrap { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }

    .sector-bar {
        height: 100%;
        border-radius: 4px;
        min-width: 2px;
    }
    .sector-bar.bar-pos { background: var(--color-positive, #10b981); }
    .sector-bar.bar-neg { background: var(--color-negative, #ef4444); }

    .sector-pct { font-size: 0.82rem; font-weight: 700; text-align: right; }

    .top-sectors {
        padding-top: 0.75rem;
        border-top: 1px solid var(--color-border, #e5e7eb);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .top-label { font-size: 0.78rem; color: var(--color-text-gray); font-weight: 600; }

    .top-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .top-badge {
        background: #ECF2FE;
        color: var(--color-theme-1, #00529B);
        border-radius: 20px;
        padding: 0.2rem 0.7rem;
        font-size: 0.75rem;
        font-weight: 700;
    }

    .pos { color: var(--color-positive, #10b981); }
    .neg { color: var(--color-negative, #ef4444); }

    /* Commodity clickable + chart */
    .commodity-item { cursor: pointer; border: none; text-align: left; width: 100%; transition: outline 0.15s; }
    .commodity-item:hover { outline: 2px solid var(--color-theme-1, #00529B); outline-offset: -2px; border-radius: 8px; }
    .commodity-selected { outline: 2px solid var(--color-theme-1, #00529B); outline-offset: -2px; }

    .commodity-chart-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border, #e5e7eb); }
    .chart-label { font-size: 0.85rem; font-weight: 600; margin: 0 0 0.5rem 0; color: #333; }
    .commodity-chart-wrap { background: var(--color-bg-2, #f9fafb); border-radius: 8px; padding: 0.75rem; }
    .commodity-chart-svg { width: 100%; height: 60px; }

    /* Full-width cards spanning both columns */
    .full-width-card { grid-column: 1 / -1; }

    /* Market events */
    .market-events-list { display: flex; flex-direction: column; gap: 0; }
    .market-event-item { padding: 0.85rem 0; border-bottom: 1px solid var(--color-border, #e5e7eb); }
    .market-event-item:last-child { border-bottom: none; }
    .market-event-header { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; flex-wrap: wrap; }
    .market-event-name { font-size: 0.9rem; font-weight: 700; }
    .market-event-type-badge {
        background: #ECF2FE; color: var(--color-theme-1, #00529B);
        border-radius: 4px; padding: 0.15rem 0.5rem; font-size: 0.72rem; font-weight: 700;
    }
    .market-event-desc { font-size: 0.82rem; color: var(--color-text-gray); margin: 0 0 0.4rem 0; line-height: 1.5; }
    .market-event-meta { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
    .market-event-impact { font-size: 0.8rem; font-weight: 700; }
    .market-event-time { font-size: 0.75rem; color: var(--color-text-gray); }

    /* Macro economy grid */
    .macro-economy-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 0.75rem;
    }
    .macro-eco-item {
        background: var(--color-bg-2, #f9fafb);
        border-radius: 8px;
        padding: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    .macro-eco-label { font-size: 0.78rem; color: var(--color-text-gray); font-weight: 500; }
    .macro-eco-value { font-size: 0.95rem; font-weight: 700; color: #111; }

    @media (max-width: 1024px) {
        .dashboard-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 600px) {
        .commodity-list { grid-template-columns: repeat(2, 1fr); }
    }
</style>
