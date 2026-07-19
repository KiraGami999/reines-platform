"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Users, ShieldCheck, HardHat, UserCheck, Search } from "lucide-react";
import SlidePanel    from "./SlidePanel";
import CreateUserForm from "./CreateUserForm";
import ConfirmDialog from "./ConfirmDialog";
import RoleBadge     from "./RoleBadge";
import StatCard      from "./StatCard";
import { fmtAdmin, type AdminUser } from "@/lib/mock-admin";

type RoleFilter = "ALL" | "ADMIN" | "PROJECT_MANAGER" | "CLIENT";

const ROLE_TABS: { key: RoleFilter; label: string }[] = [
  { key: "ALL",             label: "All"             },
  { key: "ADMIN",           label: "Admin"           },
  { key: "PROJECT_MANAGER", label: "Project Manager" },
  { key: "CLIENT",          label: "Client"          },
];

export default function UsersTable({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users,      setUsers]      = useState<AdminUser[]>(initialUsers);
  const [panelOpen,  setPanelOpen]  = useState(false);
  const [editUser,   setEditUser]   = useState<AdminUser | null>(null);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState(false);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const counts = {
    ALL:             users.length,
    ADMIN:           users.filter((u) => u.role === "ADMIN").length,
    PROJECT_MANAGER: users.filter((u) => u.role === "PROJECT_MANAGER").length,
    CLIENT:          users.filter((u) => u.role === "CLIENT").length,
  };

  const filtered = users.filter((u) => {
    const matchesRole   = roleFilter === "ALL" || u.role === roleFilter;
    const query         = search.trim().toLowerCase();
    const matchesSearch = !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  function openCreate() { setEditUser(null); setPanelOpen(true); }
  function openEdit(u: AdminUser) { setEditUser(u); setPanelOpen(true); }

  function onSuccess(user: AdminUser) {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === user.id);
      return idx >= 0
        ? prev.map((u) => (u.id === user.id ? user : u))
        : [user, ...prev];
    });
    setPanelOpen(false);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteId));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete user.");
      }
    } catch {
      alert("A network error occurred. Please check your connection and try again.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const deleteTarget = users.find((u) => u.id === deleteId);

  return (
    <>
      {/* Stats strip */}
      <div className="mb-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-4 sm:gap-4">
        <StatCard label="Total Users"      value={counts.ALL}             icon={<Users      className="w-5 h-5" />} />
        <StatCard label="Admins"           value={counts.ADMIN}           icon={<ShieldCheck className="w-5 h-5" />} accent="bg-zinc-100 text-zinc-500" />
        <StatCard label="Project Managers" value={counts.PROJECT_MANAGER} icon={<HardHat    className="w-5 h-5" />} accent="bg-zinc-100 text-zinc-500" />
        <StatCard label="Clients"          value={counts.CLIENT}          icon={<UserCheck  className="w-5 h-5" />} accent="bg-zinc-100 text-zinc-500" />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-[#2d4a6b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a2f4a]"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Role filter tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1.5">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRoleFilter(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              roleFilter === tab.key
                ? "bg-[#2d4a6b] text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                roleFilter === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-2.5 py-2 sm:px-4 sm:py-3">Name</th>
                <th className="px-2.5 py-2 sm:px-4 sm:py-3">Email</th>
                <th className="px-2.5 py-2 sm:px-4 sm:py-3">Role</th>
                <th className="hidden px-2.5 py-2 sm:table-cell sm:px-4 sm:py-3">Joined</th>
                <th className="px-2.5 py-2 text-right sm:px-4 sm:py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-400">
                    {search || roleFilter !== "ALL"
                      ? "No users match your filters."
                      : "No users yet. Click 'Add User' to create the first account."}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="group transition-colors hover:bg-zinc-50">
                    <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2d4a6b] text-xs font-bold uppercase text-[#8fb9e8]">
                          {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <span className="font-medium text-zinc-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[120px] truncate px-2.5 py-2 text-zinc-500 sm:max-w-none sm:px-4 sm:py-3">{user.email}</td>
                    <td className="px-2.5 py-2 sm:px-4 sm:py-3"><RoleBadge role={user.role} /></td>
                    <td className="hidden px-2.5 py-2 text-zinc-400 sm:table-cell sm:px-4 sm:py-3">{fmtAdmin(user.createdAt)}</td>
                    <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100">
                        <button
                          onClick={() => openEdit(user)}
                          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-[#2d4a6b]"
                          title="Edit user"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(user.id)}
                          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600"
                          title="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-xs text-zinc-400">
          Showing {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
          {roleFilter !== "ALL" && ` · filtered by ${roleFilter.replace("_", " ").toLowerCase()}`}
        </div>
      </div>

      {/* Slide panel */}
      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editUser ? "Edit User" : "Add New User"}
        subtitle={
          editUser
            ? `Editing account for ${editUser.name}`
            : "Create a new account and assign a role."
        }
      >
        <CreateUserForm
          key={editUser?.id ?? "new"}
          editUser={editUser}
          onSuccess={onSuccess}
          onCancel={() => setPanelOpen(false)}
        />
      </SlidePanel>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete User"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed. This cannot be undone.`
            : "This user will be permanently removed."
        }
        confirmLabel="Delete User"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
