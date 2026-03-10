<script lang="ts">
    import { getValuation, getFinancials } from '$lib/api/market';
    import type { Valuation, FinancialReport } from '$lib/api/market';
    import type { PortfolioDashboard } from '$lib/api/trade';

    interface Props {
        selectedCompanyId: string;
        currentPrice: number;
        dashboard: PortfolioDashboard | null;
    }

    let { selectedCompanyId, currentPrice, dashboard }: Props = $props();

    let valuation = $state<Valuation | null>(null);
    let financials = $state<FinancialReport | null>(null);
    let expanded = $state(false);

    $effect(() => {
        if (!selectedCompanyId) return;
        valuation = null;
        financials = null;
        Promise.all([
            getValuation(selectedCompanyId),
            getFinancials(selectedCompanyId)
        ]).then(([v, f]) => {
            valuation = v;
            financials = f;
        }).catch(() => {});
    });

    let holding = $derived(
        dashboard?.holdings.find(h => h.company_id === selectedCompanyId) ?? null
    );

    let stats = $derived([
        { label: '공정가치', value: valuation ? `₩${valuation.fair_value.toLocaleString()}` : '-' },
        { label: '괴리율', value: valuation ? `${valuation.deviation_pct.toFixed(2)}%` : '-' },
        { label: 'EPS', value: valuation ? `₩${valuation.eps.toLocaleString()}` : '-' },
        { label: 'BPS', value: valuation ? `₩${valuation.bps.toLocaleString()}` : '-' },
        { label: 'PER', value: valuation ? valuation.current_per.toFixed(1) : '-' },
        { label: 'PBR', value: valuation ? valuation.current_pbr.toFixed(2) : '-' },
        { label: 'ROE', value: valuation ? `${valuation.roe.toFixed(1)}%` : '-' },
    ]);

    let holdingStats = $derived(
        holding
            ? [
                { label: '보유 수량', value: `${holding.quantity}주` },
                { label: '평균 단가', value: `₩${Math.round(holding.avg_price).toLocaleString()}` },
                { label: '투자금', value: `₩${holding.total_invested.toLocaleString()}` },
                { label: '평가액', value: `₩${holding.current_value.toLocaleString()}` },
                { label: '평가 손익', value: `₩${holding.profit_loss.toLocaleString()}` },
                { label: '수익률', value: `${holding.profit_loss_pct.toFixed(2)}%` },
                { label: '비중', value: `${holding.weight_pct.toFixed(1)}%` },
              ]
            : []
    );

    let isProfitPositive = $derived((holding?.profit_loss ?? 0) >= 0);
</script>

<aside class="info-panel" class:expanded>
    <div class="summary-content">
        <div class="header">
            <div class="title-row">
                <div class="icon">₩</div>
                <strong class="code">{holding?.company_name ?? (selectedCompanyId || '-')}</strong>
            </div>
        </div>

        <p class="meta">현재가 · ₩{currentPrice.toLocaleString()}</p>

        <div class="price">
            <span class="price-value">₩{currentPrice.toLocaleString()}</span>
            {#if holding}
                <span class="change" class:negative={!isProfitPositive} class:positive={isProfitPositive}>
                    {isProfitPositive ? '+' : ''}{holding.profit_loss_pct.toFixed(2)}%
                </span>
            {/if}
        </div>

        <div class="divider"></div>

        <h4 class="section-title">밸류에이션</h4>

        <div class="stats">
            {#each stats as stat}
                <div class="stat-row">
                    <span class="stat-label">{stat.label}</span>
                    <span class="stat-value">{stat.value}</span>
                </div>
            {/each}
        </div>

        {#if holdingStats.length > 0}
            <div class="divider"></div>
            <h4 class="section-title">보유 현황</h4>
            <div class="stats">
                {#each holdingStats as stat}
                    <div class="stat-row">
                        <span class="stat-label">{stat.label}</span>
                        <span class="stat-value">{stat.value}</span>
                    </div>
                {/each}
            </div>
        {/if}

        {#if financials}
            <div class="divider"></div>
            <h4 class="section-title">재무제표</h4>
            <div class="stats">
                <div class="stat-row">
                    <span class="stat-label">매출</span>
                    <span class="stat-value">{financials.revenue != null ? `₩${financials.revenue.toLocaleString()}` : '-'}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">순이익</span>
                    <span class="stat-value" style="color: {(financials.net_income ?? 0) >= 0 ? '#16a34a' : '#dc2626'}">{financials.net_income != null ? `₩${financials.net_income.toLocaleString()}` : '-'}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">총자산</span>
                    <span class="stat-value">{financials.total_assets != null ? `₩${financials.total_assets.toLocaleString()}` : '-'}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">자기자본</span>
                    <span class="stat-value">{financials.total_equity != null ? `₩${financials.total_equity.toLocaleString()}` : '-'}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">EPS</span>
                    <span class="stat-value">{financials.eps != null ? `₩${financials.eps.toLocaleString()}` : '-'}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">BPS</span>
                    <span class="stat-value">{financials.bps != null ? `₩${financials.bps.toLocaleString()}` : '-'}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">ROE</span>
                    <span class="stat-value">{financials.roe != null ? `${financials.roe.toFixed(1)}%` : '-'}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">PER</span>
                    <span class="stat-value">{financials.per != null ? financials.per.toFixed(1) : '-'}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">PBR</span>
                    <span class="stat-value">{financials.pbr != null ? financials.pbr.toFixed(2) : '-'}</span>
                </div>
            </div>
        {/if}

        <div class="divider"></div>

        <div class="account-row">
            <span class="stat-label">가용 현금</span>
            <span class="stat-value">₩{(dashboard?.summary.cash ?? 0).toLocaleString()}</span>
        </div>
        <div class="account-row">
            <span class="stat-label">주식 평가액</span>
            <span class="stat-value">₩{(dashboard?.summary.stock_value ?? 0).toLocaleString()}</span>
        </div>
        <div class="account-row">
            <span class="stat-label">총 자산</span>
            <span class="stat-value">₩{(dashboard?.summary.total_assets ?? 0).toLocaleString()}</span>
        </div>
        <div class="account-row">
            <span class="stat-label">총 손익</span>
            <span class="stat-value" style="color: {(dashboard?.summary.total_profit_loss ?? 0) >= 0 ? '#16a34a' : '#dc2626'}">
                {(dashboard?.summary.total_profit_loss ?? 0) >= 0 ? '+' : ''}₩{(dashboard?.summary.total_profit_loss ?? 0).toLocaleString()} ({(dashboard?.summary.total_profit_loss_pct ?? 0).toFixed(2)}%)
            </span>
        </div>
    </div>

    {#if !expanded}
        <div class="fade-overlay"></div>
        <button class="expand-btn" onclick={() => expanded = true}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
            </svg>
            <span>더보기</span>
        </button>
    {/if}
</aside>

<style>
    .info-panel {
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

    .info-panel.expanded {
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

    .meta {
        font-size: 0.8125rem;
        color: #64748b;
        margin: 0 0 0.5rem 0;
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

    .change {
        font-size: 0.875rem;
        font-weight: 700;
    }

    .change.negative {
        color: #dc2626;
    }

    .change.positive {
        color: #16a34a;
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

    .stat-row,
    .account-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .account-row {
        margin-bottom: 0.375rem;
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
