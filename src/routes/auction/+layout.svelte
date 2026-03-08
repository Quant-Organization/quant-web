<script lang="ts">
	let { children } = $props();
</script>

<div class="auction-layout">
	{@render children()}
</div>

<style>
	.auction-layout {
		width: 100%;
		min-height: 100vh;
		overflow-y: auto;
		padding: 1.4rem 2rem;
		background: #121212;
	}
</style>
