<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { auth } from '$lib/stores/auth';
    import { get } from 'svelte/store';
    import { showLoginModal } from '$lib/stores/loginModal';

    onMount(() => {
        if (get(auth.isLoggedIn)) {
            goto('/dashboard/overview', { replaceState: true });
        } else {
            showLoginModal.set(true);
            goto('/dashboard/overview', { replaceState: true });
        }
    });
</script>
