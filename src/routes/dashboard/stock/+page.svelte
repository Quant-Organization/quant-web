<script lang="ts">
    import StockHeader from '../../../lib/stock/StockHeader.svelte';
    import StockChart from '../../../lib/stock/StockChart.svelte';
    import NewsSection from '../../../lib/stock/NewsSection.svelte';
    import OrderPanel from '../../../lib/stock/OrderPanel.svelte';
    import Summary from "$lib/stock/Summary.svelte";
</script>

<div class="stock-page">
    <div class="left">
        <StockHeader />
        <StockChart />
        <NewsSection />
    </div>

    <div class="right">
        <OrderPanel />
        <Summary />
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
</style>
