<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { page } from '$app/stores';
  import {
    getDistributionSummary, getMarkets, getShipments, getWarehouses, getSales,
    estimateShipment, createShipment, upgradeWarehouse, sellProduct, getWarehouseInventory,
    getMarketDetail, createWarehouse, getActiveShipments,
    type DistributionSummaryResponse, type MarketResponse, type ShipmentResponse,
    type UserWarehouseResponse, type SalesRecordResponse,
    type ShipmentEstimateResponse, type WarehouseInventoryResponse
  } from '$lib/api/distribution';
  import { friendlyError } from '$lib/api/config';
  import { getCompanyFactories, type FactoryResponse } from '$lib/api/factory';
  import { getInventory, type FactoryProductResponse } from '$lib/api/product';
  import { getCompanyDetail, type CompanyResponse } from '$lib/api/company';
  import SkeletonTable from '$lib/components/SkeletonTable.svelte';

  // --- API 상태 ---
  let summary = $state<DistributionSummaryResponse | null>(null);
  let markets = $state<MarketResponse[]>([]);
  let shipments = $state<ShipmentResponse[]>([]);
  let warehouses = $state<UserWarehouseResponse[]>([]);
  let sales = $state<SalesRecordResponse[]>([]);
  let loading = $state(true);
  let factories = $state<FactoryResponse[]>([]);
  let allInventory = $state<FactoryProductResponse[]>([]);
  let company = $state<CompanyResponse | null>(null);

  // 선택된 국가 상태
  let selectedMarketCode = $state('');
  let selectedMarket = $derived(markets.find(m => m.code === selectedMarketCode) ?? markets[0] ?? null);
  let isKorMarket = $derived(selectedMarket?.code === 'KOR');

  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  // 선택된 시장의 가용 비율
  let availablePercent = $derived(
    selectedMarket ? Math.round((selectedMarket.availableMarketSize / selectedMarket.totalMarketSize) * 100) : 0
  );
  let dashOffset = $derived(circumference - (availablePercent / 100) * circumference);

  // 선택된 시장의 창고
  let selectedWarehouse = $derived(warehouses.find(w => w.market.code === selectedMarketCode) ?? null);

  $effect(() => {
    if (selectedMarketCode) {
      getMarketDetail(selectedMarketCode).then(detail => {
        markets = markets.map(m => m.code === selectedMarketCode ? detail : m);
      }).catch(() => {});
    }
  });

  // --- 선적 생성 모달 ---
  let showShipmentModal = $state(false);
  let shipFactoryId = $state<number | null>(null);
  let shipProductId = $state<number | null>(null);
  let shipQualityGrade = $state('A');
  let shipQuantity = $state(100);
  let shipEstimate = $state<ShipmentEstimateResponse | null>(null);
  let estimating = $state(false);
  let submittingShipment = $state(false);

  let factoryProducts = $derived(
    shipFactoryId ? allInventory.filter(inv => inv.factoryId === shipFactoryId) : []
  );
  let availableGrades = $derived((() => {
    if (!shipProductId || !shipFactoryId) return [] as string[];
    const inv = allInventory.find(i => i.factoryId === shipFactoryId && i.product.id === shipProductId);
    if (!inv) return [] as string[];
    const grades: string[] = [];
    if (inv.inventoryGradeA > 0) grades.push('A');
    if (inv.inventoryGradeB > 0) grades.push('B');
    if (inv.inventoryGradeC > 0) grades.push('C');
    if (inv.inventoryGradeD > 0) grades.push('D');
    return grades;
  })());

  $effect(() => {
    if (availableGrades.length > 0 && !availableGrades.includes(shipQualityGrade)) {
      shipQualityGrade = availableGrades[0];
    }
  });

  // --- 창고 업그레이드 ---
  let upgradingId = $state<number | null>(null);

  // --- 창고 생성 모달 ---
  let showCreateWarehouseModal = $state(false);
  let creatingWarehouse = $state(false);

  // --- 활성 선적 필터 ---
  let showActiveOnly = $state(false);
  let activeShipments = $state<ShipmentResponse[]>([]);

  // --- 판매 모달 ---
  let showSellModal = $state(false);
  let sellWarehouse = $state<UserWarehouseResponse | null>(null);
  let warehouseInventory = $state<WarehouseInventoryResponse[]>([]);
  let sellInventoryItem = $state<WarehouseInventoryResponse | null>(null);
  let sellQuantity = $state(1);
  let sellSubmitting = $state(false);
  let loadingInventory = $state(false);

  onMount(async () => {
    const companyId = Number($page.params.id);
    try {
      const [sum, mks, ships, whs, sls, fcts, inv, actShips, comp] = await Promise.all([
        getDistributionSummary().catch(() => null),
        getMarkets().catch(() => [] as MarketResponse[]),
        getShipments().catch(() => [] as ShipmentResponse[]),
        getWarehouses().catch(() => [] as UserWarehouseResponse[]),
        getSales().catch(() => [] as SalesRecordResponse[]),
        getCompanyFactories(companyId).catch(() => [] as FactoryResponse[]),
        getInventory().catch(() => [] as FactoryProductResponse[]),
        getActiveShipments().catch(() => [] as ShipmentResponse[]),
        getCompanyDetail(companyId).catch(() => null)
      ]);
      summary = sum;
      markets = mks;
      shipments = ships;
      warehouses = whs;
      sales = sls;
      factories = fcts;
      allInventory = inv;
      activeShipments = actShips;
      company = comp;
      if (mks.length > 0) selectedMarketCode = mks[0].code;
    } catch (e) {
      console.error('유통 데이터 로드 실패:', e);
    } finally {
      loading = false;
    }
  });

  function formatCurrency(n: number) {
    n = n ?? 0;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  }

  function formatUnit(n: number) {
    n = n ?? 0;
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return `${n}`;
  }

  // 선적 생성
  function openShipmentModal() {
    shipFactoryId = factories[0]?.id ?? null;
    shipProductId = null;
    shipQualityGrade = 'A';
    shipQuantity = 100;
    shipEstimate = null;
    showShipmentModal = true;
  }

  async function handleEstimate() {
    if (!shipFactoryId || !shipProductId || !selectedMarket) return;
    estimating = true;
    try {
      shipEstimate = await estimateShipment({
        factoryId: shipFactoryId,
        productId: shipProductId,
        qualityGrade: shipQualityGrade,
        marketCode: selectedMarket.code,
        quantity: shipQuantity
      });
    } catch (e) {
      console.error('견적 실패:', e);
    } finally {
      estimating = false;
    }
  }

  async function handleCreateShipment() {
    if (!shipFactoryId || !shipProductId || !selectedMarket) return;
    submittingShipment = true;
    try {
      await createShipment({
        factoryId: shipFactoryId,
        productId: shipProductId,
        qualityGrade: shipQualityGrade,
        marketCode: selectedMarket.code,
        quantity: shipQuantity
      });
      [shipments, summary, sales] = await Promise.all([
        getShipments().catch(() => shipments),
        getDistributionSummary().catch(() => summary),
        getSales().catch(() => sales),
      ]);
      showShipmentModal = false;
      toast.success(isKorMarket ? '국내 즉시 판매가 완료되었습니다.' : '선적이 생성되었습니다.');
    } catch (e) {
      toast.error(friendlyError(e, '선적 생성에 실패했습니다.'));
    } finally {
      submittingShipment = false;
    }
  }

  // 창고 업그레이드
  async function handleUpgradeWarehouse(warehouseId: number) {
    upgradingId = warehouseId;
    try {
      const updated = await upgradeWarehouse(warehouseId);
      warehouses = warehouses.map(w => w.id === warehouseId ? updated : w);
      toast.success('창고가 업그레이드되었습니다.');
    } catch (e) {
      toast.error(friendlyError(e, '창고 업그레이드에 실패했습니다.'));
    } finally {
      upgradingId = null;
    }
  }

  // 창고 생성
  async function handleCreateWarehouse() {
    if (!selectedMarketCode) return;
    creatingWarehouse = true;
    try {
      const newWarehouse = await createWarehouse(selectedMarketCode);
      warehouses = [...warehouses, newWarehouse];
      showCreateWarehouseModal = false;
      toast.success('창고가 생성되었습니다.');
    } catch (e) {
      toast.error(friendlyError(e, '창고 생성에 실패했습니다.'));
    } finally {
      creatingWarehouse = false;
    }
  }

  let displayedShipments = $derived(showActiveOnly ? activeShipments : shipments);

  // 판매
  async function openSellModal(warehouse: UserWarehouseResponse) {
    sellWarehouse = warehouse;
    sellInventoryItem = null;
    sellQuantity = 1;
    showSellModal = true;
    loadingInventory = true;
    try {
      warehouseInventory = await getWarehouseInventory(warehouse.id);
    } catch (e) {
      console.error('재고 로드 실패:', e);
      warehouseInventory = [];
    } finally {
      loadingInventory = false;
    }
  }

  async function handleSellProduct() {
    if (!sellWarehouse || !sellInventoryItem) return;
    sellSubmitting = true;
    try {
      await sellProduct({
        warehouseId: sellWarehouse.id,
        productId: sellInventoryItem.productId,
        qualityGrade: sellInventoryItem.qualityGrade,
        quantity: sellQuantity
      });
      warehouses = await getWarehouses().catch(() => warehouses);
      sales = await getSales().catch(() => sales);
      summary = await getDistributionSummary().catch(() => summary);
      showSellModal = false;
      toast.success('판매가 완료되었습니다.');
    } catch (e) {
      toast.error(friendlyError(e, '판매에 실패했습니다.'));
    } finally {
      sellSubmitting = false;
    }
  }
</script>

<div class="page-wrapper">

  <header class="page-header">
    <div class="header-row">
      <div>
        <h1>유통 및 판매</h1>
        <p>생산 된 제품의 글로벌 유통 및 판매를 관리합니다.</p>
      </div>
      <button class="primary-btn" onclick={openShipmentModal} disabled={!selectedMarket || factories.length === 0}>
        + 새 선적 생성
      </button>
    </div>
  </header>

  {#if loading}
    <SkeletonTable rows={5} cols={4} />
  {:else}

  <!-- 상단 통계 -->
  <section class="top-stats-grid">
    <div class="card stat-card">
      <span class="label">현재 총 재고</span>
      <div class="value-row">
        <h2 class="value">{(summary?.totalInventory ?? 0).toLocaleString()}</h2>
        <span class="unit">units</span>
      </div>
    </div>
    <div class="card stat-card">
      <span class="label">월간 총 수출액</span>
      <div class="value-row">
        <h2 class="value">{formatCurrency(summary?.monthlyExportRevenue ?? 0)}</h2>
      </div>
    </div>
    <div class="card stat-card">
      <span class="label">총 직원 수</span>
      <div class="value-row">
        <h2 class="value">{(company?.totalEmployees ?? 0).toLocaleString()}</h2>
        <span class="unit">명</span>
      </div>
    </div>
  </section>

  <!-- 국가별 수출 테이블 -->
  <section class="card table-card">
    <h3>국가별 수출 정보</h3>
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>국가</th>
            <th>물류비 (컨테이너당)</th>
            <th>관세율</th>
            <th>소모 시간</th>
          </tr>
        </thead>
        <tbody>
          {#each markets as market}
            <tr>
              <td><span class="country-cell">{market.flagEmoji} {market.name}</span></td>
              <td class="font-bold">${(market.shippingCostPerContainer ?? 0).toLocaleString()}</td>
              <td>{market.tariffRateMin}~{market.tariffRateMax}%</td>
              <td>{market.deliveryDaysMin}~{market.deliveryDaysMax}일</td>
            </tr>
          {/each}
          {#if markets.length === 0}
            <tr><td colspan="4" class="empty-cell">시장 정보가 없습니다.</td></tr>
          {/if}
        </tbody>
      </table>
    </div>
  </section>

  <!-- 시장 상세 -->
  {#if markets.length > 0}
  <section class="detail-section">
    <div class="country-selector">
      <div class="dropdown-wrapper">
        <select class="country-dropdown" bind:value={selectedMarketCode}>
          {#each markets as market}
            <option value={market.code}>{market.flagEmoji} {market.name}</option>
          {/each}
        </select>
        <span class="dropdown-arrow">▾</span>
      </div>
      <div class="country-divider"></div>
    </div>

    <div class="detail-grid">
      {#if selectedMarket}
      <div class="card detail-card">
        <h4>시장 개요: {selectedMarket.name}</h4>
        <div class="chart-flex">
          <div class="chart-info">
            <div class="info-item">
              <span class="sub-label">총 시장 규모</span>
              <span class="sub-val">{formatCurrency(selectedMarket.totalMarketSize)}</span>
            </div>
            <div class="info-item">
              <span class="sub-label">가용 시장 규모</span>
              <span class="sub-val">{formatCurrency(selectedMarket.availableMarketSize)}</span>
            </div>
          </div>
          <div class="donut-wrapper">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-border)" stroke-width="10" />
              <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-theme-1)" stroke-width="10"
                stroke-dasharray={circumference} stroke-dashoffset={dashOffset}
                stroke-linecap="round" transform="rotate(-90 50 50)" />
            </svg>
            <span class="donut-text">{availablePercent}%</span>
          </div>
        </div>
      </div>
      {/if}

      <!-- 나의 현황 -->
      <div class="card detail-card">
        <h4>나의 현황</h4>
        <div class="score-row">
          <span class="sub-label">경쟁력 점수</span>
          <div class="score-bar-group">
            <div class="progress-track sm">
              <div class="progress-fill green" style="width: {company?.competitivenessScore ?? 0}%"></div>
            </div>
            <span class="score-text">{company?.competitivenessScore ?? 0}/100</span>
          </div>
        </div>
        <div class="status-grid">
          <div>
            <span class="tiny-label">시장 점유율</span>
            <span class="tiny-val">{(company?.marketShare ?? 0).toFixed(1)}%</span>
          </div>
          <div>
            <span class="tiny-label">판매 가능량</span>
            <span class="tiny-val">{formatUnit(selectedMarket?.availableMarketSize ?? 0)} <span class="tiny-unit">units</span></span>
          </div>
          <div>
            <span class="tiny-label">현재 판매량</span>
            <span class="tiny-val">{formatUnit(company?.monthlyRevenue ?? 0)} <span class="tiny-unit">units/월</span></span>
          </div>
          <div>
            <span class="tiny-label">물류비</span>
            <span class="tiny-val">{formatCurrency(summary?.monthlyShippingCost ?? 0)}<span class="tiny-unit">/월</span></span>
          </div>
        </div>
      </div>

      <!-- 재고 현황 (전체) -->
      <div class="card detail-card">
        <h4>재고 현황</h4>
        <div class="inventory-item">
          <div class="inv-header">
            <span class="sub-label">공장 재고</span>
            <span class="inv-val">{(summary?.totalFactoryInventory ?? 0).toLocaleString()} units</span>
          </div>
          <div class="progress-track md">
            <div class="progress-fill green" style="width: {summary?.totalInventory ? (summary.totalFactoryInventory / summary.totalInventory) * 100 : 0}%"></div>
          </div>
        </div>
        <div class="inventory-item">
          <div class="inv-header">
            <span class="sub-label">창고 재고</span>
            <span class="inv-val">{(summary?.totalWarehouseInventory ?? 0).toLocaleString()} units</span>
          </div>
          <div class="progress-track md">
            <div class="progress-fill green" style="width: {summary?.totalInventory ? (summary.totalWarehouseInventory / summary.totalInventory) * 100 : 0}%"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
  {/if}

  <!-- 글로벌 창고 현황 -->
  <section class="warehouse-section">
    <h3>글로벌 창고 현황</h3>
    <div class="warehouse-grid">
      {#each markets as market}
        {@const wh = warehouses.find(w => w.market.code === market.code)}
        {#if market.code === 'KOR'}
          <div class="wh-card wh-kor">
            <div class="wh-header">
              <span class="wh-flag">{market.flagEmoji}</span>
              <span class="wh-name">{market.name}</span>
            </div>
            <div class="wh-kor-tag">국내 시장 · 즉시 판매</div>
            <div class="wh-kor-desc">창고 불필요 · 배송비 $0 · 관세 0%</div>
          </div>
        {:else if wh}
          <div class="wh-card wh-active">
            <div class="wh-header">
              <span class="wh-flag">{market.flagEmoji}</span>
              <span class="wh-name">{market.name}</span>
              <span class="wh-level">Lv.{wh.level}</span>
            </div>
            <div class="wh-capacity">
              <div class="wh-capacity-header">
                <span>재고</span>
                <span>{wh.currentInventory.toLocaleString()} / {wh.capacity.toLocaleString()}</span>
              </div>
              <div class="wh-bar-track">
                <div class="wh-bar-fill" style="width: {wh.capacity > 0 ? Math.min((wh.currentInventory / wh.capacity) * 100, 100) : 0}%"></div>
              </div>
            </div>
            <div class="wh-meta">
              <span>임대료 {formatCurrency(wh.monthlyRentCost)}/월</span>
              {#if wh.canUpgrade}
                <button class="wh-upgrade-btn" onclick={() => handleUpgradeWarehouse(wh.id)} disabled={upgradingId === wh.id}>
                  {upgradingId === wh.id ? '업그레이드 중...' : `업그레이드 (${formatCurrency(wh.upgradeCost)})`}
                </button>
              {:else}
                <span class="wh-max-tag">MAX</span>
              {/if}
            </div>
          </div>
        {:else}
          <div class="wh-card wh-empty">
            <div class="wh-header">
              <span class="wh-flag">{market.flagEmoji}</span>
              <span class="wh-name">{market.name}</span>
            </div>
            <div class="wh-empty-body">
              <p>창고 미설립</p>
              <button class="wh-create-btn" onclick={() => { selectedMarketCode = market.code; showCreateWarehouseModal = true; }}>
                설립 ($100,000)
              </button>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </section>

  <!-- 진행 중인 선적 -->
  {#if shipments.length > 0}
  <section class="card competitor-card">
    <div class="shipments-header">
      <h4>진행 중인 선적 ({displayedShipments.length}건)</h4>
      <button class="toggle-btn" class:active={showActiveOnly} onclick={() => { showActiveOnly = !showActiveOnly; }}>
        진행 중인 선적만 보기
      </button>
    </div>
    <div class="competitor-list">
      {#each displayedShipments.slice(0, 5) as shipment}
        <div class="comp-row">
          <span class="rank">{shipment.targetMarket.flagEmoji}</span>
          <span class="comp-label">{shipment.targetMarket.name}</span>
          <div class="progress-track lg">
            <div class="progress-fill green" style="width: {shipment.remainingHours <= 0 ? 100 : Math.max(10, 100 - (shipment.remainingHours / 24 / 7) * 100)}%"></div>
          </div>
          <span class="comp-val">{shipment.statusName}</span>
        </div>
      {/each}
    </div>
  </section>
  {/if}

  <!-- 최근 판매 기록 -->
  {#if sales.length > 0}
  <section class="card table-card">
    <h3>최근 판매 기록</h3>
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>시장</th>
            <th>제품</th>
            <th>등급</th>
            <th>수량</th>
            <th>매출</th>
            <th>순이익</th>
          </tr>
        </thead>
        <tbody>
          {#each sales.slice(0, 10) as sale}
            <tr>
              <td>{sale.marketName}</td>
              <td>{sale.productName}</td>
              <td>{sale.qualityGrade}</td>
              <td>{(sale.quantity ?? 0).toLocaleString()}</td>
              <td class="font-bold">{formatCurrency(sale.totalRevenue)}</td>
              <td class:positive={sale.netProfit >= 0} class:negative={sale.netProfit < 0}>{formatCurrency(sale.netProfit)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
  {/if}

  {/if}

  <!-- 선적 생성 모달 -->
  {#if showShipmentModal}
  <div class="modal-overlay" onclick={() => { showShipmentModal = false; }}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3>{isKorMarket ? '국내 즉시 판매' : '새 선적 생성'}</h3>
        <button class="modal-close" onclick={() => { showShipmentModal = false; }}>✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>목적 시장</label>
          <div class="form-value">{selectedMarket?.flagEmoji} {selectedMarket?.name}</div>
        </div>
        <div class="form-group">
          <label for="ship-factory">공장 선택</label>
          <select id="ship-factory" bind:value={shipFactoryId} onchange={() => { shipProductId = null; shipEstimate = null; }}>
            {#each factories as f}
              <option value={f.id}>{f.name}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label for="ship-product">제품 선택</label>
          <select id="ship-product" bind:value={shipProductId} onchange={() => { shipQualityGrade = 'A'; shipEstimate = null; }} disabled={factoryProducts.length === 0}>
            <option value={null}>-- 제품 선택 --</option>
            {#each factoryProducts as fp}
              <option value={fp.product.id}>{fp.product.name}</option>
            {/each}
          </select>
          {#if shipProductId}
            {@const selFp = factoryProducts.find(fp => fp.product.id === shipProductId)}
            {#if selFp?.product.imageUrl || selFp?.product.description}
            <div class="product-preview">
              {#if selFp.product.imageUrl}
                <img src={selFp.product.imageUrl} alt={selFp.product.name} class="product-preview-img" />
              {/if}
              <div class="product-preview-info">
                {#if selFp.product.description}<p>{selFp.product.description}</p>{/if}
                <span>기본 단가: ${(selFp.product.baseUnitPrice ?? 0).toLocaleString()}</span>
              </div>
            </div>
            {/if}
          {/if}
        </div>
        <div class="form-group">
          <label for="ship-grade">품질 등급</label>
          <select id="ship-grade" bind:value={shipQualityGrade} onchange={() => { shipEstimate = null; }} disabled={availableGrades.length === 0}>
            {#each availableGrades as g}
              <option value={g}>등급 {g}</option>
            {/each}
            {#if availableGrades.length === 0}
              <option value="A">등급 A</option>
            {/if}
          </select>
        </div>
        <div class="form-group">
          <label for="ship-qty">수량</label>
          <input id="ship-qty" type="number" min="1" bind:value={shipQuantity} oninput={() => { shipEstimate = null; }} />
        </div>
        {#if isKorMarket}
          <div class="estimate-box kor-info">
            <h4>국내 즉시 판매</h4>
            <div class="estimate-grid">
              <span>배송비</span><span>$0</span>
              <span>관세</span><span>0%</span>
              <span>배송 시간</span><span>즉시</span>
              <span>창고</span><span>불필요</span>
            </div>
          </div>
        {:else if !selectedWarehouse}
          <div class="estimate-box warehouse-warning">
            <h4>창고 미설립</h4>
            <p>해외 시장으로 수출하려면 먼저 해당 시장에 창고를 설립해야 합니다.</p>
            <button class="btn-create-warehouse" onclick={() => { showCreateWarehouseModal = true; }}>
              {selectedMarket?.flagEmoji} {selectedMarket?.name} 창고 설립 ($100,000)
            </button>
          </div>
        {:else}
          <button class="estimate-btn" onclick={handleEstimate} disabled={!shipFactoryId || !shipProductId || estimating}>
            {estimating ? '견적 계산 중...' : '견적 확인'}
          </button>
          {#if shipEstimate}
          <div class="estimate-box">
            <h4>예상 견적</h4>
            <div class="estimate-grid">
              <span>컨테이너 수</span><span>{shipEstimate.containers}개</span>
              <span>화물 가치</span><span>{formatCurrency(shipEstimate.goodsValue)}</span>
              <span>물류비</span><span>{formatCurrency(shipEstimate.shippingCost)}</span>
              <span>예상 관세</span><span>{formatCurrency(shipEstimate.estimatedTariffMin)} ~ {formatCurrency(shipEstimate.estimatedTariffMax)}</span>
              <span>총 비용</span><span class="font-bold">{formatCurrency(shipEstimate.totalCostMin)} ~ {formatCurrency(shipEstimate.totalCostMax)}</span>
              <span>배송 기간</span><span>{shipEstimate.estimatedDaysMin}~{shipEstimate.estimatedDaysMax}일</span>
            </div>
          </div>
          {/if}
        {/if}
      </div>
      <div class="modal-footer">
        <button class="cancel-modal-btn" onclick={() => { showShipmentModal = false; }}>취소</button>
        <button class="primary-btn" onclick={handleCreateShipment} disabled={(!isKorMarket && (!shipEstimate || !selectedWarehouse)) || !shipFactoryId || !shipProductId || submittingShipment}>
          {submittingShipment ? '처리 중...' : isKorMarket ? '즉시 판매' : '선적 생성'}
        </button>
      </div>
    </div>
  </div>
  {/if}

  <!-- 판매 모달 -->
  {#if showSellModal}
  <div class="modal-overlay" onclick={() => { showSellModal = false; }}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3>제품 판매 — {sellWarehouse?.market.flagEmoji} {sellWarehouse?.market.name}</h3>
        <button class="modal-close" onclick={() => { showSellModal = false; }}>✕</button>
      </div>
      <div class="modal-body">
        {#if loadingInventory}
          <p class="loading-text">재고 정보를 불러오는 중...</p>
        {:else if warehouseInventory.length === 0}
          <p class="no-data">판매 가능한 재고가 없습니다.</p>
        {:else}
          <div class="form-group">
            <label>판매할 제품 선택</label>
            <div class="inventory-select-list">
              {#each warehouseInventory as item}
                <button
                  class="inventory-item-btn"
                  class:selected={sellInventoryItem?.id === item.id}
                  onclick={() => { sellInventoryItem = item; sellQuantity = 1; }}
                >
                  <span class="inv-name">{item.productName}</span>
                  <span class="inv-grade">등급 {item.qualityGrade}</span>
                  <span class="inv-qty">재고 {(item.quantity ?? 0).toLocaleString()}개</span>
                </button>
              {/each}
            </div>
          </div>
          {#if sellInventoryItem}
          <div class="form-group">
            <label for="sell-qty">판매 수량 (최대 {(sellInventoryItem.quantity ?? 0).toLocaleString()})</label>
            <input id="sell-qty" type="number" min="1" max={sellInventoryItem.quantity} bind:value={sellQuantity} />
          </div>
          {/if}
        {/if}
      </div>
      <div class="modal-footer">
        <button class="cancel-modal-btn" onclick={() => { showSellModal = false; }}>취소</button>
        <button class="primary-btn" onclick={handleSellProduct} disabled={!sellInventoryItem || sellSubmitting || loadingInventory}>
          {sellSubmitting ? '판매 중...' : '판매 확정'}
        </button>
      </div>
    </div>
  </div>
  {/if}

  <!-- 창고 생성 모달 -->
  {#if showCreateWarehouseModal}
  <div class="modal-overlay" onclick={() => { showCreateWarehouseModal = false; }}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3>새 창고 생성</h3>
        <button class="modal-close" onclick={() => { showCreateWarehouseModal = false; }}>✕</button>
      </div>
      <div class="modal-body">
        <p>선택된 시장: {selectedMarket?.flagEmoji} {selectedMarket?.name}에 새 창고를 생성하시겠습니까?</p>
      </div>
      <div class="modal-footer">
        <button class="cancel-modal-btn" onclick={() => { showCreateWarehouseModal = false; }}>취소</button>
        <button class="primary-btn" onclick={handleCreateWarehouse} disabled={creatingWarehouse}>
          {creatingWarehouse ? '생성 중...' : '생성'}
        </button>
      </div>
    </div>
  </div>
  {/if}

</div>

<style>
  /* --- 기본 설정 --- */
  .page-wrapper {
    background-color: var(--color-bg-0);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: var(--color-text);
  }

  .card {
    background: var(--color-bg-1);
    border-radius: 12px;
    border: 1px solid var(--color-border);
    padding: 24px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }

  /* --- 1. 헤더 --- */
  .page-header { margin-bottom: 32px; }
  .page-header h1 { font-size: 28px; font-weight: 700; margin: 0 0 8px 0; }
  .page-header p { font-size: 16px; color: var(--color-text-gray); margin: 0; }
  .header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }

  /* --- 2. 상단 통계 --- */
  .top-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 24px;
  }

  .stat-card .label { font-size: var(--stat-label-size); color: var(--stat-label-color); display: block; margin-bottom: 0.5rem; font-weight: 500;}
  .value-row { display: flex; align-items: baseline; gap: 4px; }
  .stat-card .value { font-size: var(--stat-value-size); font-weight: var(--stat-value-weight); margin: 0; color: var(--color-text); }
  .stat-card .unit { font-size: 1.25rem; font-weight: var(--stat-change-weight); color: var(--stat-label-color); }

  /* --- 3. 테이블 --- */
  .table-card { margin-bottom: 32px; padding: 20px 24px; }
  .table-card h3 { font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: var(--color-text); }

  .table-responsive { width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; min-width: 600px; }

  th { text-align: left; color: var(--color-text-gray); font-size: 13px; font-weight: 600; padding: 12px 0; border-bottom: 1px solid var(--color-border); }
  td { font-size: 14px; padding: 16px 0; border-bottom: 1px solid var(--color-border); color: var(--color-text); }
  tr:last-child td { border-bottom: none; }
  .font-bold { font-weight: 700; }
  .country-cell { display: flex; align-items: center; gap: 6px; }

  /* --- 4. 상세 그리드 섹션 --- */
  .detail-section { margin-bottom: 24px; }

  .country-selector { margin-bottom: 24px; }

  .dropdown-wrapper {
    position: relative;
    display: inline-block;
    margin-bottom: 16px;
  }

  .country-dropdown {
    appearance: none;
    -webkit-appearance: none;
    background: none;
    border: none;
    font-size: 18px;
    font-weight: 700;
    color: var(--color-theme-1);
    cursor: pointer;
    padding-right: 20px;
    outline: none;
  }

  .country-dropdown option {
    color: var(--color-text);
    font-weight: 500;
  }

  .dropdown-arrow {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    color: var(--color-theme-1);
    pointer-events: none;
  }

  .country-divider {
    height: 1px;
    background-color: var(--color-border);
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .detail-card h4 { font-size: 16px; font-weight: 700; margin: 0 0 20px 0; color: var(--color-text); }

  /* 4-1. 도넛 차트 */
  .chart-flex { display: flex; justify-content: space-between; align-items: center; }
  .info-item { margin-bottom: 12px; display: flex; flex-direction: column; }

  .sub-label { font-size: 13px; color: var(--color-text-gray); font-weight: 500; margin-bottom: 4px; }
  .sub-val { font-size: 15px; font-weight: 700; color: var(--color-text); }

  /* SVG Donut Chart */
  .donut-wrapper {
    position: relative;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .donut-wrapper svg {
    position: absolute;
    top: 0;
    left: 0;
  }
  .donut-text {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
    z-index: 1;
  }

  /* 4-2. 나의 현황 */
  .score-row { margin-bottom: 24px; }
  .score-bar-group { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
  .score-text { font-size: 14px; font-weight: 700; min-width: 60px; text-align: right; color: #10b981; }
  .tiny-unit { font-size: 11px; font-weight: 500; color: var(--color-text-gray); }

  .status-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px 12px;
  }
  .tiny-label { font-size: 12px; color: var(--color-text-gray); display: block; margin-bottom: 2px; }
  .tiny-val { font-size: 14px; font-weight: 700; color: var(--color-text); }

  /* 4-3. 재고 현황 */
  .inventory-item { margin-bottom: 24px; }
  .inventory-item:last-child { margin-bottom: 0; }
  .inv-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .inv-val { font-size: 13px; font-weight: 700; color: var(--color-text); }

  /* 공통 프로그레스 바 */
  .progress-track {
    background-color: var(--color-bg-2); border-radius: 99px; overflow: hidden;
  }
  .progress-track.sm { height: 6px; flex: 1; }
  .progress-track.md { height: 8px; width: 100%; }
  .progress-track.lg { height: 12px; flex: 1; }

  .progress-fill { height: 100%; border-radius: 99px; }
  .progress-fill.green { background-color: #10b981; }

  /* --- 5. 경쟁사 현황 --- */
  .competitor-card h4 { font-size: 16px; font-weight: 700; margin: 0 0 20px 0; color: var(--color-text); }

  .comp-row {
    display: flex; align-items: center; gap: 16px; margin-bottom: 12px;
  }
  .comp-row:last-child { margin-bottom: 0; }

  .rank { width: 16px; font-size: 13px; color: var(--color-text-gray); }
  .comp-label { width: 80px; font-size: 13px; color: var(--color-text-gray); }
  .comp-val { width: 48px; text-align: right; font-size: 13px; font-weight: 600; color: var(--color-text); }

  /* 반응형 (Mobile) */
  @media (max-width: 900px) {
    .top-stats-grid { grid-template-columns: 1fr; }
    .detail-grid { grid-template-columns: 1fr; }
    .table-responsive { overflow-x: auto; }
  }

  .loading-text { color: var(--color-text-gray); padding: 2rem; text-align: center; }
  .no-data { color: var(--color-text-gray); font-size: 0.9rem; margin: 0; }
  .empty-cell { text-align: center; color: var(--color-text-gray); padding: 1.5rem 0; }
  .positive { color: #10b981; font-weight: 600; }
  .negative { color: #ef4444; font-weight: 600; }
  .top-stats-grid { grid-template-columns: repeat(3, 1fr); }

  /* --- 버튼 --- */
  .primary-btn {
    background-color: var(--color-theme-1);
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .primary-btn:hover { opacity: 0.9; }
  .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .upgrade-btn {
    background-color: #f59e0b;
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .upgrade-btn:hover { opacity: 0.9; }
  .upgrade-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .sell-btn {
    background-color: #10b981;
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .sell-btn:hover { opacity: 0.9; }
  .sell-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .warehouse-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    justify-content: flex-end;
  }

  /* --- 모달 --- */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--color-bg-0);
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border);
  }
  .modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; }

  .modal-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--color-text-gray);
    padding: 4px;
    line-height: 1;
  }

  .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid var(--color-border);
  }

  .cancel-modal-btn {
    background: var(--color-bg-2, #f1f3f7);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .form-group label { font-size: 13px; font-weight: 600; color: var(--color-text-gray); }
  .form-group select,
  .form-group input[type="number"] {
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 14px;
    background: var(--color-bg-0);
    color: var(--color-text);
    width: 100%;
  }
  .form-group select:focus,
  .form-group input[type="number"]:focus { outline: 2px solid var(--color-theme-1); }
  .form-value { font-size: 15px; font-weight: 600; color: var(--color-text); }

  .estimate-btn {
    background: var(--color-theme-2, #ecf2fe);
    color: var(--color-theme-1);
    border: 1px solid var(--color-theme-1);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    align-self: flex-start;
  }
  .estimate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .estimate-box {
    background: var(--color-bg-2, #f8fafc);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 16px;
  }
  .estimate-box h4 { margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: var(--color-text); }
  .warehouse-warning { border-color: #fde68a; background: #fffbeb; }
  .warehouse-warning h4 { color: #92400e; }
  .warehouse-warning p { font-size: 0.8rem; color: #92400e; margin: 0 0 0.75rem; }
  .btn-create-warehouse {
    width: 100%; padding: 0.5rem; background: #fef3c7; color: #92400e; border: 1px solid #fde68a;
    border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: 0.2s;
  }
  .btn-create-warehouse:hover { background: #fde68a; }
  .estimate-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    font-size: 13px;
  }
  .estimate-grid span:nth-child(odd) { color: var(--color-text-gray); }
  .estimate-grid span:nth-child(even) { font-weight: 600; text-align: right; }

  /* 재고 선택 목록 */
  .inventory-select-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 240px;
    overflow-y: auto;
  }

  .inventory-item-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-0);
    cursor: pointer;
    text-align: left;
    gap: 8px;
    font-size: 13px;
    transition: border-color 0.15s, background 0.15s;
  }
  .inventory-item-btn.selected {
    border-color: var(--color-theme-1);
    background: var(--color-theme-2, #ecf2fe);
  }
  .inventory-item-btn:hover:not(.selected) { border-color: var(--color-theme-1); }
  .inv-name { font-weight: 600; color: var(--color-text); flex: 1; }
  .inv-grade { color: var(--color-text-gray); }
  .inv-qty { color: var(--color-text-gray); white-space: nowrap; }

  /* --- 창고 카드 그리드 --- */
  .warehouse-section { margin-bottom: 1.5rem; }
  .warehouse-section h3 { font-size: 1.125rem; font-weight: 700; margin: 0 0 1rem; color: var(--color-text); }
  .warehouse-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.75rem; }
  .wh-card {
    border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem;
    border: 1px solid var(--color-border); background: var(--color-bg-1);
  }
  .wh-header { display: flex; align-items: center; gap: 0.5rem; }
  .wh-flag { font-size: 1.25rem; }
  .wh-name { font-size: 0.875rem; font-weight: 700; flex: 1; }
  .wh-level {
    font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 10px;
    background: var(--color-theme-1); color: white;
  }
  .wh-active { border-color: #86efac; background: #f0fdf4; }
  .wh-capacity { display: flex; flex-direction: column; gap: 0.25rem; }
  .wh-capacity-header { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--color-text-gray); }
  .wh-bar-track { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
  .wh-bar-fill { height: 100%; background: #10b981; border-radius: 3px; transition: width 0.3s; }
  .wh-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--color-text-gray); }
  .wh-upgrade-btn {
    padding: 0.2rem 0.5rem; background: var(--color-theme-1); color: white; border: none;
    border-radius: 4px; font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: 0.2s;
  }
  .wh-upgrade-btn:hover { opacity: 0.85; }
  .wh-upgrade-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .wh-max-tag {
    font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 4px;
    background: #fef3c7; color: #92400e;
  }
  .wh-empty { border-style: dashed; border-color: #d1d5db; background: var(--color-bg-2, #f9fafb); }
  .wh-empty-body { text-align: center; padding: 0.5rem 0; }
  .wh-empty-body p { font-size: 0.8rem; color: var(--color-text-gray); margin: 0 0 0.5rem; }
  .wh-create-btn {
    padding: 0.35rem 1rem; background: var(--color-bg-1); color: var(--color-text); border: 1px solid var(--color-border);
    border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.2s;
  }
  .wh-create-btn:hover { background: var(--color-border); }
  .wh-kor { border-color: #93c5fd; background: #eff6ff; }
  .wh-kor-tag { font-size: 0.8rem; font-weight: 700; color: #1e40af; }
  .wh-kor-desc { font-size: 0.7rem; color: #3b82f6; }

  /* --- 선적 섹션 헤더 --- */
  .shipments-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .shipments-header h4 { margin: 0; font-size: 16px; font-weight: 700; color: var(--color-text); }

  .toggle-btn {
    background: var(--color-bg-2, #f1f3f7);
    color: var(--color-text-gray);
    border: 1px solid var(--color-border);
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .toggle-btn.active {
    background: var(--color-theme-2, #ecf2fe);
    color: var(--color-theme-1);
    border-color: var(--color-theme-1);
  }
  .product-preview { display: flex; gap: 0.75rem; align-items: flex-start; margin-top: 0.5rem; padding: 0.5rem 0.75rem; background: #f0f4ff; border-radius: 8px; border: 1px solid var(--color-border); }
  .product-preview-img { width: 3rem; height: 3rem; object-fit: cover; border-radius: 6px; flex-shrink: 0; background: #e5e7eb; }
  .product-preview-info { font-size: 0.8rem; color: var(--color-text-gray); display: flex; flex-direction: column; gap: 4px; }
  .product-preview-info p { margin: 0; }
</style>
