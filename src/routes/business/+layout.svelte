<script lang="ts">
    import { afterNavigate } from '$app/navigation';
    import { updateSection, selectedIndex, sidebarConfigs, currentCompanyId, setCompanySidebar } from '$lib/stores/sidebar';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';

    let { children } = $props();

    function updateSidebarForPath(pathname: string) {
        const companyMatch = pathname.match(/\/business\/company\/(\d+)/);

        if (companyMatch) {
            const companyId = companyMatch[1];
            const currentCompany = get(currentCompanyId);

            if (currentCompany !== companyId) {
                setCompanySidebar(companyId, "\uae08\uc131\uc804\uc790");
            }

            if (pathname.includes('/overview')) {
                selectedIndex.set(0);
            } else if (pathname.includes('/factory')) {
                selectedIndex.set(1);
            } else if (pathname.includes('/rnd')) {
                selectedIndex.set(2);
            } else if (pathname.includes('/distribution')) {
                selectedIndex.set(3);
            }
        } else {
            updateSection('business');

            const items = sidebarConfigs.business;
            const index = items.findIndex(item => item.link === pathname);
            if (index !== -1) {
                selectedIndex.set(index);
            }
        }
    }

    updateSidebarForPath(get(page).url.pathname);

    afterNavigate(({ to }) => {
        if (to?.url.pathname) {
            updateSidebarForPath(to.url.pathname);
        }
    });
</script>

<div class="content">
    {@render children()}
</div>

<style>
    .content {
        flex: 1;
        padding: 1.4rem 2rem;
        overflow-y: auto;
        background-color: var(--color-bg-0);
    }
</style>
