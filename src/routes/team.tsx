import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Users, UserPlus, Trash2, Mail, ShieldAlert, AlertCircle, Loader2 } from "lucide-react";
import { fetchTeamMembers, inviteTeamMember, removeTeamMember, type TenantMember } from "@/lib/api/team";
import { ro } from "@/lib/i18n/ro";
import { getErrorMessage } from "@/lib/i18n/getErrorMessage";

export const Route = createFileRoute("/team")({
  head: () => ({ meta: [{ title: ro.team.headTitle }] }),
  component: TeamPage,
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(email: string): string {
  if (!email) return "U";
  return email.slice(0, 2).toUpperCase();
}

function getRoleBadgeStyle(role: TenantMember["role"]): string {
  switch (role) {
    case "OWNER":
      return "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300 border-slate-200/60 dark:border-slate-800";
    case "ADMIN":
      return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30";
    case "STAFF":
      return "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border-violet-200/50 dark:border-violet-900/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function TeamPage() {
  const queryClient = useQueryClient();
  
  // Dialog & Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TenantMember | null>(null);
  
  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [isInviting, setIsInviting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Fetch team members
  const { data: members = [], isLoading, isError, error } = useQuery({
    queryKey: ["team-members"],
    queryFn: fetchTeamMembers,
  });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error(ro.validation.inviteEmailRequired);
      return;
    }

    setIsInviting(true);
    try {
      await inviteTeamMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      toast.success(ro.team.inviteSuccess);
      // Invalidate cache to refetch members list
      await queryClient.invalidateQueries({ queryKey: ["team-members"] });
      
      // Reset form states
      setInviteEmail("");
      setInviteRole("STAFF");
      setIsInviteOpen(false);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!memberToDelete) return;
    
    setIsRemoving(true);
    try {
      await removeTeamMember(memberToDelete.id);
      toast.success(ro.team.removeSuccess);
      await queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setMemberToDelete(null);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-5xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{ro.team.title}</h1>
            <p className="text-sm text-muted-foreground">{ro.team.subtitle}</p>
          </div>
          
          {/* Invite Dialog */}
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 px-4 font-medium flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {ro.team.inviteBtn}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleInviteSubmit}>
                <DialogHeader className="gap-1">
                  <DialogTitle className="text-lg">{ro.team.inviteTitle}</DialogTitle>
                  <DialogDescription className="text-xs">
                    {ro.team.inviteDesc}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-5">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">{ro.team.emailLabel}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={ro.team.emailPlaceholder}
                        className="pl-9 h-11 border-border/70 text-sm"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        disabled={isInviting}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="role" className="text-xs font-semibold text-muted-foreground">{ro.team.roleLabel}</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(val: "ADMIN" | "STAFF") => setInviteRole(val)}
                      disabled={isInviting}
                    >
                      <SelectTrigger className="h-11 border-border/70 text-sm">
                        <SelectValue placeholder={ro.team.selectRole} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STAFF" className="text-xs py-2.5">
                          <div>
                            <span className="font-semibold block">{ro.team.roleStaff}</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">{ro.team.roleStaffDesc}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN" className="text-xs py-2.5">
                          <div>
                            <span className="font-semibold block">{ro.team.roleAdmin}</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">{ro.team.roleAdminDesc}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteOpen(false)}
                    disabled={isInviting}
                    className="h-11"
                  >
                    {ro.common.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isInviting}
                    className="h-11 px-6"
                  >
                    {isInviting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {ro.team.inviting}
                      </>
                    ) : (
                      ro.team.sendInvitation
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Errors state */}
        {isError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
            <span>{getErrorMessage(error)}</span>
          </div>
        )}

        {/* Data Table */}
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 h-12 text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">{ro.team.tableMember}</TableHead>
                    <TableHead className="h-12 text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">{ro.team.tableRole}</TableHead>
                    <TableHead className="h-12 text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">{ro.team.tableJoined}</TableHead>
                    <TableHead className="pr-6 h-12 text-right text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">{ro.team.tableActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <TableRow key={idx} className="hover:bg-transparent border-b border-border/30">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell className="py-4"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="pr-6 py-4 text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : members.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                        {ro.team.noMembers}
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow key={member.id} className="hover:bg-muted/10 transition-colors border-b border-border/30">
                        {/* Member Details */}
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarFallback className="text-xs font-semibold bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300">
                                {getInitials(member.user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-foreground truncate">{member.user.email}</span>
                              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                {ro.team.userType}: {member.user.globalRole}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Workspace Role */}
                        <TableCell className="py-4">
                          <Badge
                            variant="outline"
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getRoleBadgeStyle(member.role)}`}
                          >
                            {ro.roles[member.role] ?? member.role}
                          </Badge>
                        </TableCell>
                        
                        {/* Joined Date */}
                        <TableCell className="py-4 text-xs text-muted-foreground">
                          {formatDate(member.user.createdAt)}
                        </TableCell>
                        
                        {/* Remove Action Button */}
                        <TableCell className="pr-6 py-4 text-right">
                          {member.role === "OWNER" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground/30 cursor-not-allowed"
                              disabled
                              title={ro.team.ownerRemoveAlert}
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMemberToDelete(member)}
                              className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Remove Confirmation Alert Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">{ro.team.removeTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {ro.team.removeDesc.replace("{email}", memberToDelete?.user.email || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>{ro.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white font-medium h-10 px-4"
              onClick={(e) => {
                e.preventDefault();
                handleRemoveConfirm();
              }}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {ro.team.removing}
                </>
              ) : (
                ro.team.removeConfirmBtn
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
