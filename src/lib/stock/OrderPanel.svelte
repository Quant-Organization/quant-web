<script>
    let tab = 'buy';
    let price = 100300;
    let qty = 0;
    const balance = 1400000000;

    function adjustPrice(delta) {
        price = Math.max(0, Math.floor(Number(price || 0) + delta));
    }

    function setPercent(percent) {
        const p = Math.max(0, percent);
        const pQty = Math.floor((balance * p) / 100 / Math.max(1, Number(price || 1)));
        qty = Math.max(0, pQty);
    }

    function onQtyInput(e) {
        const v = Number(e.target.value || 0);
        qty = Math.max(0, Math.floor(v));
    }

    $: numericPrice = Math.max(0, Number(price || 0));
    $: numericQty = Math.max(0, Number(qty || 0));
    $: total = numericPrice * numericQty;

    function money(n) {
        return n.toLocaleString();
    }
</script>

<aside class="panel" style="height: fit-content;">
    <div class="tabs">
        <button
                class="tab-btn"
                class:active={tab === 'buy'}
                on:click={() => (tab = 'buy')}
        >
            매수
        </button>
        <button
                class="tab-btn"
                class:active={tab === 'sell'}
                on:click={() => (tab = 'sell')}
        >
            매도
        </button>
        <button
                class="tab-btn"
                class:active={tab === 'reserve'}
                on:click={() => (tab = 'reserve')}
        >
            예약
        </button>
    </div>

    <label class="label">주문 가격 (USD)</label>
    <div class="price-box">
        <button class="step" on:click={() => adjustPrice(-100)}>−</button>
        <input
                class="price-input"
                type="number"
                bind:value={price}
        />
        <button class="step" on:click={() => adjustPrice(100)}>+</button>
    </div>

    <label class="label">수량 (주)</label>
    <div class="qty-box">
        <input
                class="qty-input"
                type="number"
                min="0"
                on:input={onQtyInput}
                value={qty}
        />
        <span class="unit">주</span>
    </div>

    <div class="percent">
        <button on:click={() => setPercent(10)}>10%</button>
        <button on:click={() => setPercent(25)}>25%</button>
        <button on:click={() => setPercent(50)}>50%</button>
        <button on:click={() => setPercent(100)}>최대</button>
    </div>

    <div class="summary">
        <div class="summary-row">
            <span class="label-small">주문 총액</span>
            <strong class="value">${money(total)}</strong>
        </div>
        <div class="summary-row dimmed">
            <span class="label-small">가능 금액</span>
            <strong class="value">${money(balance)}</strong>
        </div>
    </div>

    <button class="buy">매수</button>
</aside>

<style>
    .panel {
        width: 100%;
        max-width: 20rem;
        background: #ffffff;
        padding: 0.875rem;
        border-radius: 0.75rem;
        box-shadow: 0 0.375rem 1.125rem rgba(18,43,77,.04);
        border: 1px solid #e5e7eb;
        font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        color: #102a43;
        box-sizing: border-box;
    }

    .tabs {
        display: flex;
        gap: 0.375rem;
        margin-bottom: 0.75rem;
    }

    .tab-btn {
        flex: 1;
        background: transparent;
        border: none;
        padding: 0.625rem 0.375rem;
        border-radius: 0.5rem;
        font-weight: 700;
        color: #64748b;
        cursor: pointer;
        position: relative;
    }

    .tab-btn.active {
        color: #0b61b0;
    }

    .tab-btn.active::after {
        content: '';
        position: absolute;
        left: 0.75rem;
        right: 0.75rem;
        bottom: 0.375rem;
        height: 3px;
        background: #2563eb;
        border-radius: 3px;
    }

    .label {
        display: block;
        font-size: 1rem;
        color: #64748b;
        margin-bottom: 0.5rem;
    }

    .price-box {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        background: rgba(236, 236, 236, 0.2);
        padding: 0.625rem 0.75rem;
        border-radius: 0.75rem;
        margin-bottom: 2rem;
        border: 0.5px solid rgba(157, 157, 157, 0.5);
        box-sizing: border-box;
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
    }

    .price-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 1.25rem;
        font-weight: 800;
        text-align: center;
        min-width: 0;
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
        margin-bottom: 0.75rem;
        box-sizing: border-box;
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
    }

    .unit {
        color: #64748b;
        font-weight: 700;
    }

    .percent {
        display: flex;
        gap: 0.5rem;
        margin: 0 0 2rem;
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
        margin-bottom: 0.875rem;
        box-sizing: border-box;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.375rem;
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

    .buy {
        width: 100%;
        padding: 1rem;
        background: var(--color-theme-1);
        color: white;
        font-weight: 800;
        border-radius: 0.75rem;
        border: none;
        cursor: pointer;
        font-size: 1.5rem;
    }



    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type="number"] {
        -moz-appearance: textfield;
    }
</style>