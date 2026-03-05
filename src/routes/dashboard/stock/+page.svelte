<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import StockHeader from '../../../lib/stock/StockHeader.svelte';
    import StockChart from '../../../lib/stock/StockChart.svelte';
    import NewsSection from '../../../lib/stock/NewsSection.svelte';
    import OrderPanel from '../../../lib/stock/OrderPanel.svelte';
    import Summary from '$lib/stock/Summary.svelte';
    import { getCompanies, getPrices } from '$lib/api/market';
    import { getAccount, getOrders } from '$lib/api/trade';
    import type { Company, PriceMap } from '$lib/api/market';
    import type { AccountResponse, OrderResponse } from '$lib/api/trade';

    let companies = $state<Company[]>([]);
    let selectedCompanyId = $state<string>('');
    let priceMap = $state<PriceMap>({ prices: {} });
    let account = $state<AccountResponse | null>(null);
    let orders = $state<OrderResponse[]>([]);

    let intervalId: ReturnType<typeof setInterval>;

    async function loadPrices() {
        try {
            priceMap = await getPrices();
        } catch (e) {
            console.error('가격 로드 실패:', e);
        }
    }

    async function loadAccount() {
        try {
            account = await getAccount();
        } catch (e) {
            console.error('계좌 로드 실패:', e);
        }
    }

    async function loadOrders() {
        try { orders = await getOrders(20); } catch { /* ignore */ }
    }

    onMount(async () => {
        try {
            companies = await getCompanies();
            if (companies.length > 0) {
                selectedCompanyId = companies[0].company_id;
            }
        } catch (e) {
            console.error('종목 로드 실패:', e);
        }

        await Promise.all([loadPrices(), loadAccount(), loadOrders()]);

        intervalId = setInterval(async () => {
            await loadPrices();
        }, 5000);
    });

    onDestroy(() => {
        clearInterval(intervalId);
    });

    function onAccountRefresh() {
        loadAccount();
        loadOrders();
    }
</script>

<div class="stock-page">
    <div class="left">
        <StockHeader
            {companies}
            bind:selectedCompanyId
            {priceMap}
        />
        <StockChart {selectedCompanyId} />
        <NewsSection {selectedCompanyId} />
    </div>

    <div class="right">
        <OrderPanel
            {selectedCompanyId}
            {priceMap}
            {account}
            onOrderComplete={onAccountRefresh}
        />
        <Summary
            {selectedCompanyId}
            {priceMap}
            {account}
        />
        {#if orders.length > 0}
        <div class="orders-panel">
            <h3 class="orders-title">최근 주문 내역</h3>
            <div class="orders-list">
                {#each orders as ord}
                    <div class="order-row" class:buy={ord.order_type === 'buy'} class:sell={ord.order_type === 'sell'}>
                        <span class="order-type">{ord.order_type === 'buy' ? '매수' : '매도'}</span>
                        <span class="order-company">{ord.company_id}</span>
                        <span class="order-qty">{ord.quantity}주</span>
                        <span class="order-price">{ord.total_amount.toLocaleString()}원</span>
                    </div>
                {/each}
            </div>
        </div>
        {/if}
    </div>
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
