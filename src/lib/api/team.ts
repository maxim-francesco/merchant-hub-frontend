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

interface InviteMemberEnvelope {
  status: string;
  data: {
    member: TenantMember;
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
 * Invite a new member to the workspace by email.
 */
export async function inviteTeamMember(data: {
  email: string;
  role: "ADMIN" | "STAFF";
}): Promise<TenantMember> {
  const { data: envelope } = await apiClient.post<InviteMemberEnvelope>("/team/invite", data);
  return envelope.data.member;
}

/**
 * Remove a member from the workspace by their TenantMember ID.
 */
export async function removeTeamMember(memberId: string): Promise<void> {
  await apiClient.delete<RemoveMemberEnvelope>(`/team/${memberId}`);
}
