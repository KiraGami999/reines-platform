import api from "@/lib/api";
import type {
  Payment,
  PaymentDetail,
  InitiatePaymentResponse,
  CashPaymentResponse,
  PaymentsResponse,
  PaymentResponse,
} from "@/types";

/** Fetches all payments for the authenticated client. */
export async function fetchPayments(): Promise<Payment[]> {
  const { data } = await api.get<PaymentsResponse>("/api/mobile/payments");
  return data.payments;
}

/** Fetches a single payment with full detail. */
export async function fetchPayment(id: string): Promise<PaymentDetail> {
  const { data } = await api.get<PaymentResponse>(`/api/mobile/payments/${id}`);
  return data.payment;
}

/**
 * Initiates a Paychangu online payment.
 * Returns { txRef, checkoutUrl, paymentId } so the app can open
 * the checkout URL in an in-app browser.
 */
export async function initiateOnlinePayment(payload: {
  projectId:   string;
  amount:      number;
  description: string;
  currency?:   "MWK" | "USD";
}): Promise<InitiatePaymentResponse> {
  const { data } = await api.post<InitiatePaymentResponse>(
    "/api/mobile/payments/initiate",
    { currency: "MWK", ...payload }
  );
  return data;
}

/**
 * Submits a cash payment with an optional receipt URL.
 * The payment will be in PENDING status until an admin approves it.
 */
export async function submitCashPayment(payload: {
  projectId:   string;
  amount:      number;
  description: string;
  currency?:   "MWK" | "USD";
  receiptUrl?: string;
}): Promise<CashPaymentResponse> {
  const { data } = await api.post<CashPaymentResponse>(
    "/api/mobile/payments/cash",
    { currency: "MWK", ...payload }
  );
  return data;
}

/**
 * Uploads a local image (receipt) as FormData.
 * Returns the remote URL of the uploaded file.
 */
export async function uploadReceipt(localUri: string): Promise<string> {
  const filename = localUri.split("/").pop() ?? "receipt.jpg";
  const match    = /\.(\w+)$/.exec(filename);
  const type     = match ? `image/${match[1]}` : "image/jpeg";

  const formData = new FormData();
  formData.append("file", { uri: localUri, name: filename, type } as unknown as Blob);

  const { data } = await api.post<{ url: string }>(
    "/api/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.url;
}
