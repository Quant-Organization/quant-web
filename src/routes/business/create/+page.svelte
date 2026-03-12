<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { getCompanyTypes, createCompany, type CompanyType } from '$lib/api/company';
  import { getSpringAccount } from '$lib/api/dashboard';
  import type { SpringAccount } from '$lib/api/dashboard';
  import { springMe } from '$lib/api/auth';
  import { auth } from '$lib/stores/auth';
  import { get } from 'svelte/store';
  import SkeletonTable from '$lib/components/SkeletonTable.svelte';

  // --- State ---
  let companyTypes = $state<CompanyType[]>([]);
  let account: SpringAccount | null = $state(null);
  let loading = $state(true);
  let creating = $state(false);
  let error = $state('');

  // Selections
  let selectedType = $state('');

  // Form
  let companyName = $state('');
  let ceoName = $state('');
  let mainProduct = $state('');

  // User level for locked types
  let userLevel = $state(1);

  let selectedTypeData = $derived(companyTypes.find(t => t.typeCode === selectedType));

  const typeIcons: Record<string, string> = {
    SEMICONDUCTOR: '🔬', ELECTRONICS: '💻', AUTOMOTIVE: '🚗', PHARMACEUTICAL: '💊',
    ENERGY: '⚡', CONSUMER_GOODS: '🛒', CONSTRUCTION: '🏗️', LOGISTICS: '🚚',
    FOOD: '🍕', FASHION: '👗', CHEMICAL: '🧪', STEEL: '⚙️'
  };

  function formatCost(val: number | undefined | null): string {
    if (val == null) return '$0';
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toLocaleString()}`;
  }

  onMount(async () => {
    // Get user level: prefer server, fallback to auth store
    const currentUser = get(auth.user);
    if (currentUser?.level != null) userLevel = currentUser.level;

    try {
      const [typesRes, me] = await Promise.all([
        getCompanyTypes(),
        springMe().catch(() => null)
      ]);
      if (me?.level != null) userLevel = me.level;
      companyTypes = typesRes.sort((a, b) => a.requiredLevel - b.requiredLevel);
      if (companyTypes.length > 0) {
        const available = companyTypes.find(t => t.requiredLevel <= userLevel);
        selectedType = available ? available.typeCode : companyTypes[0].typeCode;
      }
    } catch {
      error = '데이터를 불러오는데 실패했습니다.';
    } finally {
      loading = false;
    }

    // Account is non-critical, fetch separately
    getSpringAccount().then(a => { account = a; }).catch(() => {});
  });

  let isTypeLocked = $derived(selectedTypeData ? selectedTypeData.requiredLevel > userLevel : false);
  let formValid = $derived(companyName.trim() !== '' && selectedType !== '' && !isTypeLocked);

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
  {/if}
</div>

<style>
  * { box-sizing: border-box; }

  .page-container {
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--color-text);
    max-width: 720px;
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
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Info Panel */
  .panel-card {
    background: var(--color-bg-1); padding: 20px;
    border-radius: 12px; border: 1px solid var(--color-border);
  }
  .card-label {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    color: var(--color-text-gray); letter-spacing: 0.5px; margin-bottom: 12px;
  }

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
  @media (max-width: 600px) {
    .type-selector { grid-template-columns: repeat(2, 1fr); }
  }
</style>
