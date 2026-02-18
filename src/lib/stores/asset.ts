import { writable, derived, get } from 'svelte/store';

// ─── Types ───────────────────────────────────────────────

export type StorageType = 'garage' | 'hangar' | 'marina';
export type StorageTier = 'basic' | 'standard' | 'premium';

export type StorageTierConfig = {
    tier: StorageTier;
    name: string;
    price: number;
    capacity: number;
    gradeText: string;
    maintenanceCost: number;
    isPremium: boolean;
};

export type StorageFacility = {
    type: StorageType;
    tier: StorageTier;
    name: string;
    capacity: number;
    currentCount: number;
    maintenanceCost: number;
    purchasePrice: number;
};

export type VehicleType = 'car' | 'jet' | 'yacht';

export type Vehicle = {
    id: string;
    type: VehicleType;
    name: string;
    price: number;
    img: string;
    fame: number;
    maintenanceCost: number;
    specs: Record<string, string>;
    purchasedAt: string;
};

// ─── Storage ↔ Vehicle Mapping ───────────────────────────

export const storageVehicleMap: Record<VehicleType, StorageType> = {
    car: 'garage',
    jet: 'hangar',
    yacht: 'marina',
};

export const storageLabels: Record<StorageType, string> = {
    garage: '차고',
    hangar: '격납고',
    marina: '마리나',
};

export const vehicleLabels: Record<VehicleType, string> = {
    car: '고급 차량',
    jet: '전용기',
    yacht: '요트',
};

export const tierLabels: Record<StorageTier, string> = {
    basic: '기본',
    standard: '표준',
    premium: '프리미엄',
};

export const tierOrder: StorageTier[] = ['basic', 'standard', 'premium'];

// ─── Tier Configs ────────────────────────────────────────

export const storageTierConfigs: Record<StorageType, StorageTierConfig[]> = {
    garage: [
        { tier: 'basic', name: '기본 차고', price: 1_000_000, capacity: 5, gradeText: '일반, 스포츠', maintenanceCost: 50_000, isPremium: false },
        { tier: 'standard', name: '표준 차고', price: 8_500_000, capacity: 15, gradeText: '일반, 스포츠, 슈퍼카', maintenanceCost: 150_000, isPremium: false },
        { tier: 'premium', name: '프리미엄 차고', price: 250_000_000, capacity: 30, gradeText: '모든 등급', maintenanceCost: 500_000, isPremium: true },
    ],
    hangar: [
        { tier: 'basic', name: '기본 격납고', price: 10_000_000, capacity: 3, gradeText: '경비행기', maintenanceCost: 200_000, isPremium: false },
        { tier: 'standard', name: '표준 격납고', price: 85_000_000, capacity: 8, gradeText: '경비행기, 중형기', maintenanceCost: 600_000, isPremium: false },
        { tier: 'premium', name: '프리미엄 격납고', price: 500_000_000, capacity: 15, gradeText: '모든 등급', maintenanceCost: 1_500_000, isPremium: true },
    ],
    marina: [
        { tier: 'basic', name: '기본 마리나', price: 5_000_000, capacity: 3, gradeText: '소형 요트', maintenanceCost: 100_000, isPremium: false },
        { tier: 'standard', name: '표준 마리나', price: 50_000_000, capacity: 8, gradeText: '소형, 중형 요트', maintenanceCost: 350_000, isPremium: false },
        { tier: 'premium', name: '프리미엄 마리나', price: 350_000_000, capacity: 15, gradeText: '모든 등급', maintenanceCost: 1_000_000, isPremium: true },
    ],
};

// ─── LocalStorage Helpers ────────────────────────────────

const STORAGE_KEY = 'quant-web-assets';

type PersistedState = {
    balance: number;
    storageFacilities: StorageFacility[];
    ownedVehicles: Vehicle[];
};

function loadState(): PersistedState {
    if (typeof window === 'undefined') {
        return getDefaultState();
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw) as PersistedState;
        }
    } catch {
        /* empty */
    }
    return getDefaultState();
}

function getDefaultState(): PersistedState {
    return {
        balance: 500_000_000,
        storageFacilities: [],
        ownedVehicles: [],
    };
}

function persistState() {
    if (typeof window === 'undefined') return;
    const state: PersistedState = {
        balance: get(balance),
        storageFacilities: get(storageFacilities),
        ownedVehicles: get(ownedVehicles),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Stores ──────────────────────────────────────────────

const initial = loadState();

export const balance = writable<number>(initial.balance);
export const storageFacilities = writable<StorageFacility[]>(initial.storageFacilities);
export const ownedVehicles = writable<Vehicle[]>(initial.ownedVehicles);

balance.subscribe(() => persistState());
storageFacilities.subscribe(() => persistState());
ownedVehicles.subscribe(() => persistState());

// ─── Derived Stores ──────────────────────────────────────

export const hasGarage = derived(storageFacilities, ($sf) =>
    $sf.some((f) => f.type === 'garage')
);

export const hasHangar = derived(storageFacilities, ($sf) =>
    $sf.some((f) => f.type === 'hangar')
);

export const hasMarina = derived(storageFacilities, ($sf) =>
    $sf.some((f) => f.type === 'marina')
);

export function hasStorageFor(vehicleType: VehicleType): boolean {
    const requiredStorage = storageVehicleMap[vehicleType];
    return get(storageFacilities).some((f) => f.type === requiredStorage);
}

export function getStorageFor(vehicleType: VehicleType): StorageFacility | undefined {
    const requiredStorage = storageVehicleMap[vehicleType];
    return get(storageFacilities).find((f) => f.type === requiredStorage);
}

export function getRemainingCapacity(vehicleType: VehicleType): number {
    const storage = getStorageFor(vehicleType);
    if (!storage) return 0;
    const ownedCount = get(ownedVehicles).filter((v) => v.type === vehicleType).length;
    return storage.capacity - ownedCount;
}

export const ownedCars = derived(ownedVehicles, ($v) =>
    $v.filter((v) => v.type === 'car')
);

export const ownedJets = derived(ownedVehicles, ($v) =>
    $v.filter((v) => v.type === 'jet')
);

export const ownedYachts = derived(ownedVehicles, ($v) =>
    $v.filter((v) => v.type === 'yacht')
);

export const totalAssetValue = derived(ownedVehicles, ($v) =>
    $v.reduce((sum, v) => sum + v.price, 0)
);

// ─── Actions ─────────────────────────────────────────────

export function purchaseStorage(type: StorageType, tier: StorageTier): boolean {
    const tierConfig = storageTierConfigs[type].find((t) => t.tier === tier);
    if (!tierConfig) return false;

    const currentBalance = get(balance);
    if (currentBalance < tierConfig.price) return false;

    const existing = get(storageFacilities).find((f) => f.type === type);

    if (existing) {
        const currentTierIdx = tierOrder.indexOf(existing.tier);
        const newTierIdx = tierOrder.indexOf(tier);
        if (newTierIdx <= currentTierIdx) return false;

        balance.update((b) => b - tierConfig.price);
        storageFacilities.update((sf) =>
            sf.map((f) => {
                if (f.type !== type) return f;
                return {
                    type,
                    tier,
                    name: tierConfig.name,
                    capacity: tierConfig.capacity,
                    currentCount: f.currentCount,
                    maintenanceCost: tierConfig.maintenanceCost,
                    purchasePrice: tierConfig.price,
                };
            })
        );
    } else {
        balance.update((b) => b - tierConfig.price);
        storageFacilities.update((sf) => [
            ...sf,
            {
                type,
                tier,
                name: tierConfig.name,
                capacity: tierConfig.capacity,
                currentCount: 0,
                maintenanceCost: tierConfig.maintenanceCost,
                purchasePrice: tierConfig.price,
            },
        ]);
    }

    return true;
}

export function purchaseVehicle(vehicle: Omit<Vehicle, 'id' | 'purchasedAt'>): boolean {
    const currentBalance = get(balance);
    if (currentBalance < vehicle.price) return false;

    if (!hasStorageFor(vehicle.type)) return false;
    if (getRemainingCapacity(vehicle.type) <= 0) return false;

    const id = `${vehicle.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    balance.update((b) => b - vehicle.price);
    ownedVehicles.update((v) => [
        ...v,
        {
            ...vehicle,
            id,
            purchasedAt: new Date().toISOString(),
        },
    ]);

    storageFacilities.update((sf) =>
        sf.map((f) => {
            if (f.type !== storageVehicleMap[vehicle.type]) return f;
            return { ...f, currentCount: f.currentCount + 1 };
        })
    );

    return true;
}

export function formatCurrency(amount: number): string {
    return '$' + amount.toLocaleString('en-US');
}
