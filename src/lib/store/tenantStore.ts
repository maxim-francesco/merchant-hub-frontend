import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  settings?: any;
}

interface TenantState {
  activeAdminTenant: TenantInfo | null;
  setActiveAdminTenant: (tenant: TenantInfo | null) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeAdminTenant: null,
      setActiveAdminTenant: (tenant) => set({ activeAdminTenant: tenant }),
    }),
    {
      name: "tenant-store",
    }
  )
);
