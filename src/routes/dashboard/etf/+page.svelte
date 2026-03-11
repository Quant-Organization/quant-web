<script lang="ts">
    import { onMount } from 'svelte';
    import { toast } from 'svelte-sonner';
    import { getETFs, getETFDetail, getETFHoldings, getETFDividends, buyETF, sellETF } from '$lib/api/etf';
    import type { ETF, ETFUserHolding, ETFDividendRecord, ETFHoldingsResponse } from '$lib/api/etf';
    import ETFChart from '$lib/components/ETFChart.svelte';
    import OrderPanel from '$lib/components/OrderPanel.svelte';
    import SkeletonDashboard from '$lib/components/SkeletonDashboard.svelte';
    import { setBalance } from '$lib/stores/asset';

    let etfs: ETF[] = $state([]);
    let holdings: ETFUserHolding[] = $state([]);
    let cashBalance = $state(0);
    let dividends: ETFDividendRecord[] = $state([]);
    let selectedETFId = $state('');
    let loading = $state(true);
    let error = $state('');
    let currentNav = $state(0);

    onMount(async () => {
        try {
            const [listRes, holdRes] = await Promise.all([
                getETFs(),
                getETFHoldings({ suppressAuth: true }).catch(() => ({ holdings: [], total_etf_value: 0, cash_balance: 0 }) as ETFHoldingsResponse)
            ]);
            etfs = listRes.etfs;
            holdings = holdRes.holdings;
            cashBalance = holdRes.cash_balance;
            setBalance(cashBalance);
            if (etfs.length > 0) selectedETFId = etfs[0].id;
        } catch {
            error = '데이터를 불러오는 중 오류가 발생했습니다.';
            toast.error('ETF 데이터를 불러오지 못했습니다.');
        } finally {
            loading = false;
        }
    });

    $effect(() => {
        if (!selectedETFId) return;
        getETFDetail(selectedETFId).then(detail => {
            if (detail) {
                const idx = etfs.findIndex(e => e.id === selectedETFId);
                if (idx >= 0) etfs[idx] = detail;
                currentNav = detail.nav;
            }
        }).catch(() => {});
        getETFDividends(selectedETFId).then(res => {
            dividends = res.dividends ?? [];
        }).catch(() => { dividends = []; });
    });

    function handlePriceUpdate(price: number) {
        currentNav = price;
    }

    async function refreshHoldings() {
        try {
            const res = await getETFHoldings();
            holdings = res.holdings;
            cashBalance = res.cash_balance;
            setBalance(cashBalance);
        } catch {}
    }

    async function handleBuy(qty: number) {
        if (!selectedETFId) return;
        try {
            await buyETF(selectedETFId, qty);
            await refreshHoldings();
            toast.success('매수가 완료되었습니다.');
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : '매수 실패');
            throw e;
        }
    }

    async function handleSell(qty: number) {
        if (!selectedETFId) return;
        try {
            await sellETF(selectedETFId, qty);
            await refreshHoldings();
            toast.success('매도가 완료되었습니다.');
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : '매도 실패');
            throw e;
        }
    }

    let selectedETF = $derived(etfs.find(e => e.id === selectedETFId) ?? null);
    let isUp = $derived((selectedETF?.change_from_base_pct ?? 0) >= 0);
    let maxSellQty = $derived(
        holdings.find(h => h.etf_id === selectedETFId)?.quantity ?? 0
    );

    function formatExactPrice(n: number): string {
        return '$' + Math.round(n).toLocaleString();
    }

    function formatNumber(n: number): string {
        if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
        if (n >= 1_000) return '$' + (n / 1_000).toFixed(2) + 'K';
        return '$' + n.toFixed(2);
    }

    function formatPct(n: number): string {
        return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
    }

    function formatDate(s: string): string {
        try {
            return new Date(s).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch { return s; }
    }
</script>

<div class="etf-page">
    {#if loading}
        <SkeletonDashboard />
    {:else if error}
        <div class="error-state">{error}</div>
    {:else}
        <div class="main-layout">
            <div class="left">
                <!-- Header -->
                <section class="header-card">
                    <div class="header-left">
                        <div class="title-row">
                            <span class="pill">ETF</span>
                            <select class="etf-select" bind:value={selectedETFId}>
                                {#each etfs as e}
                                    <option value={e.id}>{e.name} ({e.ticker})</option>
                                {/each}
                            </select>
                        </div>
                        <div class="price-row">
                            <strong class="price">{formatExactPrice(currentNav)}</strong>
                            {#if selectedETF}
                                <span class={isUp ? 'badge-up' : 'badge-down'}>
                                    {formatPct(selectedETF.change_from_base_pct ?? 0)}
                                </span>
                            {/if}
                        </div>
                    </div>
                    <div class="stats">
                        <div class="stat">
                            <span class="stat-label">보수율</span>
                            <strong>{selectedETF ? ((selectedETF?.expense_ratio ?? 0) * 100).toFixed(2) + '%' : '-'}</strong>
                        </div>
                        <div class="divider-v"></div>
                        <div class="stat">
                            <span class="stat-label">배당수익률</span>
                            <strong>{selectedETF?.annual_dividend_rate != null ? (selectedETF.annual_dividend_rate * 100).toFixed(2) + '%' : '-'}</strong>
                        </div>
                        <div class="divider-v"></div>
                        <div class="stat">
                            <span class="stat-label">구성종목</span>
                            <strong>{selectedETF ? selectedETF.constituents.length + '개' : '-'}</strong>
                        </div>
                    </div>
                </section>

                <!-- Chart -->
                <ETFChart selectedETFId={selectedETFId} onPriceUpdate={handlePriceUpdate} />

                <!-- ETF list table -->
                <section class="panel table-panel">
                    <table class="etf-table">
                        <thead>
                            <tr>
                                <th>ETF</th>
                                <th>티커</th>
                                <th>NAV</th>
                                <th>변동률</th>
                                <th>배당수익률</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each etfs as etf}
                                <tr
                                    class="etf-row"
                                    class:active={selectedETFId === etf.id}
                                    onclick={() => { selectedETFId = etf.id; }}
                                >
                                    <td>
                                        <span class="etf-name">{etf.name}</span>
                                    </td>
                                    <td class="ticker-cell">{etf.ticker}</td>
                                    <td>{formatNumber(etf.nav)}</td>
                                    <td class:positive={(etf.change_from_base_pct ?? 0) >= 0} class:negative={(etf.change_from_base_pct ?? 0) < 0}>
                                        {formatPct(etf.change_from_base_pct ?? 0)}
                                    </td>
                                    <td>{etf.annual_dividend_rate != null ? (etf.annual_dividend_rate * 100).toFixed(2) + '%' : '-'}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </section>
            </div>

            <div class="right">
                <!-- Order Panel -->
                <OrderPanel
                    currentPrice={currentNav}
                    balance={cashBalance}
                    {maxSellQty}
                    onBuy={handleBuy}
                    onSell={handleSell}
                    currency="$"
                    unit="좌"
                    allowDecimal={false}
                    showReserve={false}
                />

                <!-- User Holdings -->
                <div class="panel">
                    <h3 class="section-title">보유현황</h3>
                    {#if holdings.length === 0}
                        <div class="empty-state">보유한 ETF가 없습니다.</div>
                    {:else}
                        <table class="holdings-table">
                            <thead>
                                <tr>
                                    <th>종목</th>
                                    <th>수량</th>
                                    <th>평균단가</th>
                                    <th>손익</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each holdings as h}
                                    <tr>
                                        <td class="h-id">{h.etf_id}</td>
                                        <td>{h.quantity}</td>
                                        <td>{formatNumber(h.avg_price)}</td>
                                        <td class:pos={h.profit_loss >= 0} class:neg={h.profit_loss < 0}>
                                            {h.profit_loss >= 0 ? '+' : ''}{formatNumber(h.profit_loss)}
                                            ({(h.profit_loss_pct ?? 0) >= 0 ? '+' : ''}{(h.profit_loss_pct ?? 0).toFixed(2)}%)
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>

                <!-- Dividend Info -->
                {#if selectedETF}
                    <div class="panel">
                        <h3 class="section-title">배당 정보</h3>
                        <div class="dividend-summary">
                            <div class="dividend-row">
                                <span class="dividend-label">연 배당수익률</span>
                                <strong class="dividend-value accent">
                                    {selectedETF.annual_dividend_rate != null ? (selectedETF.annual_dividend_rate * 100).toFixed(2) + '%' : '-'}
                                </strong>
                            </div>
                            <div class="dividend-row">
                                <span class="dividend-label">주간 배당률</span>
                                <strong class="dividend-value">
                                    {selectedETF.weekly_dividend_rate != null ? (selectedETF.weekly_dividend_rate * 100).toFixed(2) + '%' : '-'}
                                </strong>
                            </div>
                            <div class="dividend-row">
                                <span class="dividend-label">1좌당 예상 주간배당</span>
                                <strong class="dividend-value">
                                    {selectedETF.expected_weekly_dividend_per_share != null ? formatNumber(selectedETF.expected_weekly_dividend_per_share) : '-'}
                                </strong>
                            </div>
                        </div>

                        {#if dividends.length > 0}
                            <h4 class="subsection-title">배당 내역</h4>
                            <table class="dividend-table">
                                <thead>
                                    <tr>
                                        <th>지급일</th>
                                        <th>1좌당</th>
                                        <th>수령액</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each dividends.slice(0, 5) as d}
                                        <tr>
                                            <td>{formatDate(d.payment_date)}</td>
                                            <td>{formatNumber(d.dividend_per_unit)}</td>
                                            <td class="pos">{formatNumber(d.total_dividend)}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        {/if}
                    </div>
                {/if}

                <!-- Constituents -->
                {#if selectedETF}
                    {#if selectedETF.description}
                        <div class="panel">
                            <h3 class="section-title">설명</h3>
                            <p class="desc-text">{selectedETF.description}</p>
                        </div>
                    {/if}

                    <div class="panel">
                        <h3 class="section-title">구성종목</h3>
                        <table class="constituents-table">
                            <thead>
                                <tr>
                                    <th>종목</th>
                                    <th>비중</th>
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
                                                <span>{((holding.target_weight ?? 0) * 100).toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td>{formatNumber(holding.price)}</td>
                                        <td>{formatNumber(holding.value)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {:else}
                    <div class="panel empty-state">ETF를 선택하세요.</div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .etf-page { width: 100%; }

    .loading-state, .error-state {
        display: flex; align-items: center; justify-content: center;
        min-height: 40vh; font-size: 1rem; color: var(--color-text-gray);
    }
    .error-state { color: var(--color-negative); }

    .main-layout {
        display: flex;
        gap: 2rem;
    }

    .left {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .right {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        width: 22rem;
    }

    /* Header card */
    .header-card {
        background: #fff;
        padding: 1.125rem 1.375rem;
        border-radius: 0.875rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
    }

    .title-row {
        display: flex;
        align-items: center;
        gap: 0.625rem;
    }

    .pill {
        background: #f8fafc; color: #475569;
        padding: 0.25rem 0.625rem; border-radius: 999px;
        font-weight: 700; font-size: 0.75rem; border: 1px solid #e5e7eb;
    }

    .etf-select {
        -webkit-appearance: none; -moz-appearance: none; appearance: none;
        font-size: 1.125rem; font-weight: 700; color: #0f172a;
        border: 1px solid #e5e7eb; border-radius: 0.5rem;
        padding: 0.25rem 1.75rem 0.25rem 0.5rem;
        background: #f8fafc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 0.5rem center;
        cursor: pointer; outline: none; min-width: 14rem;
    }
    .etf-select:focus { border-color: #3b82f6; }

    .price-row {
        margin-top: 0.625rem;
        display: flex; align-items: baseline; gap: 0.5rem;
    }

    .price { font-size: 1.875rem; font-weight: 800; letter-spacing: -0.3px; }

    .badge-up {
        background: #dcfce7; color: #166534;
        padding: 0.25rem 0.5rem; border-radius: 0.375rem;
        font-size: 0.8125rem; font-weight: 700;
    }
    .badge-down {
        background: #fee2e2; color: #991b1b;
        padding: 0.25rem 0.5rem; border-radius: 0.375rem;
        font-size: 0.8125rem; font-weight: 700;
    }

    .stats { display: flex; align-items: center; }

    .stat { padding: 0 1.125rem; text-align: right; }
    .stat .stat-label { font-size: 0.75rem; color: #94a3b8; }
    .stat strong { display: block; margin-top: 0.25rem; font-size: 0.9375rem; font-weight: 700; color: #0f172a; }
    .divider-v { width: 1px; height: 2.125rem; background: #e5e7eb; }

    /* Table */
    .panel {
        background: white; border-radius: 12px;
        border: 1px solid #e5e7eb; padding: 1.25rem;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
    }
    .table-panel { padding: 0; overflow: hidden; }

    .etf-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .etf-table th {
        padding: 0.75rem 1rem; text-align: left;
        border-bottom: 2px solid #e5e7eb;
        color: var(--color-text-gray); font-weight: 600; background: #f9fafb;
    }
    .etf-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f0f0f0; }
    .etf-row { cursor: pointer; transition: background 0.15s; }
    .etf-row:hover { background: #f9fafb; }
    .etf-row.active { background: #ECF2FE; }
    .etf-name { font-weight: 700; }
    .ticker-cell { font-family: 'Fira Mono', monospace; font-size: 0.8rem; color: var(--color-text-gray); }
    .positive { color: var(--color-positive); font-weight: 700; }
    .negative { color: var(--color-negative); font-weight: 700; }

    /* Right panel */
    .section-title { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.75rem; }
    .subsection-title { font-size: 0.85rem; font-weight: 600; margin: 1rem 0 0.5rem; color: #475569; }
    .desc-text { font-size: 0.875rem; color: #555; line-height: 1.6; margin: 0; }
    .empty-state {
        display: flex; align-items: center; justify-content: center;
        min-height: 120px; color: var(--color-text-gray); font-size: 0.9rem;
    }

    /* User Holdings */
    .holdings-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .holdings-table th {
        text-align: left; padding: 0.5rem;
        border-bottom: 2px solid #e5e7eb;
        color: var(--color-text-gray); font-weight: 600;
    }
    .holdings-table td { padding: 0.5rem; border-bottom: 1px solid #f0f0f0; }
    .h-id { font-family: 'Fira Mono', monospace; font-weight: 600; color: var(--color-theme-1); }
    .pos { color: var(--color-positive); font-weight: 700; }
    .neg { color: var(--color-negative); font-weight: 700; }

    /* Dividend */
    .dividend-summary { display: flex; flex-direction: column; gap: 0.5rem; }
    .dividend-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 0.375rem 0; border-bottom: 1px solid #f5f5f5;
    }
    .dividend-row:last-child { border-bottom: none; }
    .dividend-label { font-size: 0.8125rem; color: #64748b; }
    .dividend-value { font-size: 0.875rem; font-weight: 700; color: #0f172a; }
    .dividend-value.accent { color: var(--color-theme-1); }

    .dividend-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .dividend-table th {
        text-align: left; padding: 0.5rem;
        border-bottom: 2px solid #e5e7eb;
        color: var(--color-text-gray); font-weight: 600;
    }
    .dividend-table td { padding: 0.5rem; border-bottom: 1px solid #f0f0f0; }

    /* Constituents */
    .constituents-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .constituents-table th {
        text-align: left; padding: 0.5rem;
        border-bottom: 2px solid #e5e7eb;
        color: var(--color-text-gray); font-weight: 600;
    }
    .constituents-table td { padding: 0.5rem; border-bottom: 1px solid #f0f0f0; }
    .holding-id { font-family: 'Fira Mono', monospace; font-weight: 600; color: var(--color-theme-1); }

    .weight-bar-wrap { display: flex; align-items: center; gap: 0.5rem; }
    .weight-bar {
        height: 6px; background: var(--color-theme-1);
        border-radius: 3px; min-width: 2px; max-width: 80px; opacity: 0.7;
    }

    @media (max-width: 1100px) {
        .main-layout { flex-direction: column; }
        .right { width: 100%; }
    }
</style>
