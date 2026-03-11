<script lang="ts">
    import { Canvas } from '@threlte/core';
    import { browser } from '$app/environment';
    import CoinScene from './CoinScene.svelte';

    let { onclick }: { onclick?: () => void } = $props();
</script>

{#if browser}
<div class="coin-canvas-wrapper">
    <Canvas>
        <CoinScene {onclick} />
    </Canvas>
</div>
{/if}

<style>
    .coin-canvas-wrapper {
        width: 100%;
        height: 100%;
        min-height: 12rem;
    }

    .coin-canvas-wrapper :global(canvas) {
        width: 100% !important;
        height: 100% !important;
    }
</style>
