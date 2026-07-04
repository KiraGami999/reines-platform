import Link from "next/link";
import { Users, FolderKanban, MessageSquare, ArrowRight, ShieldCheck, CreditCard, ImageIcon, UserCheck, PackageCheck, Wrench } from "lucide-react";
import { MOCK_USERS, MOCK_ADMIN_PROJECTS, MOCK_ENQUIRIES } from "@/lib/mock-admin";
import { prisma } from "@/lib/prisma";

async function getStats() {
  try {
    const [users, clients, projects, enquiries] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.project.count(),
      prisma.enquiry.count({ where: { read: false } }),
    ]);
    return { users, clients, projects, unreadEnquiries: enquiries };
  } catch {
    return {
      users:           MOCK_USERS.length,
      clients:         MOCK_USERS.filter((user) => user.role === "CLIENT").length,
      projects:        MOCK_ADMIN_PROJECTS.length,
      unreadEnquiries: MOCK_ENQUIRIES.filter((e) => !e.read).length,
    };
  }
}

export const metadata = { title: "Admin Panel � Reines" };

export default async function AdminOverviewPage() {
  const stats = await getStats();

  const CARDS = [
    {
      href:    "/dashboard/admin/users",
      icon:    <Users className="w-7 h-7" />,
      title:   "User Management",
      desc:    "Create accounts, assign roles (Admin, Project Manager, Client), and manage access.",
      stat:    `${stats.users} users`,
      accent:  "from-blue-500/10 to-blue-500/5 border-blue-200",
      iconBg:  "bg-blue-100 text-blue-600",
    },
    {
      href:    "/dashboard/admin/clients",
      icon:    <UserCheck className="w-7 h-7" />,
      title:   "Client Management",
      desc:    "View every registered client and their linked project count.",
      stat:    `${stats.clients} clients`,
      accent:  "from-blue-500/10 to-blue-500/5 border-blue-200",
      iconBg:  "bg-blue-100 text-blue-600",
    },
    {
      href:    "/dashboard/admin/projects",
      icon:    <FolderKanban className="w-7 h-7" />,
      title:   "Project Management",
      desc:    "Create projects, assign clients and project managers, and track all work.",
      stat:    `${stats.projects} projects`,
      accent:  "from-[#8fb9e8]/10 to-[#8fb9e8]/5 border-[#8fb9e8]/30",
      iconBg:  "bg-[#8fb9e8]/10 text-[#8fb9e8]",
    },
    {
      href:    "/dashboard/admin/enquiries",
      icon:    <MessageSquare className="w-7 h-7" />,
      title:   "Contact Enquiries",
      desc:    "Review and respond to messages submitted via the public contact form.",
      stat:    stats.unreadEnquiries > 0 ? `${stats.unreadEnquiries} unread` : "All read",
      accent:  stats.unreadEnquiries > 0
        ? "from-blue-500/10 to-blue-500/5 border-blue-200"
        : "from-blue-500/10 to-blue-500/5 border-blue-200",
      iconBg:  stats.unreadEnquiries > 0 ? "bg-blue-100 text-blue-600" : "bg-blue-100 text-blue-600",
    },
    {
      href:    "/dashboard/admin/payments",
      icon:    <CreditCard className="w-7 h-7" />,
      title:   "Payments",
      desc:    "View all Paychangu payment transactions, statuses, and receipts.",
      stat:    "Via Paychangu",
      accent:  "from-blue-500/10 to-blue-500/5 border-blue-200",
      iconBg:  "bg-blue-100 text-blue-600",
    },
    {
      href:    "/dashboard/admin/homepage",
      icon:    <ImageIcon className="w-7 h-7" />,
      title:   "Homepage Ads",
      desc:    "Choose which promotional images and copy appear on the public homepage.",
      stat:    "Public content",
      accent:  "from-blue-500/10 to-blue-500/5 border-blue-200",
      iconBg:  "bg-blue-100 text-blue-600",
    },
    {
      href:    "/dashboard/admin/products",
      icon:    <PackageCheck className="w-7 h-7" />,
      title:   "Product Catalogue",
      desc:    "Edit public products by subsidiary, including images, price labels, promotions, and catalogue copy.",
      stat:    "Public products",
      accent:  "from-blue-500/10 to-blue-500/5 border-blue-200",
      iconBg:  "bg-blue-100 text-blue-600",
    },
    {
      href:    "/dashboard/admin/public-projects",
      icon:    <FolderKanban className="w-7 h-7" />,
      title:   "Public Projects",
      desc:    "Control the project images, descriptions, and statuses shown on the public Projects page.",
      stat:    "Public portfolio",
      accent:  "from-blue-500/10 to-blue-500/5 border-blue-200",
      iconBg:  "bg-blue-100 text-blue-600",
    },
    {
      href:    "/dashboard/admin/public-services",
      icon:    <Wrench className="w-7 h-7" />,
      title:   "Public Services",
      desc:    "Edit the services, descriptions, feature lists, and icons shown on the public Services page.",
      stat:    "Public services",
      accent:  "from-blue-500/10 to-blue-500/5 border-blue-200",
      iconBg:  "bg-blue-100 text-blue-600",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#2d4a6b] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-[#8fb9e8]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2d4a6b]">Admin Panel</h1>
          <p className="text-zinc-500 text-sm">Full platform control and management.</p>
        </div>
      </div>

      <p className="text-zinc-500 text-sm mb-8 sm:ml-13">
        Welcome to the admin area. Select a section below to manage the platform.
      </p>

      {/* Quick-action cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`group flex flex-col justify-between bg-gradient-to-br ${card.accent} border rounded-2xl p-6 hover:shadow-md transition-all`}
          >
            <div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.iconBg}`}>
                {card.icon}
              </div>
              <h2 className="text-base font-semibold text-[#2d4a6b] mb-1">{card.title}</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">{card.desc}</p>
            </div>

            <div className="flex items-center justify-between mt-6">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{card.stat}</span>
              <span className="flex items-center gap-1 text-xs font-medium text-[#2d4a6b] group-hover:gap-2 transition-all">
                Open <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Tip */}
      <div className="mt-8 bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm text-zinc-500">
        <span className="font-medium text-zinc-700">Tip:</span> Create users first, then create projects and assign them to the right client and manager.
      </div>
    </div>
  );
}
