<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
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
    type FactoryProductResponse,
    type ProductResponse
  } from '$lib/api/product';

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
  let productCategories = $state<string[]>([]);
  let selectedProductCategory = $state<string | null>(null);
  let filteredProducts = $state<ProductResponse[]>([]);

  const companyId = $derived($page.params.id);
  const factoryId = $derived(Number($page.params.factoryId));

  // 생산량 조절 슬라이더 (50% ~ 150%)
  let productionPercent = $state(100);
  let sliderPercent = $derived(((productionPercent - 50) / 100) * 100);

  // 숫자 포맷팅 유틸
  const fmtMoney = (n: number) => `$${n.toLocaleString()}`;
  const fmtSimple = (n: number) => n.toLocaleString();
  const fmtUnit = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  const gradeNames: Record<string, string> = {
    workshop: '공방', small: '소형 공장', medium: '중형 공장', large: '대형 공장',
    complex: '산업 단지', mega: '메가 팩토리', giga: '기가 팩토리'
  };

  let isRunning = $derived(factory?.status === 'RUNNING' || factory?.status === 'ACTIVE');

  let totalOpex = $derived(factory
    ? factory.monthlyLaborCost + factory.monthlyMaterialCost + factory.monthlyElectricityCost
    : 0);

  onMount(async () => {
    try {
      [factory] = await Promise.all([
        getFactoryDetail(factoryId),
      ]);
      await Promise.all([
        loadFactoryProductions(),
        getAvailableProducts('MANUFACTURING').then(p => {
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
    if (!selectedProductId || productionLoading) return;
    productionLoading = true;
    try {
      await setFactoryProduction(factoryId, { productId: selectedProductId, monthlyProduction: newMonthlyProduction });
      await loadFactoryProductions();
    } catch (e: any) {
      alert(e.message || '생산 설정에 실패했습니다.');
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
    } catch (e: any) {
      alert(e.message || '제거에 실패했습니다.');
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
      alert(e.message || '작업에 실패했습니다.');
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
      alert(e.message || '생산량 조절에 실패했습니다.');
    } finally {
      actionLoading = false;
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
      alert('공장이 매각되었습니다.');
      goto(`/business/company/${companyId}/factory`);
    } catch (e: any) {
      alert(e.message || '매각에 실패했습니다.');
      actionLoading = false;
    }
  }
</script>

<svelte:head>
  <title>{factory?.name ?? '공장'} - 상세 정보</title>
</svelte:head>

<div class="page-container">

  {#if loading}
    <div class="loading-msg">공장 데이터를 불러오는 중...</div>
  {:else if error}
    <div class="error-msg">{error}</div>
  {:else if factory}

  <div class="page-header">
    <div class="header-icon">🏭</div>
    <div class="header-text">
      <h1>{factory.name}</h1>
      <p class="sub-text">{factory.regionName}</p>
      <p class="meta-text">완공일: {factory.constructionEndDate ?? '-'} · 등급: {gradeNames[factory.grade] ?? factory.grade}</p>
    </div>
    <div class="status-badge" class:running={isRunning} class:paused={!isRunning}>
      {isRunning ? '가동중' : '일시정지'}
    </div>
  </div>

  <div class="grid-layout">

    <div class="card location-card">
      <div class="map-section">
        <div class="map-placeholder">
          <span>📍 {factory.regionName}</span>
        </div>
      </div>
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
            <span class="lbl">🏭 공장 등급</span>
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
            <span class="val">{(factory.efficiency * 100).toFixed(1)}%</span>
          </div>
          <div class="info-row">
            <span class="lbl">📦 재고 / 창고</span>
            <span class="val">{fmtUnit(factory.currentInventory)} / {fmtUnit(factory.warehouseCapacity)}</span>
          </div>
          <div class="info-row">
            <span class="lbl">📅 완공일</span>
            <span class="val">{factory.constructionEndDate ?? '-'}</span>
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
          <span class="s-val">{(factory.efficiency * 100).toFixed(1)}%</span>
        </div>
        <div class="stat-item">
          <span class="s-lbl">재고량</span>
          <span class="s-val">{fmtUnit(factory.currentInventory)}</span>
        </div>
      </div>

      <div class="chart-container">
        <svg viewBox="0 0 400 120" class="line-chart">
          <line x1="0" y1="20" x2="400" y2="20" stroke="var(--color-border)" />
          <line x1="0" y1="60" x2="400" y2="60" stroke="var(--color-border)" />
          <line x1="0" y1="100" x2="400" y2="100" stroke="var(--color-border)" />

          <polyline
            points="10,90 60,80 110,95 160,70 210,65 260,50 310,55 360,40"
            fill="none" stroke="var(--color-theme-1)" stroke-width="2"
          />
          <polyline
            points="10,100 60,95 110,100 160,90 210,85 260,75 310,80 360,60"
            fill="none" stroke="#fbbf24" stroke-width="2"
          />
        </svg>
        <div class="chart-labels">
          <span>생산 추이</span>
        </div>
        <div class="legend">
          <span class="dot blue"></span> 생산량
          <span class="dot yellow"></span> 매출액
        </div>
      </div>
    </div>

    <div class="card control-card">
      <h3>생산량 조절</h3>
      <p class="card-desc">생산 비율을 조절하여 생산량과 운영비를 관리하세요.</p>

      <div class="slider-wrapper">
        <div class="slider-labels">
          <span>50%</span>
          <span>150%</span>
        </div>
        <input
          type="range"
          min={50}
          max={150}
          step="5"
          bind:value={productionPercent}
          style="background: linear-gradient(to right, #0f4c81 0%, #0f4c81 {sliderPercent}%, var(--color-border) {sliderPercent}%, var(--color-border) 100%);"
        />
      </div>

      <div class="stats-grid">
        <div class="s-box">
          <span class="l">현재 비율</span>
          <span class="v">{productionPercent}%</span>
        </div>
        <div class="s-box">
          <span class="l">직원 수</span>
          <span class="v">{fmtSimple(factory.employeeCount)} <span class="unit">명</span></span>
        </div>
        <div class="s-box">
          <button class="btn-adjust" onclick={handleAdjustProduction} disabled={actionLoading}>
            {actionLoading ? '처리중...' : '적용'}
          </button>
        </div>
      </div>
    </div>

    <div class="card rnd-card">
      <h3>공장 옵션 정보</h3>
      <div class="rnd-list">
        <div class="rnd-item">
          <div class="rnd-icon">⚙️</div>
          <div class="rnd-info">
            <div class="rnd-head"><span class="rnd-name">생산 라인</span></div>
            <div class="rnd-desc text-green">{factory.productionLineType}</div>
          </div>
        </div>
        <div class="rnd-item">
          <div class="rnd-icon">🏗️</div>
          <div class="rnd-info">
            <div class="rnd-head"><span class="rnd-name">부지 확장</span></div>
            <div class="rnd-desc text-green">Lv.{factory.landExpansionLevel}</div>
          </div>
        </div>
        <div class="rnd-item">
          <div class="rnd-icon">🏢</div>
          <div class="rnd-info">
            <div class="rnd-head"><span class="rnd-name">건축 확장</span></div>
            <div class="rnd-desc text-green">Lv.{factory.buildingExpansionLevel}</div>
          </div>
        </div>
        <div class="rnd-item">
          <div class="rnd-icon">🔋</div>
          <div class="rnd-info">
            <div class="rnd-head"><span class="rnd-name">에너지</span></div>
            <div class="rnd-desc text-green">{factory.energyOption}</div>
          </div>
        </div>
        <div class="rnd-item">
          <div class="rnd-icon">🔒</div>
          <div class="rnd-info">
            <div class="rnd-head"><span class="rnd-name">보안</span></div>
            <div class="rnd-desc text-green">{factory.securityOption}</div>
          </div>
        </div>
      </div>
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

  <!-- 제품 생산 설정 -->
  <div class="card production-card">
    <h3>제품 생산 설정</h3>
    {#if factoryProductions.length > 0}
    <div class="prod-list">
    {#each factoryProductions as fp}
        <div class="prod-item">
            {#if fp.product.imageUrl}
              <img src={fp.product.imageUrl} alt={fp.product.name} class="prod-thumb" />
            {/if}
            <div class="prod-info">
              <span class="prod-name">{fp.product.name}</span>
              <span class="prod-cat">{fp.product.category}</span>
            </div>
            <span class="prod-qty">{fmtUnit(fp.currentMonthlyProduction)}/월</span>
            <span class="prod-inv">재고: {fmtUnit(fp.currentInventory)}</span>
            <span class="prod-grade">{fp.baseQualityGrade}</span>
            <button class="btn-prod-remove" onclick={() => handleRemoveProduction(fp.product.id)} disabled={productionLoading}>제거</button>
        </div>
        {/each}
    </div>
    {:else}
    <p class="prod-empty">설정된 제품이 없습니다.</p>
    {/if}
    <div class="prod-add">
        <h4>제품 추가</h4>
        {#if productCategories.length > 0}
          <div class="cat-filters">
            <button class:active={selectedProductCategory === null} onclick={() => selectCategory(null)}>전체</button>
            {#each productCategories as cat}
              <button class:active={selectedProductCategory === cat} onclick={() => selectCategory(cat)}>{cat}</button>
            {/each}
          </div>
        {/if}
        <div class="prod-add-row">
            <select class="prod-select" onchange={(e) => selectedProductId = Number((e.target as HTMLSelectElement).value)}>
                <option value="">제품 선택</option>
                {#each filteredProducts as p}
                <option value={p.id}>{p.name} ({p.category})</option>
                {/each}
            </select>
            <input class="prod-input" type="number" min="100" step="100" bind:value={newMonthlyProduction} placeholder="월 생산량" />
            <button class="btn-prod-add" onclick={handleSetProduction} disabled={productionLoading || !selectedProductId}>
                {productionLoading ? '처리 중...' : '설정'}
            </button>
        </div>
        {#if selectedProductId}
          {@const selProd = filteredProducts.find(p => p.id === selectedProductId)}
          {#if selProd}
          <div class="prod-detail-panel">
            {#if selProd.imageUrl}
              <img src={selProd.imageUrl} alt={selProd.name} class="prod-detail-img" />
            {/if}
            <div class="prod-detail-info">
              <p class="prod-detail-name">{selProd.name}</p>
              {#if selProd.description}<p class="prod-detail-desc">{selProd.description}</p>{/if}
              <div class="prod-detail-stats">
                <span>기본 단가: <strong>${selProd.baseUnitPrice.toLocaleString()}</strong></span>
                <span>생산 단가: <strong>${selProd.productionCostPerUnit.toLocaleString()}</strong></span>
                {#if selProd.requiredLevel > 0}<span>필요 레벨: <strong>Lv.{selProd.requiredLevel}</strong></span>{/if}
              </div>
            </div>
          </div>
          {/if}
        {/if}
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
  .header-icon {
    width: 64px; height: 64px; background: var(--color-bg-2); border-radius: 8px;
    font-size: 32px; display: flex; align-items: center; justify-content: center;
  }
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
    background-color: var(--color-bg-2);
    border-radius: 12px;
    overflow: hidden;
  }
  .map-section iframe, .map-placeholder {
    width: 100%;
    height: 100%;
  }
  .map-placeholder {
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: var(--color-text-gray); background: var(--color-bg-2);
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
  .s-sub { font-size: 10px; color: var(--color-text-gray); font-weight: normal; }

  .chart-container { position: relative; margin-top: 16px; }
  .line-chart { width: 100%; height: 120px; overflow: visible; }
  .chart-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--color-text-gray); margin-top: 8px; }
  .legend { display: flex; justify-content: flex-end; gap: 12px; font-size: 11px; color: var(--color-text-gray); margin-top: 8px; }
  .dot { width: 8px; height: 8px; display: inline-block; border-radius: 50%; margin-right: 4px; }
  .dot.blue { background: var(--color-theme-1); }
  .dot.yellow { background: #fbbf24; }
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
  .rnd-desc { font-size: 12px; font-weight: 600; }

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
  .prod-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
  .prod-item { display: grid; grid-template-columns: 2rem 1fr 1fr 1fr 1fr auto; gap: 0.75rem; align-items: center; padding: 0.5rem 0.75rem; background: #f9fafb; border-radius: 8px; font-size: 0.875rem; }
  .prod-thumb { width: 2rem; height: 2rem; object-fit: cover; border-radius: 4px; background: #e5e7eb; }
  .prod-info { display: flex; flex-direction: column; gap: 2px; }
  .prod-name { font-weight: 600; }
  .prod-cat { font-size: 0.75rem; color: var(--color-text-gray); }
  .prod-grade { color: #6b7280; font-size: 0.8rem; }
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
</style>
