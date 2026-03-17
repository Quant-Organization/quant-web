<script lang="ts">
    import { fly, fade } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { auth } from '$lib/stores/auth';
    import { showLoginModal, loginModalAuthRequired } from '$lib/stores/loginModal';
    import { springLogin, springRegister, fastAPILogin, fastAPIRegister } from '$lib/api/auth';
    import { toast } from 'svelte-sonner';
    import logo from '$lib/images/quant-logo.svg';
    import { get } from 'svelte/store';

    import type { FastAPIToken } from '$lib/api/auth';

    /** FastAPI 로그인/회원가입을 1회 재시도 후 토큰 저장. 실패 시 toast 경고. */
    async function loginFastAPI(call: () => Promise<FastAPIToken>) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const res = await call();
                localStorage.setItem('fastapi_token', res.access_token);
                return;
            } catch {
                if (attempt === 0) await new Promise(r => setTimeout(r, 500));
            }
        }
        toast.warning('주식/코인 서버 연결에 실패했습니다. 일부 기능이 제한될 수 있습니다.');
    }

    let mode: 'login' | 'register' = $state('login');
    let username = $state('');
    let password = $state('');
    let playerName = $state('');
    let email = $state('');
    let error = $state('');
    let loading = $state(false);

    function resetForm() {
        showLoginModal.set(false);
        loginModalAuthRequired.set(false);
        username = '';
        password = '';
        playerName = '';
        email = '';
        error = '';
        mode = 'login';
    }

    function close() {
        const wasAuthRequired = get(loginModalAuthRequired);
        resetForm();
        if (wasAuthRequired) {
            history.back();
        }
    }

    async function handleSubmit() {
        error = '';
        loading = true;
        try {
            if (mode === 'login') {
                const springRes = await springLogin(username, password);
                localStorage.setItem('spring_token', springRes.token);
                await loginFastAPI(() => fastAPILogin(username, password));
                auth.login(springRes.token, {
                    id: springRes.id,
                    username: springRes.username,
                    playerName: springRes.playerName,
                    level: springRes.level,
                    fame: springRes.fame,
                    investmentStyle: springRes.investmentStyle,
                    title: springRes.title
                });
            } else {
                const springRes = await springRegister(username, password, playerName);
                localStorage.setItem('spring_token', springRes.token);
                await loginFastAPI(() => fastAPIRegister(username, email, password));
                auth.login(springRes.token, {
                    id: springRes.id,
                    username: springRes.username,
                    playerName: springRes.playerName,
                    level: springRes.level,
                    fame: springRes.fame,
                    investmentStyle: springRes.investmentStyle,
                    title: springRes.title
                });
            }
            const currentPath = page.url.pathname;
            resetForm();
            if (currentPath === '/login') {
                goto('/dashboard/overview');
            } else {
                // 이미 마운트된 페이지의 데이터를 갱신하기 위해 리로드
                location.reload();
            }
        } catch (e: unknown) {
            error = e instanceof Error ? e.message : '오류가 발생했습니다.';
        } finally {
            loading = false;
        }
    }
</script>

{#if $showLoginModal}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
        class="modal-backdrop"
        transition:fade={{ duration: 220 }}
        onclick={close}
    >
        <div
            class="modal-card"
            transition:fly={{ y: 64, duration: 360, easing: cubicOut }}
            onclick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'login' ? '로그인' : '회원가입'}
        >
            <button class="close-btn" onclick={close} aria-label="닫기">✕</button>

            <div class="logo-section">
                <img src={logo} alt="QUANT" class="logo-img" />
                <h2>QUANT</h2>
                <p class="subtitle">경제 시뮬레이션 게임</p>
            </div>

            {#if $loginModalAuthRequired}
                <div class="session-expired-msg">세션이 만료되었습니다. 다시 로그인해 주세요.</div>
            {/if}

            <div class="tab-row">
                <button class="tab" class:active={mode === 'login'} onclick={() => { mode = 'login'; error = ''; }}>로그인</button>
                <button class="tab" class:active={mode === 'register'} onclick={() => { mode = 'register'; error = ''; }}>회원가입</button>
            </div>

            <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div class="field">
                    <label for="modal-username">아이디</label>
                    <input id="modal-username" type="text" bind:value={username} placeholder="아이디를 입력하세요" required autocomplete="username" />
                </div>
                <div class="field">
                    <label for="modal-password">비밀번호</label>
                    <input id="modal-password" type="password" bind:value={password} placeholder="비밀번호를 입력하세요" required autocomplete={mode === 'login' ? 'current-password' : 'new-password'} />
                </div>
                {#if mode === 'register'}
                    <div class="field" transition:fly={{ y: -8, duration: 200, easing: cubicOut }}>
                        <label for="modal-playerName">플레이어 이름</label>
                        <input id="modal-playerName" type="text" bind:value={playerName} placeholder="게임에서 사용할 이름" required />
                    </div>
                    <div class="field" transition:fly={{ y: -8, duration: 220, easing: cubicOut }}>
                        <label for="modal-email">이메일</label>
                        <input id="modal-email" type="email" bind:value={email} placeholder="이메일 주소" required />
                    </div>
                {/if}
                {#if error}
                    <div class="error-msg">{error}</div>
                {/if}
                <button type="submit" class="submit-btn" disabled={loading}>
                    {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
                </button>
            </form>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }

    .modal-card {
        background: white;
        border-radius: 1.25rem;
        padding: 2.5rem;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 24px 64px rgba(0, 82, 155, 0.18), 0 4px 16px rgba(0, 0, 0, 0.12);
        position: relative;
    }

    .close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1rem;
        color: #9ca3af;
        cursor: pointer;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.15s, color 0.15s;
    }
    .close-btn:hover { background: #f3f4f6; color: #374151; }

    .logo-section { text-align: center; margin-bottom: 1.75rem; }
    .logo-img { width: 3rem; height: 3rem; margin-bottom: 0.5rem; }
    .logo-section h2 {
        font-size: 1.6rem;
        font-weight: 800;
        color: var(--color-theme-1, #00529B);
        margin: 0;
    }
    .subtitle { color: #9ca3af; font-size: 0.85rem; margin-top: 0.2rem; }

    .tab-row {
        display: flex;
        margin-bottom: 1.5rem;
        border-bottom: 2px solid #e5e7eb;
    }
    .tab {
        flex: 1;
        background: none;
        border: none;
        padding: 0.7rem 0;
        font-size: 0.95rem;
        font-weight: 500;
        color: #9ca3af;
        cursor: pointer;
        position: relative;
        transition: color 0.2s;
    }
    .tab.active { color: var(--color-theme-1, #00529B); font-weight: 700; }
    .tab.active::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 100%;
        height: 2px;
        background: var(--color-theme-1, #00529B);
        border-radius: 2px 2px 0 0;
    }

    .field { margin-bottom: 1.1rem; }
    .field label {
        display: block;
        font-size: 0.82rem;
        font-weight: 600;
        color: #555;
        margin-bottom: 0.35rem;
    }
    .field input {
        width: 100%;
        padding: 0.7rem 0.9rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;
        transition: border-color 0.2s, box-shadow 0.2s;
        outline: none;
        box-sizing: border-box;
        background: #fafafa;
        font-family: var(--font-body);
    }
    .field input:focus {
        border-color: var(--color-theme-1, #00529B);
        background: white;
        box-shadow: 0 0 0 3px rgba(0, 82, 155, 0.08);
    }

    .error-msg {
        color: #ef4444;
        font-size: 0.82rem;
        margin-bottom: 1rem;
        padding: 0.5rem 0.75rem;
        background: #fef2f2;
        border-radius: 6px;
        border-left: 3px solid #ef4444;
    }

    .session-expired-msg {
        color: #d97706;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 1rem;
        padding: 0.6rem 0.85rem;
        background: #fffbeb;
        border-radius: 8px;
        border-left: 3px solid #f59e0b;
        text-align: center;
    }

    .submit-btn {
        width: 100%;
        padding: 0.8rem;
        background: var(--color-theme-1, #00529B);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s, transform 0.1s;
        margin-top: 0.25rem;
        font-family: var(--font-body);
    }
    .submit-btn:hover:not(:disabled) { background: var(--color-theme-1-dark, #004480); }
    .submit-btn:active:not(:disabled) { transform: scale(0.98); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
