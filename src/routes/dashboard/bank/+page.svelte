<script lang="ts">
    import { fly, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
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

    // --- 대출 신청 페이지용 State ---
    let selectedLoanBank: { name: string, icon: string, rate: number, tier: number } | null = $state(null);
    let applyAmount = $state(50000000);
    let applyTerm = $state(36);
    let repaymentMethod = $state('equal_principal_interest');

    // 월 예상 상환금 계산 (변수 p 제거)
    let estimatedMonthlyPayment = $derived.by(() => {
        if (!selectedLoanBank) return 0;
        const rate = selectedLoanBank.rate / 100 / 12;
        const n = applyTerm;
        const payment = (applyAmount * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
        return Math.floor(payment);
    });

    let sliderStyle = $derived(`background: linear-gradient(to right, #00509d 0%, #00509d ${(applyAmount / 150000000) * 100}%, #e5e7eb ${(applyAmount / 150000000) * 100}%, #e5e7eb 100%);`);

    // --- Functions ---
    function goToLoanPage(bank: any) {
        selectedLoanBank = bank;
        applyAmount = 50000000;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function goBackToList() {
        selectedLoanBank = null;
    }

    function handleFinalLoan() {
        if(!selectedLoanBank) return;
        alert(`${selectedLoanBank.name}에서 ${applyAmount.toLocaleString()}원 대출 신청이 완료되었습니다.`);
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

        {#if !selectedLoanBank}
            <div class="hero-content" transition:fade>
                <div class="hero-bank-title">
                    <img src={bankIcon} alt="은행" class="bank-icon"/>
                    <span class="bank-text">은행 대출</span>
                </div>
            </div>
        {:else}
            <div class="hero-content compact" transition:fade>
                <div class="hero-bank-title compact-title">
                    <button class="back-button" onclick={goBackToList}>
                        <img src={arrow} alt="뒤로가기" class="back-arrow"/>
                    </button>
                    <img src={bankIcon} alt="은행" class="bank-icon-sm"/>
                    <span class="bank-text">은행 대출</span>
                </div>
            </div>
        {/if}
    </div>

    <div class="main-content">
        {#if selectedLoanBank === null}
            <div class="list-view" transition:fade={{duration: 200}}>
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
                    </div>
                    <div class="payment-card">
                        <h3 class="section-title">상환 일정</h3>
                        <div class="payment-info">
                            <div class="payment-row">
                                <div class="payment-label">다음 상환일</div>
                                <div class="payment-date">2025년 12월 12일 (금)</div>
                            </div>
                            <div class="payment-row">
                                <div class="payment-label">예상 상환액</div>
                                <div class="payment-amount">1,650,000원</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        {:else}
            <div class="loan-view" transition:fly={{ y: 20, duration: 400 }}>
                <div class="loan-header">
                    <h2>대출 신청</h2>
                    <div class="loan-bank-badge">
                        <img src={selectedLoanBank.icon} alt="bank" />
                        <span>{selectedLoanBank.name}</span>
                    </div>
                </div>

                <div class="loan-content-grid">
                    <div class="loan-form-card">
                        <div class="form-row two-col">
                            <div class="input-group">
                                <label for="loan-type">대출 신청</label>
                                <select id="loan-type" class="custom-select">
                                    <option>신용 대출</option>
                                    <option>담보 대출</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label for="loan-term">대출 기간</label>
                                <select id="loan-term" class="custom-select" bind:value={applyTerm}>
                                    <option value={12}>12개월</option>
                                    <option value={24}>24개월</option>
                                    <option value={36}>36개월</option>
                                    <option value={48}>48개월</option>
                                    <option value={60}>60개월</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="input-group">
                                <label for="amount">대출액</label>
                                <div class="amount-display-box">
                                    <div class="amount-label">대출액</div>
                                    <div class="amount-value-tag">{applyAmount.toLocaleString()}원</div>
                                </div>
                                <input
                                        id="amount"
                                        type="range"
                                        min="1000000"
                                        max="150000000"
                                        step="1000000"
                                        bind:value={applyAmount}
                                        class="range-slider"
                                        style={sliderStyle}
                                />
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="radio-group-label">상환 방식</div>
                            <div class="radio-group">
                                <label class="radio-item" class:selected={repaymentMethod === 'equal_principal_interest'}>
                                    <input type="radio" name="method" value="equal_principal_interest" bind:group={repaymentMethod}>
                                    <span class="radio-circle"></span>
                                    <span>원리금균등상환</span>
                                </label>
                                <label class="radio-item" class:selected={repaymentMethod === 'bullet'}>
                                    <input type="radio" name="method" value="bullet" bind:group={repaymentMethod}>
                                    <span class="radio-circle"></span>
                                    <span>만기일시상환</span>
                                </label>
                                <label class="radio-item" class:selected={repaymentMethod === 'equal_principal'}>
                                    <input type="radio" name="method" value="equal_principal" bind:group={repaymentMethod}>
                                    <span class="radio-circle"></span>
                                    <span>원금균등상환</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="loan-summary-sidebar">
                        <div class="estimated-card">
                            <div class="estimated-bg"></div>
                            <div class="estimated-content">
                                <div class="est-label">예상 월 상환금</div>
                                <div class="est-amount">₩{estimatedMonthlyPayment.toLocaleString()}</div>
                            </div>
                        </div>

                        <div class="summary-details-card">
                            <h3>신청 요약</h3>
                            <div class="detail-list">
                                <div class="detail-item">
                                    <span class="label">대출 은행</span>
                                    <span class="value">{selectedLoanBank.name}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">대출 상품</span>
                                    <span class="value">신용 대출</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">대출 원금</span>
                                    <span class="value">{applyAmount.toLocaleString()}원</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">대출 기간</span>
                                    <span class="value">{applyTerm}개월</span>
                                </div>
                                <div class="detail-item highlight">
                                    <span class="label">예상 금리</span>
                                    <span class="value">연 {selectedLoanBank.rate}%</span>
                                </div>
                            </div>
                        </div>

                        <button class="final-apply-btn" onclick={handleFinalLoan}>
                            대출 받기
                        </button>
                    </div>
                </div>
            </div>
        {/if}
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
    /* CSS 축약형 적용 및 표준 속성 추가 */
    .bank-container { width: 100%; padding: 1.4rem 0 2rem 0; margin-top: -1.4rem; }
    .hero-section { background: linear-gradient(135deg, #1e5a8e 0%, #124a7a 100%); margin: -1.4rem -2rem 2rem -2rem; color: white; position: relative; overflow: hidden; min-height: 250px; display: flex; flex-direction: column;}
    .top-bar { display: flex; justify-content: space-between; align-items: center; padding: 0 6rem; background: rgba(0,0,0,0.1); }
    .page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: white; }
    .hero-content { display: flex; align-items: center; flex: 1; padding: 0 4rem 2rem calc(192px + 2rem); }
    .hero-content.compact { padding-bottom: 1rem; align-items: flex-end; }
    .hero-bank-title { display: flex; align-items: center; gap: 2rem; }
    .compact-title { gap: 1rem; }
    .bank-icon { height: 10rem; }
    .bank-icon-sm { height: 4rem; }
    .bank-text { font-size: 2.5rem; font-weight: 700; color: white; }

    .main-content { padding: 0 4rem; min-height: 600px; }
    .banks-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; align-items: start; margin-bottom: 2rem;}
    .bank-card-wrapper { display: flex; flex-direction: column; gap: 1rem; }
    .tier-header { background: #1e5a8e; border-radius: 10px; padding: 1rem; text-align: center; color: white; }
    .tier-title { font-size: 1.5rem; font-weight: 700; }
    .tier-subtitle { font-size: 0.9rem; opacity: 0.8; }

    .bank-card.simple { background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: all 0.2s; cursor: pointer; position: relative; }
    .bank-card.simple.hoverable:hover { border-color: #1e5a8e; transform: translateY(-4px); box-shadow: 0 10px 15px rgba(30,90,142,0.1); }

    .bank-details { display: flex; flex-direction: column; gap: 0.75rem; padding-top: 1rem; }
    .detail-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; }
    .detail-icon { font-size: 1rem; width: 1.5rem; text-align: center; }
    .detail-label { color: #6b7280; flex: 1; font-weight: 500; }
    .detail-value { font-weight: 600; color: #1a1a1a; }

    .click-guide { position: absolute; bottom: 0.5rem; left: 0; right: 0; text-align: center; font-size: 0.8rem; color: #1e5a8e; opacity: 0; transition: opacity 0.2s; font-weight: 600;}
    .bank-card.simple.hoverable:hover .click-guide { opacity: 1; }

    .bank-header-simple { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem; }
    .bank-logo { height: 2rem; width: auto; }
    .bank-name-simple { font-size: 1.5rem; font-weight: 600; color: #1e5a8e; }
    .bank-rate-bar { background: #1e5a8e; padding: 0.75rem 0.5rem; display: flex; align-items: center; justify-content: start; gap: 0.5rem; border-radius: 8px; color: white; font-weight: 600; }

    .toggle-button { background: none; border: none; padding: 0.25rem; border-radius: 50%; cursor: pointer; }
    .arrow-icon { width: 1.5rem; transition: transform 0.3s; }
    .arrow-icon.rotated { transform: rotate(180deg); }

    .bottom-section { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 2rem; }
    .summary-card, .payment-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 2rem; }
    .section-title { font-size: 1.25rem; font-weight: bold; margin-bottom: 1.5rem; color: #1a1a1a; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 1rem; align-items: center; }
    .summary-label span:first-child { font-weight: 600; display: block; }
    .sublabel { font-size: 0.8rem; color: #666; }
    .summary-value { font-size: 1.25rem; font-weight: 700; }
    .progress-bar { height: 10px; background: #eee; border-radius: 5px; overflow: hidden; margin-top: 1rem; }
    .progress-fill { height: 100%; background: #1e5a8e; }

    .payment-row { display: flex; justify-content: space-between; margin-bottom: 0.8rem; border-bottom: 1px dashed #eee; padding-bottom: 0.5rem; }
    .payment-amount { font-weight: 700; font-size: 1.2rem; color: #1a1a1a; }
    .payment-date { font-weight: 600; color: #1e5a8e; }

    .loan-view { display: flex; flex-direction: column; gap: 2rem; }
    .loan-header { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
    .loan-header h2 { font-size: 2rem; font-weight: 700; margin: 0; color: #1a1a1a; }
    .loan-bank-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 1.2rem; font-weight: 600; color: #1e5a8e; }
    .loan-bank-badge img { height: 1.5rem; }

    .loan-content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }

    .loan-form-card { background: white;  border-radius: 16px; display: flex; flex-direction: column; gap: 2rem; }
    .form-row { display: flex; flex-direction: column; gap: 0.8rem; }
    .form-row.two-col { flex-direction: row; gap: 1.5rem; }
    .input-group { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
    .input-group label { font-size: 0.95rem; color: #6b7280; font-weight: 500; }

    .custom-select {
        appearance: none;
        -webkit-appearance: none;
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") no-repeat right 1rem center;
        background-size: 1.2rem;
        cursor: pointer;
    }
    .custom-select:focus { outline: 2px solid #1e5a8e; border-color: transparent; }

    .amount-display-box {
        display: flex; justify-content: space-between; align-items: center;
        background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px 12px 0 0;
        padding: 1.5rem;
        border-bottom: none;
    }
    .amount-value-tag { background: #e5e7eb; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; color: #4b5563; }

    .range-slider {
        appearance: none;
        -webkit-appearance: none;
        width: 100%;
        height: 8px;
        border-radius: 0 0 12px 12px;
        outline: none;
        margin: 0;
        cursor: pointer;
    }
    .range-slider::-webkit-slider-thumb {
        appearance: none;
        -webkit-appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #1e5a8e;
        cursor: pointer;
        border: 4px solid white;
        box-shadow: 0 0 0 1px #1e5a8e;
    }

    .radio-group-label { font-size: 0.95rem; color: #6b7280; font-weight: 500; }
    .radio-group { display: flex; gap: 1rem; margin-top: 0.5rem; }
    .radio-item {
        flex: 1;
        display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        transition: all 0.2s;
    }
    .radio-item input { display: none; }
    .radio-circle { width: 18px; height: 18px; border: 2px solid #d1d5db; border-radius: 50%; display: block; position: relative; }
    .radio-item.selected { border-color: #1e5a8e; background: #f0f7ff; color: #1e5a8e; }
    .radio-item.selected .radio-circle { border-color: #1e5a8e; }
    .radio-item.selected .radio-circle::after {
        content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 10px; height: 10px; background: #1e5a8e; border-radius: 50%;
    }

    .loan-summary-sidebar { display: flex; flex-direction: column; gap: 1.5rem; }

    .estimated-card {
        background: white; border-radius: 16px; padding: 2rem;
        border: 1px solid #e5e7eb;
        text-align: center;
        position: relative; overflow: hidden;
        min-height: 140px; display: flex; align-items: center; justify-content: center;
    }
    .estimated-bg {
        position: absolute; top: -50%; left: 50%; transform: translateX(-50%);
        width: 300px; height: 300px; background: #f0f7ff; border-radius: 50%; z-index: 0;
    }
    .estimated-content { position: relative; z-index: 1; }
    .est-label { color: #6b7280; font-size: 1rem; margin-bottom: 0.5rem; }
    .est-amount { color: #1e5a8e; font-size: 2rem; font-weight: 800; }

    .summary-details-card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 2rem; }
    .summary-details-card h3 { margin: 0 0 1.5rem 0; font-size: 1.1rem; }
    .detail-list { display: flex; flex-direction: column; gap: 1rem; }
    .detail-item { display: flex; justify-content: space-between; font-size: 0.95rem; color: #4b5563; }
    .detail-item .value { font-weight: 600; color: #1a1a1a; }
    .detail-item.highlight .value { color: #1e5a8e; font-size: 1.1rem; }

    .final-apply-btn {
        width: 100%;
        background: #00509d;
        color: white;
        padding: 1.2rem;
        border: none;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
        box-shadow: 0 4px 6px rgba(0,80,157, 0.2);
    }
    .final-apply-btn:hover { background: #003f7f; }

    .back-button { background: none; border: none; cursor: pointer; color: white; padding: 0; margin-right: 0.5rem;}
    .back-arrow { width: 1.5rem; height: 1.5rem; filter: brightness(0) invert(1); transform: rotate(90deg); }

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
    .checkmark { color: #1e5a8e; }

    @media (max-width: 1024px) {
        .banks-grid, .loan-content-grid, .bottom-section { grid-template-columns: 1fr; }
        .hero-content, .main-content, .top-bar { padding-left: 1.5rem; padding-right: 1.5rem; }
    }
</style>