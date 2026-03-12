<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { getCompanyTypes, createCompany, type CompanyType } from '$lib/api/company';
  import { getRegions, getRegionsByType, getRegionDetail, type Region } from '$lib/api/region';
  import { getSpringAccount } from '$lib/api/dashboard';
  import type { SpringAccount } from '$lib/api/dashboard';
  import { springMe } from '$lib/api/auth';
  import { auth } from '$lib/stores/auth';
  import { get } from 'svelte/store';
  import SkeletonTable from '$lib/components/SkeletonTable.svelte';

  // --- State ---
  let companyTypes = $state<CompanyType[]>([]);
  let regions = $state<Region[]>([]);
  let allRegions = $state<Region[]>([]);
  let account: SpringAccount | null = $state(null);
  let loading = $state(true);
  let creating = $state(false);
  let error = $state('');

  // Selections
  let selectedType = $state('');
  let selectedRegionId = $state(0);
  let availableRegionTypes = $state<string[]>([]);
  let selectedRegionType = $state<string | null>(null);
  let selectedRegionDetail = $state<Region | null>(null);

  // Form
  let companyName = $state('');
  let ceoName = $state('');
  let mainProduct = $state('');

  // Map
  let mapContainer = $state<HTMLDivElement>(null!);
  let leafletMap: any;
  let mapInitialized = $state(false);
  let polygonLayers: Map<number, any> = new Map();

  // User level for locked types
  let userLevel = $state(1);

  let selectedTypeData = $derived(companyTypes.find(t => t.typeCode === selectedType));
  let selectedRegion = $derived(regions.find(r => r.id === selectedRegionId));

  const typeIcons: Record<string, string> = {
    SEMICONDUCTOR: '🔬', ELECTRONICS: '💻', AUTOMOTIVE: '🚗', PHARMACEUTICAL: '💊',
    ENERGY: '⚡', CONSUMER_GOODS: '🛒', CONSTRUCTION: '🏗️', LOGISTICS: '🚚',
    FOOD: '🍕', FASHION: '👗', CHEMICAL: '🧪', STEEL: '⚙️'
  };

  // Korean region center coordinates (fallback for markers)
  const regionCenters: Record<string, [number, number]> = {
    '서울특별시': [37.5665, 126.978],
    '부산광역시': [35.1796, 129.0756],
    '대구광역시': [35.8714, 128.6014],
    '인천광역시': [37.4563, 126.7052],
    '광주광역시': [35.1595, 126.8526],
    '대전광역시': [36.3504, 127.3845],
    '울산광역시': [35.5384, 129.3114],
    '세종특별자치시': [36.48, 127.2599],
    '경기도': [37.4138, 127.5183],
    '강원특별자치도': [37.8228, 128.1555],
    '충청북도': [36.6357, 127.4917],
    '충청남도': [36.5184, 126.8],
    '전라북도': [35.7175, 127.153],
    '전라남도': [34.8679, 126.991],
    '경상북도': [36.4919, 128.8889],
    '경상남도': [35.4606, 128.2132],
    '제주특별자치도': [33.4996, 126.5312]
  };

  function formatCost(val: number | undefined | null): string {
    if (val == null) return '$0';
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toLocaleString()}`;
  }

function selectRegionOnMap(regionId: number) {
    selectedRegionId = regionId;
    polygonLayers.forEach((layer, id) => {
      if (id === regionId) {
        layer.setStyle({ radius: 12, fillColor: '#00529B', fillOpacity: 0.8 });
      } else {
        layer.setStyle({ radius: 8, fillColor: '#4286F5', fillOpacity: 0.5 });
      }
    });
  }

  async function initMap(regionData: Region[]) {
    const leafletModule = await import('leaflet');
    const L = leafletModule.default ?? leafletModule;
    await import('leaflet/dist/leaflet.css');

    leafletMap = L.map(mapContainer, {
      center: [36.0, 127.5] as [number, number],
      zoom: 7,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(leafletMap);

    if (regionData.length === 0) {
      for (const [name, center] of Object.entries(regionCenters)) {
        const marker = L.circleMarker(center, {
          radius: 8, fillColor: '#4286F5', fillOpacity: 0.5, color: '#fff', weight: 2
        }).addTo(leafletMap);
        marker.bindTooltip(name, { sticky: true, className: 'region-tooltip' });
      }
    } else {
      for (const region of regionData) {
        const center = regionCenters[region.name];
        if (!center) continue;
        const isSelected = region.id === selectedRegionId;
        const marker = L.circleMarker(center, {
          radius: isSelected ? 12 : 8,
          fillColor: isSelected ? '#00529B' : '#4286F5',
          fillOpacity: isSelected ? 0.8 : 0.5,
          color: '#fff',
          weight: 2
        }).addTo(leafletMap);
        marker.bindTooltip(region.name, { sticky: true, className: 'region-tooltip' });
        marker.on('click', () => selectRegionOnMap(region.id));
        polygonLayers.set(region.id, marker);
      }
    }

    mapInitialized = true;
    setTimeout(() => leafletMap.invalidateSize(), 200);
  }

  onMount(async () => {
    // Get user level: prefer server, fallback to auth store
    const currentUser = get(auth.user);
    if (currentUser?.level != null) userLevel = currentUser.level;

    try {
      const [typesRes, regionData, me] = await Promise.all([
        getCompanyTypes(),
        getRegions(),
        springMe().catch(() => null)
      ]);
      if (me?.level != null) userLevel = me.level;
      companyTypes = typesRes.sort((a, b) => a.requiredLevel - b.requiredLevel);
      regions = regionData;
      allRegions = regionData;
      availableRegionTypes = [...new Set(regionData.map(r => r.regionType))];
      if (companyTypes.length > 0) {
        const available = companyTypes.find(t => t.requiredLevel <= userLevel);
        selectedType = available ? available.typeCode : companyTypes[0].typeCode;
      }
      if (regions.length > 0) selectedRegionId = regions[0].id;
    } catch {
      error = '데이터를 불러오는데 실패했습니다.';
    } finally {
      loading = false;
    }

    // Account is non-critical, fetch separately
    getSpringAccount().then(a => { account = a; }).catch(() => {});
  });

  // Init map when container is ready (even with empty regions)
  $effect(() => {
    if (mapContainer && !mapInitialized && !loading) {
      initMap(regions);
    }
  });

  $effect(() => {
    if (selectedRegionId) {
      getRegionDetail(selectedRegionId).then(d => { selectedRegionDetail = d; }).catch(() => {});
    }
  });

  let isTypeLocked = $derived(selectedTypeData ? selectedTypeData.requiredLevel > userLevel : false);
  let formValid = $derived(companyName.trim() !== '' && selectedType !== '' && !isTypeLocked && selectedRegionId > 0);

  async function handleCreate() {
    if (!formValid) {
      error = '기업명은 필수 입력 항목입니다.';
      return;
    }
    creating = true;
    error = '';
    try {
      await createCompany({
        name: companyName,
        companyType: selectedType,
        headquartersRegionId: selectedRegionId,
        ...(ceoName.trim() && { ceoName: ceoName.trim() }),
        ...(mainProduct.trim() && { mainProduct: mainProduct.trim() })
      });
      toast.success('회사가 생성되었습니다.');
      goto('/business/dashboard');
    } catch (e) {
      error = e instanceof Error ? e.message : '기업 설립에 실패했습니다.';
      toast.error(error);
    } finally {
      creating = false;
    }
  }

  onDestroy(() => {
    leafletMap?.remove();
  });
</script>

<svelte:head>
  <title>신규 기업 설립</title>
</svelte:head>

<div class="page-container">
  <div class="page-header">
    <div class="header-left">
      <button class="back-btn" onclick={() => goto('/business/dashboard')}>←</button>
      <h2>신규 기업 설립</h2>
    </div>
    {#if account}
      <span class="balance-badge">보유 자금 {formatCost(account?.cashBalance)}</span>
    {/if}
  </div>

  {#if loading}
    <SkeletonTable rows={4} cols={3} />
  {:else}
  <div class="main-layout">

    <!-- Left: Map -->
    <div class="map-section">
      <div class="map-wrapper" bind:this={mapContainer}></div>

      {#if availableRegionTypes.length > 0}
        <div class="region-chips">
          <button class="chip" class:active={selectedRegionType === null} onclick={() => { selectedRegionType = null; regions = allRegions; }}>전체</button>
          {#each availableRegionTypes as type}
            <button class="chip" class:active={selectedRegionType === type} onclick={() => {
              selectedRegionType = type;
              getRegionsByType(type).then(r => { regions = r; if (r.length > 0 && !r.find(rr => rr.id === selectedRegionId)) { selectRegionOnMap(r[0].id); } }).catch(() => {});
            }}>{type}</button>
          {/each}
        </div>
      {/if}

      <div class="region-list">
        {#each regions as region}
          <button
            class="region-item"
            class:selected={selectedRegionId === region.id}
            onclick={() => selectRegionOnMap(region.id)}
          >
            <span class="region-name">{region.name}</span>
            <span class="region-type-badge">{region.regionType}</span>
          </button>
        {/each}
        {#if regions.length === 0}
          <p class="empty-msg">등록된 지역 정보가 없습니다. 지도에서 기본 위치를 확인하세요.</p>
        {/if}
      </div>
    </div>

    <!-- Right: Info Panel -->
    <div class="info-panel">

      <!-- Region Info -->
      {#if selectedRegionDetail}
        <div class="panel-card region-info-card">
          <div class="card-label">본사 지역</div>
          <h3 class="region-title">{selectedRegionDetail.name}</h3>
          <div class="multiplier-grid">
            <div class="mult-item">
              <span class="mult-label">비용 배율</span>
              <span class="mult-val" class:text-red={selectedRegionDetail.costMultiplier > 1} class:text-green={selectedRegionDetail.costMultiplier < 1}>
                {Math.round(selectedRegionDetail.costMultiplier * 100)}%
              </span>
            </div>
            <div class="mult-item">
              <span class="mult-label">수익 배율</span>
              <span class="mult-val" class:text-green={selectedRegionDetail.revenueMultiplier > 1} class:text-red={selectedRegionDetail.revenueMultiplier < 1}>
                {Math.round(selectedRegionDetail.revenueMultiplier * 100)}%
              </span>
            </div>
            <div class="mult-item">
              <span class="mult-label">건설 속도</span>
              <span class="mult-val" class:text-green={selectedRegionDetail.constructionSpeedMultiplier > 1} class:text-red={selectedRegionDetail.constructionSpeedMultiplier < 1}>
                {Math.round(selectedRegionDetail.constructionSpeedMultiplier * 100)}%
              </span>
            </div>
          </div>
        </div>
      {/if}

      <!-- Company Type Selection -->
      <div class="panel-card">
        <div class="card-label">기업 유형</div>
        {#if companyTypes.length === 0}
          <p class="empty-msg">등록된 기업 유형이 없습니다.</p>
        {:else}
        <div class="type-selector">
          {#each companyTypes as t}
            {@const locked = t.requiredLevel > userLevel}
            <button
              class="type-option"
              class:selected={selectedType === t.typeCode && !locked}
              class:locked
              onclick={() => { if (!locked) selectedType = t.typeCode; }}
              disabled={locked}
              title={locked ? `레벨 ${t.requiredLevel} 필요 (현재 Lv.${userLevel})` : t.displayName}
            >
              <span class="type-icon">{locked ? '🔒' : (typeIcons[t.typeCode] || '🏢')}</span>
              <div class="type-info">
                <span class="type-name">{t.displayName}</span>
                <span class="type-cost">{locked ? `Lv.${t.requiredLevel} 필요` : formatCost(t.initialCost)}</span>
              </div>
            </button>
          {/each}
        </div>
        {/if}

        {#if selectedTypeData}
          <div class="type-detail">
            <p class="type-desc">{selectedTypeData.description}</p>
            <div class="type-stats">
              <div class="ts-row">
                <span class="ts-lbl">설립 비용</span>
                <span class="ts-val text-red">{formatCost(selectedTypeData.initialCost)}</span>
              </div>
              <div class="ts-row">
                <span class="ts-lbl">필요 레벨</span>
                <span class="ts-val text-blue">Lv.{selectedTypeData.requiredLevel}</span>
              </div>
              <div class="ts-row">
                <span class="ts-lbl">마진율</span>
                <span class="ts-val text-green">{selectedTypeData.marginRateMin}% ~ {selectedTypeData.marginRateMax}%</span>
              </div>
              <div class="ts-row">
                <span class="ts-lbl">시장 변동성</span>
                <span class="ts-val">{selectedTypeData.marketVolatility}</span>
              </div>
              <div class="ts-row">
                <span class="ts-lbl">주요 재료</span>
                <span class="ts-val">{selectedTypeData.primaryMaterial}</span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Form -->
      <div class="panel-card">
        <div class="card-label">기업 정보</div>

        <div class="field">
          <label for="company-name">기업명 <span class="required">*</span></label>
          <input id="company-name" type="text" placeholder="설립할 기업의 이름" bind:value={companyName} />
        </div>
        <div class="field">
          <label for="ceo-name">CEO 이름 <span class="optional">(선택)</span></label>
          <input id="ceo-name" type="text" placeholder="대표자 이름" bind:value={ceoName} />
        </div>
        <div class="field">
          <label for="main-product">주요 제품 <span class="optional">(선택)</span></label>
          <input id="main-product" type="text" placeholder="주력 제품 또는 서비스" bind:value={mainProduct} />
        </div>

        {#if error}
          <p class="form-error">{error}</p>
        {/if}

        <button class="btn-create" onclick={handleCreate} disabled={creating || !formValid}>
          {creating ? '설립 중...' : '기업 설립'}
        </button>
      </div>

    </div>
  </div>
  {/if}
</div>

<style>
  * { box-sizing: border-box; }

  .page-container {
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--color-text);
  }

  /* Header */
  .page-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 24px;
  }
  .header-left { display: flex; align-items: center; gap: 12px; }
  .back-btn {
    width: 36px; height: 36px; border-radius: 8px;
    border: 1px solid var(--color-border); background: var(--color-bg-1);
    font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: var(--color-text-gray);
  }
  .back-btn:hover { background: var(--color-bg-2); }
  .page-header h2 { font-size: 22px; font-weight: 700; margin: 0; }
  .balance-badge {
    background: #ECF2FE; color: var(--color-theme-1);
    padding: 8px 16px; border-radius: 20px;
    font-size: 13px; font-weight: 700;
  }

  /* Main Layout */
  .main-layout {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 24px;
    align-items: start;
  }

  /* Map Section */
  .map-section { display: flex; flex-direction: column; gap: 12px; }
  .map-wrapper {
    width: 100%; height: 480px;
    border-radius: 12px; overflow: hidden;
    border: 1px solid var(--color-border);
    z-index: 0;
  }
  :global(.region-tooltip) {
    font-size: 13px !important;
    font-weight: 600 !important;
    padding: 4px 10px !important;
    border-radius: 6px !important;
  }

  .region-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip {
    padding: 5px 14px; border: 1px solid var(--color-border); border-radius: 16px;
    font-size: 12px; font-weight: 600; cursor: pointer; background: var(--color-bg-1);
    color: var(--color-text-gray); transition: all 0.15s;
  }
  .chip.active { background: var(--color-theme-1); color: white; border-color: var(--color-theme-1); }

  .region-list {
    display: flex; flex-wrap: wrap; gap: 6px;
    max-height: 140px; overflow-y: auto;
  }
  .region-item {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px; border: 1px solid var(--color-border); border-radius: 8px;
    background: var(--color-bg-1); cursor: pointer; font-size: 13px;
    transition: all 0.15s;
  }
  .region-item:hover { border-color: #93c5fd; }
  .region-item.selected {
    border-color: var(--color-theme-1); background: rgba(66, 134, 245, 0.08);
  }
  .region-name { font-weight: 600; color: var(--color-text); }
  .region-type-badge {
    font-size: 10px; color: var(--color-text-gray); background: var(--color-bg-2);
    padding: 2px 6px; border-radius: 4px;
  }

  /* Info Panel */
  .info-panel { display: flex; flex-direction: column; gap: 16px; }

  .panel-card {
    background: var(--color-bg-1); padding: 20px;
    border-radius: 12px; border: 1px solid var(--color-border);
  }
  .card-label {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    color: var(--color-text-gray); letter-spacing: 0.5px; margin-bottom: 12px;
  }

  /* Region Info */
  .region-title { font-size: 20px; font-weight: 800; margin: 0 0 16px 0; }
  .multiplier-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .mult-item {
    display: flex; flex-direction: column; gap: 4px;
    padding: 10px; background: var(--color-bg-2); border-radius: 8px; text-align: center;
  }
  .mult-label { font-size: 11px; color: var(--color-text-gray); }
  .mult-val { font-size: 16px; font-weight: 800; }

  /* Type Selection */
  .type-selector {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
    margin-bottom: 16px;
  }
  .type-option {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; border: 2px solid var(--color-border); border-radius: 10px;
    background: var(--color-bg-1); cursor: pointer; transition: all 0.15s;
    text-align: left;
  }
  .type-option:hover { border-color: #93c5fd; }
  .type-option.locked {
    opacity: 0.5; cursor: not-allowed; background: var(--color-bg-2);
  }
  .type-option.locked:hover { border-color: var(--color-border); }
  .type-option.selected {
    border-color: var(--color-theme-1);
    background: rgba(66, 134, 245, 0.08);
    box-shadow: inset 0 2px 20px rgba(0, 82, 155, 0.1);
  }
  .type-icon { font-size: 22px; flex-shrink: 0; }
  .type-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .type-name { font-size: 12px; font-weight: 700; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .type-cost { font-size: 10px; color: var(--color-text-gray); }
  .type-option.selected .type-name { color: var(--color-theme-1); }

  .type-detail { border-top: 1px solid var(--color-border); padding-top: 12px; }
  .type-desc { font-size: 13px; color: var(--color-text-gray); line-height: 1.6; margin: 0 0 12px 0; }
  .type-stats { display: flex; flex-direction: column; gap: 8px; }
  .ts-row { display: flex; justify-content: space-between; align-items: center; }
  .ts-lbl { font-size: 12px; color: var(--color-text-gray); }
  .ts-val { font-size: 14px; font-weight: 700; }

  .text-green { color: #13B981; }
  .text-red { color: #EF4444; }
  .text-blue { color: #00529B; }

  /* Form */
  .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
  .field label { font-size: 12px; font-weight: 600; color: var(--color-text-gray); }
  .required { color: #ef4444; font-weight: 700; }
  .optional { color: #9ca3af; font-weight: 400; }
  .field input {
    padding: 10px 12px; border: 1px solid var(--color-border); border-radius: 8px;
    font-size: 14px; background: var(--color-bg-0); color: var(--color-text); outline: none;
    transition: border-color 0.15s;
  }
  .field input:focus { border-color: var(--color-theme-1); }
  .field input::placeholder { color: #9ca3af; }
  .form-error { color: #ef4444; font-size: 13px; margin: 0 0 8px 0; }
  .empty-msg { color: var(--color-text-gray); font-size: 13px; text-align: center; padding: 16px 0; }

  .btn-create {
    width: 100%; background-color: #0f4c81; color: white; padding: 14px;
    border: none; border-radius: 8px; font-size: 15px; font-weight: 700;
    cursor: pointer; margin-top: 4px; transition: background 0.2s;
  }
  .btn-create:hover { background-color: #0c3b66; }
  .btn-create:disabled { background-color: var(--color-text-gray); cursor: not-allowed; opacity: 0.7; }

  /* Responsive */
  @media (max-width: 1024px) {
    .main-layout { grid-template-columns: 1fr; }
    .map-wrapper { height: 350px; }
    .type-selector { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 600px) {
    .type-selector { grid-template-columns: repeat(2, 1fr); }
    .multiplier-grid { grid-template-columns: 1fr; }
  }
</style>
