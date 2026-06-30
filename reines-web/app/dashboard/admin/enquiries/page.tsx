import { MOCK_ENQUIRIES, type AdminEnquiry } from "@/lib/mock-admin";
import { prisma } from "@/lib/prisma";
import EnquiriesTable from "@/components/admin/EnquiriesTable";

async function getEnquiries(): Promise<AdminEnquiry[]> {
  try {
    const rows = await prisma.enquiry.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map((e) => ({
      id:        e.id,
      name:      e.name,
      email:     e.email,
      phone:     e.phone,
      subject:   e.subject,
      message:   e.message,
      read:      e.read,
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
    }));
  } catch {
    return MOCK_ENQUIRIES;
  }
}

export const metadata = { title: "Enquiries � Reines Admin" };

export default async function EnquiriesPage() {
  const enquiries = await getEnquiries();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2d4a6b]">Contact Enquiries</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Review and respond to messages submitted via the public contact form.
        </p>
      </div>

      <EnquiriesTable initialEnquiries={enquiries} />
    </div>
  );
}
