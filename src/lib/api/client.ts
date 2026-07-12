import axios from "axios";
import { useTenantStore } from "../store/tenantStore";

/**
 * Configured Axios instance pointing to the backend API.
 * Automatically attaches the JWT token from localStorage on every request.
 */
const apiClient = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — inject Bearer token and tenant ID if present
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Resolve tenant context dynamically
    const isStorefront = config.url?.startsWith("/storefront");
    const isResolveEndpoint = config.url?.includes("/resolve/");

    if (isStorefront) {
      if (!isResolveEndpoint) {
        let tenantId = useTenantStore.getState().activeStorefrontTenant?.id;
        
        // Fallback: Try reading directly from localStorage to bypass hydration lag
        if (!tenantId && typeof window !== "undefined") {
          try {
            const rawStore = localStorage.getItem("tenant-store");
            if (rawStore) {
              const parsed = JSON.parse(rawStore);
              tenantId = parsed?.state?.activeStorefrontTenant?.id;
            }
          } catch (e) {}
        }

        if (tenantId) {
          config.headers["x-tenant-id"] = tenantId;
        }
      }
    } else {
      let tenantId = useTenantStore.getState().activeAdminTenant?.id;
      
      // Fallback: Try reading directly from localStorage to bypass hydration lag
      if (!tenantId && typeof window !== "undefined") {
        try {
          const rawStore = localStorage.getItem("tenant-store");
          if (rawStore) {
            const parsed = JSON.parse(rawStore);
            tenantId = parsed?.state?.activeAdminTenant?.id;
          }
        } catch (e) {
          console.error("Error reading tenant from localStorage:", e);
        }
      }

      if (tenantId) {
        config.headers["x-tenant-id"] = tenantId;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — clear token on 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
    }
    return Promise.reject(error);
  },
);

export default apiClient;
