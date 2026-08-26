/**
 * Email delivery via SMTP (nodemailer).
 *
 * Works with any SMTP provider. For a free setup, use Gmail:
 *   SMTP_HOST="smtp.gmail.com"
 *   SMTP_PORT="465"
 *   SMTP_USER="your-account@gmail.com"
 *   SMTP_PASS="<16-char Gmail App Password>"   ← NOT your normal password
 *   SMTP_FROM="Reines Group <your-account@gmail.com>"
 *
 * Create an App Password at: https://myaccount.google.com/apppasswords
 * (requires 2-Step Verification enabled on the Google account).
 */

import nodemailer, { type Transporter } from "nodemailer";

let cachedTransport: Transporter | null = null;

export function isEmailConfigured(): boolean {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Reject obviously unfilled placeholder values so the dev console fallback
  // kicks in even when the .env has template text rather than real credentials.
  const isPlaceholder = (v?: string) =>
    !v || v.startsWith("your-") || v.includes("example.com");

  return Boolean(host && !isPlaceholder(user) && !isPlaceholder(pass));
}

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in your .env file."
    );
  }

  const port = Number(process.env.SMTP_PORT ?? 465);

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user, pass },
  });

  return cachedTransport;
}

export interface SendMailParams {
  to:       string;
  subject:  string;
  html:     string;
  text?:    string;
}

export async function sendMail({ to, subject, html, text }: SendMailParams): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER!;
  await getTransport().sendMail({ from, to, subject, html, text });
}

// ─── Branded OTP email ──────────────────────────────────────────────────────

const BRAND_NAVY = "#35475D";
const BRAND_BLUE = "#8fb9e8";

function otpEmailHtml(code: string, name?: string): string {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return `
  <div style="margin:0;padding:0;background:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8eb;">
            <tr>
              <td style="background:${BRAND_NAVY};padding:24px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.3px;">Reines Group</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 12px;color:#18181b;font-size:15px;">${greeting}</p>
                <p style="margin:0 0 24px;color:#52525b;font-size:14px;line-height:1.6;">
                  Use the verification code below to complete your sign-in. This code expires in
                  <strong>10 minutes</strong>.
                </p>
                <div style="text-align:center;margin:0 0 24px;">
                  <div style="display:inline-block;background:#f0f5fc;border:1px solid ${BRAND_BLUE};border-radius:12px;padding:16px 28px;">
                    <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:${BRAND_NAVY};">${code}</span>
                  </div>
                </div>
                <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.6;">
                  If you didn't try to sign in, you can safely ignore this email — your account is still secure.
                  Never share this code with anyone. Reines staff will never ask you for it.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:16px 32px;">
                <span style="color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} Reines Property Development Limited</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function sendLoginOtpEmail(to: string, code: string, name?: string): Promise<void> {
  await sendMail({
    to,
    subject: `Your Reines sign-in code: ${code}`,
    html: otpEmailHtml(code, name),
    text:
      `${name ? `Hi ${name},\n\n` : ""}Your Reines verification code is ${code}. ` +
      `It expires in 10 minutes.\n\nIf you didn't try to sign in, ignore this email. ` +
      `Never share this code with anyone.`,
  });
}

// ─── Password reset email ────────────────────────────────────────────────────

function resetEmailHtml(code: string, name?: string): string {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return `
  <div style="margin:0;padding:0;background:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8eb;">
          <tr>
            <td style="background:${BRAND_NAVY};padding:24px 32px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;">Reines Group</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;color:#18181b;font-size:15px;">${greeting}</p>
              <p style="margin:0 0 24px;color:#52525b;font-size:14px;line-height:1.6;">
                We received a request to reset your Reines portal password. Use the code below
                to set a new password. It expires in <strong>15 minutes</strong>.
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <div style="display:inline-block;background:#f0f5fc;border:1px solid ${BRAND_BLUE};border-radius:12px;padding:16px 28px;">
                  <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:${BRAND_NAVY};">${code}</span>
                </div>
              </div>
              <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password has <strong>not</strong> been changed.
                Never share this code with anyone.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:16px 32px;">
              <span style="color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} Reines Property Development Limited</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

export async function sendPasswordResetEmail(to: string, code: string, name?: string): Promise<void> {
  await sendMail({
    to,
    subject: "Reset your Reines portal password",
    html: resetEmailHtml(code, name),
    text:
      `${name ? `Hi ${name},\n\n` : ""}Your Reines password reset code is ${code}. ` +
      `It expires in 15 minutes.\n\nIf you didn't request a reset, ignore this email. ` +
      `Your password has not been changed.`,
  });
}

// ─── Email verification email ────────────────────────────────────────────────

function verifyEmailHtml(code: string, name?: string): string {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return `
  <div style="margin:0;padding:0;background:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8eb;">
          <tr>
            <td style="background:${BRAND_NAVY};padding:24px 32px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;">Reines Group</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;color:#18181b;font-size:15px;">${greeting}</p>
              <p style="margin:0 0 8px;color:#52525b;font-size:14px;line-height:1.6;">
                Welcome to the Reines client portal. Enter the code below to verify your
                email address and activate your account.
              </p>
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:12px;">
                This code expires in <strong>24 hours</strong>.
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <div style="display:inline-block;background:#f0f5fc;border:1px solid ${BRAND_BLUE};border-radius:12px;padding:16px 28px;">
                  <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:${BRAND_NAVY};">${code}</span>
                </div>
              </div>
              <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.6;">
                If you didn't create a Reines account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:16px 32px;">
              <span style="color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} Reines Property Development Limited</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

export async function sendVerifyEmail(to: string, code: string, name?: string): Promise<void> {
  await sendMail({
    to,
    subject: "Verify your Reines portal email",
    html: verifyEmailHtml(code, name),
    text:
      `${name ? `Hi ${name},\n\n` : ""}Welcome to Reines! Your email verification code is ${code}. ` +
      `It expires in 24 hours.`,
  });
}

// ─── Quotation request notification (admin) ──────────────────────────────────

export type QuotationNotifyPayload = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  requestType: string;
  projectType: string;
  productCategory?: string | null;
  products?: unknown;
  description: string;
  location: string;
  budgetRange?: string | null;
  timeline?: string | null;
  projectSize?: string | null;
  specialRequirements?: string | null;
  howHeardAboutUs?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value?: string | null): string {
  if (!value?.trim()) return "";
  return `<tr>
    <td style="padding:6px 0;color:#71717a;font-size:13px;width:140px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;color:#18181b;font-size:13px;">${escapeHtml(value)}</td>
  </tr>`;
}

function formatProducts(products: unknown): string {
  if (!Array.isArray(products) || products.length === 0) return "";
  const lines = products
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const p = item as { name?: string; quantity?: string; unit?: string };
      if (!p.name) return null;
      const qty = [p.quantity, p.unit].filter(Boolean).join(" ");
      return `• ${p.name}${qty ? ` — ${qty}` : ""}`;
    })
    .filter(Boolean) as string[];
  return lines.join("\n");
}

/** Inbox that receives new public quote requests. Override with QUOTATION_NOTIFY_EMAIL. */
export function getQuotationNotifyEmail(): string {
  return (
    process.env.QUOTATION_NOTIFY_EMAIL?.trim() ||
    "reinesrealestate@gmail.com"
  );
}

export async function sendQuotationNotificationEmail(
  quotation: QuotationNotifyPayload
): Promise<void> {
  const to = getQuotationNotifyEmail();
  const isProducts = quotation.requestType === "PRODUCTS";
  const typeLabel = isProducts ? "Product order" : "Project / service";
  const productsText = formatProducts(quotation.products);

  const html = `
  <div style="margin:0;padding:0;background:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8eb;">
          <tr>
            <td style="background:${BRAND_NAVY};padding:24px 32px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;">Reines Group | New Quotation Request</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.6;">
                A new <strong>${escapeHtml(typeLabel)}</strong> quotation request was submitted on the website.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                ${row("Name", quotation.name)}
                ${row("Email", quotation.email)}
                ${row("Phone", quotation.phone)}
                ${row("Company", quotation.company)}
                ${row("Type", typeLabel)}
                ${row("Project type", isProducts ? null : quotation.projectType)}
                ${row("Product category", quotation.productCategory)}
                ${row("Products", productsText || null)}
                ${row("Location", quotation.location)}
                ${row("Budget", quotation.budgetRange)}
                ${row("Timeline", quotation.timeline)}
                ${row("Size", quotation.projectSize)}
                ${row("How they heard", quotation.howHeardAboutUs)}
              </table>
              ${
                quotation.description?.trim()
                  ? `<div style="margin:0 0 16px;padding:14px 16px;background:#f8fafc;border-radius:12px;border:1px solid #e4e4e7;">
                      <p style="margin:0 0 6px;color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Description</p>
                      <p style="margin:0;color:#18181b;font-size:13px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(quotation.description)}</p>
                    </div>`
                  : ""
              }
              ${
                quotation.specialRequirements?.trim()
                  ? `<div style="margin:0 0 8px;padding:14px 16px;background:#f8fafc;border-radius:12px;border:1px solid #e4e4e7;">
                      <p style="margin:0 0 6px;color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Special requirements</p>
                      <p style="margin:0;color:#18181b;font-size:13px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(quotation.specialRequirements)}</p>
                    </div>`
                  : ""
              }
              <p style="margin:20px 0 0;color:#a1a1aa;font-size:12px;">
                Review this request in the admin portal under Quotations.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:16px 32px;">
              <span style="color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} Reines Property Development Limited</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`;

  const text = [
    `New quotation request (${typeLabel})`,
    ``,
    `Name: ${quotation.name}`,
    `Email: ${quotation.email}`,
    quotation.phone ? `Phone: ${quotation.phone}` : null,
    quotation.company ? `Company: ${quotation.company}` : null,
    `Location: ${quotation.location}`,
    quotation.budgetRange ? `Budget: ${quotation.budgetRange}` : null,
    productsText ? `Products:\n${productsText}` : null,
    quotation.description ? `\nDescription:\n${quotation.description}` : null,
    quotation.specialRequirements
      ? `\nSpecial requirements:\n${quotation.specialRequirements}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendMail({
    to,
    subject: `New quotation request from ${quotation.name}`,
    html,
    text,
  });
}

// ─── Project Chat Notification Email ─────────────────────────────────────────

function projectMessageEmailHtml(opts: {
  clientName: string;
  senderName: string;
  projectTitle: string;
  messagePreview: string;
  chatUrl: string;
}): string {
  const escapedClient = escapeHtml(opts.clientName);
  const escapedSender = escapeHtml(opts.senderName);
  const escapedProject = escapeHtml(opts.projectTitle);
  const escapedPreview = escapeHtml(opts.messagePreview);

  return `
  <div style="margin:0;padding:0;background:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8eb;">
            <tr>
              <td style="background:${BRAND_NAVY};padding:24px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.3px;">Reines Group Portal</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 12px;color:#18181b;font-size:16px;font-weight:600;">Hi ${escapedClient},</p>
                <p style="margin:0 0 20px;color:#3f3f46;font-size:14px;line-height:1.6;">
                  Your Project Manager, <strong>${escapedSender}</strong>, has sent you a new message regarding your project <strong>${escapedProject}</strong>.
                </p>
                
                <div style="margin:0 0 24px;padding:16px;background:#f8fafc;border-left:4px solid ${BRAND_NAVY};border-radius:0 8px 8px 0;border-top:1px solid #f1f5f9;border-right:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;">
                  <p style="margin:0 0 6px;color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Message Preview</p>
                  <p style="margin:0;color:#18181b;font-size:14px;line-height:1.6;font-style:italic;">"${escapedPreview}"</p>
                </div>

                <div style="text-align:center;margin:32px 0 24px;">
                  <a href="${opts.chatUrl}" style="display:inline-block;background:${BRAND_NAVY};color:#ffffff;text-decoration:none;padding:12px 28px;font-size:14px;font-weight:600;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);transition:background 0.2s;">
                    View & Reply to Message
                  </a>
                </div>

                <p style="margin:24px 0 0;color:#71717a;font-size:12px;line-height:1.6;text-align:center;">
                  If the button doesn't work, copy and paste this link into your browser:<br/>
                  <a href="${opts.chatUrl}" style="color:${BRAND_BLUE};text-decoration:underline;">${opts.chatUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:16px 32px;">
                <span style="color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} Reines Property Development Limited</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function sendProjectMessageEmail(opts: {
  to: string;
  clientName: string;
  senderName: string;
  projectTitle: string;
  messagePreview: string;
  projectId: string;
}): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://reines.co.mw";
  const chatUrl = `${baseUrl}/dashboard/messages/${opts.projectId}`;
  const displayPreview = opts.messagePreview.length > 150
    ? opts.messagePreview.slice(0, 150) + "..."
    : opts.messagePreview;

  await sendMail({
    to: opts.to,
    subject: `New message on ${opts.projectTitle} from ${opts.senderName}`,
    html: projectMessageEmailHtml({ ...opts, messagePreview: displayPreview, chatUrl }),
    text:
      `Hi ${opts.clientName},\n\n` +
      `Your Project Manager, ${opts.senderName}, sent you a message on ${opts.projectTitle}:\n\n` +
      `"${displayPreview}"\n\n` +
      `View and reply to message: ${chatUrl}`,
  });
}

// ─── Identity Verification Emails ───────────────────────────────────────────

function verificationSubmittedHtml(name?: string): string {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return `
  <div style="margin:0;padding:0;background:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8eb;">
          <tr>
            <td style="background:${BRAND_NAVY};padding:24px 32px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;">Reines Group</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;color:#18181b;font-size:15px;">${greeting}</p>
              <p style="margin:0 0 24px;color:#52525b;font-size:14px;line-height:1.6;">
                We have received your identity verification documents and details. Our administrator team is currently reviewing your application.
              </p>
              <div style="margin:0 0 24px;padding:16px;background:#f0f5fc;border-radius:12px;border:1px solid ${BRAND_BLUE};">
                <span style="font-size:14px;font-weight:600;color:${BRAND_NAVY};">Status: Pending Review</span>
              </div>
              <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.6;">
                This process usually takes 24-48 business hours. You will receive an automated email as soon as your account access is approved or if we require any adjustments.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:16px 32px;">
              <span style="color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} Reines Property Development Limited</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

export async function sendClientVerificationSubmittedEmail(to: string, name?: string): Promise<void> {
  await sendMail({
    to,
    subject: "Identity verification request received - Reines Group",
    html: verificationSubmittedHtml(name),
    text: `${name ? `Hi ${name},\n\n` : ""}We have received your identity verification documents and details. Our administrator team is reviewing your application. This process usually takes 24-48 hours.`,
  });
}

function adminVerificationHtml(clientName: string, clientEmail: string, details: { phone: string, address: string, occupation: string, idType: string, idNumber: string, documentUrl: string }): string {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://reines.co.mw";
  const fullDocumentLink = details.documentUrl ? `${baseUrl}/api/media?url=${encodeURIComponent(details.documentUrl)}` : "#";
  const reviewLink = `${baseUrl}/dashboard/admin/clients`;

  return `
  <div style="margin:0;padding:0;background:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8eb;">
          <tr>
            <td style="background:${BRAND_NAVY};padding:24px 32px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;">Reines Group Admin | New Verification Request</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.6;">
                A new client account is pending verification and requires review before accessing portal features.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td style="padding:6px 0;color:#71717a;font-size:13px;width:140px;vertical-align:top;">Client Name</td>
                  <td style="padding:6px 0;color:#18181b;font-size:13px;font-weight:600;">${clientName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#71717a;font-size:13px;vertical-align:top;">Client Email</td>
                  <td style="padding:6px 0;color:#18181b;font-size:13px;">${clientEmail}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#71717a;font-size:13px;vertical-align:top;">Phone</td>
                  <td style="padding:6px 0;color:#18181b;font-size:13px;">${details.phone}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#71717a;font-size:13px;vertical-align:top;">Address</td>
                  <td style="padding:6px 0;color:#18181b;font-size:13px;">${details.address}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#71717a;font-size:13px;vertical-align:top;">Occupation</td>
                  <td style="padding:6px 0;color:#18181b;font-size:13px;">${details.occupation}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#71717a;font-size:13px;vertical-align:top;">ID Type</td>
                  <td style="padding:6px 0;color:#18181b;font-size:13px;text-transform:uppercase;">${details.idType}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#71717a;font-size:13px;vertical-align:top;">ID Number</td>
                  <td style="padding:6px 0;color:#18181b;font-size:13px;">${details.idNumber}</td>
                </tr>
              </table>
              <div style="text-align:center;margin:32px 0 24px;">
                <a href="${fullDocumentLink}" target="_blank" style="display:inline-block;background:#f0f5fc;border:1px solid ${BRAND_BLUE};color:${BRAND_NAVY};text-decoration:none;padding:12px 24px;font-size:14px;font-weight:600;border-radius:8px;margin-right:12px;">
                  View ID Document
                </a>
                <a href="${reviewLink}" style="display:inline-block;background:${BRAND_NAVY};color:#ffffff;text-decoration:none;padding:12px 24px;font-size:14px;font-weight:600;border-radius:8px;">
                  Open Admin Portal
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:16px 32px;">
              <span style="color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} Reines Property Development Limited</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

export async function sendAdminVerificationSubmittedEmail(clientName: string, clientEmail: string, details: { phone: string, address: string, occupation: string, idType: string, idNumber: string, documentUrl: string }): Promise<void> {
  const to = getQuotationNotifyEmail();
  await sendMail({
    to,
    subject: `[Review Required] Client Verification Request: ${clientName}`,
    html: adminVerificationHtml(clientName, clientEmail, details),
    text: `A new client account is pending verification and requires review.\n\nClient Name: ${clientName}\nClient Email: ${clientEmail}\nID Type: ${details.idType}\nID Number: ${details.idNumber}\n\nReview this application in the admin portal under Client Management.`,
  });
}

function verificationApprovedHtml(name?: string): string {
  const first = name?.trim().split(/\s+/)[0] || "";
  const greeting = first ? `Hi ${first},` : "Hi,";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://reines.co.mw";
  const dashboardLink = `${baseUrl.replace(/\/+$/, "")}/dashboard`;
  const projectMateLink = `${baseUrl.replace(/\/+$/, "")}/project-mate`;
  const supportEmail = "contact@reines.co.mw";
  const supportPhone = "+265 883 157 209";

  return `
  <div style="margin:0;padding:0;background:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8eb;">
          <tr>
            <td style="background:${BRAND_NAVY};padding:28px 32px;">
              <span style="display:block;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">Welcome to Reines Project Mate</span>
              <span style="display:block;margin-top:6px;color:${BRAND_BLUE};font-size:13px;font-weight:500;">Your verification is complete</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;color:#18181b;font-size:15px;">${greeting}</p>
              <p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.65;">
                Great news — your KYC identity verification has been reviewed and
                <strong style="color:#18181b;">approved</strong>. You are now welcome to start using
                your Reines Project Mate portal.
              </p>
              <p style="margin:0 0 20px;color:#52525b;font-size:14px;line-height:1.65;">
                Sign in with the same email and password you used to register. Once inside, you can:
              </p>
              <ul style="margin:0 0 24px;padding:0 0 0 18px;color:#52525b;font-size:14px;line-height:1.7;">
                <li style="margin-bottom:6px;">Track live project progress and milestones</li>
                <li style="margin-bottom:6px;">View progress galleries and updates from your project manager</li>
                <li style="margin-bottom:6px;">Message your Reines team directly</li>
                <li style="margin-bottom:6px;">Make and review payments</li>
                <li>Earn and redeem loyalty rewards</li>
              </ul>
              <div style="text-align:center;margin:8px 0 28px;">
                <a href="${dashboardLink}" style="display:inline-block;background:${BRAND_NAVY};color:#ffffff;text-decoration:none;padding:14px 28px;font-size:14px;font-weight:600;border-radius:8px;">
                  Open your portal
                </a>
              </div>
              <p style="margin:0 0 12px;color:#52525b;font-size:13px;line-height:1.6;">
                Prefer the mobile experience? Learn more about Project Mate at
                <a href="${projectMateLink}" style="color:${BRAND_NAVY};font-weight:600;text-decoration:underline;">reines.co.mw/project-mate</a>.
                Native apps for Google Play and the App Store are coming soon.
              </p>
              <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;">
                Need help? Contact us at
                <a href="mailto:${supportEmail}" style="color:${BRAND_NAVY};text-decoration:underline;">${supportEmail}</a>
                or call <a href="tel:+265883157209" style="color:${BRAND_NAVY};text-decoration:underline;">${supportPhone}</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:16px 32px;">
              <span style="color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} Reines Property Development Limited</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

export async function sendVerificationApprovedEmail(to: string, name?: string): Promise<void> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://reines.co.mw").replace(/\/+$/, "");
  const dashboardLink = `${baseUrl}/dashboard`;
  const projectMateLink = `${baseUrl}/project-mate`;
  const first = name?.trim().split(/\s+/)[0] || "";

  await sendMail({
    to,
    subject: "Welcome to Reines Project Mate — verification complete",
    html: verificationApprovedHtml(name),
    text:
      `${first ? `Hi ${first},\n\n` : "Hi,\n\n"}` +
      `Welcome to Reines Project Mate.\n\n` +
      `Your KYC identity verification has been approved. You may now start using your client portal.\n\n` +
      `Sign in and open your dashboard: ${dashboardLink}\n\n` +
      `In the portal you can track projects, view progress galleries, message your team, make payments, and use loyalty rewards.\n\n` +
      `Learn more about Project Mate: ${projectMateLink}\n\n` +
      `Need help? Email contact@reines.co.mw or call +265 883 157 209.\n`,
  });
}

function verificationRejectedHtml(name?: string, notes?: string): string {
  const greeting = name ? `Hi ${name},` : "Hi,";
  const resubmitLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://reines.co.mw"}/dashboard/verification`;
  return `
  <div style="margin:0;padding:0;background:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8eb;">
          <tr>
            <td style="background:${BRAND_NAVY};padding:24px 32px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;">Reines Group</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;color:#18181b;font-size:15px;">${greeting}</p>
              <p style="margin:0 0 24px;color:#52525b;font-size:14px;line-height:1.6;">
                Your identity verification has been reviewed and unfortunately could not be approved at this time.
              </p>
              ${notes ? `
              <div style="margin:0 0 24px;padding:16px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;">
                <p style="margin:0 0 4px;color:#991b1b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Feedback from Admins</p>
                <p style="margin:0;color:#7f1d1d;font-size:14px;line-height:1.6;font-style:italic;">"${notes}"</p>
              </div>
              ` : ""}
              <p style="margin:0 0 24px;color:#52525b;font-size:14px;line-height:1.6;">
                Please log in to your account, update the required details or resubmit a clearer copy of your identity document.
              </p>
              <div style="text-align:center;margin:32px 0 24px;">
                <a href="${resubmitLink}" style="display:inline-block;background:${BRAND_NAVY};color:#ffffff;text-decoration:none;padding:12px 28px;font-size:14px;font-weight:600;border-radius:8px;">
                  Update & Resubmit
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:16px 32px;">
              <span style="color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} Reines Property Development Limited</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

export async function sendVerificationRejectedEmail(to: string, name?: string, notes?: string): Promise<void> {
  const resubmitLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://reines.co.mw"}/dashboard/verification`;
  await sendMail({
    to,
    subject: "Identity verification update required - Reines Group",
    html: verificationRejectedHtml(name, notes),
    text: `${name ? `Hi ${name},\n\n` : ""}Your identity verification request requires updating. Feedback: ${notes || "None"}. Please resubmit at: ${resubmitLink}`,
  });
}


