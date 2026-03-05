<script lang="ts">
    import '@fontsource/inter'
	import Header from '$lib/components/Header.svelte';
	import SideBar from '$lib/components/SideBar.svelte';
	import LoginModal from '$lib/components/LoginModal.svelte';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { showLoginModal, loginModalAuthRequired } from '$lib/stores/loginModal';
	import { auth } from '$lib/stores/auth';
	import { get } from 'svelte/store';
	import '../app.css';

	let { children } = $props();

	const sidebarSections = ['/dashboard', '/asset', '/business', '/leaderboard'];
	let showSidebar = $derived(sidebarSections.some(s => page.url.pathname.startsWith(s)));

	onMount(() => {
		// 최초 접속 시 비로그인이면 로그인 모달 표시 (닫기 가능)
		if (!get(auth.isLoggedIn)) {
			showLoginModal.set(true);
		}

		const onAuthRequired = () => {
			loginModalAuthRequired.set(true);
			showLoginModal.set(true);
		};
		window.addEventListener('quant:auth-required', onAuthRequired);
		return () => window.removeEventListener('quant:auth-required', onAuthRequired);
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
