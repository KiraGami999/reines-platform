"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

interface FieldErrors {
  name?: string[];
  email?: string[];
  phone?: string[];
  subject?: string[];
  message?: string[];
}

type FormState = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<FormState>("idle");

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setFieldErrors({});

    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.status === 422) {
      setFieldErrors(data.issues ?? {});
      setState("idle");
      return;
    }

    if (!res.ok) {
      setState("error");
      return;
    }

    setState("success");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <CheckCircle2 size={26} strokeWidth={1.8} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-blue-800">Enquiry received!</h3>
        <p className="mt-2 text-sm text-blue-700">
          Thank you for reaching out. A member of our team will get back to you within 24 hours.
        </p>
        <button onClick={() => setState("idle")} className="mt-6 text-sm font-medium text-blue-600 hover:underline">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id="name"
          label="Full name"
          placeholder="Jane Smith"
          value={form.name}
          onChange={update("name")}
          error={fieldErrors.name?.[0]}
          required
        />
        <Input
          id="email"
          type="email"
          label="Email address"
          placeholder="jane@example.com"
          value={form.email}
          onChange={update("email")}
          error={fieldErrors.email?.[0]}
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id="phone"
          type="tel"
          label="Phone (optional)"
          placeholder="+(265) 999 000 000"
          value={form.phone}
          onChange={update("phone")}
          error={fieldErrors.phone?.[0]}
        />
        <div className="space-y-1">
          <label htmlFor="subject" className="block text-sm font-medium text-zinc-700">
            Subject
          </label>
          <select
            id="subject"
            value={form.subject}
            onChange={update("subject")}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            required
          >
            <option value="">Select a subject…</option>
            <option>General Enquiry</option>
            <option>Property Development</option>
            <option>Building Contracting</option>
            <option>Concrete Products</option>
            <option>Client Portal Support</option>
            <option>Other</option>
          </select>
          {fieldErrors.subject?.[0] && (
            <p className="text-xs text-blue-500">{fieldErrors.subject[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="message" className="block text-sm font-medium text-zinc-700">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder="Tell us about your project or question…"
          value={form.message}
          onChange={update("message")}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          required
        />
        {fieldErrors.message?.[0] && (
          <p className="text-xs text-blue-500">{fieldErrors.message[0]}</p>
        )}
      </div>

      {state === "error" && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-600">
          Something went wrong. Please try again or email us directly at contact@reines.co.mw.
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={state === "loading"}>
        {state === "loading" ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
