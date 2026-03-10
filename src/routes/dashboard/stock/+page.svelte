<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { toast } from 'svelte-sonner';
    import StockHeader from '../../../lib/stock/StockHeader.svelte';
    import StockChart from '../../../lib/stock/StockChart.svelte';
    import NewsSection from '../../../lib/stock/NewsSection.svelte';
    import OrderPanel from '$lib/components/OrderPanel.svelte';
    import Summary from '$lib/stock/Summary.svelte';
    import { getCompanies } from '$lib/api/market';
    import { getPortfolioDashboard, buyStock, sellStock } from '$lib/api/trade';
    import type { Company } from '$lib/api/market';
    import type { PortfolioDashboard } from '$lib/api/trade';
    import SkeletonDashboard from '$lib/components/SkeletonDashboard.svelte';

    let companies = $state<Company[]>([]);
    let selectedCompanyId = $state<string>('');
    let currentPrice = $state(0);
    let dashboard = $state<PortfolioDashboard | null>(null);

    async function loadDashboard() {
        try {
            dashboard = await getPortfolioDashboard();
        } catch (e) {
            console.error('포트폴리오 로드 실패:', e);
            toast.error('포트폴리오 정보를 불러오지 못했습니다.');
        }
    }

    onMount(async () => {
        try {
            companies = await getCompanies();
            if (companies.length > 0) {
                selectedCompanyId = companies[0].company_id;
            }
        } catch (e) {
            console.error('종목 로드 실패:', e);
            toast.error('종목 정보를 불러오지 못했습니다.');
        }

        await loadDashboard();
    });

    function onAccountRefresh() {
        loadDashboard();
    }

    function handlePriceUpdate(price: number) {
        currentPrice = price;
    }

    let stockBalance = $derived(dashboard?.summary.cash ?? 0);
    let stockMaxSellQty = $derived(
        dashboard?.holdings.find(h => h.company_id === selectedCompanyId)?.quantity ?? 0
    );

    async function handleStockBuy(qty: number) {
        await buyStock(selectedCompanyId, qty);
        onAccountRefresh();
    }
    async function handleStockSell(qty: number) {
        await sellStock(selectedCompanyId, qty);
        onAccountRefresh();
    }
</script>

<div class="stock-page">
    {#if companies.length === 0}
        <SkeletonDashboard />
    {:else}
    <div class="left">
        <StockHeader
            {companies}
            bind:selectedCompanyId
            {currentPrice}
        />
        <StockChart {selectedCompanyId} onPriceUpdate={handlePriceUpdate} />
        <NewsSection {selectedCompanyId} />
    </div>

    <div class="right">
        <OrderPanel
            {currentPrice}
            balance={stockBalance}
            maxSellQty={stockMaxSellQty}
            onBuy={handleStockBuy}
            onSell={handleStockSell}
        />
        <Summary
            {selectedCompanyId}
            {currentPrice}
            {dashboard}
        />
        {#if dashboard && dashboard.recent_trades.length > 0}
        <div class="orders-panel">
            <h3 class="orders-title">최근 거래 내역</h3>
            <div class="orders-list">
                {#each dashboard.recent_trades as trade}
                    <div class="order-row" class:buy={trade.type === 'BUY'} class:sell={trade.type === 'SELL'}>
                        <span class="order-type">{trade.type === 'BUY' ? '매수' : '매도'}</span>
                        <span class="order-company">{trade.company_name}</span>
                        <span class="order-qty">{trade.quantity}주</span>
                        <span class="order-price">{trade.total_amount.toLocaleString()}원</span>
                    </div>
                {/each}
            </div>
        </div>
        {/if}
    </div>
    {/if}
</div>

<style>
    .stock-page {
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
        width: 20rem;
    }
    .orders-panel { background: white; border: 1px solid var(--color-border); border-radius: 12px; padding: 1rem; }
    .orders-title { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.75rem; }
    .orders-list { display: flex; flex-direction: column; gap: 0.4rem; max-height: 200px; overflow-y: auto; }
    .order-row { display: grid; grid-template-columns: 2.5rem 1fr auto auto; gap: 0.5rem; align-items: center; font-size: 0.8rem; padding: 0.3rem 0; border-bottom: 1px solid #f3f4f6; }
    .order-type { font-weight: 700; font-size: 0.75rem; padding: 0.15rem 0.4rem; border-radius: 4px; }
    .order-row.buy .order-type { color: #dc2626; background: #fef2f2; }
    .order-row.sell .order-type { color: #2563eb; background: #eff6ff; }
    .order-company { color: var(--color-text-gray); font-size: 0.75rem; overflow: hidden; text-overflow: ellipsis; }
    .order-qty { color: #374151; }
    .order-price { font-weight: 600; color: #1a1a1a; }
</style>
