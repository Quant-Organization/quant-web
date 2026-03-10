<script lang="ts">
    import { onMount } from 'svelte';
    import { getMarketState, getCommodities, getCommodityHistory, getGlobalEvents, getMarketEvents } from '$lib/api/macro';
    import { getSectorPerformance } from '$lib/api/market';
    import type { MarketState, Commodity, GlobalEvent, MarketEvent } from '$lib/api/macro';
    import type { SectorPerformance } from '$lib/api/market';
    import SkeletonTable from '$lib/components/SkeletonTable.svelte';

    // --- Types ---
    interface CountryGDP {
        rank: number;
        code: string;
        name: string;
        nameKr: string;
        flag: string;
        value: string;
        region: string;
        growth: string;
        population: string;
        inflation: string;
    }

    type GDPPoint = {
        year: number;
        gdp: number;
    };

    type CommodityHistoryPoint = {
        close: number;
        timestamp?: string | number;
        time?: string | number;
        datetime?: string | number;
        date?: string | number;
        updated_at?: string | number;
    };

    // --- API State ---
    let marketState: MarketState | null = $state(null);
    let commodities: Commodity[] = $state([]);
    let globalEvents: GlobalEvent[] = $state([]);
    let sectorPerf: SectorPerformance | null = $state(null);
    let marketEvents: MarketEvent[] = $state([]);

    let selectedCommodity: Commodity | null = $state(null);
    let commodityChartData: CommodityHistoryPoint[] = $state([]);

    let loading = $state(true);
    let error = $state('');

    // --- GDP 국가 목록 (참고 데이터) ---
    const gdpList: CountryGDP[] = [
        { rank: 1, code: 'USA', name: 'USA', nameKr: '미국', flag: '🇺🇸', value: '29.18T', region: '북아메리카', growth: '3.3%', population: '3억 4115만명', inflation: '5.3%' },
        { rank: 2, code: 'CHN', name: 'China', nameKr: '중국', flag: '🇨🇳', value: '18.74T', region: '아시아', growth: '5.2%', population: '14억 2570만명', inflation: '0.2%' },
        { rank: 3, code: 'DEU', name: 'Germany', nameKr: '독일', flag: '🇩🇪', value: '4.66T', region: '유럽', growth: '0.1%', population: '8420만명', inflation: '2.9%' },
        { rank: 4, code: 'JPN', name: 'Japan', nameKr: '일본', flag: '🇯🇵', value: '4.03T', region: '아시아', growth: '1.9%', population: '1억 2450만명', inflation: '2.8%' },
        { rank: 5, code: 'IND', name: 'India', nameKr: '인도', flag: '🇮🇳', value: '3.91T', region: '아시아', growth: '7.2%', population: '14억 2860만명', inflation: '5.1%' },
        { rank: 6, code: 'UK', name: 'UK', nameKr: '영국', flag: '🇬🇧', value: '3.64T', region: '유럽', growth: '0.5%', population: '6720만명', inflation: '4.0%' },
    ];

    const gdpHistoryMap: Record<string, GDPPoint[]> = {
        USA: [
            { year: 2014, gdp: 17.55 },
            { year: 2016, gdp: 18.70 },
            { year: 2018, gdp: 20.61 },
            { year: 2020, gdp: 20.89 },
            { year: 2022, gdp: 25.44 },
            { year: 2024, gdp: 29.18 }
        ],
        CHN: [
            { year: 2014, gdp: 10.48 },
            { year: 2016, gdp: 11.23 },
            { year: 2018, gdp: 13.89 },
            { year: 2020, gdp: 14.72 },
            { year: 2022, gdp: 17.96 },
            { year: 2024, gdp: 18.74 }
        ],
        DEU: [
            { year: 2014, gdp: 3.89 },
            { year: 2016, gdp: 3.48 },
            { year: 2018, gdp: 4.00 },
            { year: 2020, gdp: 3.81 },
            { year: 2022, gdp: 4.26 },
            { year: 2024, gdp: 4.66 }
        ],
        JPN: [
            { year: 2014, gdp: 4.85 },
            { year: 2016, gdp: 4.93 },
            { year: 2018, gdp: 4.97 },
            { year: 2020, gdp: 5.05 },
            { year: 2022, gdp: 4.23 },
            { year: 2024, gdp: 4.03 }
        ],
        IND: [
            { year: 2014, gdp: 2.04 },
            { year: 2016, gdp: 2.30 },
            { year: 2018, gdp: 2.70 },
            { year: 2020, gdp: 2.67 },
            { year: 2022, gdp: 3.39 },
            { year: 2024, gdp: 3.91 }
        ],
        UK: [
            { year: 2014, gdp: 3.09 },
            { year: 2016, gdp: 2.73 },
            { year: 2018, gdp: 2.88 },
            { year: 2020, gdp: 2.70 },
            { year: 2022, gdp: 3.07 },
            { year: 2024, gdp: 3.64 }
        ]
    };

    let selectedCode = $state('USA');
    let selectedCountry = $derived(gdpList.find(c => c.code === selectedCode) || gdpList[0]);
    let selectedGDPSeries = $derived(gdpHistoryMap[selectedCode] || []);

    function selectCountry(code: string) { selectedCode = code; }

    function formatTrillion(n: number): string {
        return `${n.toFixed(n >= 10 ? 1 : 2)}T`;
    }

    let gdpChart = $derived(() => {
        const series = selectedGDPSeries.length >= 2
            ? selectedGDPSeries
            : [{ year: 2023, gdp: 1 }, { year: 2024, gdp: 1.1 }];

        const width = 760;
        const height = 240;
        const margins = { top: 20, right: 16, bottom: 30, left: 70 };
        const innerWidth = width - margins.left - margins.right;
        const innerHeight = height - margins.top - margins.bottom;

        const values = series.map((p) => p.gdp);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const padding = Math.max((maxValue - minValue) * 0.15, 0.5);
        const yMin = Math.max(0, minValue - padding);
        const yMax = maxValue + padding;
        const yRange = yMax - yMin || 1;

        const points = series.map((p, i) => {
            const x = margins.left + (i / (series.length - 1)) * innerWidth;
            const y = margins.top + (1 - (p.gdp - yMin) / yRange) * innerHeight;
            return { ...p, x, y };
        });

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
        const baseY = margins.top + innerHeight;
        const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(2)},${baseY.toFixed(2)} L${points[0].x.toFixed(2)},${baseY.toFixed(2)} Z`;

        const yTicks = Array.from({ length: 5 }, (_, i) => {
            const value = yMin + ((4 - i) / 4) * yRange;
            const y = margins.top + (i / 4) * innerHeight;
            return { value, y };
        });

        const xTicks = points.map((p) => ({ year: p.year, x: p.x }));

        return { width, height, margins, points, linePath, areaPath, yTicks, xTicks };
    });

    // --- Load API data ---
    onMount(async () => {
        try {
            const [ms, cm, ge, sp, me] = await Promise.all([
                getMarketState(),
                getCommodities(),
                getGlobalEvents(),
                getSectorPerformance(),
                getMarketEvents(true, 10).catch(() => [])
            ]);
            marketState = ms;
            commodities = cm.commodities;
            globalEvents = ge.active_events;
            sectorPerf = sp;
            marketEvents = Array.isArray(me) ? me : [];
        } catch {
            error = '데이터를 불러오는 중 오류가 발생했습니다.';
        } finally {
            loading = false;
        }
    });

    $effect(() => {
        if (!selectedCommodity) { commodityChartData = []; return; }
        const id = selectedCommodity.id;
        getCommodityHistory(id, 100).then((data: unknown) => {
            commodityChartData = Array.isArray(data) ? data : [];
        }).catch(() => { commodityChartData = []; });
    });

    function parseHistoryDate(point: CommodityHistoryPoint): Date | null {
        const raw = point.timestamp ?? point.time ?? point.datetime ?? point.date ?? point.updated_at;
        if (raw === undefined || raw === null) return null;
        const d = new Date(raw);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    function formatHistoryLabel(point: CommodityHistoryPoint, fallbackIndex: number): string {
        const d = parseHistoryDate(point);
        if (!d) return `T${fallbackIndex + 1}`;
        return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    }

    let commodityChart = $derived(() => {
        if (commodityChartData.length < 2 || !selectedCommodity) return null;

        const validData = commodityChartData.filter((p) => Number.isFinite(p.close));
        if (validData.length < 2) return null;

        const width = 760;
        const height = 240;
        const margins = { top: 20, right: 16, bottom: 32, left: 64 };
        const innerWidth = width - margins.left - margins.right;
        const innerHeight = height - margins.top - margins.bottom;

        const values = validData.map((p) => p.close);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const padding = Math.max((maxValue - minValue) * 0.15, 0.01);
        const yMin = Math.max(0, minValue - padding);
        const yMax = maxValue + padding;
        const yRange = yMax - yMin || 1;

        const points = validData.map((p, i) => {
            const x = margins.left + (i / (validData.length - 1)) * innerWidth;
            const y = margins.top + (1 - (p.close - yMin) / yRange) * innerHeight;
            return { ...p, x, y };
        });

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
        const baseY = margins.top + innerHeight;
        const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(2)},${baseY.toFixed(2)} L${points[0].x.toFixed(2)},${baseY.toFixed(2)} Z`;

        const yTicks = Array.from({ length: 5 }, (_, i) => {
            const value = yMin + ((4 - i) / 4) * yRange;
            const y = margins.top + (i / 4) * innerHeight;
            return { value, y };
        });

        const xTickIndexes = Array.from(new Set([
            0,
            Math.floor((validData.length - 1) / 3),
            Math.floor(((validData.length - 1) * 2) / 3),
            validData.length - 1
        ])).sort((a, b) => a - b);

        const xTicks = xTickIndexes.map((idx) => ({
            x: points[idx].x,
            label: formatHistoryLabel(validData[idx], idx)
        }));

        const isPositive = (selectedCommodity.price_change_pct ?? 0) >= 0;

        return { width, height, margins, points, linePath, areaPath, yTicks, xTicks, isPositive };
    });

    function formatChange(n: number): string { return ((n ?? 0) >= 0 ? '+' : '') + (n ?? 0).toFixed(2) + '%'; }

    function formatValue(n: number): string {
        n = n ?? 0;
        if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
        if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(2) + 'K';
        return n.toFixed(2);
    }

    function formatDate(s: string): string {
        try { return new Date(s).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
        catch { return s; }
    }

    const impactColors: Record<string, string> = { POSITIVE: '#059669', NEGATIVE: '#dc2626', NEUTRAL: '#6b7280' };
</script>

<svelte:head>
    <title>세계 정세</title>
</svelte:head>

<div class="page-container">
    <header class="page-header">
        <div class="header-text">
            <h1>국제 정세 및 경제 분석</h1>
            <p>비즈니스 전략에 영향을 미치는 거시 경제 환경을 깊이 있게 파악하세요.</p>
        </div>
    </header>

    {#if loading}
        <SkeletonTable rows={8} cols={3} showStats={true} />
    {:else if error}
        <div class="error-state">{error}</div>
    {:else}
        <div class="dashboard-grid">

            <div class="left-column">

                <!-- GDP 국가 카드 -->
                <div class="card gdp-card">
                    <div class="country-list">
                        <div class="list-header">
                            <span class="divider-line"></span>
                            <span class="list-header-text">GDP 순위</span>
                            <span class="divider-line"></span>
                        </div>
                        <ul>
                            {#each gdpList as country}
                                <li class:selected={country.code === selectedCode} onclick={() => selectCountry(country.code)}>
                                    <div class="flag-name">
                                        <span class="flag">{country.flag}</span>
                                        <span class="name">{country.name}</span>
                                    </div>
                                    <span class="gdp-value">{country.value}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>

                    <div class="country-detail">
                        <div class="detail-header">
                            <h2>{selectedCountry.nameKr} <span class="region">{selectedCountry.region}</span></h2>
                        </div>
                        <div class="stats-grid">
                            <div class="stat-box"><span class="label">GDP</span><span class="val">{selectedCountry.value}</span></div>
                            <div class="stat-box"><span class="label">GDP 성장률</span><span class="val text-green">{selectedCountry.growth}</span></div>
                            <div class="stat-box"><span class="label">인구</span><span class="val">{selectedCountry.population}</span></div>
                            <div class="stat-box"><span class="label">인플레이션</span><span class="val">{selectedCountry.inflation}</span></div>
                        </div>
                        <div class="chart-area">
                            {#if gdpChart()}
                                {@const chart = gdpChart()}
                                <svg viewBox={`0 0 ${chart.width} ${chart.height}`} class="line-chart" role="img" aria-label={`${selectedCountry.nameKr} GDP 추이`}>
                                    {#each chart.yTicks as tick}
                                        <line
                                            x1={chart.margins.left}
                                            y1={tick.y}
                                            x2={chart.width - chart.margins.right}
                                            y2={tick.y}
                                            class="gdp-grid-line"
                                        />
                                        <text x={chart.margins.left - 10} y={tick.y + 4} class="gdp-y-label">{formatTrillion(tick.value)}</text>
                                    {/each}

                                    <line x1={chart.margins.left} y1={chart.margins.top} x2={chart.margins.left} y2={chart.height - chart.margins.bottom} class="gdp-axis-line" />
                                    <line x1={chart.margins.left} y1={chart.height - chart.margins.bottom} x2={chart.width - chart.margins.right} y2={chart.height - chart.margins.bottom} class="gdp-axis-line" />

                                    <path d={chart.areaPath} class="gdp-area-fill" />
                                    <path d={chart.linePath} class="gdp-line-path" />

                                    {#each chart.points as point}
                                        <circle cx={point.x} cy={point.y} r="4" class="gdp-point" />
                                    {/each}

                                    {#each chart.xTicks as tick}
                                        <text x={tick.x} y={chart.height - 8} class="gdp-x-label">{tick.year}</text>
                                    {/each}

                                    <text x={chart.margins.left} y={16} class="gdp-axis-title gdp-axis-title-left">GDP (조 달러)</text>
                                </svg>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- 원자재 시세 (API) -->
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
                                        <span
                                            class="commodity-change"
                                            class:pos={c.price_change_pct >= 0}
                                            class:neg={c.price_change_pct < 0}
                                        >
                                            {formatChange(c.price_change_pct)}
                                        </span>
                                    </div>
                                    <div class="commodity-price">{formatValue(c.current_price)}</div>
                                    <div class="commodity-vol">변동성 {((c.volatility ?? 0) * 100).toFixed(1)}%</div>
                                </button>
                            {/each}
                        </div>

                        {#if selectedCommodity}
                            {@const chart = commodityChart()}
                            {#if chart}
                                <div class="commodity-chart-section">
                                    <h4 class="chart-label">{selectedCommodity.name} 가격 추이</h4>
                                    <div class="commodity-chart-wrap">
                                        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} class="commodity-chart-svg" role="img" aria-label={`${selectedCommodity.name} 가격 추이`}>
                                            {#each chart.yTicks as tick}
                                                <line
                                                    x1={chart.margins.left}
                                                    y1={tick.y}
                                                    x2={chart.width - chart.margins.right}
                                                    y2={tick.y}
                                                    class="commodity-grid-line"
                                                />
                                                <text x={chart.margins.left - 8} y={tick.y + 4} class="commodity-y-label">{formatValue(tick.value)}</text>
                                            {/each}

                                            <line x1={chart.margins.left} y1={chart.margins.top} x2={chart.margins.left} y2={chart.height - chart.margins.bottom} class="commodity-axis-line" />
                                            <line x1={chart.margins.left} y1={chart.height - chart.margins.bottom} x2={chart.width - chart.margins.right} y2={chart.height - chart.margins.bottom} class="commodity-axis-line" />

                                            <path d={chart.areaPath} class="commodity-area-fill" class:positive-fill={chart.isPositive} class:negative-fill={!chart.isPositive} />
                                            <path d={chart.linePath} class="commodity-line-path" class:positive-stroke={chart.isPositive} class:negative-stroke={!chart.isPositive} />

                                            {#each chart.xTicks as tick}
                                                <text x={tick.x} y={chart.height - 8} class="commodity-x-label">{tick.label}</text>
                                            {/each}

                                            <text x={chart.margins.left} y={16} class="commodity-axis-title commodity-axis-title-left">가격</text>
                                            <text x={chart.width / 2} y={chart.height - 2} class="commodity-axis-title">시점</text>
                                        </svg>
                                    </div>
                                </div>
                            {/if}
                        {/if}
                    </div>
                {/if}

            </div>

            <div class="right-column">

                <!-- 글로벌 이벤트 (API) -->
                <div class="card news-card">
                    <h3>실시간 글로벌 뉴스</h3>
                    <div class="news-list">
                        {#if globalEvents.length > 0}
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
                                        {#if ev.end_time}<span> ~ {formatDate(ev.end_time)}</span>{/if}
                                    </div>
                                </div>
                            {/each}
                        {:else}
                            <div class="empty-state">현재 뉴스가 없습니다.</div>
                        {/if}

                        {#if marketEvents.length > 0}
                            <div class="events-divider">
                                <span class="divider-line"></span>
                                <span class="divider-text">시장 이벤트</span>
                                <span class="divider-line"></span>
                            </div>
                            {#each marketEvents as mev}
                                <div class="event-item">
                                    <div class="event-header">
                                        <span class="event-name">{mev.name}</span>
                                        <span class="market-event-type-badge">{mev.event_type}</span>
                                    </div>
                                    <p class="event-desc">{mev.description}</p>
                                    <div class="event-meta-row">
                                        <span class="event-impact" class:pos={(mev.impact ?? 0) >= 0} class:neg={mev.impact < 0}>
                                            영향도 {(mev.impact ?? 0) >= 0 ? '+' : ''}{(mev.impact ?? 0).toFixed(1)}
                                        </span>
                                        <span class="event-time">{formatDate(mev.start_time)}</span>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>

                <!-- 섹터 성과 (API) -->
                {#if sectorPerf}
                    <div class="card">
                        <h3>업종별 수익률</h3>
                        <div class="sector-list">
                            {#each Object.entries(sectorPerf.sector_performance) as [sector, pct]}
                                <div class="sector-item">
                                    <span class="sector-name">{sector}</span>
                                    <div class="sector-bar-wrap">
                                        <div class="sector-bar" class:bar-pos={pct >= 0} class:bar-neg={pct < 0} style="width: {Math.min(Math.abs(pct) * 4, 100)}%"></div>
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
        grid-template-columns: 2fr 1fr;
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

    h3 { font-size: 1.125rem; font-weight: 700; margin: 0 0 1.25rem 0; }

    /* GDP Card */
    .gdp-card {
        display: flex;
        gap: 0;
        padding: 0;
        overflow: hidden;
    }

    .country-list {
        width: 240px;
        flex-shrink: 0;
        padding: 24px 0 24px 24px;
    }

    .list-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 12px;
        margin-bottom: 12px;
        margin-right: 12px;
        height: 30px;
    }

    .list-header .divider-line, .events-divider .divider-line {
        flex: 1;
        height: 1px;
        background-color: var(--color-border, #e5e7eb);
    }

    .list-header-text {
        font-size: 18px;
        font-weight: 700;
        color: var(--color-text);
        white-space: nowrap;
    }

    .country-list ul { list-style: none; padding: 0; margin: 0; }

    .country-list li {
        display: flex;
        justify-content: space-between;
        padding: 12px 24px 12px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text);
        transition: background-color 0.2s;
    }

    .country-list li:hover { background-color: var(--color-theme-2, #ECF2FE); }
    .country-list li.selected { background-color: var(--color-theme-2, #ECF2FE); font-weight: 700; }

    .flag-name { display: flex; gap: 8px; align-items: center; }
    .flag { font-size: 16px; }
    .gdp-value { font-size: 13px; color: var(--color-text-gray); font-weight: 600; }

    .country-detail {
        flex: 1;
        padding: 24px 32px;
    }

    .detail-header { margin-bottom: 20px; height: 30px; display: flex; align-items: center; }
    .detail-header h2 { font-size: 22px; margin: 0; display: flex; align-items: baseline; gap: 8px; font-weight: 700; }
    .detail-header .region { font-size: 13px; color: var(--color-text-gray); font-weight: 400; }

    .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 24px;
    }

    .stat-box {
        background-color: var(--color-bg-2, #f9fafb);
        padding: var(--card-padding, 1.25rem);
        border-radius: 8px;
    }

    .stat-box .label { display: block; font-size: var(--stat-label-size, 0.8rem); color: var(--stat-label-color, var(--color-text-gray)); margin-bottom: 0.5rem; }
    .stat-box .val { font-size: 1rem; font-weight: var(--stat-value-weight, 700); color: var(--color-text); }

    .chart-area {
        background-color: var(--color-bg-1, white);
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 8px;
        padding: 0.5rem;
        height: 11rem;
    }
    .line-chart { width: 100%; height: 100%; display: block; }
    .gdp-grid-line { stroke: var(--color-border, #e5e7eb); stroke-width: 1; }
    .gdp-axis-line { stroke: #cbd5e1; stroke-width: 1.2; }
    .gdp-area-fill { fill: rgba(0, 82, 155, 0.12); }
    .gdp-line-path { fill: none; stroke: var(--color-theme-1, #00529B); stroke-width: 3; }
    .gdp-point { fill: #fff; stroke: var(--color-theme-1, #00529B); stroke-width: 2; }
    .gdp-y-label { font-size: 12px; fill: var(--color-text-gray); text-anchor: end; }
    .gdp-x-label { font-size: 11px; fill: var(--color-text-gray); text-anchor: middle; }
    .gdp-axis-title { font-size: 13px; fill: var(--color-text); font-weight: 700; text-anchor: middle; }
    .gdp-axis-title-left { text-anchor: start; }

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
        cursor: pointer;
        border: none;
        text-align: left;
        width: 100%;
        transition: outline 0.15s;
    }

    .commodity-item:hover { outline: 2px solid var(--color-theme-1, #00529B); outline-offset: -2px; border-radius: 8px; }
    .commodity-selected { outline: 2px solid var(--color-theme-1, #00529B); outline-offset: -2px; }

    .commodity-name-row { display: flex; justify-content: space-between; align-items: center; }
    .commodity-name { font-size: 0.85rem; font-weight: 700; }
    .commodity-change { font-size: 0.8rem; font-weight: 700; }
    .commodity-price { font-size: 1rem; font-weight: 800; color: #111; }
    .commodity-vol { font-size: 0.72rem; color: var(--color-text-gray); }

    .commodity-chart-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border, #e5e7eb); }
    .chart-label { font-size: 0.85rem; font-weight: 600; margin: 0 0 0.5rem 0; color: #333; }
    .commodity-chart-wrap { background: var(--color-bg-2, #f9fafb); border-radius: 8px; padding: 0.5rem; height: 12rem; }
    .commodity-chart-svg { width: 100%; height: 100%; display: block; }
    .commodity-grid-line { stroke: var(--color-border, #e5e7eb); stroke-width: 1; }
    .commodity-axis-line { stroke: #cbd5e1; stroke-width: 1.2; }
    .commodity-area-fill { fill-opacity: 0.12; }
    .commodity-area-fill.positive-fill { fill: var(--color-positive, #10b981); }
    .commodity-area-fill.negative-fill { fill: var(--color-negative, #ef4444); }
    .commodity-line-path { fill: none; stroke-width: 3; }
    .commodity-line-path.positive-stroke { stroke: var(--color-positive, #10b981); }
    .commodity-line-path.negative-stroke { stroke: var(--color-negative, #ef4444); }
    .commodity-y-label { font-size: 11px; fill: var(--color-text-gray); text-anchor: end; }
    .commodity-x-label { font-size: 11px; fill: var(--color-text-gray); text-anchor: middle; }
    .commodity-axis-title { font-size: 12px; fill: var(--color-text); font-weight: 700; text-anchor: middle; }
    .commodity-axis-title-left { text-anchor: start; }

    /* Macro table */
    .macro-table-wrap { overflow-x: auto; }
    .macro-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .macro-table th { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 2px solid var(--color-border, #e5e7eb); color: var(--color-text-gray); font-weight: 600; }
    .macro-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #f0f0f0; }
    .ind-name { font-weight: 600; color: #111; }
    .ind-val { font-family: 'Fira Mono', monospace; font-weight: 700; }

    /* Events / News card */
    .news-card {
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .news-card .news-list { flex: 1; overflow-y: auto; }

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

    .market-event-type-badge {
        background: #ECF2FE;
        color: var(--color-theme-1, #00529B);
        border-radius: 4px;
        padding: 0.15rem 0.5rem;
        font-size: 0.72rem;
        font-weight: 700;
    }

    .event-desc { font-size: 0.82rem; color: var(--color-text-gray); margin: 0 0 0.4rem 0; line-height: 1.5; }
    .event-time { font-size: 0.75rem; color: var(--color-text-gray); }
    .event-meta-row { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
    .event-impact { font-size: 0.8rem; font-weight: 700; }

    .events-divider {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 1rem 0 0.5rem 0;
    }

    .divider-text {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--color-text-gray);
        white-space: nowrap;
    }

    .empty-state {
        padding: 2rem 0;
        text-align: center;
        color: var(--color-text-gray);
        font-size: 0.9rem;
    }

    /* Sector performance */
    .sector-list { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem; }
    .sector-item { display: grid; grid-template-columns: 120px 1fr 60px; align-items: center; gap: 0.75rem; }
    .sector-name { font-size: 0.82rem; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sector-bar-wrap { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .sector-bar { height: 100%; border-radius: 4px; min-width: 2px; }
    .sector-bar.bar-pos { background: var(--color-positive, #10b981); }
    .sector-bar.bar-neg { background: var(--color-negative, #ef4444); }
    .sector-pct { font-size: 0.82rem; font-weight: 700; text-align: right; }

    .top-sectors {
        padding-top: 0.75rem;
        border-top: 1px solid var(--color-border, #e5e7eb);
        display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
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
    .stat-box .val.text-green { color: var(--color-positive, #10b981); }

    /* Full-width cards */
    .full-width-card { grid-column: 1 / -1; }

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

    @media (max-width: 768px) {
        .gdp-card { flex-direction: column; }
        .country-list { width: 100%; padding-right: 24px; }
        .country-detail { padding-left: 24px; }
        .commodity-list { grid-template-columns: repeat(2, 1fr); }
    }
</style>
