<script lang="ts">
    import { fly, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { goto } from '$app/navigation';
    import arrow from '$lib/images/arrow.svg';
    import graph_yellow from '$lib/images/graph_yellow.svg';
    import bankIcon from '$lib/images/bank.svg';

    import { onMount } from 'svelte';
    import { getSpringAccount } from '$lib/api/dashboard';
    import { getBanks, getBankProducts, type BankResponse, type BankProductResponse } from '$lib/api/bank';
    import { getLoanSummary, getActiveLoans, type LoanSummaryResponse } from '$lib/api/loan';

    // --- 잔고 API 연동 ---
    let currentBalance = $state(0);
    let loanSummary = $state<LoanSummaryResponse | null>(null);

    // --- 은행 목록 API ---
    let allBanks = $state<BankResponse[]>([]);

    // tier별 은행 그룹
    let banksByTier = $derived(() => {
        const result: Record<number, BankResponse[]> = { 1: [], 2: [], 3: [] };
        for (const b of allBanks) {
            if (result[b.tier]) result[b.tier].push(b);
        }
        return result;
    });

    // 각 tier의 선택된 은행
    let selectedBanks = $state<Record<number, BankResponse | null>>({ 1: null, 2: null, 3: null });

    onMount(async () => {
        try {
            const [account, banks, summary] = await Promise.all([
                getSpringAccount().catch(() => null),
                getBanks().catch(() => [] as BankResponse[]),
                getLoanSummary().catch(() => null)
            ]);
            if (account) currentBalance = account.cashBalance;
            allBanks = banks;
            // 각 tier에서 첫 번째 은행을 기본 선택
            for (const tier of [1, 2, 3]) {
                const found = banks.find(b => b.tier === tier);
                if (found) selectedBanks[tier] = found;
            }
            loanSummary = summary;
        } catch { /* fallback */ }
    });

    // --- 등급 필터 ---
    let activeTierFilter = $state(0); // 0 = 전체
    const tierFilters: Array<[number, string]> = [[0, '전체'], [1, '1등급'], [2, '2등급'], [3, '3등급']];

    // --- 은행 상품 확장 ---
    let expandedBankId = $state<number | null>(null);
    let bankProducts = $state<Record<number, BankProductResponse[]>>({});
    let loadingProducts = $state<Record<number, boolean>>({});

    // --- 드롭다운 State ---
    let openDropdown: number | null = $state(null);
    let dropdownPosition = $state({ top: 0, left: 0, width: 0 });

    const tierTitles: Record<number, string> = {
        1: '제1금융권',
        2: '제2금융권',
        3: '제3금융권'
    };
    const tierSubtitles: Record<number, string> = {
        1: '(First-tier financial institutions)',
        2: '(Second-tier)',
        3: '(Unregulated)'
    };

    // --- Functions ---
    function goToLoanPage(bank: BankResponse) {
        goto(`/dashboard/loan?bankId=${bank.id}&bankName=${encodeURIComponent(bank.name)}&rate=${bank.interestRate}&tier=${bank.tier}`);
    }

    function toggleDropdown(tier: number, event: MouseEvent) {
        event.stopPropagation();
        if (openDropdown === tier) {
            openDropdown = null;
            return;
        }
        const button = (event.target as HTMLElement).closest('.toggle-button');
        const card = button?.closest('.bank-card');
        if (card) {
            const rect = card.getBoundingClientRect();
            dropdownPosition = {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            };
        }
        openDropdown = tier;
    }

    function selectBank(tier: number, bank: BankResponse) {
        selectedBanks[tier] = bank;
        openDropdown = null;
        expandedBankId = null;
    }

    function closeDropdown() {
        openDropdown = null;
    }

    function handleKeydown(event: KeyboardEvent, callback: () => void) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            callback();
        }
    }

    async function toggleExpand(bank: BankResponse) {
        if (expandedBankId === bank.id) {
            expandedBankId = null;
            return;
        }
        expandedBankId = bank.id;
        if (!bankProducts[bank.id]) {
            loadingProducts[bank.id] = true;
            try {
                const products = await getBankProducts(bank.id);
                bankProducts[bank.id] = products;
            } catch {
                bankProducts[bank.id] = [];
            } finally {
                loadingProducts[bank.id] = false;
            }
        }
    }</script>

<div class="bank-container">
    <div class="hero-section">
        <div class="top-bar">
            <div class="top-bar-left">
                <h1 class="page-title">QUANT 은행 대출</h1>
            </div>
            <div class="top-bar-right">
                <div class="balance-info">
                    <span class="page-title">현재 잔고: {currentBalance.toLocaleString()}원</span>
                </div>
            </div>
        </div>

        <div class="hero-content">
            <div class="hero-bank-title">
                <img src={bankIcon} alt="은행" class="bank-icon"/>
                <span class="bank-text">은행 대출</span>
            </div>
        </div>
    </div>

    <div class="main-content">
        <div class="list-view">
            <div class="tier-filter-bar">
                {#each tierFilters as [t, label]}
                    <button
                        class="tier-filter-btn"
                        class:active={activeTierFilter === t}
                        onclick={() => { activeTierFilter = t; expandedBankId = null; }}
                    >{label}</button>
                {/each}
            </div>
            <div class="banks-grid" style="grid-template-columns: repeat({activeTierFilter === 0 ? 3 : 1}, 1fr);">
                {#each (activeTierFilter === 0 ? [1, 2, 3] : [activeTierFilter]) as tier}
                    {@const bank = selectedBanks[tier]}
                    <div class="bank-card-wrapper">
                        <div class="tier-header">
                            <div class="tier-title">{tierTitles[tier]}</div>
                            <div class="tier-subtitle">{tierSubtitles[tier]}</div>
                        </div>
                        {#if bank}
                        <div
                                class="bank-card simple hoverable"
                                class:expanded={expandedBankId === bank.id}
                                role="button"
                                tabindex="0"
                                onclick={() => toggleExpand(bank)}
                                onkeydown={(e) => handleKeydown(e, () => toggleExpand(bank))}
                        >
                            <div class="bank-header-simple">
                                {#if bank.logoUrl}
                                    <img src={bank.logoUrl} alt={bank.name} class="bank-logo"/>
                                {:else}
                                    <span class="bank-emoji">🏦</span>
                                {/if}
                                <span class="bank-name-simple">{bank.name}</span>
                                <button class="toggle-button" onclick={(e) => toggleDropdown(tier, e)}>
                                    <img src={arrow} alt="변경" class="arrow-icon" class:rotated={openDropdown === tier}/>
                                </button>
                            </div>
                            <div class="bank-rate-bar">
                                <img src={graph_yellow} alt="금리" class="rate-icon"/>
                                <span class="rate-text">금리: {bank.interestRate}%</span>
                            </div>

                            <div class="bank-details">
                                <div class="detail-row">
                                    <span class="detail-icon">💰</span>
                                    <span class="detail-label">총 대출 잔액</span>
                                    <span class="detail-value">{(loanSummary?.totalRemainingPrincipal ?? 0).toLocaleString()}원</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-icon">💵</span>
                                    <span class="detail-label">다음 상환액</span>
                                    <span class="detail-value">{(loanSummary?.nextPaymentAmount ?? 0).toLocaleString()}원</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-icon">📅</span>
                                    <span class="detail-label">이자 납입일</span>
                                    <span class="detail-value">{loanSummary?.nextPaymentDate ? new Date(loanSummary.nextPaymentDate).toLocaleDateString('ko-KR') : '-'}</span>
                                </div>
                            </div>
                        </div>
                        {:else}
                        <div class="bank-card simple">
                            <p class="loading-text">은행 정보를 불러오는 중...</p>
                        </div>
                        {/if}
                        {#if bank && expandedBankId === bank.id}
                        <div class="products-expand" transition:fly={{ y: -10, duration: 250, easing: quintOut }}>
                            <h4 class="products-title">{bank.name} 대출 상품</h4>
                            {#if loadingProducts[bank.id]}
                                <p class="products-loading">상품 불러오는 중...</p>
                            {:else if !(bankProducts[bank.id]?.length)}
                                <p class="products-empty">등록된 대출 상품이 없습니다.</p>
                            {:else}
                                {#each (bankProducts[bank.id] ?? []) as product}
                                    <div class="product-row">
                                        <div class="product-info">
                                            <div class="product-name">{product.name}</div>
                                            <div class="product-meta">
                                                <span class="product-type-badge">{product.loanTypeName}</span>
                                                <span class="product-rate">금리 {product.baseInterestRate}%</span>
                                                <span class="product-range">{product.minAmount.toLocaleString()}원 ~ {product.maxAmount.toLocaleString()}원</span>
                                            </div>
                                        </div>
                                        <button class="apply-btn" onclick={() => goToLoanPage(bank)}>대출 신청</button>
                                    </div>
                                {/each}
                            {/if}
                        </div>
                        {/if}
                    </div>
                {/each}
            </div>

            <div class="bottom-section">
                <div class="summary-section">
                    <div class="summary-card">
                        <h3 class="section-title">총 대출 요약</h3>
                        <div class="summary-row">
                            <div class="summary-label">
                                <span>총 대출 잔액</span>
                                <span class="sublabel">Total loan balance</span>
                            </div>
                            <div class="summary-value">{(loanSummary?.totalRemainingPrincipal ?? 0).toLocaleString()}원</div>
                        </div>
                        <div class="summary-row">
                            <div class="summary-label">
                                <span>총 납부 이자</span>
                                <span class="sublabel">Total interest paid</span>
                            </div>
                            <div class="summary-value">{(loanSummary?.totalInterestPaid ?? 0).toLocaleString()}원</div>
                        </div>
                        {#if loanSummary && loanSummary.totalBorrowedAmount > 0}
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: {Math.min(100, (1 - loanSummary.totalRemainingPrincipal / loanSummary.totalBorrowedAmount) * 100)}%"></div>
                        </div>
                        {:else}
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        {/if}
                    </div>

                    <button class="repay-btn" onclick={() => goto('/dashboard/loan')}>
                        대출 상환하기
                    </button>
                </div>
                <div class="payment-card">
                    <h3 class="section-title">상환 일정</h3>

                    <div class="payment-detail-group">
                        <div class="payment-item">
                            <div class="payment-label-sm">다음 상환일</div>
                            <div class="payment-date-blue">
                                {loanSummary?.nextPaymentDate ? new Date(loanSummary.nextPaymentDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : '-'}
                            </div>
                        </div>

                        <div class="payment-item">
                            <div class="payment-label-sm">예상 상환액</div>
                            <div class="payment-amount-lg">{(loanSummary?.nextPaymentAmount ?? 0).toLocaleString()}원</div>
                        </div>
                    </div>

                    <div class="dashed-divider"></div>

                    <div class="payment-breakdown">
                        <div class="breakdown-row">
                            <span class="breakdown-label">활성 대출 수</span>
                            <span class="breakdown-value">{loanSummary?.activeLoanCount ?? 0}건</span>
                        </div>
                        <div class="breakdown-row">
                            <span class="breakdown-label">총 차입액</span>
                            <span class="breakdown-value">{(loanSummary?.totalBorrowedAmount ?? 0).toLocaleString()}원</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

{#if openDropdown !== null}
    <div
            class="dropdown-overlay"
            role="button"
            tabindex="0"
            onclick={closeDropdown}
            onkeydown={(e) => handleKeydown(e, closeDropdown)}
            transition:fade={{ duration: 200 }}
    ></div>
    <div
            class="dropdown-menu-floating"
            style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px; width: {dropdownPosition.width}px;"
            transition:fly={{ y: -10, duration: 300, easing: quintOut }}
    >
        <div class="dropdown-header">
            <h4>{tierTitles[openDropdown]}</h4>
        </div>
        {#each (banksByTier()[openDropdown] ?? []) as bank}
            <button class="dropdown-item" onclick={() => selectBank(openDropdown!, bank)}>
                {#if bank.logoUrl}
                    <img src={bank.logoUrl} alt={bank.name} class="dropdown-item-logo"/>
                {:else}
                    <span class="bank-emoji-sm">🏦</span>
                {/if}
                <div class="dropdown-item-info">
                    <span class="dropdown-item-name">{bank.name}</span>
                    <span class="dropdown-item-rate">금리: {bank.interestRate}%</span>
                </div>
                {#if bank.id === selectedBanks[openDropdown]?.id}
                    <svg class="checkmark" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.6668 5L7.50016 14.1667L3.3335 10" stroke="currentColor" stroke-width="2"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                {/if}
            </button>
        {/each}
    </div>
{/if}

<style>
    /* 대출 상환하기 버튼 스타일 */
    .repay-btn {
        width: 100%; /* 부모(summary-section) 너비에 맞춤 */
        margin-top: 1rem; /* 위쪽 카드와의 간격 */
        background-color: #0b51a0; /* 이미지와 유사한 진한 파란색 */
        color: white;
        border: none;
        border-radius: 12px; /* 카드와 동일한 둥글기 */
        padding: 1.2rem;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(11, 81, 160, 0.2);
        transition: background-color 0.2s, transform 0.1s;
    }

    .repay-btn:hover {
        background-color: #094080;
        transform: translateY(-2px);
    }

    .repay-btn:active {
        transform: translateY(0);
    }
    /* CSS 축약형 적용 및 표준 속성 추가 */
    .bank-container { width: 100%; padding: 1.4rem 0 2rem 0; margin-top: -1.4rem; }
    .hero-section { background: var(--color-theme-1); margin: -1.4rem -2rem 2rem -2rem; color: white; position: relative; overflow: hidden; display: flex; flex-direction: column;}
    .top-bar { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 6rem; background: var(--color-theme-1-dark); }
    .top-bar-left { display: flex; align-items: center; gap: 0.5rem; }
    .page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: white; }
    .hero-content { display: flex; align-items: center; flex: 1; padding: 0 4rem 0 calc(192px + 2rem); position: relative; }
    .hero-content.compact { padding-bottom: 0; align-items: flex-end; }
    .hero-bank-title { display: flex; align-items: center; gap: 2rem; }
    .compact-title { gap: 1rem; }
    .bank-icon { height: 10rem; }
    .bank-icon-sm { height: 4rem; }
    .bank-text { font-size: 2.5rem; font-weight: 700; color: white; }

    .main-content { padding: 0 0; min-height: 600px; position: relative; }
    .banks-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; align-items: start; margin-bottom: 2rem;}
    .bank-card-wrapper { display: flex; flex-direction: column; gap: 1rem; }
    .tier-header { background: var(--color-theme-1); border-radius: 10px; padding: 1rem; text-align: center; color: white; }
    .tier-title { font-size: 1.5rem; font-weight: 700; }
    .tier-subtitle { font-size: 0.9rem; opacity: 0.8; }

    .bank-card.simple { background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: all 0.2s; cursor: pointer; position: relative; }
    .bank-card.simple.hoverable:hover { border-color: var(--color-theme-1); box-shadow: 0 10px 15px rgba(30,90,142,0.1); }

    .bank-details { display: flex; flex-direction: column; gap: 0.75rem; padding-top: 1rem; }
    .detail-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; }
    .detail-icon { font-size: 1rem; width: 1.5rem; text-align: center; }
    .detail-label { color: #6b7280; flex: 1; font-weight: 500; }
    .detail-value { font-weight: 600; color: #1a1a1a; }

    .click-guide { position: absolute; bottom: 0.5rem; left: 0; right: 0; text-align: center; font-size: 0.8rem; color: var(--color-theme-1); opacity: 0; transition: opacity 0.2s; font-weight: 600;}
    .bank-card.simple.hoverable:hover .click-guide { opacity: 1; }

    .bank-header-simple { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem; }
    .bank-logo { height: 2rem; width: auto; }
    .bank-name-simple { font-size: 1.5rem; font-weight: 600; color: var(--color-theme-1); }
    .bank-rate-bar { background: var(--color-theme-1); padding: 0.75rem 0.5rem; display: flex; align-items: center; justify-content: start; gap: 0.5rem; border-radius: 8px; color: white; font-weight: 600; }

    .toggle-button { background: none; border: none; padding: 0.25rem; border-radius: 50%; cursor: pointer; }
    .arrow-icon { width: 1.5rem; transition: transform 0.3s; }
    .arrow-icon.rotated { transform: rotate(180deg); }

    .bottom-section { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 2rem; }
    .summary-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 2rem; flex: 1; }
    .payment-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 2rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .summary-section {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    /* 상단 그룹 (날짜, 총액) */
    .payment-detail-group {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        margin-bottom: 1.5rem;
    }

    .payment-label-sm {
        font-size: 0.95rem;
        color: #9ca3af; /* 회색 텍스트 */
        margin-bottom: 0.4rem;
        font-weight: 500;
    }

    .payment-date-blue {
        font-size: 1.2rem;
        font-weight: 700;
        color: #0b51a0; /* 이미지의 파란색 톤 */
    }

    .payment-amount-lg {
        font-size: 1.8rem;
        font-weight: 800;
        color: #0b51a0; /* 이미지의 파란색 톤 */
        letter-spacing: -0.5px;
    }

    /* 점선 구분선 */
    .dashed-divider {
        border-top: 1px dashed #cbd5e1;
        width: 100%;
        margin-bottom: 1.5rem;
    }

    /* 하단 원금/이자 내역 */
    .payment-breakdown {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .breakdown-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 1.05rem;
    }

    .breakdown-label {
        color: #9ca3af; /* 회색 */
        font-weight: 500;
    }

    .breakdown-value {
        color: #1f2937; /* 진한 회색/검정 */
        font-weight: 600;
    }
    .section-title { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #1a1a1a; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 1rem; align-items: center; }
    .summary-label span:first-child { font-weight: 600; display: block; font-size: 1.2rem; }
    .sublabel { font-size: 0.8rem; color: #666; }
    .summary-value { font-size: 1.25rem; font-weight: 700; }
    .progress-bar { height: 10px; background: #eee; border-radius: 5px; overflow: hidden; margin-top: 1rem; }
    .progress-fill { height: 100%; background: var(--color-theme-1); }

    .payment-row { display: flex; justify-content: space-between; margin-bottom: 0.8rem; border-bottom: 1px dashed #eee; padding-bottom: 0.5rem; }
    .payment-amount { font-weight: 700; font-size: 1.2rem; color: #1a1a1a; }
    .payment-date { font-weight: 600; color: var(--color-theme-1); }

    .dropdown-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.2); z-index: 998; }
    .dropdown-menu-floating { position: absolute; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 999; overflow: hidden; border: 1px solid #eee; }
    .dropdown-header { background: #f3f4f6; padding: 0.8rem 1rem; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
    .dropdown-header h4 { margin: 0; font-size: 0.9rem; }
    .dropdown-item { width: 100%; display: flex; align-items: center; gap: 0.8rem; padding: 1rem; border: none; background: white; cursor: pointer; text-align: left; border-bottom: 1px solid #f9fafb; }
    .dropdown-item:hover { background: #f9fafb; }
    .dropdown-item-logo { height: 1.5rem; width: auto; }
    .dropdown-item-info { flex: 1; display: flex; flex-direction: column; }
    .dropdown-item-name { font-weight: 600; font-size: 0.95rem; }
    .dropdown-item-rate { font-size: 0.8rem; color: #6b7280; }
    .checkmark { color: var(--color-theme-1); }

    .bank-emoji { font-size: 2rem; }
    .bank-emoji-sm { font-size: 1.5rem; }
    .loading-text { color: #9ca3af; text-align: center; padding: 2rem; }

    @media (max-width: 1024px) {
        .banks-grid, .loan-content-grid, .bottom-section { grid-template-columns: 1fr; }
        .hero-content, .main-content, .top-bar { padding-left: 1.5rem; padding-right: 1.5rem; }
    }

    .tier-filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .tier-filter-btn { padding: 0.45rem 1.2rem; border: 1.5px solid var(--color-border, #e5e7eb); border-radius: 2rem; background: white; cursor: pointer; font-size: 0.95rem; font-weight: 600; color: #4b5563; transition: all 0.2s; }
    .tier-filter-btn:hover { border-color: var(--color-theme-1); color: var(--color-theme-1); }
    .tier-filter-btn.active { background: var(--color-theme-1); color: white; border-color: var(--color-theme-1); }

    .bank-card.simple.hoverable.expanded { border-color: var(--color-theme-1); box-shadow: 0 10px 15px rgba(30,90,142,0.12); }

    .products-expand { background: #f8faff; border: 1.5px solid var(--color-theme-2, #ecf2fe); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem; }
    .products-title { font-size: 1rem; font-weight: 700; color: var(--color-theme-1); margin: 0 0 0.25rem 0; }
    .products-loading { color: #9ca3af; text-align: center; padding: 1rem; margin: 0; font-size: 0.9rem; }
    .products-empty { color: #9ca3af; text-align: center; padding: 1rem; margin: 0; font-size: 0.9rem; }
    .product-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem 1rem; }
    .product-info { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; min-width: 0; }
    .product-name { font-weight: 600; font-size: 0.95rem; color: #1a1a1a; }
    .product-meta { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
    .product-type-badge { background: var(--color-theme-2, #ecf2fe); color: var(--color-theme-1); font-size: 0.75rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 1rem; white-space: nowrap; }
    .product-rate { font-size: 0.85rem; color: #059669; font-weight: 600; }
    .product-range { font-size: 0.8rem; color: #6b7280; }
    .apply-btn { background: var(--color-theme-1); color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: background-color 0.2s; }
    .apply-btn:hover { background: var(--color-theme-1-dark, #004480); }
</style>