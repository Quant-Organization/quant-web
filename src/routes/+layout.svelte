<script lang="ts">
    import '@fontsource/inter'
	import Header from '$lib/components/Header.svelte';
	import SideBar from '$lib/components/SideBar.svelte';
	import LoginModal from '$lib/components/LoginModal.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { showLoginModal, loginModalAuthRequired } from '$lib/stores/loginModal';
	import { auth } from '$lib/stores/auth';
	import { springMe } from '$lib/api/auth';
	import { get } from 'svelte/store';
	import '../app.css';

	let { children } = $props();

	const sidebarSections = ['/dashboard', '/asset', '/business', '/leaderboard'];
	let showSidebar = $derived(sidebarSections.some(s => page.url.pathname.startsWith(s)));

	onMount(() => {
		// 최초 접속 시 비로그인이면 로그인 모달 표시 (닫기 가능)
		if (!get(auth.isLoggedIn)) {
			showLoginModal.set(true);
		} else {
			// 이미 로그인된 상태면 서버에서 최신 유저 정보(레벨, 명성 등) 갱신
			springMe().then((me) => {
				const currentUser = get(auth.user);
				if (currentUser) {
					auth.user.set({
						...currentUser,
						level: me.level,
						fame: me.fame,
						playerName: me.playerName,
						investmentStyle: me.investmentStyle,
						title: me.title
					});
				}
			}).catch(() => {
				// 토큰 만료 등의 경우 — auth-required 이벤트가 처리함
			});
		}

		const onAuthRequired = () => {
			// 만료된 토큰 정리 후 재로그인 요청
			auth.logout();
			localStorage.removeItem('spring_token');
			localStorage.removeItem('fastapi_token');
			loginModalAuthRequired.set(true);
			showLoginModal.set(true);
		};

		const onFastAPIAuthRequired = () => {
			// FastAPI 토큰만 만료 — Spring 세션은 유지하고 재로그인 유도
			showLoginModal.set(true);
		};

		window.addEventListener('quant:auth-required', onAuthRequired);
		window.addEventListener('quant:fastapi-auth-required', onFastAPIAuthRequired);
		return () => {
			window.removeEventListener('quant:auth-required', onAuthRequired);
			window.removeEventListener('quant:fastapi-auth-required', onFastAPIAuthRequired);
		};
	});
</script>

<div class="app">
	<Header />
	<div class="main-content">
		{#if showSidebar}
			<SideBar />
		{/if}
		<main>
			{@render children()}
		</main>
	</div>
</div>
<LoginModal />
<Toaster position="top-right" />

<style>
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.main-content {
		flex: 1;
		display: flex;
		overflow: hidden;
	}

	main {
		flex: 1;
		display: flex;
		overflow: hidden;
	}
</style>
