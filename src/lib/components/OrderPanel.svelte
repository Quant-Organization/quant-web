<script lang="ts">
    import { toast } from 'svelte-sonner';
    import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
    import { Button } from '$lib/components/ui/button';
    import { Alert, AlertDescription } from '$lib/components/ui/alert';

    interface Props {
        currentPrice: number;
        balance: number;
        maxSellQty: number;
        onBuy: (qty: number) => Promise<void>;
        onSell: (qty: number) => Promise<void>;
        currency?: string;
        unit?: string;
        allowDecimal?: boolean;
        showReserve?: boolean;
    }

    let {
        currentPrice,
        balance,
        maxSellQty,
        onBuy,
        onSell,
        currency = '₩',
        unit = '주',
        allowDecimal = false,
        showReserve = true
    }: Props = $props();

    let tab = $state<'buy' | 'sell' | 'reserve'>('buy');
    let qty = $state(0);
    let submitting = $state(false);
    let errorMsg = $state('');

    let total = $derived(currentPrice * Math.max(0, qty));

    function handleTabChange(value: string) {
        tab = value as 'buy' | 'sell' | 'reserve';
        qty = 0;
        errorMsg = '';
    }

    function setPercent(percent: number) {
        if (tab === 'buy') {
            const affordable = allowDecimal
                ? (balance * percent) / 100 / Math.max(0.0001, currentPrice)
                : Math.floor((balance * percent) / 100 / Math.max(1, currentPrice));
            qty = Math.max(0, allowDecimal ? +affordable.toFixed(4) : affordable);
        } else if (tab === 'sell') {
            qty = allowDecimal
                ? Math.max(0, +(maxSellQty * percent / 100).toFixed(4))
                : Math.max(0, Math.floor((maxSellQty * percent) / 100));
        }
    }

    function onQtyInput(e: Event) {
        const v = Number((e.target as HTMLInputElement).value || 0);
        qty = allowDecimal ? Math.max(0, v) : Math.max(0, Math.floor(v));
    }

    function adjustPrice(delta: number) {
        qty = Math.max(0, qty + delta);
    }

    async function submitOrder() {
        if (qty <= 0 || submitting) return;
        submitting = true;
        errorMsg = '';
        try {
            if (tab === 'buy') {
                await onBuy(qty);
                toast.success('매수 완료!');
            } else if (tab === 'sell') {
                await onSell(qty);
                toast.success('매도 완료!');
            }
            qty = 0;
        } catch (e: unknown) {
            errorMsg = e instanceof Error ? e.message : '주문 실패';
            toast.error(errorMsg);
        } finally {
            submitting = false;
        }
    }

    function money(n: number) {
        return n.toLocaleString();
    }

    function formatTotal(n: number): string {
        if (currency === '$') {
            if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
            if (n >= 1_000) return '$' + (n / 1_000).toFixed(2) + 'K';
            return '$' + n.toFixed(2);
        }
        return currency + money(n);
    }
</script>

<aside class="panel" style="height: fit-content;">
    <Tabs value={tab} onValueChange={handleTabChange} class="tabs-wrapper">
        <TabsList class="tabs-list-custom">
            <TabsTrigger value="buy" class="tab-trigger-custom">매수</TabsTrigger>
            <TabsTrigger value="sell" class="tab-trigger-custom">매도</TabsTrigger>
            {#if showReserve}
                <TabsTrigger value="reserve" class="tab-trigger-custom">예약</TabsTrigger>
            {/if}
        </TabsList>
    </Tabs>

    <span class="label">현재가 ({currency === '$' ? 'USD' : 'KRW'})</span>
    <div class="price-box">
        <Button variant="ghost" size="icon" class="step" onclick={() => adjustPrice(-1)}>−</Button>
        <span class="price-display">{formatTotal(currentPrice)}</span>
        <Button variant="ghost" size="icon" class="step" onclick={() => adjustPrice(1)}>+</Button>
    </div>

    <span class="label">수량 {unit ? `(${unit})` : ''}</span>
    <div class="qty-box">
        <input
            class="qty-input"
            type="number"
            min="0"
            step={allowDecimal ? '0.0001' : '1'}
            oninput={onQtyInput}
            value={qty}
        />
        {#if unit}
            <span class="unit">{unit}</span>
        {/if}
    </div>

    <div class="percent">
        <Button variant="ghost" size="sm" class="percent-btn" onclick={() => setPercent(10)}>10%</Button>
        <Button variant="ghost" size="sm" class="percent-btn" onclick={() => setPercent(25)}>25%</Button>
        <Button variant="ghost" size="sm" class="percent-btn" onclick={() => setPercent(50)}>50%</Button>
        <Button variant="ghost" size="sm" class="percent-btn" onclick={() => setPercent(100)}>최대</Button>
    </div>

    <div class="summary">
        <div class="summary-row">
            <span class="label-small">주문 총액</span>
            <strong class="value">{formatTotal(total)}</strong>
        </div>
        <div class="summary-row dimmed">
            <span class="label-small">{tab === 'sell' ? '보유 수량' : '가능 금액'}</span>
            <strong class="value">
                {tab === 'sell' ? `${allowDecimal ? maxSellQty.toFixed(4) : maxSellQty}${unit}` : formatTotal(balance)}
            </strong>
        </div>
    </div>

    {#if errorMsg}
        <Alert variant="destructive" class="error-alert">
            <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
    {/if}

    {#if tab !== 'reserve'}
        <Button
            variant={tab === 'sell' ? 'destructive' : 'default'}
            class="submit-btn"
            onclick={submitOrder}
            disabled={submitting || qty <= 0 || currentPrice === 0}
        >
            {submitting ? '처리 중...' : tab === 'buy' ? '매수' : '매도'}
        </Button>
    {:else}
        <Button class="submit-btn" disabled>예약 기능 준비 중</Button>
    {/if}
</aside>

<style>
    .panel {
        width: 100%;
        background: #ffffff;
        padding: 0;
        border-radius: 0.75rem;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
        font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        color: #102a43;
        box-sizing: border-box;
    }

    /* Tabs wrapper: full width, rounded top, no gap */
    :global(.tabs-wrapper) {
        gap: 0 !important;
        margin-bottom: 2rem;
    }

    :global(.tabs-list-custom) {
        width: 100% !important;
        height: auto !important;
        border-radius: 0.75rem 0.75rem 0 0 !important;
        background: transparent !important;
        padding: 0 !important;
        gap: 0 !important;
        overflow: hidden;
    }

    :global(.tab-trigger-custom) {
        flex: 1 !important;
        height: auto !important;
        padding: 0.75rem 0.375rem !important;
        font-weight: 700 !important;
        font-size: 0.9375rem !important;
        color: #64748b !important;
        border-radius: 0 !important;
        border: none !important;
        border-bottom: 2px solid transparent !important;
        background: transparent !important;
        box-shadow: none !important;
        transition: all 0.2s ease !important;
    }

    :global(.tab-trigger-custom[data-state="active"]) {
        color: #2563eb !important;
        background: #ECF2FE !important;
        border-bottom: 2px solid #2563eb !important;
        box-shadow: none !important;
    }

    .label {
        display: block;
        font-size: 1rem;
        color: #64748b;
        margin-bottom: 0.5rem;
        padding: 0 0.875rem;
    }

    .price-box {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        background: rgba(236, 236, 236, 0.2);
        padding: 0.625rem 0.75rem;
        border-radius: 0.75rem;
        margin: 0 0.875rem 2rem 0.875rem;
        border: 0.5px solid rgba(157, 157, 157, 0.5);
        box-sizing: border-box;
        backdrop-filter: blur(4px) brightness(1.8);
        -webkit-backdrop-filter: blur(4px) brightness(1.8);
        position: relative;
        overflow: hidden;
    }

    .price-box::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.8) 0%,
            rgba(255, 255, 255, 0.2) 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.2) 75%,
            rgba(255, 255, 255, 0.8) 100%
        );
        pointer-events: none;
        opacity: 0.5;
    }

    :global(.price-box > .step) {
        width: 2.75rem !important;
        height: 2.75rem !important;
        border-radius: 0.5rem !important;
        font-size: 1.375rem !important;
        font-weight: 700 !important;
        color: #64748b !important;
        position: relative;
        z-index: 1;
        background: transparent !important;
    }

    .price-display {
        flex: 1;
        font-size: 1.25rem;
        font-weight: 800;
        text-align: center;
        position: relative;
        z-index: 1;
        color: #102a43;
    }

    .qty-box {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(236, 236, 236, 0.2);
        border: 0.5px solid rgba(157, 157, 157, 0.5);
        border-radius: 0.75rem;
        padding: 1rem 0.875rem;
        height: 3.75rem;
        margin: 0 0.875rem 0.75rem 0.875rem;
        box-sizing: border-box;
        backdrop-filter: blur(4px) brightness(1.8);
        -webkit-backdrop-filter: blur(4px) brightness(1.8);
        position: relative;
        overflow: hidden;
    }

    .qty-box::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.8) 0%,
            rgba(255, 255, 255, 0.2) 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.2) 75%,
            rgba(255, 255, 255, 0.8) 100%
        );
        pointer-events: none;
        opacity: 0.5;
    }

    .qty-input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 1.25rem;
        font-weight: 800;
        text-align: right;
        background: transparent;
        min-width: 0;
        position: relative;
        z-index: 1;
    }

    .unit {
        color: #64748b;
        font-weight: 700;
        position: relative;
        z-index: 1;
    }

    .percent {
        display: flex;
        gap: 0.5rem;
        margin: 0 0.875rem 2rem 0.875rem;
    }

    :global(.percent-btn) {
        flex: 1 !important;
        padding: 0.5rem 0.375rem !important;
        border-radius: 0.5rem !important;
        font-weight: 700 !important;
        background: rgba(236, 236, 236, 0.2) !important;
        color: #102a43 !important;
        height: auto !important;
    }

    .summary {
        background: rgba(236, 236, 236, 0.2);
        border-radius: 0.625rem;
        border: 0.5px solid rgba(157, 157, 157, 0.5);
        padding: 0.75rem 0.875rem;
        margin: 0 0.875rem 2rem 0.875rem;
        box-sizing: border-box;
        backdrop-filter: blur(4px) brightness(1.8);
        -webkit-backdrop-filter: blur(4px) brightness(1.8);
        position: relative;
        overflow: hidden;
    }

    .summary::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.8) 0%,
            rgba(255, 255, 255, 0.2) 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.2) 75%,
            rgba(255, 255, 255, 0.8) 100%
        );
        pointer-events: none;
        opacity: 0.5;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.375rem;
        position: relative;
        z-index: 1;
    }

    .summary-row.dimmed .label-small {
        color: #64748b;
    }

    .label-small {
        font-size: 0.8125rem;
        color: #64748b;
    }

    .value {
        font-size: 0.875rem;
        font-weight: 800;
        color: #102a43;
    }

    :global(.error-alert) {
        margin: 0 0.875rem 0.75rem 0.875rem !important;
        border-radius: 0.5rem !important;
    }

    :global(.submit-btn) {
        width: calc(100% - 1.75rem) !important;
        padding: 1rem !important;
        font-weight: 800 !important;
        border-radius: 0.75rem !important;
        font-size: 1.5rem !important;
        height: auto !important;
        margin: 0 0.875rem 1rem !important;
        transition: opacity 0.2s !important;
        display: flex !important;
    }

    /* buy variant override to use theme color */
    :global(.submit-btn[data-slot="button"]:not([class*="destructive"])) {
        background: var(--color-theme-1) !important;
        color: white !important;
    }

    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type="number"] {
        -moz-appearance: textfield;
        appearance: textfield;
    }
</style>
