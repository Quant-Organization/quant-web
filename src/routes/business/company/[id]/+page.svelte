<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    onMount(() => {
        goto(`/business/company/${$page.params.id}/overview`);
    });
</script>
