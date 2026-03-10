import { writable } from 'svelte/store';
import { getSpringAccount } from '$lib/api/dashboard';

// ─── Balance Store (server-backed) ──────────────────────

export const balance = writable<number>(0);

export async function refreshBalance(): Promise<number> {
    try {
        const acct = await getSpringAccount();
        balance.set(acct.cashBalance ?? 0);
        return acct.cashBalance ?? 0;
    } catch {
        return 0;
    }
}

// ─── Helpers ─────────────────────────────────────────────

export function formatCurrency(amount: number): string {
    return '$' + (amount ?? 0).toLocaleString('en-US');
}
