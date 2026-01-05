<script>
    let stockCode = '005930';
    let stockName = '삼성전자 보통주';
    let exchange = 'KRX';
    let price = '100,500';
    let currency = 'KRW';
    let changeAmount = '-300';
    let changePercent = '-0.31%';

    let stats = [
        { label: '다음 실적 발표', value: '16일 후' },
        { label: '거래량', value: '4.1M' },
        { label: '평균 거래량', value: '16.8M' },
        { label: '시가 총액', value: '710B' },
        { label: '주가수익비율', value: '19.7' },
        { label: '주가순자산비율', value: '1.65' }
    ];

    let chartData = [
        { month: '7월', value: 45, compare: 35 },
        { month: '8월', value: 75, compare: 25 },
        { month: '9월', value: 60, compare: 40 },
        { month: '10월', value: 95, compare: 30 },
        { month: '11월', value: 85, compare: 45 },
        { month: '12월', value: 100, compare: 50 }
    ];

    let periodFilter = '순식 계산서';
    let chartType = '월간별';
    let expanded = false;
</script>

<aside class="summary" class:expanded>
    <div class="summary-content">
        <div class="header">
            <div class="title-row">
                <div class="icon">$</div>
                <strong class="code">{stockCode}</strong>
            </div>
            <button class="edit-btn" aria-label="편집">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
            </button>
        </div>

        <p class="meta">{stockName} · {exchange}</p>

        <div class="status-row">
            <span class="status-label">전일 가능</span>
            <span class="dot">·</span>
            <span class="status-label red">반도체</span>
        </div>

        <div class="price">
            <span class="price-value">{price}</span>
            <span class="currency">{currency}</span>
            <span class="change negative">{changeAmount} {changePercent}</span>
        </div>

        <div class="divider"></div>

        <h4 class="section-title">주요 통계</h4>

        <div class="stats">
            {#each stats as stat}
                <div class="stat-row">
                    <span class="stat-label">{stat.label}</span>
                    <span class="stat-value" class:has-icon={stat.icon}>
                        {stat.value}
                        {#if stat.icon}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                        {/if}
                    </span>
                </div>
            {/each}
        </div>

        <div class="divider"></div>

        <div class="chart-header">
            <div class="filter-group">
                <button class="filter-btn active">
                    {periodFilter}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </button>
            </div>
            <div class="chart-type">
                <button class="type-btn">{chartType}</button>
                <button class="type-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 21H4.6c-.56 0-.6-.6-.6-.6V3"/>
                        <path d="M9 6v15m6-12v12m6-9v9"/>
                    </svg>
                </button>
            </div>
        </div>

        <div class="chart">
            <div class="chart-grid">
                <span class="grid-label">100,00T</span>
                <span class="grid-label">75,00T</span>
                <span class="grid-label">50,00T</span>
                <span class="grid-label">25,00T</span>
            </div>
            <div class="chart-bars">
                {#each chartData as data}
                    <div class="bar-group">
                        <div class="bar-container">
                            <div class="bar primary" style="height: {data.value}%"></div>
                            <div class="bar secondary" style="height: {data.compare}%"></div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <div class="legend">
            <div class="legend-item">
                <span class="legend-dot primary"></span>
                <span class="legend-label">비교대상</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot secondary"></span>
                <span class="legend-label">순수익</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot tertiary"></span>
                <span class="legend-label">언론보도</span>
            </div>
        </div>
    </div>

    {#if !expanded}
        <div class="fade-overlay"></div>
        <button class="expand-btn" on:click={() => expanded = true}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
            </svg>
            <span>더보기</span>
        </button>
    {/if}
</aside>

<style>
    .summary {
        width: 100%;
        background: #fff;
        padding: 1rem;
        border-radius: 0.75rem;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
        font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        color: #102a43;
        position: relative;
        max-height: 12rem;
        overflow: hidden;
        transition: max-height 0.3s ease;
    }

    .summary.expanded {
        max-height: none;
        overflow: visible;
    }

    .summary-content {
        position: relative;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.25rem;
    }

    .title-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .icon {
        width: 1.5rem;
        height: 1.5rem;
        background: #000;
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 700;
    }

    .code {
        font-size: 1rem;
        font-weight: 700;
        color: #102a43;
    }

    .edit-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .edit-btn:hover {
        color: #102a43;
    }

    .meta {
        font-size: 0.8125rem;
        color: #64748b;
        margin: 0 0 0.5rem 0;
    }

    .status-row {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        margin-bottom: 0.75rem;
    }

    .status-label {
        font-size: 0.75rem;
        color: #64748b;
    }

    .status-label.red {
        color: #dc2626;
    }

    .dot {
        color: #cbd5e1;
        font-size: 0.75rem;
    }

    .price {
        display: flex;
        align-items: baseline;
        gap: 0.375rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .price-value {
        font-size: 1.5rem;
        font-weight: 800;
        color: #102a43;
    }

    .currency {
        font-size: 0.875rem;
        font-weight: 700;
        color: #64748b;
    }

    .change {
        font-size: 0.875rem;
        font-weight: 700;
    }

    .change.negative {
        color: #dc2626;
    }

    .divider {
        height: 1px;
        background: #f1f5f9;
        margin: 1rem 0;
    }

    .section-title {
        font-size: 0.875rem;
        font-weight: 700;
        color: #102a43;
        margin: 0 0 0.75rem 0;
    }

    .stats {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .stat-label {
        font-size: 0.8125rem;
        color: #64748b;
    }

    .stat-value {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #102a43;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .stat-value.has-icon svg {
        color: #94a3b8;
    }

    .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .filter-group {
        display: flex;
        gap: 0.5rem;
    }

    .filter-btn {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.375rem 0.625rem;
        background: transparent;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
    }

    .filter-btn.active {
        color: #102a43;
    }

    .chart-type {
        display: flex;
        gap: 0.25rem;
    }

    .type-btn {
        padding: 0.375rem 0.625rem;
        background: transparent;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #102a43;
        cursor: pointer;
        display: flex;
        align-items: center;
    }

    .chart {
        position: relative;
        height: 11.25rem;
        margin-bottom: 0.75rem;
    }

    .chart-grid {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        font-size: 0.6875rem;
        color: #94a3b8;
    }

    .grid-label {
        line-height: 1;
    }

    .chart-bars {
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        height: 100%;
        padding: 0 1.25rem 0 0;
        gap: 0.5rem;
    }

    .bar-group {
        flex: 1;
        display: flex;
        align-items: flex-end;
        height: 100%;
    }

    .bar-container {
        width: 100%;
        display: flex;
        gap: 0.25rem;
        align-items: flex-end;
        height: 100%;
    }

    .bar {
        flex: 1;
        border-radius: 0.25rem 0.25rem 0 0;
        min-height: 0.5rem;
    }

    .bar.primary {
        background: #3b82f6;
    }

    .bar.secondary {
        background: #fbbf24;
    }

    .legend {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        padding-top: 0.5rem;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    .legend-dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
    }

    .legend-dot.primary {
        background: #3b82f6;
    }

    .legend-dot.secondary {
        background: #fbbf24;
    }

    .legend-dot.tertiary {
        background: #10b981;
    }

    .legend-label {
        font-size: 0.6875rem;
        color: #64748b;
    }

    .fade-overlay {
        position: absolute;
        bottom: 2.5rem;
        left: 0;
        right: 0;
        height: 3rem;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1));
        pointer-events: none;
    }

    .expand-btn {
        position: absolute;
        bottom: 0.5rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #102a43;
        cursor: pointer;
        box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
    }

    .expand-btn:hover {
        background: #f8fafc;
        box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.15);
    }

    .expand-btn svg {
        width: 0.875rem;
        height: 0.875rem;
    }
</style>