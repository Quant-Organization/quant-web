<script lang="ts">
    import { getValuation, getHistory } from '$lib/api/market';
    import type { Company, Valuation } from '$lib/api/market';

    interface Props {
        companies: Company[];
        selectedCompanyId: string;
        currentPrice: number;
    }

    let { companies, selectedCompanyId = $bindable(), currentPrice }: Props = $props();

    let valuation = $state<Valuation | null>(null);
    let volume = $state(0);
    let lastUpdated = $state('');

    let selectedCompany = $derived(
        companies.find(c => c.company_id === selectedCompanyId) ?? null
    );

    $effect(() => {
        if (!selectedCompanyId) return;
        valuation = null;
        volume = 0;
        getValuation(selectedCompanyId)
            .then(v => { valuation = v; })
            .catch(e => console.error('밸류에이션 로드 실패:', e));
        getHistory(selectedCompanyId, 1)
            .then(candles => { if (candles.length > 0) volume = candles[0].volume; })
            .catch(() => {});
    });

    $effect(() => {
        if (currentPrice > 0) {
            const now = new Date();
            lastUpdated = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        }
    });

    let initialPrice = $derived(selectedCompany?.initial_price ?? 0);
    let changeAmt = $derived(initialPrice > 0 ? currentPrice - initialPrice : 0);
    let changePct = $derived(initialPrice > 0 ? (changeAmt / initialPrice) * 100 : 0);
    let isUp = $derived(changePct >= 0);

    // 시가총액 추정: 게임 내 발행주식수 1,000만 주 가정
    let marketCap = $derived(() => {
        if (currentPrice <= 0) return 0;
        return currentPrice * 10_000_000;
    });

    function formatLargeNumber(n: number): string {
        if (n >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(1) + '조';
        if (n >= 100_000_000) return (n / 100_000_000).toFixed(1) + '억';
        if (n >= 10_000) return (n / 10_000).toFixed(0) + '만';
        return n.toLocaleString();
    }
</script>

<section class="card">
    <div class="left">
        <div class="title-row">
            <span class="pill">NASDAQ</span>
            {#if companies.length > 0}
                <select
                    class="company-select"
                    bind:value={selectedCompanyId}
                >
                    {#each companies as c}
                        <option value={c.company_id}>{c.name}</option>
                    {/each}
                </select>
            {:else}
                <h1>로딩 중...</h1>
            {/if}
        </div>

        <div class="price-row">
            <strong class="price">₩{currentPrice.toLocaleString()}</strong>
            {#if initialPrice > 0}
                <span class={isUp ? 'up' : 'down'}>
                    {isUp ? '+' : ''}{changePct.toFixed(2)}%
                </span>
            {/if}
            {#if lastUpdated}
                <span class="time">마지막 업데이트: {lastUpdated}</span>
            {/if}
        </div>
    </div>

    <div class="stats">
        <div class="stat">
            <span class="stat-label">시가총액</span>
            <strong>{marketCap() > 0 ? formatLargeNumber(marketCap()) : '-'}</strong>
        </div>

        <div class="divider"></div>

        <div class="stat">
            <span class="stat-label">거래량</span>
            <strong>{volume > 0 ? volume.toLocaleString() : '-'}</strong>
        </div>

        <div class="divider"></div>

        <div class="stat">
            <span class="stat-label">PER</span>
            <strong>{valuation ? valuation.current_per.toFixed(1) : '-'}</strong>
        </div>
    </div>
</section>


<style>
    .card {
        background: #fff;
        padding: 1.125rem 1.375rem;
        border-radius: 0.875rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 6px 4px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
    }

    /* --- TITLE ROW (가로 배치) --- */
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

    .company-select {
        font-size: 1.125rem;
        font-weight: 700;
        color: #0f172a;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.25rem 0.5rem;
        background: #f8fafc;
        cursor: pointer;
        outline: none;
        min-width: 12rem;
    }

    .company-select:focus {
        border-color: #3b82f6;
    }

    h1 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        color: #94a3b8;
    }

    /* --- PRICE ROW --- */
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

    .up {
        background: #dcfce7;
        color: #166534;
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        font-size: 0.8125rem;
        font-weight: 700;
    }

    .down {
        background: #fee2e2;
        color: #991b1b;
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        font-size: 0.8125rem;
        font-weight: 700;
    }

    .time {
        margin-left: 0.375rem;
        font-size: 0.8125rem;
        color: #94a3b8;
        white-space: nowrap;
    }

    /* --- STATS WITH DIVIDER --- */
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

    /* 세로 구분선 */
    .divider {
        width: 1px;
        height: 2.125rem;
        background: #e5e7eb;
    }
</style>
