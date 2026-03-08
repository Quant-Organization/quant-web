<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(() => {
        goto('/dashboard/overview');
    });
</script>

<svelte:head>
    <title>Dashboard</title>
    <meta name="dashboard" content="main" />
</svelte:head>