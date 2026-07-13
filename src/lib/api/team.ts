import apiClient from "./client";

export interface User {
  id: string;
  email: string;
  globalRole: string;
  createdAt: string;
}

export interface TenantMember {
  id: string;
  userId: string;
  tenantId: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  user: User;
}

interface TeamMembersEnvelope {
  status: string;
  data: {
    members: TenantMember[];
  };
}

interface CreateMemberEnvelope {
  status: string;
  data: {
    member: TenantMember;
    addedExisting: boolean;
  };
}

interface RemoveMemberEnvelope {
  status: string;
  message: string;
}

/**
 * Fetch all team members for the active workspace.
 */
export async function fetchTeamMembers(): Promise<TenantMember[]> {
  const { data: envelope } = await apiClient.get<TeamMembersEnvelope>("/team");
  return envelope.data.members;
}

/**
 * Create a new member account for the workspace.
 * - New email: creates User with the supplied password.
 * - Existing email: adds as member only (password NOT modified); addedExisting = true.
 */
export async function createTeamMember(payload: {
  email: string;
  password: string;
  role?: string;
}): Promise<{ member: TenantMember; addedExisting: boolean }> {
  const { data: envelope } = await apiClient.post<CreateMemberEnvelope>(
    "/team/invite",
    payload,
  );
  return envelope.data;
}

/**
 * Remove a member from the workspace by their TenantMember ID.
 */
export async function removeTeamMember(memberId: string): Promise<void> {
  await apiClient.delete<RemoveMemberEnvelope>(`/team/${memberId}`);
}
