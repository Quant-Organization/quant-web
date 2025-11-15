<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(() => {
        goto('/leaderboard/global');
    });
</script>

<svelte:head>
    <title>리더보드</title>
</svelte:head>
