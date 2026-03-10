<script lang="ts">
    import { onMount } from 'svelte';
    import { toast } from 'svelte-sonner';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
    import { getCryptoList, getCryptoHoldings, getCryptoDetail, getCryptoEvents, buyCrypto, sellCrypto } from '$lib/api/crypto';
    import type { CryptoInfo, CryptoHolding, CryptoDetail, CryptoEvent } from '$lib/api/crypto';
    import CryptoChart from '$lib/components/CryptoChart.svelte';
    import OrderPanel from '$lib/components/OrderPanel.svelte';
    import SkeletonDashboard from '$lib/components/SkeletonDashboard.svelte';

    let cryptos: CryptoInfo[] = $state([]);
    let holdings: CryptoHolding[] = $state([]);
    let selectedCryptoId = $state('');
    let loading = $state(true);
    let error = $state('');

    let cryptoDetail: CryptoDetail | null = $state(null);
    let cryptoEvents: CryptoEvent[] = $state([]);
    let currentPrice = $state(0);

    onMount(async () => {
        try {
            const [listRes, holdRes, eventsRes] = await Promise.all([
                getCryptoList(),
                getCryptoHoldings({ suppressAuth: true }).catch(() => [] as CryptoHolding[]),
                getCryptoEvents().catch(() => ({ delisting_events: [] as CryptoEvent[], listing_events: [] as CryptoEvent[] }))
            ]);
            cryptos = listRes.crypto;
            holdings = holdRes;
            cryptoEvents = [...(eventsRes.delisting_events ?? []), ...(eventsRes.listing_events ?? [])];
            const queryCoin = get(page).url.searchParams.get('coin');
            if (queryCoin && cryptos.some(c => c.crypto_id === queryCoin)) {
                selectedCryptoId = queryCoin;
            } else if (cryptos.length > 0) {
                selectedCryptoId = cryptos[0].crypto_id;
            }
        } catch {
            error = '데이터를 불러오는 중 오류가 발생했습니다.';
            toast.error('코인 데이터를 불러오지 못했습니다.');
        } finally {
            loading = false;
        }
    });

    $effect(() => {
        if (!selectedCryptoId) { cryptoDetail = null; return; }
        getCryptoDetail(selectedCryptoId)
            .then(d => { cryptoDetail = d; currentPrice = d.current_price; })
            .catch(() => { cryptoDetail = null; });
    });

    function handlePriceUpdate(price: number) {
        currentPrice = price;
    }

    function formatPrice(n: number): string {
        if (n == null) return '$0';
        if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
        if (n >= 1_000) return '$' + (n / 1_000).toFixed(2) + 'K';
        return '$' + n.toFixed(4);
    }

    function formatMarketCap(n: number): string {
        if (n == null) return '$0';
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

    async function refreshHoldings() {
        try { holdings = await getCryptoHoldings(); } catch {}
    }

    async function handleCryptoBuy(qty: number) {
        if (!selectedCryptoId) return;
        try {
            await buyCrypto(selectedCryptoId, qty);
            await refreshHoldings();
            toast.success('매수가 완료되었습니다.');
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : '매수 실패');
            throw e;
        }
    }

    async function handleCryptoSell(qty: number) {
        if (!selectedCryptoId) return;
        try {
            await sellCrypto(selectedCryptoId, qty);
            await refreshHoldings();
            toast.success('매도가 완료되었습니다.');
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : '매도 실패');
            throw e;
        }
    }

    let selectedCrypto = $derived(cryptos.find(c => c.crypto_id === selectedCryptoId) ?? null);
    let cryptoMaxSellQty = $derived(
        holdings.find(h => h.crypto_id === selectedCryptoId)?.quantity ?? 0
    );
    let changePct = $derived(selectedCrypto?.price_change_pct ?? 0);
    let isUp = $derived(changePct >= 0);
</script>

<div class="coin-page">
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
                            <span class="pill">CRYPTO</span>
                            <select class="crypto-select" bind:value={selectedCryptoId}>
                                {#each cryptos as c}
                                    <option value={c.crypto_id}>{c.name} ({c.symbol})</option>
                                {/each}
                            </select>
                            {#if selectedCrypto?.is_meme}
                                <span class="meme-badge">MEME</span>
                            {/if}
                        </div>
                        <div class="price-row">
                            <strong class="price">{formatPrice(currentPrice)}</strong>
                            <span class={isUp ? 'badge-up' : 'badge-down'}>
                                {isUp ? '+' : ''}{(changePct ?? 0).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    <div class="stats">
                        <div class="stat">
                            <span class="stat-label">시가총액</span>
                            <strong>{selectedCrypto ? formatMarketCap(selectedCrypto.market_cap) : '-'}</strong>
                        </div>
                        <div class="divider"></div>
                        <div class="stat">
                            <span class="stat-label">24h 거래량</span>
                            <strong>{cryptoDetail?.volume_24h ? formatMarketCap(cryptoDetail.volume_24h) : '-'}</strong>
                        </div>
                        <div class="divider"></div>
                        <div class="stat">
                            <span class="stat-label">24h 고가</span>
                            <strong>{cryptoDetail?.high_24h ? formatPrice(cryptoDetail.high_24h) : '-'}</strong>
                        </div>
                    </div>
                </section>

                <!-- Chart -->
                <CryptoChart {selectedCryptoId} onPriceUpdate={handlePriceUpdate} />

                <!-- Crypto Table -->
                <section class="panel table-panel">
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
                                    class:active={selectedCryptoId === crypto.crypto_id}
                                    onclick={() => { selectedCryptoId = crypto.crypto_id; }}
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
                                    <td class:pos={(crypto.price_change_pct ?? 0) >= 0} class:neg={crypto.price_change_pct < 0}>
                                        {(crypto.price_change_pct ?? 0) >= 0 ? '+' : ''}{(crypto.price_change_pct ?? 0).toFixed(2)}%
                                    </td>
                                    <td>{formatMarketCap(crypto.market_cap)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </section>
            </div>

            <div class="right">
                <OrderPanel
                    {currentPrice}
                    balance={0}
                    maxSellQty={cryptoMaxSellQty}
                    onBuy={handleCryptoBuy}
                    onSell={handleCryptoSell}
                    currency="$"
                    unit=""
                    allowDecimal={true}
                    showReserve={false}
                />

                <!-- Holdings -->
                <div class="panel">
                    <h3 class="section-title">보유현황</h3>
                    {#if holdings.length === 0}
                        <div class="empty-state">보유한 암호화폐가 없습니다.</div>
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
                                        <td class="h-id">{h.crypto_id}</td>
                                        <td>{(h.quantity ?? 0).toFixed(4)}</td>
                                        <td>{formatPrice(h.avg_price)}</td>
                                        <td class:pos={h.profit_loss >= 0} class:neg={h.profit_loss < 0}>
                                            {h.profit_loss >= 0 ? '+' : ''}{formatPrice(h.profit_loss)}
                                            ({(h.profit_loss_pct ?? 0) >= 0 ? '+' : ''}{(h.profit_loss_pct ?? 0).toFixed(2)}%)
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>

                <!-- Events -->
                {#if cryptoEvents.length > 0}
                    <div class="panel">
                        <h3 class="section-title">이벤트</h3>
                        <div class="events-list">
                            {#each cryptoEvents.slice(0, 5) as ev}
                                <div class="event-item">
                                    <div class="event-top">
                                        <span class="event-badge">{ev.event_type}</span>
                                        <span class="event-crypto">{ev.name}</span>
                                    </div>
                                    <p class="event-desc">{ev.description}</p>
                                    <span class="event-time">{formatEventTime(ev.timestamp)}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .coin-page { width: 100%; }

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
        width: 20rem;
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
        background: #f8fafc;
        color: #475569;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        font-weight: 700;
        font-size: 0.75rem;
        border: 1px solid #e5e7eb;
    }

    .crypto-select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        font-size: 1.125rem;
        font-weight: 700;
        color: #0f172a;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.25rem 1.75rem 0.25rem 0.5rem;
        background: #f8fafc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 0.5rem center;
        cursor: pointer;
        outline: none;
        min-width: 12rem;
    }

    .crypto-select:focus { border-color: #3b82f6; }

    .price-row {
        margin-top: 0.625rem;
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
    }

    .price {
        font-size: 1.875rem;
        font-weight: 800;
        letter-spacing: -0.3px;
    }

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

    .stats {
        display: flex;
        align-items: center;
    }

    .stat {
        padding: 0 1.125rem;
        text-align: right;
    }

    .stat-label {
        font-size: 0.75rem;
        color: #94a3b8;
    }

    .stat strong {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.9375rem;
        font-weight: 700;
        color: #0f172a;
    }

    .divider {
        width: 1px;
        height: 2.125rem;
        background: #e5e7eb;
    }

    /* Table */
    .panel {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        padding: 1.25rem;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
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
        background: #fef3c7; color: #b45309;
        border-radius: 4px; padding: 0.1rem 0.4rem;
        font-size: 0.7rem; font-weight: 700;
    }

    .price-cell { font-family: 'Fira Mono', monospace; font-weight: 600; }

    .pos { color: var(--color-positive); font-weight: 700; }
    .neg { color: var(--color-negative); font-weight: 700; }

    /* Holdings */
    .section-title { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.75rem; }

    .empty-state { color: var(--color-text-gray); font-size: 0.9rem; text-align: center; padding: 1.5rem 0; }

    .holdings-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .holdings-table th {
        text-align: left; padding: 0.5rem;
        border-bottom: 2px solid #e5e7eb;
        color: var(--color-text-gray); font-weight: 600;
    }
    .holdings-table td { padding: 0.5rem; border-bottom: 1px solid #f0f0f0; }
    .h-id { font-family: 'Fira Mono', monospace; font-weight: 600; color: var(--color-theme-1); }

    /* Events */
    .events-list { display: flex; flex-direction: column; }
    .event-item { padding: 0.6rem 0; border-bottom: 1px solid #f0f0f0; }
    .event-item:last-child { border-bottom: none; }
    .event-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
    .event-badge {
        background: #ECF2FE; color: var(--color-theme-1);
        border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.7rem; font-weight: 700;
    }
    .event-crypto { font-size: 0.82rem; font-weight: 600; }
    .event-desc { font-size: 0.78rem; color: var(--color-text-gray); margin: 0 0 0.2rem 0; line-height: 1.4; }
    .event-time { font-size: 0.7rem; color: #999; }

    @media (max-width: 1100px) {
        .main-layout { flex-direction: column; }
        .right { width: 100%; }
    }
</style>
