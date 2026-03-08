<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getLuxuryItems, getMyLuxuryItems, purchaseLuxuryItem, sellLuxuryItem, getLuxuryItemDetail, getAssetErrorMessage } from '$lib/api/asset';
    import { getSpringAccount } from '$lib/api/dashboard';
    import { type LuxuryItem } from '$lib/api/asset';
    import type { SpringAccount } from '$lib/api/dashboard';
    import SkeletonTable from '$lib/components/SkeletonTable.svelte';
    import auction_background from '$lib/images/auction_background.png';
    import { toast } from 'svelte-sonner';

    let activeTab: 'owned' | 'market' = $state('owned');

    let marketItems: LuxuryItem[] = $state([]);
    let ownedItems: LuxuryItem[] = $state([]);
    let account: SpringAccount | null = $state(null);

    let loading = $state(true);
    let error = $state('');
    let selectedItem: LuxuryItem | null = $state(null);

    async function selectItem(item: LuxuryItem) {
        selectedItem = item;
        try { selectedItem = await getLuxuryItemDetail(item.id); } catch { /* keep existing */ }
    }
    onMount(async () => {
        await loadAll();
    });

    async function loadAll() {
        try {
            const [mRes, oRes, aRes] = await Promise.all([
                getLuxuryItems(),
                getMyLuxuryItems(),
                getSpringAccount()
            ]);
            marketItems = Array.isArray(mRes) ? mRes : (mRes.content ?? []);
            if (Array.isArray(oRes)) {
                ownedItems = oRes;
            } else if (oRes && Array.isArray(oRes.luxuryItems)) {
                ownedItems = oRes.luxuryItems.map((v: any) => ({ ...v.luxuryItem, purchasedAt: v.purchasedAt, currentValue: v.currentValue, userItemId: v.id }));
            } else {
                ownedItems = [];
            }
            account = aRes;
        } catch (e) {
            error = '데이터를 불러오는 중 오류가 발생했습니다.';
        } finally {
            loading = false;
        }
    }

    function formatCurrency(n: number): string {
        n = n ?? 0;
        if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2) + 'B';
        if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
        if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
        return '$' + n.toLocaleString();
    }

    async function handlePurchase(item: LuxuryItem) {
        try {
            await purchaseLuxuryItem(item.id);
            toast.success(`${item.name} 구매 완료!`);
            await loadAll();
            selectedItem = null;
        } catch (e: unknown) {
            toast.error(getAssetErrorMessage(e));
        }
    }

    async function handleSell(item: LuxuryItem) {
        try {
            await sellLuxuryItem(item.id);
            toast.success(`${item.name} 판매 완료!`);
            await loadAll();
            selectedItem = null;
        } catch (e: unknown) {
            toast.error(getAssetErrorMessage(e));
        }
    }
</script>

<div class="page-container">
    <header class="page-header">
        <div class="header-text">
            <h1>럭셔리 컬렉션</h1>
            <p>최고급 럭셔리 아이템을 관리하고 새로운 아이템을 획득하세요.</p>
        </div>
        {#if account}
            <div class="stats-cards">
                <div class="stat-card">
                    <span class="stat-label">잔고</span>
                    <span class="stat-value">{formatCurrency(account.cashBalance)}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">컬렉션 현황</span>
                    <span class="stat-value">{ownedItems.length}개</span>
                </div>
            </div>
        {/if}
    </header>

    <section
        class="hero-banner"
        style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url({auction_background});"
    >
        <div
            class="hero-content"
            role="button"
            tabindex="0"
            onclick={() => goto('/auction')}
            onkeydown={(e) => e.key === 'Enter' && goto('/auction')}
        >
            <h2>예술품 경매 <span class="arrow">›</span></h2>
            <p>세계에서 가장 희귀한 예술품을 획득할 수 있는 기회입니다.<br/>지금 경매에 참여하여 컬렉션의 가치를 높이세요.</p>
        </div>
    </section>

    <nav class="tab-bar">
        <button class="tab-btn" class:active={activeTab === 'owned'} onclick={() => { activeTab = 'owned'; selectedItem = null; }}>내 컬렉션</button>
        <button class="tab-btn" class:active={activeTab === 'market'} onclick={() => { activeTab = 'market'; selectedItem = null; }}>럭셔리 마켓</button>
    </nav>

    {#if loading}
        <SkeletonTable rows={6} cols={3} showHeader={false} />
    {:else if error}
        <div class="error-state">{error}</div>
    {:else if activeTab === 'owned'}
        {#if ownedItems.length === 0}
            <div class="empty-state">
                <div class="empty-icon"><span class="empty-icon-text">0</span></div>
                <h2 class="empty-title">보유한 아이템이 없습니다</h2>
                <p class="empty-subtitle">마켓에서 럭셔리 아이템을 구매해보세요.</p>
                <button class="btn-primary" onclick={() => (activeTab = 'market')}>마켓으로 이동</button>
            </div>
        {:else if selectedItem}
            <button class="back-btn" onclick={() => (selectedItem = null)}>← 목록으로</button>
            <div class="detail-panel panel">
                {#if selectedItem.imageUrl}
                    <div class="detail-img" style="background-image: url('{selectedItem.imageUrl}')"></div>
                {:else}
                    <div class="detail-img placeholder-img"></div>
                {/if}
                <div class="detail-info">
                    <div class="detail-title-row">
                        <h2>{selectedItem.name}</h2>
                        {#if selectedItem.brand}
                            <span class="brand-badge">{selectedItem.brand}</span>
                        {/if}
                    </div>
                    <div class="spec-grid">
                        <div class="spec-item">
                            <span class="spec-label">구매가</span>
                            <strong>{formatCurrency(selectedItem.price)}</strong>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">유지비/일</span>
                            <strong>{formatCurrency(selectedItem.maintenanceCostPerDay)}</strong>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">명성</span>
                            <strong>+{selectedItem.fameBonus}</strong>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">필요 레벨</span>
                            <strong>Lv.{selectedItem.requiredLevel}</strong>
                        </div>
                    </div>
                    <button class="btn-sell" onclick={() => selectedItem && handleSell(selectedItem)}>판매하기</button>
                </div>
            </div>
        {:else}
            <div class="catalog-grid">
                {#each ownedItems as item}
                    <button class="catalog-card" onclick={() => selectItem(item)}>
                        {#if item.imageUrl}
                            <div class="catalog-img" style="background-image: url('{item.imageUrl}')"></div>
                        {:else}
                            <div class="catalog-img placeholder-img"></div>
                        {/if}
                        <div class="catalog-body">
                            <div class="catalog-header">
                                <h3>{item.name}</h3>
                                {#if item.brand}
                                    <span class="brand-badge">{item.brand}</span>
                                {/if}
                            </div>
                            <span class="catalog-price">{formatCurrency(item.price)}</span>
                            <div class="catalog-meta">
                                <span>명성 +{item.fameBonus}</span>
                                <span>유지비 {formatCurrency(item.maintenanceCostPerDay)}/일</span>
                            </div>
                        </div>
                    </button>
                {/each}
            </div>
        {/if}
    {:else}
        {#if selectedItem}
            <button class="back-btn" onclick={() => (selectedItem = null)}>← 목록으로</button>
            <div class="detail-panel panel">
                {#if selectedItem.imageUrl}
                    <div class="detail-img" style="background-image: url('{selectedItem.imageUrl}')"></div>
                {:else}
                    <div class="detail-img placeholder-img"></div>
                {/if}
                <div class="detail-info">
                    <div class="detail-title-row">
                        <h2>{selectedItem.name}</h2>
                        {#if selectedItem.brand}
                            <span class="brand-badge">{selectedItem.brand}</span>
                        {/if}
                    </div>
                    <div class="spec-grid">
                        <div class="spec-item">
                            <span class="spec-label">가격</span>
                            <strong>{formatCurrency(selectedItem.price)}</strong>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">유지비/일</span>
                            <strong>{formatCurrency(selectedItem.maintenanceCostPerDay)}</strong>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">명성</span>
                            <strong>+{selectedItem.fameBonus}</strong>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">필요 레벨</span>
                            <strong>Lv.{selectedItem.requiredLevel}</strong>
                        </div>
                    </div>
                    <button class="btn-purchase" onclick={() => selectedItem && handlePurchase(selectedItem)}>구매하기</button>
                </div>
            </div>
        {:else}
            <div class="catalog-grid">
                {#each marketItems as item}
                    <button class="catalog-card" onclick={() => selectItem(item)}>
                        {#if item.imageUrl}
                            <div class="catalog-img" style="background-image: url('{item.imageUrl}')"></div>
                        {:else}
                            <div class="catalog-img placeholder-img"></div>
                        {/if}
                        <div class="catalog-body">
                            <div class="catalog-header">
                                <h3>{item.name}</h3>
                                {#if item.brand}
                                    <span class="brand-badge">{item.brand}</span>
                                {/if}
                            </div>
                            <span class="catalog-price">{formatCurrency(item.price)}</span>
                            <div class="catalog-meta">
                                <span>명성 +{item.fameBonus}</span>
                                <span>Lv.{item.requiredLevel}</span>
                                <span>유지비 {formatCurrency(item.maintenanceCostPerDay)}/일</span>
                            </div>
                        </div>
                    </button>
                {/each}
            </div>
        {/if}
    {/if}
</div>

<style>
    .page-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; width: 100%; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .header-text h1 { font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0; }
    .header-text p { font-size: 1rem; color: var(--color-text-gray); margin: 0; }
    .stats-cards { display: flex; gap: 1rem; }
    .stat-card { background: white; padding: 1rem 1.5rem; border-radius: 12px; border: 1px solid #e5e7eb; min-width: 130px; }
    .stat-label { display: block; color: #666; font-size: 0.85rem; margin-bottom: 0.2rem; }
    .stat-value { display: block; font-size: 1.4rem; font-weight: 700; }

    .hero-banner {
        width: 100%; height: 200px; background-size: cover; background-position: center;
        border-radius: 16px; display: flex; align-items: center; padding: 0 4rem;
        margin-bottom: 2rem; color: white; cursor: pointer;
    }
    .hero-content h2 { font-size: 2rem; margin: 0 0 0.75rem 0; cursor: pointer; }
    .hero-content p { font-size: 1rem; line-height: 1.6; opacity: 0.9; margin: 0; }
    .arrow { font-size: 1.5rem; }

    .tab-bar { display: flex; gap: 2rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 2rem; }
    .tab-btn { background: none; border: none; padding: 0.75rem 0; font-size: 1rem; color: #888; cursor: pointer; position: relative; font-weight: 500; }
    .tab-btn.active { color: var(--color-theme-1); font-weight: 700; }
    .tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: var(--color-theme-1); }
    .error-state { display: flex; align-items: center; justify-content: center; min-height: 40vh; font-size: 1rem; color: var(--color-negative); }
    .back-btn { background: none; border: none; color: var(--color-theme-1); font-size: 0.95rem; font-weight: 600; cursor: pointer; margin-bottom: 1.5rem; padding: 0; display: block; }
    .back-btn:hover { text-decoration: underline; }
    .panel { background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 1.5rem; }
    .detail-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .detail-img { width: 100%; aspect-ratio: 4/3; background-size: cover; background-position: center; background-color: #f3f4f6; border-radius: 10px; }
    .placeholder-img { background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%); }
    .detail-info { display: flex; flex-direction: column; gap: 1.25rem; }
    .detail-title-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .detail-title-row h2 { font-size: 1.6rem; font-weight: 800; margin: 0; }
    .brand-badge { background: #ECF2FE; color: var(--color-theme-1); border-radius: 20px; padding: 0.25rem 0.85rem; font-size: 0.8rem; font-weight: 600; }
    .spec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .spec-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.6rem; border-bottom: 1px dotted #d1d5db; }
    .spec-label { font-size: 0.85rem; color: #6b7280; }
    .spec-item strong { font-size: 0.95rem; font-weight: 700; color: #111827; }
    .btn-purchase { background: var(--color-theme-1); color: white; border: none; padding: 0.85rem 1rem; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: background 0.15s; }
    .btn-purchase:hover { background: #0b3d75; }
    .btn-sell { background: var(--color-negative); color: white; border: none; padding: 0.85rem 1rem; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: filter 0.15s; }
    .btn-sell:hover { filter: brightness(0.9); }
    .catalog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .catalog-card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; cursor: pointer; text-align: left; transition: transform 0.2s, box-shadow 0.2s; padding: 0; }
    .catalog-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .catalog-img { width: 100%; aspect-ratio: 16/10; background-size: cover; background-position: center; background-color: #f3f4f6; }
    .catalog-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .catalog-header { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .catalog-header h3 { font-weight: 700; font-size: 1rem; margin: 0; }
    .catalog-price { color: var(--color-theme-1); font-weight: 700; font-size: 1.1rem; }
    .catalog-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .catalog-meta span { font-size: 0.78rem; color: #666; background: #f9fafb; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; text-align: center; }
    .empty-icon { width: 80px; height: 80px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
    .empty-icon-text { font-size: 2rem; font-weight: 800; color: #9ca3af; }
    .empty-title { font-size: 1.3rem; font-weight: 700; margin: 0 0 0.5rem 0; }
    .empty-subtitle { color: #666; margin-bottom: 1.5rem; }
    .btn-primary { background: var(--color-theme-1); color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { background: #0b3d75; }
    @media (max-width: 900px) { .catalog-grid { grid-template-columns: repeat(2, 1fr); } .detail-panel { grid-template-columns: 1fr; } }
    @media (max-width: 600px) { .catalog-grid { grid-template-columns: 1fr; } }
</style>
