import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  settings?: any;
}

interface TenantState {
  activeStorefrontTenant: TenantInfo | null;
  activeAdminTenant: TenantInfo | null;
  setActiveStorefrontTenant: (tenant: TenantInfo | null) => void;
  setActiveAdminTenant: (tenant: TenantInfo | null) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeStorefrontTenant: null,
      activeAdminTenant: null,
      setActiveStorefrontTenant: (tenant) => set({ activeStorefrontTenant: tenant }),
      setActiveAdminTenant: (tenant) => set({ activeAdminTenant: tenant }),
    }),
    {
      name: "tenant-store",
    }
  )
);
