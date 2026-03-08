<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import {
    getCompanyFactories,
    pauseFactory,
    resumeFactory,
    adjustProduction,
    type FactoryResponse
  } from '$lib/api/factory';
  import SkeletonTable from '$lib/components/SkeletonTable.svelte';
  import { toast } from 'svelte-sonner';

  const regionCenters: Record<string, [number, number]> = {
    '서울특별시': [37.5665, 126.978], '부산광역시': [35.1796, 129.0756],
    '대구광역시': [35.8714, 128.6014], '인천광역시': [37.4563, 126.7052],
    '광주광역시': [35.1595, 126.8526], '대전광역시': [36.3504, 127.3845],
    '울산광역시': [35.5384, 129.3114], '세종특별자치시': [36.48, 127.2599],
    '경기도': [37.4138, 127.5183], '강원특별자치도': [37.8228, 128.1555],
    '충청북도': [36.6357, 127.4917], '충청남도': [36.5184, 126.8],
    '전라북도': [35.7175, 127.153], '전라남도': [34.8679, 126.991],
    '경상북도': [36.4919, 128.8889], '경상남도': [35.4606, 128.2132],
    '제주특별자치도': [33.4996, 126.5312]
  };

  let mapContainer = $state<HTMLDivElement>(null!);
  let leafletMap: any;
  let mapInitialized = $state(false);

  async function initMap(regionName: string) {
    const leafletModule = await import('leaflet');
    const L = leafletModule.default ?? leafletModule;
    await import('leaflet/dist/leaflet.css');

    const center = regionCenters[regionName] ?? [36.0, 127.5];

    leafletMap = L.map(mapContainer, {
      center: center as [number, number],
      zoom: 10,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(leafletMap);

    L.circleMarker(center, {
      radius: 12, fillColor: '#00529B', fillOpacity: 0.8, color: '#fff', weight: 2
    }).addTo(leafletMap).bindTooltip(regionName, { permanent: true, className: 'region-tooltip', direction: 'top' });

    mapInitialized = true;
    setTimeout(() => leafletMap.invalidateSize(), 200);
  }

  function updateMapLocation(regionName: string) {
    if (!leafletMap) return;
    const center = regionCenters[regionName] ?? [36.0, 127.5];
    leafletMap.eachLayer((layer: any) => {
      if (layer._latlng) leafletMap.removeLayer(layer);
    });
    const leafletModule = (window as any).L;
    if (leafletModule) {
      leafletModule.circleMarker(center, {
        radius: 12, fillColor: '#00529B', fillOpacity: 0.8, color: '#fff', weight: 2
      }).addTo(leafletMap).bindTooltip(regionName, { permanent: true, className: 'region-tooltip', direction: 'top' });
    }
    leafletMap.setView(center, 10, { animate: true });
  }

  // --- State ---
  let factories = $state<FactoryResponse[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  const companyId = $derived(Number($page.params.id));

  // Selected factory for the detail panel
  let selectedFactory = $state<FactoryResponse | null>(null);

  // Filter state
  const filters = ['모든 공장', '나라별 정렬', '높은 생산량 순 정렬', '높은 효율 순 정렬'];
  let activeFilter = $state('모든 공장');

  // Summary stats derived from real data
  let summaryStats = $derived([
    { label: '총 공장 수', value: String(factories.length), unit: '' },
    {
      label: '총 생산량/매달',
      value: formatShort(factories.reduce((s, f) => s + f.currentMonthlyProduction, 0)),
      unit: 'Units'
    },
    {
      label: '평균 효율',
      value: factories.length
        ? (factories.reduce((s, f) => s + (f.efficiency ?? 0), 0) / factories.length).toFixed(1) + '%'
        : '0%',
      unit: ''
    }
  ]);

  let filteredFactories = $derived(() => {
    let list = [...factories];
    if (activeFilter === '높은 생산량 순 정렬') {
      list.sort((a, b) => b.currentMonthlyProduction - a.currentMonthlyProduction);
    } else if (activeFilter === '높은 효율 순 정렬') {
      list.sort((a, b) => b.efficiency - a.efficiency);
    }
    return list;
  });

  function formatShort(n: number): string {
    n = n ?? 0;
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return dateStr.split('T')[0].replace(/-/g, '.');
  }

  onMount(async () => {
    try {
      const res = await getCompanyFactories(companyId);
      factories = res;
      if (factories.length > 0) selectedFactory = factories[0];
    } catch (e) {
      error = '공장 데이터를 불러오지 못했습니다.';
    } finally {
      loading = false;
    }
  });

  // Init map when a factory is selected
  $effect(() => {
    if (mapContainer && selectedFactory && !mapInitialized) {
      initMap(selectedFactory.regionName);
    } else if (mapInitialized && selectedFactory) {
      updateMapLocation(selectedFactory.regionName);
    }
  });

  async function handlePause(id: number) {
    try {
      await pauseFactory(id);
      const res = await getCompanyFactories(companyId);
      factories = res;
      if (selectedFactory?.id === id) {
        selectedFactory = factories.find(f => f.id === id) ?? null;
      }
    } catch {
      // silently ignore
    }
  }

  async function handleResume(id: number) {
    try {
      await resumeFactory(id);
      const res = await getCompanyFactories(companyId);
      factories = res;
      if (selectedFactory?.id === id) {
        selectedFactory = factories.find(f => f.id === id) ?? null;
      }
    } catch {
      // silently ignore
    }
  }
</script>

<svelte:head>
  <title>공장 관리</title>
</svelte:head>

<div class="page-container">

  <header class="page-header">
    <h1>공장 건설 및 관리</h1>
  </header>

  {#if loading}
    <SkeletonTable rows={4} cols={3} />
  {:else if error}
    <div class="error-state">{error}</div>
  {:else}
    <div class="stats-grid">
      {#each summaryStats as stat}
        <div class="card stat-card">
          <div class="stat-label">{stat.label}</div>
          <div class="stat-content">
            <span class="stat-value">
              {stat.value}
              {#if stat.unit}<span class="stat-unit">{stat.unit}</span>{/if}
            </span>
          </div>
        </div>
      {/each}
    </div>

    {#if selectedFactory}
      <div class="card location-card">
        <div class="map-section-inner" bind:this={mapContainer}></div>

        <div class="detail-section">
          <div class="detail-header">
            <h2>{selectedFactory.name}</h2>
            <div class="tags">
              <span class="tag">{selectedFactory.grade}</span>
              <span class="tag">{selectedFactory.regionName}</span>
              <span class="tag status-tag {selectedFactory.status === 'RUNNING' || selectedFactory.status === 'OPERATING' ? 'running' : 'paused'}">
                {selectedFactory.status === 'RUNNING' || selectedFactory.status === 'OPERATING' ? '가동 중' : '일시정지'}
              </span>
            </div>
          </div>

          <div class="info-table">
            <div class="info-row">
              <span class="label"><span class="icon">🏭</span> 공장 등급</span>
              <span class="val">{selectedFactory.grade}</span>
            </div>
            <div class="divider"></div>
            <div class="info-row">
              <span class="label"><span class="icon">👤</span> 직원 수</span>
              <span class="val">{(selectedFactory.employeeCount ?? 0).toLocaleString()}명</span>
            </div>
            <div class="divider"></div>
            <div class="info-row">
              <span class="label"><span class="icon">📦</span> 총 생산량/매달</span>
              <span class="val">{formatShort(selectedFactory.currentMonthlyProduction)} Units</span>
            </div>
            <div class="divider"></div>
            <div class="info-row">
              <span class="label"><span class="icon">⚡</span> 평균 효율</span>
              <span class="val">{(selectedFactory.efficiency ?? 0).toFixed(1)}%</span>
            </div>
            <div class="divider"></div>
            <div class="info-row">
              <span class="label"><span class="icon">💵</span> 월 수익</span>
              <span class="val">{formatShort(selectedFactory.monthlyRevenue)}</span>
            </div>
            <div class="divider"></div>
            <div class="info-row">
              <span class="label"><span class="icon">📅</span> 완공일</span>
              <span class="val">{formatDate(selectedFactory.constructionEndDate)}</span>
            </div>
          </div>

          <div class="detail-actions">
            {#if selectedFactory.status === 'RUNNING' || selectedFactory.status === 'OPERATING'}
              <button class="btn-pause" onclick={() => handlePause(selectedFactory!.id)}>일시정지</button>
            {:else}
              <button class="btn-resume" onclick={() => handleResume(selectedFactory!.id)}>재가동</button>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <div class="card no-factory-card">
        <p>공장이 없습니다. 새로운 공장을 건설해보세요.</p>
      </div>
    {/if}

    <div class="list-section">
      <div class="list-header">
        <div class="header-left">
          <h2>공장 목록</h2>
          <div class="filter-group">
            {#each filters as filter}
              <button
                class="filter-btn"
                class:active={activeFilter === filter}
                onclick={() => activeFilter = filter}
              >
                {filter}
              </button>
            {/each}
          </div>
        </div>
        <button class="btn-primary" onclick={() => goto(`/business/company/${$page.params.id}/factory/build`)}>+ 새로운 공장 건설</button>
      </div>

      {#if filteredFactories().length === 0}
        <div class="empty-state">공장이 없습니다.</div>
      {:else}
        <div class="factory-grid">
          {#each filteredFactories() as factory}
            <div
              class="card factory-card"
              class:selected={selectedFactory?.id === factory.id}
              onclick={() => selectedFactory = factory}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === 'Enter' && (selectedFactory = factory)}
            >
              <div class="f-header">
                <div class="f-icon">🏭</div>
                <div>
                  <h3>{factory.name}</h3>
                  <p class="location-sub">📍 {factory.regionName}</p>
                </div>
                <span class="status-badge {factory.status === 'RUNNING' || factory.status === 'OPERATING' ? 'running' : 'paused'}">
                  {factory.status === 'RUNNING' || factory.status === 'OPERATING' ? '가동 중' : '일시정지'}
                </span>
              </div>

              <div class="f-stats">
                <div class="f-stat-item">
                  <span class="lbl">총 생산량/매달</span>
                  <span class="val">{formatShort(factory.currentMonthlyProduction)}</span>
                </div>
                <div class="f-stat-item">
                  <span class="lbl">직원 수</span>
                  <span class="val">{(factory.employeeCount ?? 0).toLocaleString()}명</span>
                </div>
                <div class="f-stat-item">
                  <span class="lbl">완공일</span>
                  <span class="val">{formatDate(factory.constructionEndDate)}</span>
                </div>
                <div class="f-stat-item">
                  <span class="lbl">월 수익</span>
                  <span class="val">{formatShort(factory.monthlyRevenue)}</span>
                </div>
              </div>

              <div class="efficiency-area">
                <span class="lbl">평균 효율</span>
                <div class="progress-bg">
                  <div class="progress-fill" style="width: {Math.min(factory.efficiency, 100)}%;"></div>
                </div>
              </div>

              <div class="card-actions">
                <button onclick={(e) => { e.stopPropagation(); goto(`/business/company/${$page.params.id}/factory/${factory.id}`); }}>자세히보기</button>
                <div class="v-divider"></div>
                {#if factory.status === 'RUNNING' || factory.status === 'OPERATING'}
                  <button onclick={(e) => { e.stopPropagation(); handlePause(factory.id); }}>일시정지</button>
                {:else}
                  <button onclick={(e) => { e.stopPropagation(); handleResume(factory.id); }}>재가동</button>
                {/if}
                <div class="v-divider"></div>
                <button onclick={(e) => { e.stopPropagation(); toast.info('업그레이드 기능은 준비 중입니다.'); }}>업그레이드</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

</div>

<style>
  * { box-sizing: border-box; }

  .page-container {
    background-color: var(--color-bg-0);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--color-text);
  }

  .loading-state,
  .error-state,
  .empty-state {
    text-align: center;
    padding: 60px 0;
    color: var(--color-text-gray);
    font-size: 15px;
  }
  .error-state { color: var(--color-negative); }

  .text-green { color: #10b981; }

  .card {
    background: var(--color-bg-1);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  .page-header { margin-bottom: 24px; }
  .page-header h1 { font-size: 26px; font-weight: 700; margin: 0; }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 32px;
  }

  .stat-card { padding: var(--card-padding); }
  .stat-label { font-size: var(--stat-label-size); color: var(--stat-label-color); font-weight: 500; margin-bottom: 0.5rem; }
  .stat-content { display: flex; align-items: baseline; gap: 0.5rem; }
  .stat-value { font-size: var(--stat-value-size); font-weight: var(--stat-value-weight); color: var(--color-text); }
  .stat-unit { font-size: 1rem; font-weight: var(--stat-change-weight); margin-left: 4px; }

  .location-card {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 24px;
    margin-bottom: 40px;
    padding: 24px;
  }

  .map-section-inner {
    height: 350px;
    border-radius: 12px;
    overflow: hidden;
    z-index: 0;
  }
  :global(.region-tooltip) {
    font-size: 13px !important;
    font-weight: 600 !important;
    padding: 4px 10px !important;
    border-radius: 6px !important;
  }

  .no-factory-card {
    padding: 40px;
    text-align: center;
    color: var(--color-text-gray);
    margin-bottom: 40px;
  }

  .detail-section {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .detail-header { margin-bottom: 20px; }
  .detail-header h2 { font-size: 20px; font-weight: 700; margin: 0 0 12px 0; }

  .tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag {
    font-size: 12px;
    color: var(--color-text-gray);
    background-color: #F3F4F6;
    padding: 6px 14px;
    border-radius: 9999px;
    font-weight: 600;
    border: 1px solid #E3E9F1;
  }

  .status-tag.running { background-color: #dcfce7; color: #16a34a; border-color: #bbf7d0; }
  .status-tag.paused { background-color: #fef9c3; color: #a16207; border-color: #fef08a; }

  .info-table { display: flex; flex-direction: column; gap: 12px; }
  .info-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
  .info-row .label { color: var(--color-text-gray); display: flex; align-items: center; gap: 8px; }
  .info-row .icon { font-size: 14px; width: 16px; text-align: center; }
  .info-row .val { font-weight: 600; color: var(--color-text); }
  .divider { height: 1px; background-color: var(--color-border); width: 100%; }

  .detail-actions {
    margin-top: 20px;
    display: flex;
    gap: 12px;
  }

  .btn-pause, .btn-resume {
    flex: 1;
    padding: 10px;
    border-radius: 6px;
    border: none;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
  }
  .btn-pause { background: #fef9c3; color: #a16207; }
  .btn-pause:hover { background: #fef08a; }
  .btn-resume { background: #dcfce7; color: #16a34a; }
  .btn-resume:hover { background: #bbf7d0; }

  .list-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 20px;
  }
  .header-left { display: flex; align-items: center; gap: 24px; }
  .header-left h2 { font-size: 20px; font-weight: 700; margin: 0; }

  .filter-group { display: flex; gap: 8px; }
  .filter-btn {
    background: var(--color-bg-2); border: none; padding: 8px 16px;
    border-radius: 6px; font-size: 13px; font-weight: 600; color: var(--color-text-gray);
    cursor: pointer; transition: 0.2s;
  }
  .filter-btn.active { background-color: #dbeafe; color: #2563eb; }
  .filter-btn:hover { background-color: var(--color-border); }

  .btn-primary {
    background-color: var(--color-theme-1); color: white; border: none;
    padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;
    cursor: pointer;
  }
  .btn-primary:hover { opacity: 0.9; }

  .factory-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;
  }

  .factory-card {
    display: flex; flex-direction: column; overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .factory-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  .factory-card.selected { border-color: var(--color-theme-1); box-shadow: 0 0 0 2px rgba(0, 82, 155, 0.15); }

  .f-header {
    padding: 24px 24px 16px 24px;
    display: flex; gap: 16px; align-items: flex-start;
  }
  .f-icon {
    width: 48px; height: 48px;
    display: flex; justify-content: center; align-items: center;
    font-size: 24px; background-color: var(--color-bg-2);
    border: 1px solid var(--color-border); border-radius: 8px;
    flex-shrink: 0;
  }
  .f-header h3 { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; }
  .location-sub { font-size: 13px; color: var(--color-text-gray); margin: 0; }

  .status-badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 9999px;
    flex-shrink: 0;
  }
  .status-badge.running { background: #dcfce7; color: #16a34a; }
  .status-badge.paused { background: #fef9c3; color: #a16207; }

  .f-stats {
    padding: 0 24px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px 32px;
    margin-bottom: 20px;
  }
  .f-stat-item { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; }
  .f-stat-item .lbl { color: var(--color-text-gray); }
  .f-stat-item .val { font-weight: 600; color: var(--color-text); }

  .efficiency-area { padding: 0 24px 16px 24px; }
  .efficiency-area .lbl { display: block; font-size: 13px; color: var(--color-text-gray); margin-bottom: 6px; font-weight: 500; }

  .progress-bg {
    width: 100%; height: 8px; background-color: var(--color-bg-2);
    border-radius: 4px; overflow: hidden;
  }
  .progress-fill {
    height: 100%; background-color: var(--color-theme-1);
    border-radius: 4px;
  }

  .card-actions {
    display: flex;
    margin: 0 24px 24px 24px;
    border-radius: 12px;
    background-color: var(--color-bg-2);
    overflow: hidden;
  }
  .card-actions button {
    flex: 1; border: none; background: transparent; padding: 16px;
    font-size: 13px; font-weight: 500; color: var(--color-text-gray); cursor: pointer;
    transition: background 0.2s;
  }
  .card-actions button:hover { background-color: var(--color-bg-1); color: var(--color-text); font-weight: 600; }
  .card-actions button:first-child { border-radius: 12px 0 0 12px; }
  .card-actions button:last-of-type { border-radius: 0 12px 12px 0; }

  .v-divider { width: 1px; background-color: #000000; margin: 12px 0; }

  @media (max-width: 1024px) {
    .stats-grid { grid-template-columns: 1fr; }
    .location-card { grid-template-columns: 1fr; }
    .map-section-inner { height: 250px; }
    .factory-grid { grid-template-columns: 1fr; }
    .list-header { flex-direction: column; align-items: flex-start; gap: 16px; }
    .filter-group { overflow-x: auto; max-width: 100%; padding-bottom: 4px; }
  }
</style>
