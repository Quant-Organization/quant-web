<script lang="ts">
    import { onMount } from 'svelte';
    import { crossfade, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { selectedIndex } from '$lib/stores/sidebar';
    import {
        ownedCars,
        hasGarage,
        storageFacilities,
        storageTierConfigs,
        tierOrder,
        purchaseStorage,
        purchaseVehicle,
        hasStorageFor,
        getRemainingCapacity,
        balance,
        formatCurrency,
    } from '$lib/stores/asset';
    import type { Vehicle, StorageTier, VehicleType } from '$lib/stores/asset';

    onMount(() => {
        selectedIndex.set(1);
    });

    const [send, receive] = crossfade({
        duration: 500,
        easing: quintOut,
        fallback(node) {
            const style = getComputedStyle(node);
            const opacity = +style.opacity;
            return {
                duration: 300,
                easing: quintOut,
                css: (t: number) => `opacity: ${t * opacity}`
            };
        }
    });

    let activeTab: 'collection' | 'storage' | 'market' = $state('collection');
    let toastMsg = $state('');

    let garage = $derived($storageFacilities.find(f => f.type === 'garage'));
    let garageCapacity = $derived(garage?.capacity ?? 0);
    let totalCarValue = $derived($ownedCars.reduce((sum, v) => sum + v.price, 0));
    let tiers = storageTierConfigs.garage;

    const vehicleType: VehicleType = 'car';
    let hasStorage = $derived(hasStorageFor(vehicleType));
    let remaining = $derived(getRemainingCapacity(vehicleType));

    const marketItems = [
        {
            name: '람보르기니 아벤타도르',
            price: 135_000_000,
            fame: 850,
            maintenanceCost: 500_000,
            img: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=600&q=80',
            specs: { '최고 속도': '350km/h', '마력': '770HP', '엔진': 'V12' } as Record<string, string>
        },
        {
            name: '페라리 SF90',
            price: 250_000_000,
            fame: 920,
            maintenanceCost: 800_000,
            img: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=600&q=80',
            specs: { '최고 속도': '340km/h', '마력': '986HP', '엔진': 'V8 하이브리드' } as Record<string, string>
        },
        {
            name: '롤스로이스 팬텀',
            price: 180_000_000,
            fame: 780,
            maintenanceCost: 600_000,
            img: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
            specs: { '최고 속도': '250km/h', '마력': '563HP', '엔진': 'V12' } as Record<string, string>
        },
        {
            name: '부가티 시론',
            price: 450_000_000,
            fame: 990,
            maintenanceCost: 1_200_000,
            img: 'https://images.unsplash.com/photo-1600712242805-5f78671b24da?auto=format&fit=crop&w=600&q=80',
            specs: { '최고 속도': '420km/h', '마력': '1500HP', '엔진': 'W16' } as Record<string, string>
        },
        {
            name: '맥라렌 720S',
            price: 120_000_000,
            fame: 750,
            maintenanceCost: 450_000,
            img: 'https://images.unsplash.com/photo-1621993202323-eb4b4cbdf1dd?auto=format&fit=crop&w=600&q=80',
            specs: { '최고 속도': '341km/h', '마력': '710HP', '엔진': 'V8 트윈터보' } as Record<string, string>
        },
        {
            name: '포르쉐 918 스파이더',
            price: 320_000_000,
            fame: 880,
            maintenanceCost: 900_000,
            img: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=600&q=80',
            specs: { '최고 속도': '345km/h', '마력': '887HP', '엔진': 'V8 하이브리드' } as Record<string, string>
        }
    ];

    function formatDate(iso: string): string {
        return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function getTierState(tierIdx: number): 'owned' | 'upgrade' | 'purchase' {
        if (!garage) return 'purchase';
        const currentIdx = tierOrder.indexOf(garage.tier);
        if (tierIdx <= currentIdx) return 'owned';
        return 'upgrade';
    }

    function handleTierPurchase(tier: StorageTier, name: string) {
        const success = purchaseStorage('garage', tier);
        toastMsg = success ? `${name} 구매 완료!` : '잔고가 부족합니다.';
        setTimeout(() => { toastMsg = ''; }, 3000);
    }

    function handleMarketPurchase(item: typeof marketItems[0]) {
        const success = purchaseVehicle({
            type: vehicleType,
            name: item.name,
            price: item.price,
            img: item.img,
            fame: item.fame,
            maintenanceCost: item.maintenanceCost,
            specs: item.specs
        });
        toastMsg = success ? `${item.name} 구매 완료!` : '잔고가 부족하거나 보관소가 가득 찼습니다.';
        setTimeout(() => { toastMsg = ''; }, 3000);
    }

    let selectedMarketItem: typeof marketItems[0] | null = $state(null);
    let selectedCollectionItem: Vehicle | null = $state(null);

    const dealershipOptions = ['럭셔리 딜러샵', '프리미엄 딜러샵', '클래식 딜러샵'];
    const brandOptions = ['모든 브랜드', '람보르기니', '페라리', '롤스로이스', '부가티', '맥라렌', '포르쉐'];
    let selectedDealership = $state(dealershipOptions[0]);
    let selectedBrand = $state(brandOptions[0]);
    let isDealershipOpen = $state(false);
    let isBrandOpen = $state(false);

    function selectDealership(option: string) { selectedDealership = option; isDealershipOpen = false; }
    function selectBrand(option: string) { selectedBrand = option; isBrandOpen = false; }
</script>

<div class="page-container">
    <nav class="tab-bar">
        <button class="tab-btn" class:active={activeTab === 'collection'} onclick={() => activeTab = 'collection'}>내 차량</button>
        <button class="tab-btn" class:active={activeTab === 'market'} onclick={() => activeTab = 'market'}>차량 마켓</button>
        <button class="tab-btn" class:active={activeTab === 'storage'} onclick={() => activeTab = 'storage'}>차고 관리</button>
    </nav>

    {#if activeTab === 'collection'}
        <header class="page-header">
            <div class="header-text">
                <h1>차량 컬렉션</h1>
                <p>보유한 고급 차량을 확인하세요.</p>
            </div>
            <div class="stats-cards">
                <div class="stat-card">
                    <span class="stat-label">차고 현황</span>
                    <span class="stat-value">{$ownedCars.length} / {garageCapacity}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">총 자산 가치</span>
                    <span class="stat-value">{formatCurrency(totalCarValue)}</span>
                </div>
            </div>
        </header>

        {#if !$hasGarage}
            <div class="empty-state">
                <div class="empty-icon"><span class="empty-icon-text">!</span></div>
                <h2 class="empty-title">차고를 먼저 구매해야 합니다</h2>
                <p class="empty-subtitle">차량을 보관하려면 차고가 필요합니다.</p>
                <button class="btn-primary" onclick={() => activeTab = 'storage'}>차고 구매하러 가기</button>
            </div>
        {:else if $ownedCars.length === 0}
            <div class="empty-state">
                <div class="empty-icon"><span class="empty-icon-text">0</span></div>
                <h2 class="empty-title">보유한 차량이 없습니다</h2>
                <p class="empty-subtitle">마켓에서 첫 번째 차량을 구매해보세요.</p>
            </div>
        {:else}
            {#if selectedCollectionItem}
                {@const cKey = selectedCollectionItem.id}
                <button class="m-back-btn" in:fade={{delay: 300, duration: 200}} out:fade={{duration: 150}} onclick={() => { selectedCollectionItem = null; }}>← 목록으로</button>
                <div class="panel detail-panel">
                    <div class="detail-image" in:receive={{key: cKey}} out:send={{key: cKey}} style="background-image: url('{selectedCollectionItem.img}')"></div>
                    <div class="detail-info-fade" in:fade={{delay: 250, duration: 300}} out:fade={{duration: 200}}>
                        <div class="detail-header">
                            <h2>{selectedCollectionItem.name}</h2>
                            <div class="detail-meta">
                                <span class="detail-price">{formatCurrency(selectedCollectionItem.price)}</span>
                                <span class="fame-badge">명성 +{selectedCollectionItem.fame}</span>
                            </div>
                        </div>
                        <div class="spec-grid">
                            {#each Object.entries(selectedCollectionItem.specs) as [key, value]}
                                <div class="spec-item">
                                    <span class="spec-label">{key}</span>
                                    <strong>{value}</strong>
                                </div>
                            {/each}
                            <div class="spec-item">
                                <span class="spec-label">유지비/일</span>
                                <strong>{formatCurrency(selectedCollectionItem.maintenanceCost)}</strong>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">구매일</span>
                                <strong>{formatDate(selectedCollectionItem.purchasedAt)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <div class="m-catalog-grid">
                    {#each $ownedCars as vehicle (vehicle.id)}
                        <button class="m-catalog-card" onclick={() => { selectedCollectionItem = vehicle; }}>
                            <div class="m-catalog-img" in:receive={{key: vehicle.id}} out:send={{key: vehicle.id}} style="background-image: url('{vehicle.img}')"></div>
                            <div class="m-catalog-body">
                                <div class="m-catalog-header">
                                    <h3>{vehicle.name}</h3>
                                    <span class="fame-badge">명성 +{vehicle.fame}</span>
                                </div>
                                <span class="m-catalog-price">{formatCurrency(vehicle.price)}</span>
                                <div class="m-catalog-specs">
                                    {#each Object.entries(vehicle.specs) as [key, val]}
                                        <span class="m-catalog-spec-tag">{key}: {val}</span>
                                    {/each}
                                </div>
                                <span class="m-catalog-maintenance">유지비 {formatCurrency(vehicle.maintenanceCost)}/일</span>
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        {/if}
    {:else if activeTab === 'market'}
        {#if !hasStorage}
            <div class="empty-state">
                <div class="empty-icon"><span class="empty-icon-text">!</span></div>
                <h2 class="empty-title">차량을 구매하려면 차고가 필요합니다</h2>
                <p class="empty-subtitle">차고를 먼저 구매하면 차량을 구매할 수 있습니다.</p>
                <button class="btn-primary" onclick={() => activeTab = 'storage'}>차고 구매하러 가기</button>
            </div>
        {:else}
            <header class="page-header">
                <div class="header-text">
                    <h1>차량 마켓</h1>
                    <p>최고급 차량을 관리하고 새로운 차량을 획득하세요.</p>
                </div>
                <div class="stats-cards">
                    <div class="stat-card">
                        <span class="stat-label">잔고</span>
                        <span class="stat-value">{formatCurrency($balance)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">차고 잔여</span>
                        <span class="stat-value">{remaining}대</span>
                    </div>
                </div>
            </header>

            {#if selectedMarketItem}
            {@const mKey = selectedMarketItem.name}
            <button class="m-back-btn" in:fade={{delay: 300, duration: 200}} out:fade={{duration: 150}} onclick={() => { selectedMarketItem = null; }}>← 목록으로</button>
            <main class="market-main-grid">
                <section class="m-left-section" in:fade={{delay: 200, duration: 300}} out:fade={{duration: 150}}>
                    <h3 class="section-title">보유 차량</h3>
                    <div class="panel m-left-panel">
                        {#if $ownedCars.length === 0}
                            <p class="empty-list-text">보유한 차량이 없습니다.</p>
                        {:else}
                            {#each $ownedCars as car}
                                <div class="m-list-item">
                                    <img src={car.img} alt={car.name} class="thumb" />
                                    <div class="m-item-info">
                                        <span class="m-item-name">{car.name}</span>
                                        <span class="m-item-price">{formatCurrency(car.price)}</span>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>
                </section>

                <section class="m-center-section">
                    <div class="panel m-center-top">
                        <div class="m-preview-image" in:receive={{key: mKey}} out:send={{key: mKey}} style="background-image: url('{selectedMarketItem.img}')"></div>
                        <div class="m-header-info" in:fade={{delay: 250, duration: 300}} out:fade={{duration: 150}}>
                            <h2>{selectedMarketItem.name}</h2>
                            <span class="m-current-price">가격: {formatCurrency(selectedMarketItem.price)}</span>
                        </div>
                    </div>
                    <div class="panel m-center-bottom" in:fade={{delay: 300, duration: 300}} out:fade={{duration: 150}}>
                        <div class="m-spec-grid">
                            {#each Object.entries(selectedMarketItem.specs) as [key, val]}
                                <div class="m-spec-item">
                                    <span class="m-spec-label">{key}</span>
                                    <strong>{val}</strong>
                                </div>
                            {/each}
                            <div class="m-spec-item">
                                <span class="m-spec-label">명성</span>
                                <strong>+{selectedMarketItem.fame}</strong>
                            </div>
                            <div class="m-spec-item">
                                <span class="m-spec-label">유지비/일</span>
                                <strong>{formatCurrency(selectedMarketItem.maintenanceCost)}</strong>
                            </div>
                        </div>
                        <button class="m-btn-purchase" onclick={() => selectedMarketItem && handleMarketPurchase(selectedMarketItem)}>구매하기</button>
                    </div>
                </section>

                <section class="m-right-section" in:fade={{delay: 200, duration: 300}} out:fade={{duration: 150}}>
                    <h3 class="section-title">럭셔리 딜러샵</h3>
                    <div class="m-filters">
                        <div class="m-custom-select">
                            <button class="m-select-btn" onclick={() => isDealershipOpen = !isDealershipOpen}>
                                <span>{selectedDealership}</span>
                                <span class="m-arrow">{isDealershipOpen ? '▲' : '▼'}</span>
                            </button>
                            {#if isDealershipOpen}
                                <div class="m-select-dropdown">
                                    {#each dealershipOptions as option}
                                        <button class="m-select-option" class:selected={option === selectedDealership} onclick={() => selectDealership(option)}>{option}</button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <div class="m-custom-select">
                            <button class="m-select-btn" onclick={() => isBrandOpen = !isBrandOpen}>
                                <span>{selectedBrand}</span>
                                <span class="m-arrow">{isBrandOpen ? '▲' : '▼'}</span>
                            </button>
                            {#if isBrandOpen}
                                <div class="m-select-dropdown">
                                    {#each brandOptions as option}
                                        <button class="m-select-option" class:selected={option === selectedBrand} onclick={() => selectBrand(option)}>{option}</button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                    <div class="panel m-right-panel">
                        {#each marketItems as item}
                            <button class="m-shop-item" onclick={() => { selectedMarketItem = item; }}>
                                <div class="m-shop-img" style="background-image: url('{item.img}')"></div>
                                <div class="m-shop-info">
                                    <div class="m-shop-row">
                                        <span class="m-shop-name">{item.name}</span>
                                        <span class="m-shop-price">{formatCurrency(item.price)}</span>
                                    </div>
                                    <div class="m-shop-row sub">
                                        <span>명성 +{item.fame}</span>
                                    </div>
                                </div>
                            </button>
                        {/each}
                    </div>
                </section>
            </main>
            {:else}
            <div class="m-catalog-grid">
                {#each marketItems as item (item.name)}
                    <button class="m-catalog-card" onclick={() => { selectedMarketItem = item; }}>
                        <div class="m-catalog-img" in:receive={{key: item.name}} out:send={{key: item.name}} style="background-image: url('{item.img}')"></div>
                        <div class="m-catalog-body">
                            <div class="m-catalog-header">
                                <h3>{item.name}</h3>
                                <span class="fame-badge">명성 +{item.fame}</span>
                            </div>
                            <span class="m-catalog-price">{formatCurrency(item.price)}</span>
                            <div class="m-catalog-specs">
                                {#each Object.entries(item.specs) as [key, val]}
                                    <span class="m-catalog-spec-tag">{key}: {val}</span>
                                {/each}
                            </div>
                            <span class="m-catalog-maintenance">유지비 {formatCurrency(item.maintenanceCost)}/일</span>
                        </div>
                    </button>
                {/each}
            </div>
            {/if}
        {/if}
    {:else}
        <section class="storage-section">
            <header class="page-header">
                <div class="header-text">
                    <h1>차고 관리</h1>
                    <p>더 많은 차량을 보관하고 컬렉션을 확장하기 위해 차고를 업그레이드 하세요</p>
                </div>
                <div class="stats-cards">
                    <div class="stat-card">
                        <span class="stat-label">잔고</span>
                        <span class="stat-value">{formatCurrency($balance)}</span>
                    </div>
                </div>
            </header>

            <div class="tier-grid">
                {#each tiers as tier, idx}
                    {@const state = getTierState(idx)}
                    <div class="card tier-card">
                        <div class="card-image">
                            <div class="placeholder-img"></div>
                        </div>
                        <div class="card-body">
                            <h3>{tier.name}</h3>
                            <div class="price">{formatCurrency(tier.price)}</div>
                            <div class="specs">
                                <div class="spec-row">
                                    <span class="label">차량 보유 가능 대수</span>
                                    <span class="value">{tier.capacity}</span>
                                </div>
                                <div class="spec-row">
                                    <span class="label">구매 가능 차량 등급</span>
                                    <span class="value">{tier.gradeText}</span>
                                </div>
                            </div>
                            {#if state === 'owned'}
                                <div class="owned-badge">보유 중</div>
                            {:else}
                                <button
                                    class="btn-tier {tier.isPremium ? 'btn-gold' : 'btn-blue'}"
                                    onclick={() => handleTierPurchase(tier.tier, tier.name)}
                                >{state === 'upgrade' ? '업그레이드' : '구매하기'}</button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

            {#if $hasGarage && garage}
                <div class="my-storage-section">
                    <h2>내 차고</h2>
                    <div class="card my-storage-card">
                        <div class="card-image wide">
                            <div class="placeholder-img"></div>
                        </div>
                        <div class="card-body">
                            <h3>{garage.name}</h3>
                            <div class="info-row">
                                <span class="info-item">보관 {garage.currentCount} / {garage.capacity}대</span>
                                <span class="info-item">{tiers.find(t => t.tier === garage.tier)?.gradeText ?? ''}</span>
                            </div>
                            <div class="my-stats-row">
                                <div class="stat">
                                    <span class="stat-label">유지비/일</span>
                                    <span class="stat-value">{formatCurrency(garage.maintenanceCost)}</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-label">보관 가능</span>
                                    <span class="stat-value">{garage.capacity}대</span>
                                </div>
                            </div>
                        </div>
                        <div class="card-actions">
                            <button onclick={() => activeTab = 'collection'}>차량 보기</button>
                            <div class="divider"></div>
                            <button onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>업그레이드</button>
                        </div>
                    </div>
                </div>
            {/if}
        </section>
    {/if}
</div>

<svelte:window onclick={(e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target?.closest?.('.m-custom-select')) {
        isDealershipOpen = false;
        isBrandOpen = false;
    }
}} />

{#if toastMsg}
    <div class="toast">{toastMsg}</div>
{/if}

<style>
    .page-container {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #333;
        width: 100%;
    }

    .tab-bar {
        display: flex;
        gap: 2rem;
        border-bottom: 1px solid #e5e7eb;
        margin-bottom: 2rem;
    }

    .tab-btn {
        background: none;
        border: none;
        padding: 0.75rem 0;
        font-size: 1rem;
        color: #888;
        cursor: pointer;
        position: relative;
        font-weight: 500;
    }

    .tab-btn.active {
        color: #0e4c92;
        font-weight: 700;
    }

    .tab-btn.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100%;
        height: 2px;
        background: #0e4c92;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
    }

    .page-header h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem 0; }
    .page-header p { font-size: 0.95rem; color: var(--color-text-gray); margin: 0; }

    .stats-cards { display: flex; gap: 1rem; }

    .stat-card {
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        min-width: 140px;
    }

    .stat-card .stat-label,
    .my-stats-row .stat-label {
        display: block;
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
    }

    .stat-card .stat-value,
    .my-stats-row .stat-value {
        display: block;
        font-size: 1.4rem;
        font-weight: 700;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        text-align: center;
    }

    .empty-icon {
        width: 80px;
        height: 80px;
        background: #f3f4f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
    }

    .empty-icon-text { font-size: 2rem; font-weight: 800; color: #9ca3af; }
    .empty-title { font-size: 1.3rem; font-weight: 700; margin: 0 0 0.5rem 0; }
    .empty-subtitle { color: #666; margin-bottom: 1.5rem; }

    .btn-primary {
        background: #0e4c92;
        color: white;
        border: none;
        padding: 0.75rem 2rem;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
    }

    .btn-primary:hover { background: #0b3d75; }

    .main-grid {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 1.5rem;
        align-items: start;
    }

    .section-title { margin: 0 0 1rem 0; font-size: 1.3rem; font-weight: 700; }

    .panel {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        padding: 1.5rem;
    }

    .vehicle-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 65vh;
        overflow-y: auto;
    }

    .list-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        border-radius: 10px;
        cursor: pointer;
        transition: background 0.2s;
        border: 1px solid transparent;
        background: none;
        text-align: left;
        width: 100%;
    }

    .list-item:hover { background: #f9fafb; }
    .list-item.active { background: #f0f7ff; border-color: #0e4c92; }

    .thumb { width: 70px; height: 70px; border-radius: 10px; object-fit: cover; background: #f3f4f6; }

    .item-info { display: flex; flex-direction: column; gap: 0.15rem; }
    .item-name { font-weight: 700; font-size: 0.95rem; }
    .item-price { color: #0e4c92; font-weight: 600; font-size: 0.85rem; }
    .item-date { color: #999; font-size: 0.75rem; }

    .detail-panel { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06); }

    .detail-image {
        width: 100%;
        aspect-ratio: 16 / 9;
        background-size: cover;
        background-position: center;
        background-color: #f3f4f6;
        border-radius: 10px;
        margin-bottom: 1.5rem;
    }

    .detail-header { margin-bottom: 1.5rem; }
    .detail-header h2 { font-size: 1.8rem; font-weight: 700; margin: 0 0 0.5rem 0; }
    .detail-meta { display: flex; align-items: center; gap: 1rem; }
    .detail-price { font-size: 1.2rem; font-weight: 700; color: #0e4c92; }

    .fame-badge {
        background: #ECF2FE;
        color: #0e4c92;
        border-radius: 20px;
        padding: 0.25rem 0.75rem;
        font-size: 0.8rem;
        font-weight: 700;
    }

    .spec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    .spec-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 0.6rem;
        border-bottom: 1px dotted #d1d5db;
    }

    .spec-item .spec-label { font-size: 0.85rem; color: #6b7280; }
    .spec-item strong { font-size: 0.95rem; font-weight: 700; color: #111827; }

    .detail-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        color: #9ca3af;
        font-size: 1rem;
    }

    .storage-section h2 { font-size: 1.25rem; font-weight: 700; margin: 2.5rem 0 1.5rem 0; }

    .tier-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.5rem;
    }

    .card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        border: 1px solid #e1e4e8;
        display: flex;
        flex-direction: column;
    }

    .card-image {
        width: 100%;
        height: 180px;
        position: relative;
        overflow: hidden;
    }

    .card-image.wide { height: 200px; }

    .placeholder-img {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%);
    }

    .card-body { padding: 20px; flex: 1; display: flex; flex-direction: column; }
    .card-body h3 { font-size: 1rem; color: #333; margin: 0 0 0.5rem 0; }

    .price { font-size: 1.75rem; font-weight: 800; color: #0f5fa6; margin-bottom: 1.25rem; }

    .specs { margin-bottom: 1.5rem; font-size: 0.9rem; color: #555; }

    .spec-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }

    .spec-row .label { color: #888; }
    .spec-row .value { font-weight: 600; color: #333; }

    .btn-tier {
        width: 100%;
        padding: 14px;
        border: none;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        margin-top: auto;
        transition: filter 0.2s;
    }

    .btn-tier:hover { filter: brightness(0.95); }
    .btn-blue { background-color: #0b5190; color: white; }
    .btn-gold { background-color: #dcb038; color: #4a3b10; }

    .owned-badge {
        background: #ecfdf5;
        color: #059669;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        text-align: center;
        font-weight: 700;
        font-size: 0.95rem;
        margin-top: auto;
    }

    .my-storage-section { margin-top: 1rem; }

    .my-storage-card { max-width: 480px; }

    .info-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .info-item { font-size: 0.85rem; color: #555; }

    .my-stats-row {
        display: flex;
        justify-content: space-between;
        padding-top: 1rem;
        border-top: 1px solid #f0f0f0;
    }

    .stat { display: flex; align-items: center; gap: 0.5rem; }

    .card-actions {
        background-color: #f2f4f6;
        display: flex;
        border-top: 1px solid #eee;
    }

    .card-actions button {
        flex: 1;
        background: transparent;
        border: none;
        padding: 14px 0;
        font-size: 0.9rem;
        color: #333;
        font-weight: 500;
        cursor: pointer;
    }

    .card-actions button:hover { background-color: rgba(0, 0, 0, 0.03); }

    .divider { width: 1px; background-color: #ddd; margin: 10px 0; }

    /* Market tab — 3-column layout */
    .market-main-grid { display: grid; grid-template-columns: 250fr 390fr 250fr; gap: 1.5rem; align-items: start; }
    .m-left-section, .m-right-section { display: flex; flex-direction: column; height: 100%; }
    .m-left-panel, .m-right-panel { height: 100%; }
    .m-center-section { display: flex; flex-direction: column; gap: 1.5rem; }

    .m-list-item { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .m-list-item .thumb { width: 80px; height: 80px; border-radius: 10px; object-fit: cover; background: #f3f4f6; }
    .m-item-info { display: flex; flex-direction: column; }
    .m-item-name { font-weight: 700; font-size: 1rem; }
    .m-item-price { color: #666; font-size: 0.8rem; margin-top: 4px; }

    .m-center-top { padding: 1rem; }
    .m-preview-image { width: 100%; aspect-ratio: 1 / 1; background-color: #f3f4f6; background-size: cover; background-position: center; border-radius: 12px; margin-bottom: 1.5rem; }
    .m-header-info h2 { margin: 0 0 0.5rem 0; font-size: 1.8rem; }
    .m-current-price { color: var(--color-text-gray); font-weight: 600; font-size: 1.2rem; }

    .m-center-bottom { padding: 1.3rem; }
    .m-spec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem 2rem; margin-bottom: 1.5rem; }
    .m-spec-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.6rem; border-bottom: 1px dotted #d1d5db; }
    .m-spec-item .m-spec-label { font-size: 0.8rem; color: #6b7280; }
    .m-spec-item strong { font-size: 1rem; font-weight: 700; color: #111827; }

    .m-btn-purchase { width: 100%; background: #0e4c92; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; }
    .m-btn-purchase:hover { background: #0b3d75; }

    .m-center-placeholder { display: flex; align-items: center; justify-content: center; min-height: 400px; color: #9ca3af; font-size: 1rem; }

    .m-filters { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .m-custom-select { flex: 1; position: relative; }
    .m-select-btn { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; font-size: 0.85rem; color: #555; background: white; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
    .m-select-btn:hover { border-color: #0e4c92; }
    .m-arrow { font-size: 0.7rem; color: #888; }
    .m-select-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: white; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 100; max-height: 200px; overflow-y: auto; }
    .m-select-option { display: block; width: 100%; padding: 0.5rem; font-size: 0.85rem; color: #555; cursor: pointer; background: none; border: none; text-align: left; }
    .m-select-option:hover { background-color: #f3f4f6; }
    .m-select-option.selected { background-color: #e5e7eb; font-weight: 600; color: #0e4c92; }

    .m-shop-item { display: block; width: 100%; margin-bottom: 1.5rem; cursor: pointer; background: none; border: none; padding: 0; text-align: left; }
    .m-shop-item:hover { opacity: 0.8; }
    .m-shop-img { width: 100%; aspect-ratio: 250 / 140; background-size: cover; background-position: center; border-radius: 8px; margin-bottom: 0.75rem; }
    .m-shop-info { padding: 0; }
    .m-shop-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
    .m-shop-name { font-weight: 700; font-size: 0.8rem; }
    .m-shop-price { font-weight: 700; font-size: 0.8rem; color: #0e4c92; }
    .m-shop-row.sub { font-size: 0.8rem; color: var(--color-text-gray); }

    .empty-list-text { color: #9ca3af; font-size: 0.9rem; text-align: center; padding: 2rem 0; }

    .m-back-btn { background: none; border: none; color: #0e4c92; font-size: 0.95rem; font-weight: 600; cursor: pointer; margin-bottom: 1.5rem; padding: 0; }
    .m-back-btn:hover { text-decoration: underline; }
    .m-catalog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .m-catalog-card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; cursor: pointer; text-align: left; transition: transform 0.2s; }
    .m-catalog-card:hover { transform: translateY(-4px); }
    .m-catalog-img { width: 100%; aspect-ratio: 16/10; background-size: cover; background-position: center; background-color: #f3f4f6; }
    .m-catalog-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .m-catalog-header { display: flex; justify-content: space-between; align-items: center; }
    .m-catalog-header h3 { font-weight: 700; font-size: 1.1rem; margin: 0; }
    .m-catalog-price { color: #0e4c92; font-weight: 700; font-size: 1.15rem; }
    .m-catalog-specs { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .m-catalog-spec-tag { font-size: 0.8rem; color: #666; background: #f9fafb; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .m-catalog-maintenance { font-size: 0.8rem; color: #999; }

    @media (max-width: 1200px) {
        .market-main-grid { grid-template-columns: 1fr 1fr; }
        .m-right-section { grid-column: span 2; }
    }
    @media (max-width: 768px) {
        .market-main-grid { grid-template-columns: 1fr; }
        .m-right-section { grid-column: auto; }
    }

    .toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: #1f2937;
        color: white;
        padding: 0.75rem 2rem;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
</style>