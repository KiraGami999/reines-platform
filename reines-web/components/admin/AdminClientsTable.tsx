"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import RoleBadge from "@/components/admin/RoleBadge";
import VerificationBadge from "./VerificationBadge";
import ClientVerificationPanel, { ClientVerificationData } from "./ClientVerificationPanel";

export type ClientRow = ClientVerificationData & {
  role: string;
  createdAt: string;
  projectCount: number;
  totalPoints: number;
};

interface Props {
  initialClients: ClientRow[];
}

export default function AdminClientsTable({ initialClients }: Props) {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<ClientVerificationData | null>(null);

  const handleSuccess = () => {
    // Refresh the current route to fetch updated data from the server
    router.refresh();
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Projects</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-400">
                    No client accounts yet. New public registrations will appear here automatically.
                  </td>
                </tr>
              ) : (
                initialClients.map((client) => (
                  <tr key={client.id} className="transition-colors hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold uppercase text-blue-700">
                          {client.name.split(" ").map((name) => name[0]).slice(0, 2).join("")}
                        </div>
                        <span className="font-medium text-zinc-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${client.email}`} className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#35475D]">
                        <Mail size={13} />
                        {client.email}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <VerificationBadge status={client.verificationStatus} />
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{client.projectCount}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {client.totalPoints.toLocaleString("en-MW")} pts
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="text-sm font-medium text-emerald-600 hover:underline"
                      >
                        Review
                      </button>
                      <Link href="/dashboard/admin/projects" className="text-sm font-medium text-[#8fb9e8] hover:underline">
                        Projects
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientVerificationPanel
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        client={selectedClient}
        onSuccess={handleSuccess}
      />
    </>
  );
}
