import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import VerificationPortal from "@/components/dashboard/VerificationPortal";

export const metadata = {
  title: "KYC Identity Verification - Reines Portal",
  description: "Complete KYC identity verification to unlock all platform features.",
};

export default async function VerificationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== "CLIENT") {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      verificationStatus:      true,
      verificationFullName:    true,
      verificationPhone:       true,
      verificationAddress:     true,
      verificationOccupation:  true,
      verificationWorkplace:   true,
      verificationInterest:    true,
      verificationIdType:      true,
      verificationIdNumber:    true,
      verificationDocumentUrl: true,
      verificationAdminNotes:  true,
    },
  });

  if (!user) redirect("/login");

  // If already approved, redirect to dashboard main
  if (user.verificationStatus === "APPROVED") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-8">
      <VerificationPortal initialUser={user} />
    </div>
  );
}
