import { writable, get } from 'svelte/store';
import { getSpringAccount } from '$lib/api/dashboard';

// ─── Balance Store (server-backed) ──────────────────────

export const balance = writable<number>(0);

export function setBalance(amount: number) {
    balance.set(amount);
}

export async function refreshBalance(): Promise<number> {
    try {
        const acct = await getSpringAccount();
        const val = acct.cashBalance ?? 0;
        balance.set(val);
        return val;
    } catch {
        return get(balance);
    }
}

// ─── Helpers ─────────────────────────────────────────────

export function formatCurrency(amount: number): string {
    return '$' + (amount ?? 0).toLocaleString('en-US');
}
