/**
 * Email delivery via SMTP (nodemailer).
 *
 * Works with any SMTP provider. For a free setup, use Gmail:
 *   SMTP_HOST="smtp.gmail.com"
 *   SMTP_PORT="465"
 *   SMTP_USER="your-account@gmail.com"
 *   SMTP_PASS="<16-char Gmail App Password>"   ← NOT your normal password
 *   SMTP_FROM="Reines Properties <your-account@gmail.com>"
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

const BRAND_NAVY = "#2d4a6b";
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
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.3px;">Reines Properties</span>
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
              <span style="color:#ffffff;font-size:18px;font-weight:700;">Reines Properties</span>
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
              <span style="color:#ffffff;font-size:18px;font-weight:700;">Reines Properties</span>
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
