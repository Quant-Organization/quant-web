<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import {
    getFactoryDetail,
    pauseFactory,
    resumeFactory,
    adjustProduction,
    deleteFactory,
    type FactoryResponse
  } from '$lib/api/factory';
  import {
    getFactoryProduction,
    setFactoryProduction,
    removeFactoryProduction,
    getProductsByCategory,
    getAvailableProducts,
    setAutoSell,
    type FactoryProductResponse,
    type ProductResponse
  } from '$lib/api/product';
  import { getCompanyDetail } from '$lib/api/company';
  import { friendlyError } from '$lib/api/config';
  import { getResearchEffects, type CompletedResearchResponse } from '$lib/api/research';
  import SkeletonTable from '$lib/components/SkeletonTable.svelte';
  import { toast } from 'svelte-sonner';
  import factoryIcon from '$lib/images/factory_icon.svg';
  import { REGION_CENTERS } from '$lib/constants';

  const regionCenters = REGION_CENTERS;

  let mapContainer = $state<HTMLDivElement>(null!);
  let mapInitialized = $state(false);
  let leafletMap: any;

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

  // --- State ---
  let factory = $state<FactoryResponse | null>(null);
  let loading = $state(true);
  let error = $state('');
  let actionLoading = $state(false);

  // Production state
  let factoryProductions = $state<FactoryProductResponse[]>([]);
  let availableProducts = $state<ProductResponse[]>([]);
  let selectedProductId = $state<number | null>(null);
  let newMonthlyProduction = $state(1000);
  let productionLoading = $state(false);
  let rndEffects = $state<CompletedResearchResponse[]>([]);
  let productCategories = $state<string[]>([]);
  let selectedProductCategory = $state<string | null>(null);
  let filteredProducts = $state<ProductResponse[]>([]);
  let showProductSelector = $state(false);

  const companyId = $derived($page.params.id);
  const factoryId = $derived(Number($page.params.factoryId));

  // 생산량 조절 슬라이더 (0% ~ 100%)
  let productionPercent = $state(100);
  let sliderPercent = $derived(productionPercent);

  // 숫자 포맷팅 유틸
  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    return dateStr.split('T')[0].replace(/-/g, '.');
  }

  const fmtMoney = (n: number) => `$${n.toLocaleString()}`;
  const fmtSimple = (n: number) => n.toLocaleString();
  const fmtUnit = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  const gradeNames: Record<string, string> = {
    WORKSHOP: '공방', SMALL: '소형 공장', MEDIUM: '중형 공장', LARGE: '대형 공장',
    INDUSTRIAL: '산업 단지', MEGA: '메가 팩토리', GIGA: '기가 팩토리'
  };

  let isRunning = $derived(factory?.status === 'OPERATING');
  let isUnderConstruction = $derived(factory?.status === 'CONSTRUCTING');

  let constructionProgress = $derived(() => {
    if (!factory?.constructionStartDate || !factory?.constructionEndDate) return 0;
    const start = new Date(factory.constructionStartDate).getTime();
    const end = new Date(factory.constructionEndDate).getTime();
    const now = Date.now();
    if (end <= start) return 100;
    return Math.min(Math.max(((now - start) / (end - start)) * 100, 0), 100);
  });

  let daysRemaining = $derived(() => {
    if (!factory?.constructionEndDate) return 0;
    const end = new Date(factory.constructionEndDate).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 0);
  });

  let chartMetrics = $derived(factory ? [
    { label: '생산 가동률', value: factory.baseMonthlyProduction > 0 ? Math.min((factory.currentMonthlyProduction / factory.baseMonthlyProduction) * 100, 100) : 0, color: '#00529B', display: `${fmtUnit(factory.currentMonthlyProduction)} / ${fmtUnit(factory.baseMonthlyProduction)}` },
    { label: '효율', value: Math.min(factory.efficiency ?? 0, 100), color: '#10b981', display: `${(factory.efficiency ?? 0).toFixed(1)}%` },
    { label: '창고 사용률', value: factory.warehouseCapacity > 0 ? Math.min((factory.currentInventory / factory.warehouseCapacity) * 100, 100) : 0, color: '#f59e0b', display: `${fmtUnit(factory.currentInventory)} / ${fmtUnit(factory.warehouseCapacity)}` },
    { label: '월 수익률', value: factory.monthlyRevenue > 0 ? Math.min(Math.abs(factory.monthlyNetIncome / factory.monthlyRevenue) * 100, 100) : 0, color: factory.monthlyNetIncome >= 0 ? '#10b981' : '#ef4444', display: `${factory.monthlyNetIncome >= 0 ? '+' : ''}${fmtMoney(factory.monthlyNetIncome)}` }
  ] : []);

  let totalOpex = $derived(factory
    ? factory.monthlyLaborCost + factory.monthlyMaterialCost + factory.monthlyElectricityCost
    : 0);

  onMount(async () => {
    try {
      [factory] = await Promise.all([
        getFactoryDetail(factoryId),
      ]);
      const company = await getCompanyDetail(factory!.companyId);
      await Promise.all([
        loadFactoryProductions(),
        getResearchEffects(factory!.companyId).then(e => { rndEffects = e; }).catch(() => {}),
        getAvailableProducts(company.companyType).then(p => {
          availableProducts = p;
          filteredProducts = p;
          productCategories = [...new Set(p.map(prod => prod.category || 'ALL'))];
        }).catch(() => {}),
      ]);
    } catch (e: any) {
      error = e.message || '공장 데이터를 불러오지 못했습니다.';
    } finally {
      loading = false;
    }
  });

  $effect(() => {
    if (mapContainer && factory && !mapInitialized) {
      initMap(factory.regionName);
    }
  });

  async function loadFactoryProductions() {
    try { factoryProductions = await getFactoryProduction(factoryId); } catch { /* ignore */ }
  }

  async function selectCategory(cat: string | null) {
    selectedProductCategory = cat;
    if (cat === null) {
      filteredProducts = availableProducts;
    } else {
      try {
        filteredProducts = await getProductsByCategory(cat);
      } catch {
        filteredProducts = availableProducts.filter(p => p.category === cat);
      }
    }
  }

  async function handleSetProduction() {
    if (!selectedProductId || productionLoading || !factory) return;
    if (factoryProductions.length > 0) {
      const currentProduct = factoryProductions.find(fp => fp.isActive);
      if (currentProduct && currentProduct.product.id !== selectedProductId) {
        const confirmed = confirm(`현재 생산 중인 "${currentProduct.product.name}"이(가) 비활성화됩니다. 계속하시겠습니까?`);
        if (!confirmed) return;
      }
    }
    productionLoading = true;
    try {
      await setFactoryProduction(factoryId, { productId: selectedProductId, monthlyProduction: factory.baseMonthlyProduction });
      await loadFactoryProductions();
      showProductSelector = false;
      selectedProductId = null;
      toast.success('생산 설정이 완료되었습니다.');
    } catch (e: any) {
      toast.error(friendlyError(e, '생산 설정에 실패했습니다.'));
    } finally {
      productionLoading = false;
    }
  }

  async function handleRemoveProduction(productId: number) {
    if (productionLoading) return;
    productionLoading = true;
    try {
      await removeFactoryProduction(factoryId, productId);
      await loadFactoryProductions();
      toast.success('생산 항목이 제거되었습니다.');
    } catch (e: any) {
      toast.error(friendlyError(e, '생산 중지에 실패했습니다.'));
    } finally {
      productionLoading = false;
    }
  }

  async function handleTogglePause() {
    if (!factory || actionLoading) return;
    actionLoading = true;
    try {
      if (isRunning) {
        await pauseFactory(factory.id);
      } else {
        await resumeFactory(factory.id);
      }
      factory = await getFactoryDetail(factoryId);
    } catch (e: any) {
      toast.error(friendlyError(e, '작업에 실패했습니다.'));
    } finally {
      actionLoading = false;
    }
  }

  async function handleAdjustProduction() {
    if (!factory || actionLoading) return;
    actionLoading = true;
    try {
      await adjustProduction(factory.id, productionPercent);
      factory = await getFactoryDetail(factoryId);
    } catch (e: any) {
      toast.error(friendlyError(e, '생산량 조절에 실패했습니다.'));
    } finally {
      actionLoading = false;
    }
  }

  async function handleToggleAutoSell(productId: number, currentEnabled: boolean) {
    if (productionLoading) return;
    productionLoading = true;
    try {
      await setAutoSell(factoryId, productId, !currentEnabled);
      await loadFactoryProductions();
      toast.success(!currentEnabled ? '자동판매가 활성화되었습니다.' : '자동판매가 비활성화되었습니다.');
    } catch (e: any) {
      toast.error(friendlyError(e, '자동판매 설정에 실패했습니다.'));
    } finally {
      productionLoading = false;
    }
  }

  async function handleDeleteFactory() {
    if (!factory) return;
    const salePrice = factory.constructionCost * 0.5;
    const confirmed = confirm(`정말로 공장을 매각하시겠습니까?\n예상 매각 금액: ${fmtMoney(salePrice)}`);
    if (!confirmed) return;
    actionLoading = true;
    try {
      await deleteFactory(factory.id);
      toast.success('공장이 매각되었습니다.');
      goto(`/business/company/${companyId}/factory`);
    } catch (e: any) {
      toast.error(friendlyError(e, '매각에 실패했습니다.'));
      actionLoading = false;
    }
  }

  onDestroy(() => {
    leafletMap?.remove();
  });
</script>

<svelte:head>
  <title>{factory?.name ?? '공장'} - 상세 정보</title>
</svelte:head>

<div class="page-container">

  {#if loading}
    <SkeletonTable rows={5} cols={3} />
  {:else if error}
    <div class="error-msg">{error}</div>
  {:else if factory}

  <div class="page-header">
    <div class="header-icon"><img src={factoryIcon} alt="공장" class="header-icon-img" /></div>
    <div class="header-text">
      <h1>{factory.name}</h1>
      <p class="sub-text">{factory.regionName}</p>
      <p class="meta-text">완공일: {formatDate(factory.constructionEndDate)} · 등급: {gradeNames[factory.grade] ?? factory.grade}</p>
    </div>
    <div class="status-badge" class:running={isRunning && !isUnderConstruction} class:paused={!isRunning && !isUnderConstruction} class:constructing={isUnderConstruction}>
      {isUnderConstruction ? '건설 중' : isRunning ? '가동중' : '일시정지'}
    </div>
  </div>

  {#if isUnderConstruction}
  <div class="construction-wrapper">
    <div class="construction-banner">
      <div class="barricade-stripe"></div>
      <div class="construction-body">
        <div class="construction-icon">🏗️</div>
        <div class="construction-text">
          <h2>공사 진행 중</h2>
          <p class="construction-sub">건설 완료까지 <strong>{daysRemaining()}</strong>일 남음</p>
        </div>
      </div>
      <div class="barricade-stripe"></div>
    </div>

    <div class="construction-info-grid">
      <div class="card construction-detail-card">
        <h3>공장 정보</h3>
        <div class="info-list">
          <div class="info-row">
            <span class="lbl"><img src={factoryIcon} alt="공장" class="lbl-icon" /> 공장 등급</span>
            <span class="val">{gradeNames[factory.grade] ?? factory.grade}</span>
          </div>
          <div class="info-row">
            <span class="lbl">📍 지역</span>
            <span class="val">{factory.regionName}</span>
          </div>
          <div class="info-row">
            <span class="lbl">💰 건설 비용</span>
            <span class="val">{fmtMoney(factory.constructionCost)}</span>
          </div>
          <div class="info-row">
            <span class="lbl">👥 예정 직원 수</span>
            <span class="val">{fmtSimple(factory.employeeCount)}명</span>
          </div>
          <div class="info-row">
            <span class="lbl">📦 기본 생산량</span>
            <span class="val">{fmtUnit(factory.baseMonthlyProduction)} Units/월</span>
          </div>
        </div>
      </div>

      <div class="card construction-progress-card">
        <h3>건설 진행 현황</h3>
        <div class="progress-dates">
          <div class="date-item">
            <span class="date-lbl">착공일</span>
            <span class="date-val">{formatDate(factory.constructionStartDate)}</span>
          </div>
          <div class="date-arrow">→</div>
          <div class="date-item">
            <span class="date-lbl">완공 예정일</span>
            <span class="date-val">{formatDate(factory.constructionEndDate)}</span>
          </div>
        </div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: {constructionProgress()}%"></div>
          </div>
          <div class="progress-pct">{constructionProgress().toFixed(1)}% 완료</div>
        </div>
        <div class="days-remaining-box">
          <span class="days-lbl">건설 완료까지</span>
          <span class="days-val">{daysRemaining()}일</span>
          <span class="days-lbl">남음</span>
        </div>
      </div>
    </div>

    <div class="construction-actions">
      <button class="btn btn-red" onclick={handleDeleteFactory} disabled={actionLoading}>공장 매각</button>
    </div>
  </div>
  {:else}
  <div class="grid-layout">

    <div class="card location-card">
      <div class="map-section" bind:this={mapContainer}></div>
      <div class="summary-section">
        <div class="card-header">
          <h3>{factory.name} - {factory.regionName}</h3>
          <div class="tags">
            <span class="tag">{factory.companyName}</span>
            <span class="tag">{gradeNames[factory.grade] ?? factory.grade}</span>
            <span class="tag">{factory.regionName}</span>
          </div>
        </div>
        <div class="info-list">
          <div class="info-row">
            <span class="lbl"><img src={factoryIcon} alt="공장" class="lbl-icon" /> 공장 등급</span>
            <span class="val">{gradeNames[factory.grade] ?? factory.grade}</span>
          </div>
          <div class="info-row">
            <span class="lbl">👤 직원 수</span>
            <span class="val">{fmtSimple(factory.employeeCount)}명</span>
          </div>
          <div class="info-row">
            <span class="lbl">📦 월 생산량</span>
            <span class="val">{fmtUnit(factory.currentMonthlyProduction)} Units</span>
          </div>
          <div class="info-row">
            <span class="lbl">⚡ 효율</span>
            <span class="val">{(factory.efficiency ?? 0).toFixed(1)}%</span>
          </div>
          <div class="info-row">
            <span class="lbl">📦 재고 / 창고</span>
            <span class="val">{fmtUnit(factory.currentInventory)} / {fmtUnit(factory.warehouseCapacity)}</span>
          </div>
          <div class="info-row">
            <span class="lbl">📅 완공일</span>
            <span class="val">{formatDate(factory.constructionEndDate)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card chart-card">
      <h3>공장 현황</h3>
      <div class="chart-stats">
        <div class="stat-item">
          <span class="s-lbl">기본 생산량</span>
          <span class="s-val">{fmtUnit(factory.baseMonthlyProduction)}</span>
        </div>
        <div class="stat-item">
          <span class="s-lbl">현재 생산량</span>
          <span class="s-val text-green">{fmtUnit(factory.currentMonthlyProduction)}</span>
        </div>
        <div class="stat-item">
          <span class="s-lbl">효율</span>
          <span class="s-val">{(factory.efficiency ?? 0).toFixed(1)}%</span>
        </div>
        <div class="stat-item">
          <span class="s-lbl">재고량</span>
          <span class="s-val">{fmtUnit(factory.currentInventory)}</span>
        </div>
      </div>

      <div class="chart-container">
        <svg viewBox="0 0 600 200" class="factory-chart-svg">
          {#each chartMetrics as m, i}
            {@const y = 20 + i * 44}
            {@const barAreaW = 370}
            <text x={82} y={y + 19} class="chart-bar-label">{m.label}</text>
            <rect x={90} y={y} width={barAreaW} height={28} rx="6" class="chart-bar-bg" />
            <rect x={90} y={y} width={Math.max(barAreaW * (Math.abs(m.value) / 100), 4)} height={28} rx="6" fill={m.color} opacity="0.85">
              <animate attributeName="width" from="0" to={Math.max(barAreaW * (Math.abs(m.value) / 100), 4)} dur="0.6s" fill="freeze" />
            </rect>
            <text x={102} y={y + 19} class="chart-bar-pct">{Math.abs(m.value).toFixed(1)}%</text>
            <text x={472} y={y + 19} class="chart-bar-value">{m.display}</text>
          {/each}
        </svg>
      </div>
    </div>

    <div class="card control-card">
      <h3>생산량 조절</h3>
      <p class="card-desc">생산 비율을 조절하여 생산량과 운영비를 관리하세요.</p>

      <div class="slider-wrapper">
        <div class="slider-labels">
          <span>0%</span>
          <span>100%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step="5"
          bind:value={productionPercent}
          style="background: linear-gradient(to right, #0f4c81 0%, #0f4c81 {sliderPercent}%, var(--color-border) {sliderPercent}%, var(--color-border) 100%);"
        />
      </div>

      <div class="stats-grid">
        <div class="s-box">
          <span class="l">생산성/인당</span>
          <span class="v">{factory.employeeCount > 0 ? fmtUnit(Math.round(factory.currentMonthlyProduction / factory.employeeCount)) : '0'} <span class="unit">Units</span></span>
        </div>
        <div class="s-box">
          <span class="l">평균 임금</span>
          <span class="v">{factory.employeeCount > 0 ? fmtMoney(Math.round(factory.monthlyLaborCost / factory.employeeCount)) : '-'}</span>
        </div>
        <div class="s-box">
          <span class="l">총 인건비</span>
          <span class="v">{fmtMoney(factory.monthlyLaborCost)}</span>
        </div>
        <div class="s-box">
          <button class="btn-adjust" onclick={handleAdjustProduction} disabled={actionLoading}>
            {actionLoading ? '처리중...' : '적용'}
          </button>
        </div>
      </div>
    </div>

    <div class="card rnd-card">
      <h3>적용된 R&D 효과</h3>
      {#if rndEffects.length > 0}
        <div class="rnd-list">
          {#each rndEffects as effect}
            <div class="rnd-item">
              <div class="rnd-icon">
                {#if effect.effectType === 'REDUCE_LABOR' || effect.effectType === 'INCREASE_PRODUCTION' || effect.effectType === 'INCREASE_MAX_PRODUCTION'}📈
                {:else if effect.effectType === 'REDUCE_ELECTRICITY_COST' || effect.effectType === 'REDUCE_MATERIAL_COST' || effect.effectType === 'REDUCE_SHIPPING_COST'}💰
                {:else if effect.effectType === 'REDUCE_DEFECT_RATE' || effect.effectType === 'INCREASE_PRODUCT_PRICE' || effect.effectType === 'INCREASE_BRAND_VALUE' || effect.effectType === 'INCREASE_QUALITY_SCORE'}✨
                {:else if effect.effectType === 'INCREASE_WAREHOUSE_CAPACITY'}📦
                {:else}🔬
                {/if}
              </div>
              <div class="rnd-info">
                <div class="rnd-head">
                  <span class="rnd-name">{effect.project.name}</span>
                  <span class="rnd-badge" class:active={effect.isActive}>{effect.isActive ? '활성' : '비활성'}</span>
                </div>
                <div class="rnd-desc text-green">{effect.effectDescription || effect.effectTypeName}</div>
                <div class="rnd-meta">효과 +{effect.effectValue}% · {effect.completedDate?.split('T')[0] ?? ''}</div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="rnd-empty">적용된 R&D 효과가 없습니다. R&D 센터에서 연구를 진행해보세요.</div>
      {/if}
    </div>

    <div class="card finance-container">
      <div class="finance-card">
        <h3>재무 상태</h3>
        <div class="finance-row">

          <div class="f-col">
            <h4>월 운영비 상세</h4>
            <div class="f-item">
              <span>인건비</span> <span>{fmtMoney(factory.monthlyLaborCost)}</span>
            </div>
            <div class="f-item">
              <span>자재비</span> <span>{fmtMoney(factory.monthlyMaterialCost)}</span>
            </div>
            <div class="f-item">
              <span>전기세</span> <span>{fmtMoney(factory.monthlyElectricityCost)}</span>
            </div>
            <div class="f-divider"></div>
            <div class="f-item total">
              <span>총계</span> <span class="text-red">-{fmtMoney(totalOpex)}</span>
            </div>
          </div>

          <div class="f-col">
            <h4>수익성 지표</h4>
            <div class="f-item">
              <span>월 매출</span> <span>{fmtMoney(factory.monthlyRevenue)}</span>
            </div>
            <div class="f-item">
              <span>운영비</span> <span class="text-red">-{fmtMoney(totalOpex)}</span>
            </div>
            <div class="f-divider"></div>
            <div class="f-item total">
              <span>월 순수익</span>
              <span class="text-profit">
                {factory.monthlyNetIncome >= 0 ? '+' : ''}{fmtMoney(factory.monthlyNetIncome)}
              </span>
            </div>
          </div>

        </div>
      </div>

      <div class="action-buttons">
        <button class="btn btn-yellow" onclick={handleTogglePause} disabled={actionLoading}>
          {isRunning ? '일시중지' : '재가동'}
        </button>
        <button class="btn btn-red" onclick={handleDeleteFactory} disabled={actionLoading}>공장 매각</button>
      </div>
    </div>

    <div class="card production-card">
      <h3>생산 관리</h3>

      {#if factoryProductions.length > 0}
        {@const fp = factoryProductions[0]}
        <div class="prod-current">
          <div class="prod-current-header">
            <img src={fp.product.imageUrl || ''} alt={fp.product.name} class="prod-current-thumb" />
            <div class="prod-current-info">
              <span class="prod-current-name">{fp.product.name} <span class="prod-quality-badge">{fp.baseQualityGrade}</span></span>
              <span class="prod-current-price">{fmtMoney(fp.product.baseUnitPrice)} · 마진 {fmtMoney(fp.product.baseUnitPrice - fp.product.productionCostPerUnit)}</span>
            </div>
            <div class="prod-current-actions">
              <button
                class="btn-auto-sell"
                class:enabled={fp.autoSellEnabled}
                onclick={() => handleToggleAutoSell(fp.product.id, fp.autoSellEnabled)}
                disabled={productionLoading}
              >
                {fp.autoSellEnabled ? '자동판매 ON' : '자동판매 OFF'}
              </button>
              <button class="btn-prod-remove" onclick={() => handleRemoveProduction(fp.product.id)} disabled={productionLoading}>생산 중지</button>
            </div>
          </div>

          <div class="prod-current-stats">
            <div class="prod-stat-box">
              <span class="prod-stat-label">월 생산량</span>
              <span class="prod-stat-value">{fmtUnit(fp.currentMonthlyProduction)} <span class="prod-stat-cap">/ {fmtUnit(fp.monthlyProductionCapacity)}</span></span>
            </div>
            <div class="prod-stat-box">
              <span class="prod-stat-label">총 재고</span>
              <span class="prod-stat-value">{fmtSimple(fp.currentInventory)}</span>
            </div>
          </div>

          <div class="prod-current-grades">
            <span class="prod-grades-label">등급별 재고</span>
            <div class="prod-grades">
              <span class="grade grade-a">A {fmtSimple(fp.inventoryGradeA)}</span>
              <span class="grade grade-b">B {fmtSimple(fp.inventoryGradeB)}</span>
              <span class="grade grade-c">C {fmtSimple(fp.inventoryGradeC)}</span>
              <span class="grade grade-d">D {fmtSimple(fp.inventoryGradeD)}</span>
            </div>
          </div>

          <button class="btn-change-product" onclick={() => { showProductSelector = true; }}>상품 변경</button>
        </div>
      {:else}
        <div class="prod-empty-state">
          <p>현재 생산 중인 상품이 없습니다.</p>
          <button class="btn-prod-add" onclick={() => { showProductSelector = true; }}>상품 선택</button>
        </div>
      {/if}

      {#if showProductSelector}
        <div class="prod-selector">
          <div class="prod-selector-header">
            <h4>{factoryProductions.length > 0 ? '생산 상품 변경' : '생산 상품 선택'}</h4>
            {#if factoryProductions.length > 0}
              <button class="prod-selector-close" onclick={() => { showProductSelector = false; }}>취소</button>
            {/if}
          </div>
          <div class="cat-filters">
            <button class:active={selectedProductCategory === null} onclick={() => selectCategory(null)}>전체</button>
            {#each productCategories as cat}
              <button class:active={selectedProductCategory === cat} onclick={() => selectCategory(cat)}>{cat}</button>
            {/each}
          </div>
          <div class="prod-add-row">
            <select class="prod-select" bind:value={selectedProductId}>
              <option value={null}>상품 선택...</option>
              {#each filteredProducts as p}
                <option value={p.id}>{p.name} ({fmtMoney(p.baseUnitPrice)})</option>
              {/each}
            </select>
            <button class="btn-prod-add" onclick={handleSetProduction} disabled={!selectedProductId || productionLoading}>
              {productionLoading ? '처리중...' : '생산 시작'}
            </button>
          </div>
          {#if selectedProductId}
            {@const sp = filteredProducts.find(p => p.id === selectedProductId)}
            {#if sp}
              <div class="prod-detail-panel">
                <img src={sp.imageUrl || ''} alt={sp.name} class="prod-detail-img" />
                <div class="prod-detail-info">
                  <p class="prod-detail-name">{sp.name}</p>
                  <p class="prod-detail-desc">{sp.description || ''}</p>
                  <div class="prod-detail-stats">
                    <span>기본가격: <strong>{fmtMoney(sp.baseUnitPrice)}</strong></span>
                    <span>생산비용: <strong>{fmtMoney(sp.productionCostPerUnit)}</strong></span>
                    <span>필요레벨: <strong>Lv.{sp.requiredLevel}</strong></span>
                  </div>
                </div>
              </div>
            {/if}
          {/if}
        </div>
      {/if}
    </div>

  </div>
  {/if}
  {/if}
</div>

<style>
  /* --- Base --- */
  * { box-sizing: border-box; }
  .page-container {
    background-color: var(--color-bg-0);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--color-text);
  }

  .loading-msg, .error-msg { text-align: center; padding: 60px 20px; font-size: 16px; }
  .error-msg { color: #ef4444; }

  /* --- Header --- */
  .page-header { display: flex; gap: 16px; margin-bottom: 24px; align-items: flex-start; }

  .status-badge {
    margin-left: auto; padding: 6px 16px; border-radius: 20px;
    font-size: 13px; font-weight: 600; white-space: nowrap;
  }
  .status-badge.running { background: #dcfce7; color: #166534; }
  .status-badge.paused { background: #fef3c7; color: #92400e; }
  .status-badge.constructing { background: #fed7aa; color: #9a3412; }
  .header-icon {
    width: 64px; height: 64px; background: var(--color-bg-2); border-radius: 8px;
    font-size: 32px; display: flex; align-items: center; justify-content: center;
  }
  .header-icon-img { width: 2rem; height: 2rem; }
  .lbl-icon { width: 1rem; height: 1rem; vertical-align: middle; }
  .header-text h1 { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; }
  .sub-text { margin: 0 0 4px 0; font-size: 14px; color: var(--color-text-gray); }
  .meta-text { margin: 0; font-size: 13px; color: var(--color-text-gray); }

  /* --- Grid Layout --- */
  .grid-layout {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 20px;
  }

  .card {
    background: var(--color-bg-1); border: 1px solid var(--color-border); border-radius: 12px;
    padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }
  .card h3 { font-size: 18px; font-weight: 700; margin: 0 0 20px 0; }

  /* --- Location Card (Map + Summary Combined) --- */
  .location-card {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 24px;
    padding: 24px;
  }
  .map-section {
    height: 320px;
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
  .summary-section {
    display: flex;
    flex-direction: column;
  }
  .summary-section .card-header {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 16px;
    margin-bottom: 16px;
  }
  .tags { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .tag {
    background: #F3F4F6;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 12px;
    color: var(--color-text-gray);
    font-weight: 600;
    border: 1px solid #E3E9F1;
  }
  .info-list { display: flex; flex-direction: column; gap: 0; }
  .info-row {
    display: flex; justify-content: space-between; font-size: 14px;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .info-row:last-child { border-bottom: none; }
  .info-row .lbl { color: var(--color-text-gray); font-weight: 500; display: flex; align-items: center; gap: 6px; }
  .info-row .val { font-weight: 600; color: var(--color-text); }

  /* --- Chart Card --- */
  .chart-stats { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .stat-item { display: flex; flex-direction: column; }
  .s-lbl { font-size: var(--stat-label-size); color: var(--stat-label-color); margin-bottom: 0.5rem; }
  .s-val { font-size: var(--stat-value-size); font-weight: var(--stat-value-weight); color: var(--color-text); }

  .chart-container {
    background: var(--color-bg-2, #f9fafb);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.75rem;
  }
  .factory-chart-svg { width: 100%; height: auto; display: block; }
  .chart-bar-label { font-size: 13px; fill: var(--color-text-gray); font-weight: 600; text-anchor: end; }
  .chart-bar-bg { fill: var(--color-border, #e5e7eb); }
  .chart-bar-pct { font-size: 12px; fill: white; font-weight: 700; }
  .chart-bar-value { font-size: 13px; fill: var(--color-text); font-weight: 700; }
  .text-green { color: #10b981; }

  /* --- Control Card (Slider) --- */
  .card-desc { font-size: 13px; color: var(--color-text-gray); margin-bottom: 16px; margin-top: -12px; }
  .slider-wrapper { position: relative; padding: 8px 0; margin-bottom: 24px; }
  .slider-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--color-text-gray); margin-bottom: 8px; }

  input[type=range] {
    width: 100%; -webkit-appearance: none; height: 6px; border-radius: 3px; outline: none;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #0f4c81; cursor: pointer; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .stats-grid { display: flex; justify-content: space-between; }
  .s-box { display: flex; flex-direction: column; }
  .s-box .l { font-size: 12px; color: var(--color-text-gray); margin-bottom: 4px; }
  .s-box .v { font-size: 16px; font-weight: 700; color: var(--color-text); }
  .s-box .v.large { font-size: 18px; }
  .unit { font-size: 11px; color: var(--color-text-gray); font-weight: normal; }

  /* --- R&D Card --- */
  .rnd-list { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .rnd-item { display: flex; align-items: center; gap: 12px; }
  .rnd-icon {
    width: 40px; height: 40px; background: #f0fdf4; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 20px;
  }
  .rnd-info { flex: 1; }
  .rnd-head { margin-bottom: 2px; }
  .rnd-name { font-size: 14px; font-weight: 600; }
  .rnd-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; background: #dcfce7; color: #166534; }
  .rnd-badge:not(.active) { background: #f3f4f6; color: #6b7280; }
  .rnd-desc { font-size: 12px; font-weight: 600; }
  .rnd-meta { font-size: 11px; color: var(--color-text-gray); margin-top: 2px; }
  .rnd-empty { text-align: center; padding: 24px 0; color: var(--color-text-gray); font-size: 13px; }
  .rnd-head { display: flex; align-items: center; gap: 8px; }

  /* --- Finance & Actions --- */
  .finance-container {
    background: transparent; border: none; padding: 0; box-shadow: none;
    display: flex; flex-direction: column; gap: 20px;
  }
  .finance-card {
    background: var(--color-bg-1); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px;
  }
  .finance-row { display: flex; gap: 32px; }
  .f-col { flex: 1; }
  .f-col h4 { font-size: 14px; color: var(--color-text); margin: 0 0 16px 0; font-weight: 600; }
  .f-item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: var(--color-text-gray); }
  .f-item span:last-child { font-weight: 600; color: var(--color-text); font-family: "Roboto", sans-serif; }

  .f-divider { border-top: 1px dashed var(--color-border); margin: 12px 0; }
  .f-item.total span:last-child { font-size: 15px; font-weight: 700; }

  .text-red { color: #ef4444 !important; }
  .text-profit { color: #13B981 !important; }

  /* Sale Info */
  .sale-info {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--color-bg-2); padding: 16px 20px; border-radius: 8px;
  }
  .sale-label { font-size: 14px; color: var(--color-text-gray); }
  .sale-value { font-size: 18px; font-weight: 700; color: var(--color-text); }

  /* Buttons */
  .action-buttons { display: flex; gap: 16px; }
  .btn {
    flex: 1; padding: 14px; border: none; border-radius: 8px;
    font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.2s;
  }
  .btn-yellow { background-color: #fef3c7; color: #92400e; }
  .btn-yellow:hover { background-color: #fde68a; }
  .btn-red { background-color: #fee2e2; color: #991b1b; }
  .btn-red:hover { background-color: #fecaca; }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-adjust {
    padding: 8px 24px; background: var(--color-theme-1); color: white;
    border: none; border-radius: 6px; font-weight: 600; font-size: 14px;
    cursor: pointer; transition: 0.2s;
  }
  .btn-adjust:hover { background: #0c3b66; }
  .btn-adjust:disabled { opacity: 0.6; cursor: not-allowed; }

  /* --- Responsive --- */
  @media (max-width: 1024px) {
    .grid-layout { grid-template-columns: 1fr; }
    .location-card { grid-template-columns: 1fr; }
    .map-section { height: 250px; }
    .summary-section { padding: 0; padding-top: 16px; }
  }
  @media (max-width: 600px) {
    .finance-row { flex-direction: column; gap: 24px; }
    .stats-grid { flex-direction: column; gap: 12px; }
  }

  .production-card { grid-column: 1 / -1; margin-top: 1.5rem; }

  /* --- 현재 생산 상품 카드 --- */
  .prod-current { display: flex; flex-direction: column; gap: 1rem; }
  .prod-current-header { display: flex; align-items: center; gap: 0.75rem; }
  .prod-current-thumb { width: 3rem; height: 3rem; object-fit: cover; border-radius: 8px; background: #e5e7eb; flex-shrink: 0; }
  .prod-current-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .prod-current-name { font-size: 1rem; font-weight: 700; }
  .prod-current-price { font-size: 0.8rem; color: var(--color-text-gray); }
  .prod-current-actions { display: flex; gap: 0.5rem; align-items: center; }
  .prod-current-stats { display: flex; gap: 1.5rem; padding: 0.75rem 1rem; background: var(--color-bg-2, #f9fafb); border-radius: 8px; border: 1px solid var(--color-border); }
  .prod-stat-box { display: flex; flex-direction: column; gap: 2px; }
  .prod-current-grades { display: flex; align-items: center; gap: 0.75rem; }
  .prod-grades-label { font-size: 0.75rem; color: var(--color-text-gray); font-weight: 600; white-space: nowrap; }
  .btn-change-product {
    align-self: flex-start; padding: 0.4rem 1rem; background: var(--color-bg-2); color: var(--color-text-gray);
    border: 1px solid var(--color-border); border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.2s;
  }
  .btn-change-product:hover { background: var(--color-border); }

  .prod-empty-state { text-align: center; padding: 2rem 0; }
  .prod-empty-state p { color: var(--color-text-gray); font-size: 0.875rem; margin-bottom: 1rem; }

  /* --- 상품 선택 패널 --- */
  .prod-selector { margin-top: 1rem; padding: 1rem; background: var(--color-bg-2, #f9fafb); border-radius: 8px; border: 1px solid var(--color-border); }
  .prod-selector-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
  .prod-selector-header h4 { font-size: 0.9rem; font-weight: 600; margin: 0; }
  .prod-selector-close { background: none; border: none; color: var(--color-text-gray); cursor: pointer; font-size: 0.8rem; font-weight: 600; }
  .prod-selector-close:hover { color: var(--color-text); }
  .prod-quality-badge {
    display: inline-block; font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.35rem;
    border-radius: 4px; background: #f3f4f6; color: #6b7280; vertical-align: middle; margin-left: 0.25rem;
  }
  .prod-stat { display: flex; flex-direction: column; gap: 2px; }
  .prod-stat-label { font-size: 0.7rem; color: var(--color-text-gray); }
  .prod-stat-value { font-size: 0.9rem; font-weight: 700; color: var(--color-text); }
  .prod-stat-cap { font-size: 0.75rem; font-weight: 500; color: var(--color-text-gray); }
  .prod-inv-total { font-size: 0.7rem; font-weight: 600; color: var(--color-text-gray); }
  .prod-grades { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .grade { font-size: 0.75rem; font-weight: 600; padding: 0.15rem 0.4rem; border-radius: 4px; }
  .grade-a { color: #166534; background: #dcfce7; }
  .grade-b { color: #1e40af; background: #dbeafe; }
  .grade-c { color: #92400e; background: #fef3c7; }
  .grade-d { color: #991b1b; background: #fee2e2; }
  .btn-auto-sell {
    padding: 0.3rem 0.75rem; border: 1px solid var(--color-border); border-radius: 6px;
    font-size: 0.8rem; font-weight: 600; cursor: pointer; background: #f3f4f6; color: #6b7280; transition: 0.2s; white-space: nowrap;
  }
  .btn-auto-sell.enabled { background: #dcfce7; color: #166534; border-color: #86efac; }
  .btn-auto-sell:hover:not(:disabled) { opacity: 0.8; }
  .btn-auto-sell:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-prod-remove { padding: 0.25rem 0.6rem; background: #fee2e2; color: #dc2626; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
  .prod-empty { color: #9ca3af; font-size: 0.875rem; margin: 0.5rem 0; }
  .prod-add h4 { font-size: 0.9rem; font-weight: 600; margin: 0 0 0.5rem; }
  .prod-add-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  .prod-select { flex: 2; padding: 0.4rem 0.6rem; border: 1px solid var(--color-border); border-radius: 6px; font-size: 0.875rem; }
  .prod-input { width: 8rem; padding: 0.4rem 0.6rem; border: 1px solid var(--color-border); border-radius: 6px; font-size: 0.875rem; }
  .btn-prod-add { padding: 0.4rem 1rem; background: var(--color-theme-1); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }
  .btn-prod-add:disabled { opacity: 0.6; cursor: not-allowed; }
  .cat-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 0.5rem; }
  .cat-filters button { padding: 3px 10px; border: 1px solid var(--color-border); border-radius: 12px; font-size: 11px; font-weight: 600; cursor: pointer; background: var(--color-bg-1); color: var(--color-text-gray); }
  .cat-filters button.active { background: var(--color-theme-1); color: white; border-color: var(--color-theme-1); }
  .prod-detail-panel { display: flex; gap: 0.75rem; align-items: flex-start; margin-top: 0.75rem; padding: 0.75rem; background: #f0f4ff; border-radius: 8px; border: 1px solid var(--color-border); }
  .prod-detail-img { width: 3.5rem; height: 3.5rem; object-fit: cover; border-radius: 6px; flex-shrink: 0; background: #e5e7eb; }
  .prod-detail-info { flex: 1; min-width: 0; }
  .prod-detail-name { font-weight: 700; font-size: 0.9rem; margin: 0 0 4px; }
  .prod-detail-desc { font-size: 0.8rem; color: var(--color-text-gray); margin: 0 0 6px; }
  .prod-detail-stats { display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.8rem; color: var(--color-text-gray); }
  .prod-detail-stats strong { color: var(--color-text); }

  /* --- Construction UI --- */
  .construction-wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .construction-banner {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  }

  .barricade-stripe {
    height: 16px;
    background: repeating-linear-gradient(
      45deg,
      #fbbf24,
      #fbbf24 10px,
      #1f2937 10px,
      #1f2937 20px
    );
  }

  .construction-body {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 28px 32px;
    background: var(--color-bg-1);
  }

  .construction-icon {
    font-size: 48px;
    line-height: 1;
    flex-shrink: 0;
  }

  .construction-text h2 {
    margin: 0 0 8px 0;
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text);
  }

  .construction-sub {
    margin: 0;
    font-size: 15px;
    color: var(--color-text-gray);
  }

  .construction-sub strong {
    color: #d97706;
    font-size: 18px;
  }

  .construction-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  @media (max-width: 768px) {
    .construction-info-grid { grid-template-columns: 1fr; }
  }


  .progress-dates {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .date-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .date-lbl {
    font-size: 11px;
    color: var(--color-text-gray);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .date-val {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
  }

  .date-arrow {
    font-size: 18px;
    color: var(--color-text-gray);
    margin-top: 12px;
  }

  .progress-bar-wrapper {
    margin-bottom: 20px;
  }

  .progress-bar-track {
    width: 100%;
    height: 12px;
    background: var(--color-border);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 6px;
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #f59e0b, #d97706);
    border-radius: 6px;
    transition: width 0.4s ease;
    min-width: 4px;
  }

  .progress-pct {
    font-size: 12px;
    color: var(--color-text-gray);
    font-weight: 600;
    text-align: right;
  }

  .days-remaining-box {
    display: flex;
    align-items: baseline;
    gap: 8px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 12px 16px;
  }

  .days-lbl {
    font-size: 13px;
    color: #92400e;
  }

  .days-val {
    font-size: 28px;
    font-weight: 800;
    color: #d97706;
    line-height: 1;
  }

  .construction-actions {
    display: flex;
    gap: 16px;
    justify-content: flex-end;
  }

  .construction-actions .btn {
    min-width: 120px;
    flex: none;
  }
</style>
