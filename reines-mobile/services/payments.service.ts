import api from "@/lib/api";
import { getToken } from "@/lib/storage";
import { API_BASE_URL } from "@/constants";
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
 * Uploads a local receipt image via the mobile cash-upload endpoint.
 * Returns the remote URL of the uploaded file.
 */
export function uploadReceipt(localUri: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const token = await getToken();
    if (!token) {
      reject(new Error("Not authenticated."));
      return;
    }

    const filename = localUri.split("/").pop() ?? "receipt.jpg";
    const match    = /\.(\w+)$/.exec(filename);
    const mimeType = match
      ? `image/${match[1].toLowerCase().replace("jpg", "jpeg")}`
      : "image/jpeg";

    const formData = new FormData();
    formData.append("file", {
      uri:  localUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/mobile/payments/cash/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as { url?: string; error?: string };
        if (xhr.status >= 200 && xhr.status < 300 && json.url) {
          resolve(json.url);
        } else {
          reject(new Error(json.error ?? `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error("Invalid response from server."));
      }
    };

    xhr.onerror  = () => reject(new Error("Network error during upload."));
    xhr.ontimeout = () => reject(new Error("Upload timed out."));
    xhr.timeout  = 60_000;
    xhr.send(formData);
  });
}
