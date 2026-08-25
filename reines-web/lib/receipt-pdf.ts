import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { ORGANIZATION, REGISTERED_OFFICE_FULL, SITE_NAME } from "@/lib/site";
import { fmtPaymentAmount, PAYMENT_STATUS_META } from "@/lib/paychangu";

const NAVY = rgb(27 / 255, 51 / 255, 79 / 255);
const ZINC_400 = rgb(161 / 255, 161 / 255, 170 / 255);
const ZINC_500 = rgb(113 / 255, 113 / 255, 122 / 255);
const ZINC_900 = rgb(24 / 255, 24 / 255, 27 / 255);
const LINE = rgb(228 / 255, 228 / 255, 231 / 255);
const WHITE = rgb(1, 1, 1);

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
/** Fixed column where values begin — keeps every row aligned. */
const VALUE_X = 200;
const VALUE_MAX_WIDTH = PAGE_WIDTH - MARGIN - VALUE_X;

const logoBytesPromise = readFile(
  path.join(process.cwd(), "public/logo-receipt-reines-group.png")
);

export type ReceiptPdfData = {
  txRef: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  description: string | null;
  billedTo: string;
  projectTitle: string | null;
  paidAt: Date | null;
  createdAt: Date;
  paychanguId: string | null;
};

function fmtDate(d: Date | null) {
  if (!d) return "-";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function methodLabel(method: string) {
  if (method === "CASH") return "Cash Payment";
  if (method === "BANK_TRANSFER") return "Bank Transfer";
  return "Online Payment";
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  const pushChunks = (token: string) => {
    if (font.widthOfTextAtSize(token, size) <= maxWidth) {
      const next = current ? `${current} ${token}` : token;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next;
        return;
      }
      if (current) lines.push(current);
      current = token;
      return;
    }

    if (current) {
      lines.push(current);
      current = "";
    }
    let chunk = "";
    for (const ch of token) {
      const trial = chunk + ch;
      if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
        chunk = trial;
      } else {
        if (chunk) lines.push(chunk);
        chunk = ch;
      }
    }
    current = chunk;
  };

  for (const word of words) {
    if (!word) continue;
    pushChunks(word);
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : ["-"];
}

/**
 * Two-column row: label left, value in a fixed column (left-aligned).
 * Avoids right-edge rag that made short values look scattered.
 */
function drawRow(
  page: PDFPage,
  y: number,
  label: string,
  value: string,
  fonts: { regular: PDFFont; bold: PDFFont }
) {
  const fontSize = 10;
  const lineH = 14;
  const lines = wrapText(value, fonts.regular, fontSize, VALUE_MAX_WIDTH);

  page.drawText(label, {
    x: MARGIN,
    y,
    size: fontSize,
    font: fonts.regular,
    color: ZINC_500,
  });

  lines.forEach((line, i) => {
    page.drawText(line, {
      x: VALUE_X,
      y: y - i * lineH,
      size: fontSize,
      font: fonts.regular,
      color: ZINC_900,
    });
  });

  const used = Math.max(26, 8 + lines.length * lineH);
  page.drawLine({
    start: { x: MARGIN, y: y - used + 10 },
    end: { x: PAGE_WIDTH - MARGIN, y: y - used + 10 },
    thickness: 0.5,
    color: LINE,
  });

  return y - used;
}

export async function buildReceiptPdf(data: ReceiptPdfData): Promise<Uint8Array> {
  const [pdf, logoBytes] = await Promise.all([PDFDocument.create(), logoBytesPromise]);
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const isPng = logoBytes[0] === 0x89 && logoBytes[1] === 0x50;
  const [regular, bold, logo] = await Promise.all([
    pdf.embedFont(StandardFonts.Helvetica),
    pdf.embedFont(StandardFonts.HelveticaBold),
    isPng ? pdf.embedPng(logoBytes) : pdf.embedJpg(logoBytes),
  ]);

  const headerH = 200;
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - headerH,
    width: PAGE_WIDTH,
    height: headerH,
    color: NAVY,
  });

  // Official Reines Group lockup — large and clear on the navy header.
  // Asset is a square plate; size by width so the wordmark inside stays readable.
  const maxLogoW = Math.min(320, PAGE_WIDTH - MARGIN * 2);
  const maxLogoH = 140;
  const scale = Math.min(maxLogoW / logo.width, maxLogoH / logo.height);
  const logoW = logo.width * scale;
  const logoH = logo.height * scale;
  page.drawImage(logo, {
    x: (PAGE_WIDTH - logoW) / 2,
    y: PAGE_HEIGHT - 22 - logoH,
    width: logoW,
    height: logoH,
  });

  const subtitle = "PAYMENT RECEIPT";
  const subSize = 9;
  const subW = bold.widthOfTextAtSize(subtitle, subSize);
  page.drawText(subtitle, {
    x: (PAGE_WIDTH - subW) / 2,
    y: PAGE_HEIGHT - headerH + 22,
    size: subSize,
    font: bold,
    color: WHITE,
  });

  const statusMeta = PAYMENT_STATUS_META[data.status] ?? PAYMENT_STATUS_META.PENDING;
  const amountText = fmtPaymentAmount(data.amount, data.currency);
  let y = PAGE_HEIGHT - headerH - 40;

  page.drawText(statusMeta.label, {
    x: MARGIN,
    y,
    size: 20,
    font: bold,
    color: ZINC_900,
  });
  y -= 22;
  page.drawText(
    data.status === "SUCCESS"
      ? `Payment of ${amountText} received`
      : `Status: ${statusMeta.label}`,
    {
      x: MARGIN,
      y,
      size: 11,
      font: regular,
      color: ZINC_500,
    }
  );

  y -= 32;
  const fonts = { regular, bold };
  y = drawRow(page, y, "Reference", data.txRef, fonts);
  y = drawRow(page, y, "Project", data.projectTitle ?? "Product Sale", fonts);
  y = drawRow(page, y, "Description", data.description?.trim() || "-", fonts);
  y = drawRow(page, y, "Amount", amountText, fonts);
  y = drawRow(page, y, "Currency", data.currency, fonts);
  y = drawRow(page, y, "Payment Method", methodLabel(data.method), fonts);
  y = drawRow(page, y, "Status", statusMeta.label, fonts);
  y = drawRow(page, y, "Paid at", fmtDate(data.paidAt), fonts);
  y = drawRow(page, y, "Initiated", fmtDate(data.createdAt), fonts);
  if (data.paychanguId) {
    y = drawRow(page, y, "Paychangu ID", data.paychanguId, fonts);
  }
  y = drawRow(page, y, "Billed to", data.billedTo, fonts);

  const footer = [
    SITE_NAME,
    REGISTERED_OFFICE_FULL,
    `${ORGANIZATION.telephone}  |  ${ORGANIZATION.email}`,
  ];
  let fy = 40;
  for (const line of [...footer].reverse()) {
    const size = 8;
    const w = regular.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: (PAGE_WIDTH - w) / 2,
      y: fy,
      size,
      font: regular,
      color: ZINC_400,
    });
    fy += 12;
  }

  return pdf.save();
}
