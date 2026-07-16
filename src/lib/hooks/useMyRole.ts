import { useQuery } from "@tanstack/react-query";
import { fetchCurrentTenantWithRole } from "@/lib/api/tenant";

export function useMyRole() {
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-current-with-role"],
    queryFn: fetchCurrentTenantWithRole,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const myRole = data?.myRole || null;
  // Default to false during load, so we never show privileged elements to STAFF
  const isPrivileged = isLoading ? false : (myRole ? ["SUPER_ADMIN", "OWNER", "ADMIN"].includes(myRole) : false);
  const isStaff = isLoading ? false : myRole === "STAFF";

  return {
    myRole,
    isPrivileged,
    isStaff,
    isLoading,
  };
}
