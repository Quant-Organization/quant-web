<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { getFactoryGrades, type FactoryGrade } from '$lib/api/factory';
  import { getRegions, getRegionsByType, getRegionDetail, type Region } from '$lib/api/region';
  import { updateFactoryBuild, resetFactoryBuild } from '$lib/stores/factoryBuild';
  import { springMe } from '$lib/api/auth';
  import { auth } from '$lib/stores/auth';
  import { get } from 'svelte/store';
  import SkeletonTable from '$lib/components/SkeletonTable.svelte';
  import { REGION_CENTERS } from '$lib/constants';
  import workshopImg from '$lib/images/factory/workshop.svg';
  import smallImg from '$lib/images/factory/small.svg';
  import mediumImg from '$lib/images/factory/medium.svg';
  import largeImg from '$lib/images/factory/large.svg';
  import industrialImg from '$lib/images/factory/industrial.svg';
  import megaImg from '$lib/images/factory/mega.svg';
  import gigaImg from '$lib/images/factory/giga.svg';

  // --- State ---
  let grades = $state<FactoryGrade[]>([]);
  let regions = $state<Region[]>([]);
  let selectedGrade = $state('');
  let selectedRegionId = $state(0);
  let loading = $state(true);
  let error = $state('');
  let userLevel = $state(1);
  let allRegions = $state<Region[]>([]);
  let availableRegionTypes = $state<string[]>([]);
  let selectedRegionType = $state<string | null>(null);
  let selectedRegionDetail = $state<Region | null>(null);

  // Map
  let mapContainer = $state<HTMLDivElement>(null!);
  let leafletMap: any;
  let mapInitialized = $state(false);
  let polygonLayers: Map<number, any> = new Map();

  const regionCenters = REGION_CENTERS;

  const gradeImages: Record<string, string> = {
    WORKSHOP: workshopImg, SMALL: smallImg, MEDIUM: mediumImg, LARGE: largeImg,
    INDUSTRIAL: industrialImg, MEGA: megaImg, GIGA: gigaImg
  };

  function formatProduction(val: number): string {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(0)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return val.toString();
  }

  function formatCost(val: number | undefined | null): string {
    if (val == null) return '₩0';
    if (val >= 1_000_000_000) return `₩${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `₩${(val / 1_000_000).toFixed(0)}M`;
    return `₩${val.toLocaleString()}`;
  }

  let selectedGradeData = $derived(grades.find(g => g.grade === selectedGrade));
  let selectedRegion = $derived(regions.find(r => r.id === selectedRegionId));

  let regionBonus = $derived.by(() => {
    if (!selectedRegion) return '';
    const speed = selectedRegion.constructionSpeedMultiplier;
    if (speed > 1) return `건설 속도 +${Math.round((speed - 1) * 100)}%`;
    if (speed < 1) return `건설 속도 -${Math.round((1 - speed) * 100)}%`;
    return '보너스 없음';
  });

  function selectRegionOnMap(regionId: number) {
    selectedRegionId = regionId;
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
    resetFactoryBuild();
    const currentUser = get(auth.user);
    if (currentUser?.level != null) userLevel = currentUser.level;
    try {
      const [gradeData, regionData, me] = await Promise.all([
        getFactoryGrades(),
        getRegions(),
        springMe().catch(() => null)
      ]);
      if (me?.level != null) userLevel = me.level;
      grades = gradeData.sort((a, b) => a.requiredLevel - b.requiredLevel);
      regions = regionData;
      allRegions = regionData;
      availableRegionTypes = [...new Set(regionData.map(r => r.regionType))];
      if (grades.length > 0) {
        const available = grades.find(g => g.requiredLevel <= userLevel);
        selectedGrade = available ? available.grade : grades[0].grade;
      }
      if (regions.length > 0) selectedRegionId = regions[0].id;
    } catch (e: any) {
      error = e.message || '데이터를 불러오는데 실패했습니다.';
    } finally {
      loading = false;
    }
  });

  // Init map when container is ready
  $effect(() => {
    if (mapContainer && !mapInitialized && !loading) {
      initMap(regions);
    }
  });

  // Sync map markers when selectedRegionId changes
  $effect(() => {
    if (mapInitialized && selectedRegionId) {
      polygonLayers.forEach((layer, id) => {
        if (id === selectedRegionId) {
          layer.setStyle({ radius: 12, fillColor: '#00529B', fillOpacity: 0.8 });
        } else {
          layer.setStyle({ radius: 8, fillColor: '#4286F5', fillOpacity: 0.5 });
        }
      });
    }
  });

  $effect(() => {
    if (selectedRegionId) {
      getRegionDetail(selectedRegionId).then(detail => {
        selectedRegionDetail = detail;
      }).catch(() => {});
    }
  });

  function goToNextStep() {
    if (!selectedGrade || !selectedRegionId) return;
    updateFactoryBuild({
      companyId: Number($page.params.id),
      grade: selectedGrade,
      gradeName: selectedGradeData?.displayName || selectedGrade,
      regionId: selectedRegionId,
      regionName: selectedRegion?.name || '',
      baseConstructionCost: selectedGradeData?.baseConstructionCost || 0
    });
    goto(`/business/company/${$page.params.id}/factory/build/settings`);
  }

  onDestroy(() => {
    leafletMap?.remove();
  });
</script>

<svelte:head>
  <title>공장 건설</title>
</svelte:head>

<div class="page-container">

  <div class="page-title">
    <h2>공장 건설 - 1. 지역/등급 선택</h2>
  </div>

  <div class="stepper">
    <div class="step-item active">
      <div class="step-icon check">✓</div>
      <span class="step-label">지역/등급 선택</span>
    </div>
    <div class="step-line"></div>
    <div class="step-item inactive">
      <div class="step-icon custom-check">✓</div>
      <span class="step-label">세부 설정</span>
    </div>
    <div class="step-line"></div>
    <div class="step-item inactive">
      <div class="step-icon custom-check">✓</div>
      <span class="step-label">견적 및 계약</span>
    </div>
  </div>

  {#if loading}
    <SkeletonTable rows={4} cols={3} />
  {:else if error}
    <div class="error-msg">{error}</div>
  {:else}
  <div class="content-wrapper">

    <div class="factory-grid">
      {#each grades as grade}
        {@const locked = grade.requiredLevel > userLevel}
        <div
          class="card factory-card {grade.grade.toUpperCase() === 'GIGA' ? 'full-width' : ''}"
          class:selected={selectedGrade === grade.grade && !locked}
          class:locked
          onclick={() => { if (!locked) selectedGrade = grade.grade; }}
          onkeydown={(e) => { if (e.key === 'Enter' && !locked) selectedGrade = grade.grade; }}
          role="button"
          tabindex={locked ? -1 : 0}
          title={locked ? `레벨 ${grade.requiredLevel} 필요 (현재 Lv.${userLevel})` : grade.displayName}
        >
          <div class="card-header">
            <div class="icon-box">
              {#if locked}
                🔒
              {:else if gradeImages[grade.grade]}
                <img src={gradeImages[grade.grade]} alt={grade.displayName} class="grade-img" />
              {:else}
                🏭
              {/if}
            </div>
            <h3>{grade.displayName}</h3>
          </div>
          <p class="desc">{locked ? `Lv.${grade.requiredLevel} 필요 (현재 Lv.${userLevel})` : `Lv.${grade.requiredLevel} 이상 건설 가능`}</p>

          <div class="stats-row">
            <div class="stat">
              <span class="label">총 생산량/매달</span>
              <span class="val">{formatProduction(grade.monthlyProduction)}</span>
            </div>
            <div class="stat">
              <span class="label">직원 수</span>
              <span class="val">{grade.employeeCount.toLocaleString()}</span>
            </div>
          </div>

          <div class="stat-divider"></div>

          <div class="detail-link">
            기반 비용: {formatCost(grade.baseConstructionCost)}
          </div>
        </div>
      {/each}
    </div>

    <div class="summary-panel">
      <div class="map-wrapper" bind:this={mapContainer}></div>

      {#if availableRegionTypes.length > 0}
        <div class="type-filters">
          <button class:active={selectedRegionType === null} onclick={() => { selectedRegionType = null; regions = allRegions; }}>전체</button>
          {#each availableRegionTypes as type}
            <button class:active={selectedRegionType === type} onclick={() => { selectedRegionType = type; getRegionsByType(type).then(r => { regions = r; if (r.length > 0) selectedRegionId = r[0].id; }).catch(() => {}); }}>{type}</button>
          {/each}
        </div>
      {/if}

      <div class="region-select">
        <label for="region">지역 선택</label>
        <select id="region" bind:value={selectedRegionId}>
          {#each regions as region}
            <option value={region.id}>{region.name} ({region.regionType})</option>
          {/each}
        </select>
      </div>

      {#if selectedRegionDetail}
        <div class="region-detail-panel">
          <div class="detail-row">
            <span class="d-lbl">비용 배율</span>
            <span class="d-val">{Math.round(selectedRegionDetail.costMultiplier * 100)}%</span>
          </div>
          <div class="detail-row">
            <span class="d-lbl">수익 배율</span>
            <span class="d-val">{Math.round(selectedRegionDetail.revenueMultiplier * 100)}%</span>
          </div>
          <div class="detail-row">
            <span class="d-lbl">건설 속도</span>
            <span class="d-val">{Math.round(selectedRegionDetail.constructionSpeedMultiplier * 100)}%</span>
          </div>
        </div>
      {/if}

      <div class="summary-content">
        <div class="sum-row">
          <span class="lbl">선택 지역</span>
          <span class="val">{selectedRegion?.name || '-'}</span>
        </div>
        <div class="sum-row">
          <span class="lbl">선택 등급</span>
          <span class="val highlight">{selectedGradeData?.displayName || '-'}</span>
        </div>
        <div class="sum-row">
          <span class="lbl">지역 보너스</span>
          <span class="val text-green">{regionBonus}</span>
        </div>

        <div class="divider-dashed"></div>

        <div class="sum-row cost-row">
          <span class="lbl">예상 기반 비용</span>
          <span class="val text-red">{selectedGradeData ? formatCost(selectedGradeData.baseConstructionCost) : '-'}</span>
        </div>
        <div class="sum-row cost-row">
          <span class="lbl">필요 레벨</span>
          <span class="val text-blue">Lv.{selectedGradeData?.requiredLevel || '-'}</span>
        </div>
        <div class="sum-row cost-row">
          <span class="lbl">건설 가능 여부</span>
          {#if selectedGradeData && selectedGradeData.requiredLevel > userLevel}
            <span class="badge-red">● 레벨 부족</span>
          {:else}
            <span class="badge-green">● 건설 가능</span>
          {/if}
        </div>

        <button class="btn-next" onclick={goToNextStep} disabled={!selectedGrade || !selectedRegionId || (selectedGradeData != null && selectedGradeData.requiredLevel > userLevel)}>다음단계로 ></button>
      </div>
    </div>

  </div>
  {/if}
</div>

<style>
  /* --- Base --- */
  * { box-sizing: border-box; }
  .page-container {
    background-color: var(--color-bg-0);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--color-text);
  }

  /* --- Header --- */
  .page-title h2 {
    font-size: 24px; font-weight: 700; margin: 0 0 32px 0;
  }

  /* --- Stepper --- */
  .stepper {
    display: flex; align-items: center; margin-bottom: 32px;
  }
  .step-item {
    display: flex; align-items: center; gap: 8px;
    font-weight: 600; color: var(--color-text-gray);
  }
  .step-item.active { color: var(--color-text); }

  .step-icon {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
    font-size: 12px; font-weight: 700;
  }
  .step-item.active .step-icon { background-color: var(--color-theme-1); color: white; }
  .step-item.inactive .step-icon { background-color: var(--color-border); color: white; }

  .step-line {
    flex: 1; height: 2px; background-color: var(--color-border); margin: 0 16px;
  }

  /* --- Layout --- */
  .content-wrapper {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 24px;
    align-items: start;
  }

  /* --- Left: Factory Grid --- */
  .factory-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .factory-card {
    background: var(--color-bg-1);
    border: 2px solid var(--color-border);
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
    display: flex; flex-direction: column;
  }

  /* Full Width for Giga Factory */
  .factory-card.full-width {
    grid-column: span 2;
  }

  /* Selected State */
  .factory-card.locked {
    opacity: 0.5; cursor: not-allowed;
  }
  .factory-card.locked:hover { border-color: var(--color-border); }
  .factory-card:not(.locked):hover { border-color: #93c5fd; }
  .factory-card.selected {
    border-color: rgba(0, 82, 155, 0.8);
    background-color: rgba(66, 134, 245, 0.1);
    box-shadow:
      inset 0 5px 50px rgba(0, 82, 155, 0.2),
      0 4px 5px rgba(0, 0, 0, 0.05);
  }

  .card-header {
    display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
  }
  .icon-box { font-size: 24px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .grade-img { width: 32px; height: 32px; object-fit: contain; }
  .card-header h3 { font-size: 18px; font-weight: 700; margin: 0; }

  .desc {
    font-size: 13px; color: var(--color-text-gray); line-height: 1.5;
    margin: 0 0 20px 0; min-height: 40px;
  }

  .stats-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }
  .stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .stat .label { font-size: 12px; color: var(--color-text-gray); }
  .stat .val { font-size: 14px; font-weight: 700; color: var(--color-text); }

  .stat-divider {
    height: 1px;
    background-color: #D9D9D9;
    margin-bottom: 16px;
  }

  .detail-link {
    text-align: right; font-size: 12px; color: var(--color-theme-1); font-weight: 600;
    margin-top: auto;
  }

  /* --- Right: Map & Summary --- */
  .summary-panel {
    display: flex; flex-direction: column; gap: 16px;
  }

  /* Map */
  .map-wrapper {
    width: 100%; height: 320px;
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

  /* Summary Content */
  .summary-content {
    background: var(--color-bg-1); padding: 24px;
    border-radius: 12px; border: 1px solid var(--color-border);
  }

  .sum-row {
    display: flex; justify-content: space-between; margin-bottom: 12px;
    font-size: 14px;
  }
  .sum-row .lbl { color: var(--color-text-gray); font-weight: 500; }
  .sum-row .val { font-weight: 700; color: var(--color-text); text-align: right; }
  .sum-row .val.highlight { font-size: 16px; }

  .sum-row .val.text-green { color: #13B981; }
  .sum-row .val.text-red { color: #EF4444; }
  .sum-row .val.text-blue { color: #00529B; }

  .divider-dashed {
    border-top: 1px dashed var(--color-border);
    margin: 16px 0;
  }

  .cost-row { align-items: center; margin-bottom: 16px; }
  .cost-row .val { font-size: 18px; }

  .badge-green {
    background-color: #dcfce7; color: #166534;
    padding: 4px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 600;
  }
  .badge-red {
    background-color: #fee2e2; color: #991b1b;
    padding: 4px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 600;
  }

  .btn-next {
    width: 100%;
    background-color: #0f4c81;
    color: white;
    padding: 16px;
    border: none; border-radius: 8px;
    font-size: 16px; font-weight: 700;
    cursor: pointer;
    margin-top: 8px;
    transition: background 0.2s;
  }
  .btn-next:hover { background-color: #0c3b66; }

  /* Loading/Error */
  .loading-msg, .error-msg {
    text-align: center; padding: 60px 20px; font-size: 16px;
  }
  .error-msg { color: #ef4444; }

  /* Region Select */
  .region-select {
    display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;
  }
  .region-select label {
    font-size: 13px; font-weight: 600; color: var(--color-text-gray);
  }
  .region-select select {
    width: 100%; padding: 10px 12px; border: 1px solid var(--color-border);
    border-radius: 8px; font-size: 14px; background: var(--color-bg-1);
    color: var(--color-text); cursor: pointer;
  }

  .btn-next:disabled {
    background-color: var(--color-text-gray); cursor: not-allowed; opacity: 0.7;
  }

  /* Type Filters */
  .type-filters {
    display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;
  }
  .type-filters button {
    padding: 4px 12px; border: 1px solid var(--color-border); border-radius: 16px;
    font-size: 12px; font-weight: 600; cursor: pointer; background: var(--color-bg-1);
    color: var(--color-text-gray); transition: all 0.15s;
  }
  .type-filters button.active {
    background: var(--color-theme-1); color: white; border-color: var(--color-theme-1);
  }

  /* Region Detail Panel */
  .region-detail-panel {
    background: var(--color-bg-2); border-radius: 8px; padding: 12px 16px;
    margin-bottom: 16px; border: 1px solid var(--color-border);
  }
  .detail-row {
    display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0;
  }
  .d-lbl { color: var(--color-text-gray); }
  .d-val { font-weight: 700; color: var(--color-theme-1); }

  /* --- Responsive --- */
  @media (max-width: 1024px) {
    .content-wrapper { grid-template-columns: 1fr; }
    .factory-grid { order: 2; }
    .summary-panel { order: 1; position: sticky; top: 0; z-index: 10; }
    .map-container { height: 200px; }
  }

  @media (max-width: 600px) {
    .factory-grid { grid-template-columns: 1fr; }
    .factory-card.full-width { grid-column: span 1; }
  }
</style>
