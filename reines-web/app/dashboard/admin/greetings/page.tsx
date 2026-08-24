import { MessageSquareText } from "lucide-react";
import PortalGreetingsForm from "@/components/admin/PortalGreetingsForm";
import { getPortalGreetingSettings } from "@/lib/greetings";

export const metadata = { title: "Portal Greetings - Reines Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPortalGreetingsPage() {
  const settings = await getPortalGreetingSettings();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-[#2d4a6b]">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2d4a6b]">Portal Greetings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Control the welcome text on the portal landing screen for morning, afternoon, and
            evening — with up to five options each. A different option is shown every time someone
            signs in.
          </p>
        </div>
      </div>

      <PortalGreetingsForm initialSettings={settings} />
    </div>
  );
}
