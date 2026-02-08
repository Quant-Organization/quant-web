<script lang="ts">
    import '@fontsource/inter'
	import Header from '$lib/components/Header.svelte';
	import SideBar from '$lib/components/SideBar.svelte';
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();

	const sidebarSections = ['/dashboard', '/asset', '/business', '/leaderboard'];
	let showSidebar = $derived(sidebarSections.some(s => page.url.pathname.startsWith(s)));
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
