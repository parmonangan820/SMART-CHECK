import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

// Custom storage for zustand using idb-keyval
const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export interface ScanResult {
  id: string;
  date: string;
  image: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  recipientName: string;
  recipientAccountNumber: string;
  recipientBankName: string;
  giroNumber: string;
  giroDate: string;
  amount: string;
  amountText: string;
  isAmountMatch: boolean;
  status: 'VERIFIED' | 'WARNING' | 'INVALID' | 'UNREADABLE';
  bankStatus: 'VALID' | 'INVALID';
  recipientBankStatus: 'VALID' | 'INVALID' | 'UNKNOWN';
  fraudStatus: 'SAFE' | 'POTENTIAL_FRAUD';
  fraudReason?: string;
  biValidation?: {
    responseCode: string;
    responseMessage: string;
    bankCode: string;
    bankName: string;
    accountStatus: string;
    isBlacklisted: boolean;
    matchScore: number;
  };
  recipientBiValidation?: {
    responseCode: string;
    responseMessage: string;
    bankCode: string;
    bankName: string;
    accountStatus: string;
    isBlacklisted: boolean;
    matchScore: number;
  };
}

interface AppState {
  scans: ScanResult[];
  addScan: (scan: ScanResult) => void;
  deleteScan: (id: string) => void;
  clearHistory: () => void;
  settings: {
    darkMode: boolean;
    autoScan: boolean;
    notifications: boolean;
  };
  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      scans: [],
      addScan: (scan) => set((state) => ({ scans: [scan, ...state.scans] })),
      deleteScan: (id) =>
        set((state) => ({ scans: state.scans.filter((s) => s.id !== id) })),
      clearHistory: () => set({ scans: [] }),
      settings: {
        darkMode: false,
        autoScan: true,
        notifications: true,
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'cek-giro-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
