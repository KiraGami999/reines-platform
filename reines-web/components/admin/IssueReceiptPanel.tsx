"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import SlidePanel from "./SlidePanel";
import RecordPaymentForm from "./RecordPaymentForm";

interface ProjectOption {
  id:         string;
  title:      string;
  clientName: string;
}

interface IssueReceiptPanelProps {
  projects: ProjectOption[];
}

export default function IssueReceiptPanel({ projects }: IssueReceiptPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1a2f4a] transition-colors shadow-sm"
      >
        <Plus size={16} /> Issue Manual Receipt
      </button>

      <SlidePanel
        open={open}
        onClose={() => setOpen(false)}
        title="Issue Manual Receipt"
        subtitle="Record cash payments received at the office and issue a client receipt."
      >
        <RecordPaymentForm
          projects={projects}
          onCancel={() => setOpen(false)}
        />
      </SlidePanel>
    </>
  );
}
