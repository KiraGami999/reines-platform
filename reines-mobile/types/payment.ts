export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
export type PaymentMethod = "PAYCHANGU" | "CASH";

/** Embedded project summary on a payment record */
export interface PaymentProject {
  id:     string;
  title:  string;
  status: string;
}

/** Payment summary row (list screen) */
export interface Payment {
  id:          string;
  txRef:       string;
  amount:      string;
  currency:    string;
  status:      PaymentStatus;
  method:      PaymentMethod;
  description: string | null;
  checkoutUrl: string | null;
  receiptUrl:  string | null;
  paidAt:      string | null;
  adminNotes:  string | null;
  projectId:   string;
  createdAt:   string;
  project:     PaymentProject;
}

/** Full payment detail (detail screen) */
export type PaymentDetail = Payment;

/** Response shapes */
export interface PaymentsResponse  { payments: Payment[] }
export interface PaymentResponse   { payment:  PaymentDetail }

/** Initiate PayChangu checkout response */
export interface InitiatePaymentResponse {
  txRef:       string;
  checkoutUrl: string;
  paymentId:   string;
}

/** Submit cash payment response */
export interface CashPaymentResponse {
  paymentId: string;
  txRef:     string;
  status:    PaymentStatus;
}

/** Form values for initiating any payment */
export interface PaymentFormValues {
  projectId:   string;
  amount:      string;   // string to handle text input; parsed to number before submit
  description: string;
  currency:    "MWK" | "USD";
}

/** Form values for a cash payment */
export interface CashPaymentFormValues extends PaymentFormValues {
  receiptUri?: string;   // local image URI, uploaded before submit
}
