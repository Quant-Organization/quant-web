<script lang="ts">
    import { fly, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { goto } from '$app/navigation';
    import sinhan from '$lib/images/sinhan.svg';
    import sinhyup from '$lib/images/sinhyup.svg';
    import ok from '$lib/images/ok.svg';
    import arrow from '$lib/images/arrow.svg';
    import graph_yellow from '$lib/images/graph_yellow.svg';
    import bankIcon from '$lib/images/bank.svg';

    // --- 기존 데이터 ---
    let currentBalance = 15000000;
    let loanAmount = $state(1500000);
    let repaymentAmount = $state(150000);
    let nextPaymentDate = $state('2025-12-02');

    // --- 드롭다운 및 은행 목록 State ---
    let openDropdown: 'bank1' | 'bank2' | 'bank3' | null = $state(null);
    let dropdownPosition = $state({ top: 0, left: 0, width: 0 });

    let selectedBanks = $state({
        bank1: { name: '신한은행', icon: sinhan, rate: 3.5, tier: 1 },
        bank2: { name: '신협', icon: sinhyup, rate: 5.5, tier: 2 },
        bank3: { name: 'OK저축은행', icon: ok, rate: 8.5, tier: 3 }
    });

    const banks = [
        {
            tier: 1,
            title: '제1금융권',
            institutions: [
                { name: '신한은행', icon: sinhan, rate: 3.5, tier: 1 },
                { name: 'KB국민은행', icon: sinhan, rate: 3.8, tier: 1 },
                { name: '우리은행', icon: sinhan, rate: 3.7, tier: 1 }
            ]
        },
        {
            tier: 2,
            title: '제2금융권',
            institutions: [
                { name: '신협', icon: sinhyup, rate: 5.5, tier: 2 },
                { name: '새마을금고', icon: sinhyup, rate: 5.8, tier: 2 },
                { name: '수협', icon: sinhyup, rate: 5.3, tier: 2 }
            ]
        },
        {
            tier: 3,
            title: '제3금융권',
            institutions: [
                { name: 'OK저축은행', icon: ok, rate: 8.5, tier: 3 },
                { name: '웰컴저축은행', icon: ok, rate: 9.2, tier: 3 },
                { name: 'SBI저축은행', icon: ok, rate: 8.8, tier: 3 }
            ]
        }
    ];

    // --- Functions ---
    function goToLoanPage(bank: any) {
        const bankData = encodeURIComponent(JSON.stringify(bank));
        goto(`/dashboard/loan?bank=${bankData}`);
    }

    function handleFinalLoan() {
        alert('대출 신청이 완료되었습니다.');
    }

    function toggleDropdown(slot: 'bank1' | 'bank2' | 'bank3', event: MouseEvent) {
        event.stopPropagation();
        if (openDropdown === slot) {
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
        openDropdown = slot;
    }

    function selectBank(slot: 'bank1' | 'bank2' | 'bank3', bank: any) {
        selectedBanks[slot] = bank;
        openDropdown = null;
    }

    function getBanksForTier(tier: number) {
        const tierData = banks.find(b => b.tier === tier);
        return tierData ? tierData.institutions : [];
    }

    function closeDropdown() {
        openDropdown = null;
    }

    // 키보드 이벤트 핸들러 (a11y 해결용)
    function handleKeydown(event: KeyboardEvent, callback: () => void) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            callback();
        }
    }
</script>

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
            <div class="banks-grid">
                    <div class="bank-card-wrapper">
                        <div class="tier-header">
                            <div class="tier-title">제1금융권</div>
                            <div class="tier-subtitle">(First-tier financial institutions)</div>
                        </div>
                        <div
                                class="bank-card simple hoverable"
                                role="button"
                                tabindex="0"
                                onclick={() => goToLoanPage(selectedBanks.bank1)}
                                onkeydown={(e) => handleKeydown(e, () => goToLoanPage(selectedBanks.bank1))}
                        >
                            <div class="bank-header-simple">
                                <img src={selectedBanks.bank1.icon} alt={selectedBanks.bank1.name} class="bank-logo"/>
                                <span class="bank-name-simple">{selectedBanks.bank1.name}</span>
                                <button class="toggle-button" onclick={(e) => toggleDropdown('bank1', e)}>
                                    <img src={arrow} alt="변경" class="arrow-icon" class:rotated={openDropdown === 'bank1'}/>
                                </button>
                            </div>
                            <div class="bank-rate-bar">
                                <img src={graph_yellow} alt="금리" class="rate-icon"/>
                                <span class="rate-text">금리: {selectedBanks.bank1.rate}%</span>
                            </div>

                            <div class="bank-details">
                                <div class="detail-row">
                                    <span class="detail-icon">💰</span>
                                    <span class="detail-label">대출 원금</span>
                                    <span class="detail-value">{loanAmount.toLocaleString()}원</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-icon">💵</span>
                                    <span class="detail-label">상환 금액</span>
                                    <span class="detail-value">{repaymentAmount.toLocaleString()}원</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-icon">📅</span>
                                    <span class="detail-label">이자 납입일</span>
                                    <span class="detail-value">{nextPaymentDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bank-card-wrapper">
                        <div class="tier-header">
                            <div class="tier-title">제2금융권</div>
                            <div class="tier-subtitle">(Second-tier)</div>
                        </div>
                        <div
                                class="bank-card simple hoverable"
                                role="button"
                                tabindex="0"
                                onclick={() => goToLoanPage(selectedBanks.bank2)}
                                onkeydown={(e) => handleKeydown(e, () => goToLoanPage(selectedBanks.bank2))}
                        >
                            <div class="bank-header-simple">
                                <img src={selectedBanks.bank2.icon} alt={selectedBanks.bank2.name} class="bank-logo"/>
                                <span class="bank-name-simple">{selectedBanks.bank2.name}</span>
                                <button class="toggle-button" onclick={(e) => toggleDropdown('bank2', e)}>
                                    <img src={arrow} alt="변경" class="arrow-icon" class:rotated={openDropdown === 'bank2'}/>
                                </button>
                            </div>
                            <div class="bank-rate-bar">
                                <img src={graph_yellow} alt="금리" class="rate-icon"/>
                                <span class="rate-text">금리: {selectedBanks.bank2.rate}%</span>
                            </div>

                            <div class="bank-details">
                                <div class="detail-row">
                                    <span class="detail-icon">💰</span>
                                    <span class="detail-label">대출 원금</span>
                                    <span class="detail-value">{loanAmount.toLocaleString()}원</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-icon">💵</span>
                                    <span class="detail-label">상환 금액</span>
                                    <span class="detail-value">{repaymentAmount.toLocaleString()}원</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-icon">📅</span>
                                    <span class="detail-label">이자 납입일</span>
                                    <span class="detail-value">{nextPaymentDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bank-card-wrapper">
                        <div class="tier-header">
                            <div class="tier-title">제3금융권</div>
                            <div class="tier-subtitle">(Unregulated)</div>
                        </div>
                        <div
                                class="bank-card simple hoverable"
                                role="button"
                                tabindex="0"
                                onclick={() => goToLoanPage(selectedBanks.bank3)}
                                onkeydown={(e) => handleKeydown(e, () => goToLoanPage(selectedBanks.bank3))}
                        >
                            <div class="bank-header-simple">
                                <img src={selectedBanks.bank3.icon} alt={selectedBanks.bank3.name} class="bank-logo"/>
                                <span class="bank-name-simple">{selectedBanks.bank3.name}</span>
                                <button class="toggle-button" onclick={(e) => toggleDropdown('bank3', e)}>
                                    <img src={arrow} alt="변경" class="arrow-icon" class:rotated={openDropdown === 'bank3'}/>
                                </button>
                            </div>
                            <div class="bank-rate-bar">
                                <img src={graph_yellow} alt="금리" class="rate-icon"/>
                                <span class="rate-text">금리: {selectedBanks.bank3.rate}%</span>
                            </div>

                            <div class="bank-details">
                                <div class="detail-row">
                                    <span class="detail-icon">💰</span>
                                    <span class="detail-label">대출 원금</span>
                                    <span class="detail-value">{loanAmount.toLocaleString()}원</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-icon">💵</span>
                                    <span class="detail-label">상환 금액</span>
                                    <span class="detail-value">{repaymentAmount.toLocaleString()}원</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-icon">📅</span>
                                    <span class="detail-label">이자 납입일</span>
                                    <span class="detail-value">{nextPaymentDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bottom-section">
                    <div class="summary-section">
                        <div class="summary-card">
                            <h3 class="section-title">총 대출 요약</h3>
                            <div class="summary-row">
                                <div class="summary-label">
                                    <span>총 대출 잔액</span>
                                    <span class="sublabel">Total loan history</span>
                                </div>
                                <div class="summary-value">4,500,000원</div>
                            </div>
                            <div class="summary-row">
                                <div class="summary-label">
                                    <span>총 상환 금액</span>
                                    <span class="sublabel">Total repayment</span>
                                </div>
                                <div class="summary-value">1,500,000원</div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 33%"></div>
                            </div>
                        </div>

                        <button class="repay-btn">
                            대출 상환하기
                        </button>
                    </div>
                    <div class="payment-card">
                        <h3 class="section-title">상환 일정</h3>

                        <div class="payment-detail-group">
                            <div class="payment-item">
                                <div class="payment-label-sm">다음 상환일</div>
                                <div class="payment-date-blue">2025년 12월 12일 (금)</div>
                            </div>

                            <div class="payment-item">
                                <div class="payment-label-sm">예상 상환액</div>
                                <div class="payment-amount-lg">{(loanAmount + repaymentAmount).toLocaleString()}원</div>
                            </div>
                        </div>

                        <div class="dashed-divider"></div>

                        <div class="payment-breakdown">
                            <div class="breakdown-row">
                                <span class="breakdown-label">원금</span>
                                <span class="breakdown-value">{loanAmount.toLocaleString()}원</span>
                            </div>
                            <div class="breakdown-row">
                                <span class="breakdown-label">이자</span>
                                <span class="breakdown-value">{repaymentAmount.toLocaleString()}원</span>
                            </div>
                        </div>
                    </div>
                </div>
        </div>
    </div>
</div>

{#if openDropdown}
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
            <h4>제{selectedBanks[openDropdown].tier}금융권</h4>
        </div>
        {#each getBanksForTier(selectedBanks[openDropdown].tier) as bank}
            <button class="dropdown-item" onclick={() => selectBank(openDropdown!, bank)}>
                <img src={bank.icon} alt={bank.name} class="dropdown-item-logo"/>
                <div class="dropdown-item-info">
                    <span class="dropdown-item-name">{bank.name}</span>
                    <span class="dropdown-item-rate">금리: {bank.rate}%</span>
                </div>
                {#if bank.name === selectedBanks[openDropdown].name}
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

    @media (max-width: 1024px) {
        .banks-grid, .loan-content-grid, .bottom-section { grid-template-columns: 1fr; }
        .hero-content, .main-content, .top-bar { padding-left: 1.5rem; padding-right: 1.5rem; }
    }
</style>