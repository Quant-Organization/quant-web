<script lang="ts">
    import { toast } from 'svelte-sonner';
    import { buyStock, sellStock } from '$lib/api/trade';
    import type { PriceMap } from '$lib/api/market';
    import type { AccountResponse } from '$lib/api/trade';

    interface Props {
        selectedCompanyId: string;
        priceMap: PriceMap;
        account: AccountResponse | null;
        onOrderComplete: () => void;
    }

    let { selectedCompanyId, priceMap, account, onOrderComplete }: Props = $props();

    let tab = $state<'buy' | 'sell' | 'reserve'>('buy');
    let qty = $state(0);
    let submitting = $state(false);
    let errorMsg = $state('');

    let currentPrice = $derived(
        selectedCompanyId && priceMap.prices[selectedCompanyId]
            ? priceMap.prices[selectedCompanyId]
            : 0
    );

    let balance = $derived(account?.cash ?? 0);

    let holding = $derived(
        account?.holdings.find(h => h.company_id === selectedCompanyId) ?? null
    );

    let maxSellQty = $derived(holding?.quantity ?? 0);

    let total = $derived(currentPrice * Math.max(0, qty));

    function setPercent(percent: number) {
        if (tab === 'buy') {
            const affordable = Math.floor((balance * percent) / 100 / Math.max(1, currentPrice));
            qty = Math.max(0, affordable);
        } else if (tab === 'sell') {
            qty = Math.max(0, Math.floor((maxSellQty * percent) / 100));
        }
    }

    function onQtyInput(e: Event) {
        const v = Number((e.target as HTMLInputElement).value || 0);
        qty = Math.max(0, Math.floor(v));
    }

    function adjustPrice(delta: number) {
        // price is read-only from market; delta adjusts qty instead for UX
        qty = Math.max(0, qty + delta);
    }

    async function submitOrder() {
        if (!selectedCompanyId || qty <= 0 || submitting) return;
        submitting = true;
        errorMsg = '';
        try {
            if (tab === 'buy') {
                await buyStock(selectedCompanyId, qty);
                toast.success('매수 완료!');
            } else if (tab === 'sell') {
                await sellStock(selectedCompanyId, qty);
                toast.success('매도 완료!');
            }
            qty = 0;
            onOrderComplete();
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
</script>

<aside class="panel" style="height: fit-content;">
    <div class="tabs">
        <button
            class="tab-btn"
            class:active={tab === 'buy'}
            onclick={() => { tab = 'buy'; qty = 0; errorMsg = ''; }}
        >
            매수
        </button>
        <button
            class="tab-btn"
            class:active={tab === 'sell'}
            onclick={() => { tab = 'sell'; qty = 0; errorMsg = ''; }}
        >
            매도
        </button>
        <button
            class="tab-btn"
            class:active={tab === 'reserve'}
            onclick={() => { tab = 'reserve'; qty = 0; errorMsg = ''; }}
        >
            예약
        </button>
    </div>

    <span class="label">현재가 (KRW)</span>
    <div class="price-box">
        <button class="step" onclick={() => adjustPrice(-1)}>−</button>
        <span class="price-display">₩{money(currentPrice)}</span>
        <button class="step" onclick={() => adjustPrice(1)}>+</button>
    </div>

    <span class="label">수량 (주)</span>
    <div class="qty-box">
        <input
            class="qty-input"
            type="number"
            min="0"
            oninput={onQtyInput}
            value={qty}
        />
        <span class="unit">주</span>
    </div>

    <div class="percent">
        <button onclick={() => setPercent(10)}>10%</button>
        <button onclick={() => setPercent(25)}>25%</button>
        <button onclick={() => setPercent(50)}>50%</button>
        <button onclick={() => setPercent(100)}>최대</button>
    </div>

    <div class="summary">
        <div class="summary-row">
            <span class="label-small">주문 총액</span>
            <strong class="value">₩{money(total)}</strong>
        </div>
        <div class="summary-row dimmed">
            <span class="label-small">{tab === 'sell' ? '보유 수량' : '가능 금액'}</span>
            <strong class="value">
                {tab === 'sell' ? `${maxSellQty}주` : `₩${money(balance)}`}
            </strong>
        </div>
    </div>

    {#if errorMsg}
        <p class="error">{errorMsg}</p>
    {/if}

    {#if tab !== 'reserve'}
        <button
            class="submit-btn"
            class:sell-btn={tab === 'sell'}
            onclick={submitOrder}
            disabled={submitting || qty <= 0 || currentPrice === 0}
        >
            {submitting ? '처리 중...' : tab === 'buy' ? '매수' : '매도'}
        </button>
    {:else}
        <button class="submit-btn" disabled>예약 기능 준비 중</button>
    {/if}
</aside>

<style>
    .panel {
        width: 100%;
        max-width: 20rem;
        background: #ffffff;
        padding: 0;
        border-radius: 0.75rem;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
        font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        color: #102a43;
        box-sizing: border-box;
    }

    .tabs {
        display: flex;
        gap: 0;
        margin-bottom: 2rem;
        border-radius: 0.75rem 0.75rem 0 0;
        overflow: hidden;
    }

    .tab-btn {
        flex: 1;
        background: transparent;
        border: none;
        padding: 0.75rem 0.375rem;
        font-weight: 700;
        color: #64748b;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
        border-bottom: 2px solid transparent;
    }

    .tab-btn.active {
        color: #2563eb;
        background: #ECF2FE;
        border-bottom: 2px solid #2563eb;
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

    .price-box .step {
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 0.5rem;
        background: transparent;
        border: none;
        font-size: 1.375rem;
        font-weight: 700;
        cursor: pointer;
        color: #64748b;
        position: relative;
        z-index: 1;
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

    .percent button {
        flex: 1;
        border: none;
        padding: 0.5rem 0.375rem;
        border-radius: 0.5rem;
        font-weight: 700;
        background: rgba(236, 236, 236, 0.2);
        color: #102a43;
        cursor: pointer;
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

    .error {
        color: #dc2626;
        font-size: 0.8125rem;
        margin: 0 0.875rem 0.75rem 0.875rem;
        font-weight: 600;
    }

    .submit-btn {
        width: calc(100% - 1.75rem);
        padding: 1rem;
        background: var(--color-theme-1);
        color: white;
        font-weight: 800;
        border-radius: 0.75rem;
        border: none;
        cursor: pointer;
        font-size: 1.5rem;
        margin: 0 0.875rem 1rem;
        transition: opacity 0.2s;
    }

    .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .submit-btn.sell-btn {
        background: #ef4444;
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
