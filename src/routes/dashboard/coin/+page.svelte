<script lang="ts">
    import { onMount } from 'svelte';
    import { getCryptoList, getCryptoHoldings, getCryptoDetail, getCryptoHistory, getCryptoEvents, buyCrypto, sellCrypto } from '$lib/api/crypto';
    import type { CryptoInfo, CryptoHolding, CryptoDetail, CryptoCandle, CryptoEvent } from '$lib/api/crypto';

    let cryptos: CryptoInfo[] = $state([]);
    let holdings: CryptoHolding[] = $state([]);
    let selected: CryptoInfo | null = $state(null);
    let loading = $state(true);
    let holdingsLoading = $state(true);
    let error = $state('');
    let quantity = $state('1');
    let actionMsg = $state('');
    let actionError = $state(false);

    // New state for detail, history, events
    let cryptoDetail: CryptoDetail | null = $state(null);
    let cryptoHistory: CryptoCandle[] = $state([]);
    let cryptoEvents: CryptoEvent[] = $state([]);
    let eventsLoading = $state(false);

    onMount(async () => {
        try {
            const [listRes, holdRes, eventsRes] = await Promise.all([
                getCryptoList(),
                getCryptoHoldings().catch(() => [] as CryptoHolding[]),
                getCryptoEvents().catch(() => ({ delisting_events: [] as CryptoEvent[], listing_events: [] as CryptoEvent[] }))
            ]);
            cryptos = listRes.crypto;
            holdings = holdRes;
            cryptoEvents = [...(eventsRes.delisting_events ?? []), ...(eventsRes.listing_events ?? [])];
        } catch (e) {
            error = '데이터를 불러오는 중 오류가 발생했습니다.';
        } finally {
            loading = false;
            holdingsLoading = false;
        }
    });

    // When a crypto is selected, load its detail and history
    $effect(() => {
        if (!selected) {
            cryptoDetail = null;
            cryptoHistory = [];
            return;
        }
        const id = selected.crypto_id;
        Promise.all([
            getCryptoDetail(id),
            getCryptoHistory(id, 100)
        ]).then(([detail, history]) => {
            cryptoDetail = detail;
            cryptoHistory = history;
        }).catch(() => {
            cryptoDetail = null;
            cryptoHistory = [];
        });
    });

    function formatPrice(n: number): string {
        if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2) + 'B';
        if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
        if (n >= 1_000) return '$' + (n / 1_000).toFixed(2) + 'K';
        return '$' + n.toFixed(4);
    }

    function formatMarketCap(n: number): string {
        if (n >= 1_000_000_000_000) return '$' + (n / 1_000_000_000_000).toFixed(2) + 'T';
        if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2) + 'B';
        if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
        return '$' + n.toFixed(0);
    }

    function formatEventTime(s: string): string {
        try {
            return new Date(s).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch { return s; }
    }

    // Build SVG sparkline path from history
    let sparklinePath = $derived(() => {
        if (cryptoHistory.length < 2) return '';
        const prices = cryptoHistory.map(c => c.close);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;
        const w = 300;
        const h = 60;
        return prices.map((p, i) => {
            const x = (i / (prices.length - 1)) * w;
            const y = h - ((p - min) / range) * h;
            return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
        }).join(' ');
    });

    async function refreshHoldings() {
        try {
            holdings = await getCryptoHoldings();
        } catch {}
    }

    async function handleBuy() {
        if (!selected) return;
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) { actionMsg = '수량을 올바르게 입력하세요.'; actionError = true; return; }
        try {
            await buyCrypto(selected.crypto_id, qty);
            actionMsg = `${selected.name} ${qty}개 매수 완료`;
            actionError = false;
            await refreshHoldings();
        } catch (e: unknown) {
            actionMsg = e instanceof Error ? e.message : '매수 실패';
            actionError = true;
        }
        setTimeout(() => { actionMsg = ''; }, 3000);
    }

    async function handleSell() {
        if (!selected) return;
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) { actionMsg = '수량을 올바르게 입력하세요.'; actionError = true; return; }
        try {
            await sellCrypto(selected.crypto_id, qty);
            actionMsg = `${selected.name} ${qty}개 매도 완료`;
            actionError = false;
            await refreshHoldings();
        } catch (e: unknown) {
            actionMsg = e instanceof Error ? e.message : '매도 실패';
            actionError = true;
        }
        setTimeout(() => { actionMsg = ''; }, 3000);
    }

    let holdingMap = $derived(
        Object.fromEntries(holdings.map(h => [h.crypto_id, h]))
    );
</script>

<div class="page-container">
    <header class="page-header">
        <div class="header-text">
            <h1>암호화폐</h1>
            <p>실시간 암호화폐 시세를 확인하고 매수·매도하세요.</p>
        </div>
    </header>

    {#if loading}
        <div class="loading-state">데이터를 불러오는 중...</div>
    {:else if error}
        <div class="error-state">{error}</div>
    {:else}
        <div class="main-grid">
            <section class="left-section">
                <div class="panel table-panel">
                    <table class="crypto-table">
                        <thead>
                            <tr>
                                <th>암호화폐</th>
                                <th>시세</th>
                                <th>변동률(24h)</th>
                                <th>시가총액</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each cryptos as crypto}
                                <tr
                                    class="crypto-row"
                                    class:active={selected?.crypto_id === crypto.crypto_id}
                                    onclick={() => { selected = crypto; quantity = '1'; actionMsg = ''; }}
                                >
                                    <td>
                                        <div class="crypto-name-cell">
                                            <span class="crypto-name">{crypto.name}</span>
                                            <span class="crypto-symbol">{crypto.symbol}</span>
                                            {#if crypto.is_meme}
                                                <span class="meme-badge">MEME</span>
                                            {/if}
                                        </div>
                                    </td>
                                    <td class="price-cell">{formatPrice(crypto.current_price)}</td>
                                    <td class:pos={crypto.price_change_pct >= 0} class:neg={crypto.price_change_pct < 0}>
                                        {crypto.price_change_pct >= 0 ? '+' : ''}{crypto.price_change_pct.toFixed(2)}%
                                    </td>
                                    <td>{formatMarketCap(crypto.market_cap)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="right-section">
                {#if selected}
                    <div class="panel trade-panel">
                        <div class="trade-header">
                            <div class="trade-title-row">
                                <h3>{selected.name}</h3>
                                <span class="trade-symbol">{selected.symbol}</span>
                                {#if selected.is_meme}
                                    <span class="meme-badge">MEME</span>
                                {/if}
                            </div>
                            <div class="trade-price-row">
                                <span class="trade-price">{formatPrice(selected.current_price)}</span>
                                <span class="trade-change" class:pos={selected.price_change_pct >= 0} class:neg={selected.price_change_pct < 0}>
                                    {selected.price_change_pct >= 0 ? '+' : ''}{selected.price_change_pct.toFixed(2)}%
                                </span>
                            </div>
                        </div>

                        <div class="trade-meta">
                            <div class="meta-item">
                                <span class="meta-label">시가총액</span>
                                <span class="meta-val">{formatMarketCap(selected.market_cap)}</span>
                            </div>
                            {#if cryptoDetail?.volume_24h}
                                <div class="meta-item">
                                    <span class="meta-label">24h 거래량</span>
                                    <span class="meta-val">{formatMarketCap(cryptoDetail.volume_24h)}</span>
                                </div>
                            {/if}
                            {#if cryptoDetail?.high_24h}
                                <div class="meta-item">
                                    <span class="meta-label">24h 고가</span>
                                    <span class="meta-val">{formatPrice(cryptoDetail.high_24h)}</span>
                                </div>
                            {/if}
                            {#if cryptoDetail?.low_24h}
                                <div class="meta-item">
                                    <span class="meta-label">24h 저가</span>
                                    <span class="meta-val">{formatPrice(cryptoDetail.low_24h)}</span>
                                </div>
                            {/if}
                        </div>

                        {#if sparklinePath()}
                            <div class="sparkline-wrap">
                                <svg viewBox="0 0 300 60" class="sparkline-svg">
                                    <path d={sparklinePath()} fill="none" stroke={selected.price_change_pct >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'} stroke-width="1.5" />
                                </svg>
                            </div>
                        {/if}

                        <div class="trade-form">
                            <label class="form-label" for="qty-input">수량</label>
                            <input
                                id="qty-input"
                                class="form-input"
                                type="number"
                                min="0"
                                step="0.0001"
                                bind:value={quantity}
                                placeholder="수량 입력"
                            />
                            <div class="form-btns">
                                <button class="btn-buy" onclick={handleBuy}>매수</button>
                                <button class="btn-sell" onclick={handleSell}>매도</button>
                            </div>
                            {#if actionMsg}
                                <div class="action-msg" class:msg-error={actionError}>{actionMsg}</div>
                            {/if}
                        </div>
                    </div>
                {:else}
                    <div class="panel empty-panel">
                        <span>암호화폐를 선택하면 매수·매도할 수 있습니다.</span>
                    </div>
                {/if}

                {#if cryptoEvents.length > 0}
                    <div class="panel events-panel">
                        <h3 class="events-title">암호화폐 이벤트</h3>
                        <div class="events-list">
                            {#each cryptoEvents.slice(0, 5) as ev}
                                <div class="event-item">
                                    <div class="event-top">
                                        <span class="event-type-badge">{ev.event_type}</span>
                                        <span class="event-crypto">{ev.name}</span>
                                    </div>
                                    <p class="event-desc">{ev.description}</p>
                                    <span class="event-time">{formatEventTime(ev.timestamp)}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                <div class="panel holdings-panel">
                    <h3 class="holdings-title">보유현황</h3>
                    {#if holdingsLoading}
                        <div class="empty-holdings">불러오는 중...</div>
                    {:else if holdings.length === 0}
                        <div class="empty-holdings">보유한 암호화폐가 없습니다.</div>
                    {:else}
                        <table class="holdings-table">
                            <thead>
                                <tr>
                                    <th>종목</th>
                                    <th>수량</th>
                                    <th>평균단가</th>
                                    <th>현재가</th>
                                    <th>손익</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each holdings as h}
                                    <tr>
                                        <td class="h-id">{h.crypto_id}</td>
                                        <td>{h.quantity}</td>
                                        <td>{formatPrice(h.avg_price)}</td>
                                        <td>{formatPrice(h.current_price)}</td>
                                        <td class:pos={h.profit_loss >= 0} class:neg={h.profit_loss < 0}>
                                            {h.profit_loss >= 0 ? '+' : ''}{formatPrice(h.profit_loss)}
                                            ({h.profit_loss_pct >= 0 ? '+' : ''}{h.profit_loss_pct.toFixed(2)}%)
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
            </section>
        </div>
    {/if}
</div>

<style>
    .page-container {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #333;
        width: 100%;
    }

    .page-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
    .header-text h1 { font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0; }
    .header-text p { font-size: 1rem; color: var(--color-text-gray); margin: 0; }

    .loading-state, .error-state {
        display: flex; align-items: center; justify-content: center;
        min-height: 40vh; font-size: 1rem; color: var(--color-text-gray);
    }
    .error-state { color: var(--color-negative); }

    .main-grid {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: 1.5rem;
        align-items: start;
    }

    .panel {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        padding: 1.25rem;
    }

    .table-panel { padding: 0; overflow: hidden; }

    .crypto-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
    }

    .crypto-table th {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 2px solid #e5e7eb;
        color: var(--color-text-gray);
        font-weight: 600;
        background: #f9fafb;
    }

    .crypto-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f0f0f0; }

    .crypto-row { cursor: pointer; transition: background 0.15s; }
    .crypto-row:hover { background: #f9fafb; }
    .crypto-row.active { background: #ECF2FE; }

    .crypto-name-cell { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .crypto-name { font-weight: 700; }
    .crypto-symbol { font-family: 'Fira Mono', monospace; font-size: 0.8rem; color: var(--color-text-gray); }

    .meme-badge {
        background: #fef3c7;
        color: #b45309;
        border-radius: 4px;
        padding: 0.1rem 0.4rem;
        font-size: 0.7rem;
        font-weight: 700;
    }

    .price-cell { font-family: 'Fira Mono', monospace; font-weight: 600; }

    .pos { color: var(--color-positive); font-weight: 700; }
    .neg { color: var(--color-negative); font-weight: 700; }

    .right-section { display: flex; flex-direction: column; gap: 1.25rem; }

    .trade-header { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; }

    .trade-title-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .trade-title-row h3 { margin: 0; font-size: 1.2rem; font-weight: 800; }
    .trade-symbol { font-family: 'Fira Mono', monospace; font-size: 0.85rem; color: var(--color-text-gray); }

    .trade-price-row { display: flex; align-items: baseline; gap: 0.75rem; }
    .trade-price { font-size: 1.5rem; font-weight: 800; color: #111; font-family: 'Fira Mono', monospace; }
    .trade-change { font-size: 0.95rem; font-weight: 700; }

    .trade-meta { display: flex; gap: 1.5rem; margin-bottom: 1.25rem; }
    .meta-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .meta-label { font-size: 0.78rem; color: var(--color-text-gray); }
    .meta-val { font-size: 0.9rem; font-weight: 700; }

    .trade-form { display: flex; flex-direction: column; gap: 0.75rem; }

    .form-label { font-size: 0.85rem; font-weight: 600; color: #555; }

    .form-input {
        padding: 0.6rem 0.85rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 1rem;
        outline: none;
        transition: border-color 0.15s;
    }
    .form-input:focus { border-color: var(--color-theme-1); }

    .form-btns { display: flex; gap: 0.75rem; }

    .btn-buy, .btn-sell {
        flex: 1;
        padding: 0.75rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: filter 0.15s;
    }
    .btn-buy { background: var(--color-positive); color: white; }
    .btn-sell { background: var(--color-negative); color: white; }
    .btn-buy:hover, .btn-sell:hover { filter: brightness(0.9); }

    .action-msg {
        font-size: 0.88rem;
        color: var(--color-positive);
        font-weight: 600;
        padding: 0.5rem;
        background: #ecfdf5;
        border-radius: 6px;
        text-align: center;
    }
    .action-msg.msg-error { color: var(--color-negative); background: #fef2f2; }

    .empty-panel {
        display: flex; align-items: center; justify-content: center;
        min-height: 120px; color: var(--color-text-gray); font-size: 0.9rem;
        text-align: center;
    }

    .holdings-title { font-size: 1rem; font-weight: 700; margin: 0 0 0.75rem 0; }

    .empty-holdings { color: var(--color-text-gray); font-size: 0.9rem; text-align: center; padding: 1.5rem 0; }

    .holdings-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .holdings-table th {
        text-align: left; padding: 0.5rem 0.5rem;
        border-bottom: 2px solid #e5e7eb;
        color: var(--color-text-gray); font-weight: 600;
    }
    .holdings-table td { padding: 0.5rem; border-bottom: 1px solid #f0f0f0; }
    .h-id { font-family: 'Fira Mono', monospace; font-weight: 600; color: var(--color-theme-1); }

    .sparkline-wrap {
        margin-bottom: 1rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .sparkline-svg {
        width: 100%;
        height: 60px;
    }

    .events-panel { }
    .events-title { font-size: 1rem; font-weight: 700; margin: 0 0 0.75rem 0; }
    .events-list { display: flex; flex-direction: column; gap: 0; }
    .event-item { padding: 0.6rem 0; border-bottom: 1px solid #f0f0f0; }
    .event-item:last-child { border-bottom: none; }
    .event-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
    .event-type-badge {
        background: #ECF2FE; color: var(--color-theme-1, #00529B);
        border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.7rem; font-weight: 700;
    }
    .event-crypto { font-size: 0.82rem; font-weight: 600; }
    .event-desc { font-size: 0.78rem; color: var(--color-text-gray); margin: 0 0 0.2rem 0; line-height: 1.4; }
    .event-time { font-size: 0.7rem; color: #999; }

    @media (max-width: 1100px) {
        .main-grid { grid-template-columns: 1fr; }
    }
</style>
