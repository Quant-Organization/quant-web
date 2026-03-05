<script lang="ts">
    import { getValuation } from '$lib/api/market';
    import type { Company, PriceMap, Valuation } from '$lib/api/market';

    interface Props {
        companies: Company[];
        selectedCompanyId: string;
        priceMap: PriceMap;
    }

    let { companies, selectedCompanyId = $bindable(), priceMap }: Props = $props();

    let valuation = $state<Valuation | null>(null);
    let lastUpdated = $state('');

    let currentPrice = $derived(
        selectedCompanyId && priceMap.prices[selectedCompanyId]
            ? priceMap.prices[selectedCompanyId]
            : 0
    );

    let selectedCompany = $derived(
        companies.find(c => c.company_id === selectedCompanyId) ?? null
    );

    $effect(() => {
        if (!selectedCompanyId) return;
        valuation = null;
        getValuation(selectedCompanyId)
            .then(v => { valuation = v; })
            .catch(e => console.error('밸류에이션 로드 실패:', e));
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
                        <option value={c.company_id}>{c.name} ({c.company_id})</option>
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
            <span class="stat-label">현재가</span>
            <strong>₩{currentPrice.toLocaleString()}</strong>
        </div>

        <div class="divider"></div>

        <div class="stat">
            <span class="stat-label">PER</span>
            <strong>{valuation ? valuation.current_per.toFixed(1) : '-'}</strong>
        </div>

        <div class="divider"></div>

        <div class="stat">
            <span class="stat-label">PBR</span>
            <strong>{valuation ? valuation.current_pbr.toFixed(2) : '-'}</strong>
        </div>

        <div class="divider"></div>

        <div class="stat">
            <span class="stat-label">ROE</span>
            <strong>{valuation ? valuation.roe.toFixed(1) + '%' : '-'}</strong>
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
        text-align: center;
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
