import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPayments,
  fetchPayment,
  initiateOnlinePayment,
  submitCashPayment,
} from "@/services/payments.service";
import type {
  Payment,
  PaymentDetail,
  InitiatePaymentResponse,
  CashPaymentResponse,
} from "@/types";

export const PAYMENT_KEYS = {
  all:    ["payments"] as const,
  detail: (id: string) => ["payments", id] as const,
};

/** Fetches all payments for the authenticated client (30 s stale). */
export function usePayments() {
  return useQuery<Payment[]>({
    queryKey:  PAYMENT_KEYS.all,
    queryFn:   fetchPayments,
    staleTime: 30_000,
  });
}

/** Fetches a single payment's full detail. */
export function usePayment(id: string) {
  return useQuery<PaymentDetail>({
    queryKey:  PAYMENT_KEYS.detail(id),
    queryFn:   () => fetchPayment(id),
    enabled:   !!id,
    staleTime: 30_000,
  });
}

/** Invalidates payment cache (call after checkout completes or cash submitted). */
export function useInvalidatePayments() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
}

/**
 * Initiates a PayChangu online payment.
 * On success returns { checkoutUrl } — open it in expo-web-browser.
 */
export function useInitiatePayment() {
  const qc = useQueryClient();
  return useMutation<
    InitiatePaymentResponse,
    Error,
    { projectId: string; amount: number; description: string }
  >({
    mutationFn: initiateOnlinePayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
    },
  });
}

/**
 * Submits a cash payment (pending admin approval).
 * Invalidates the payment list so the new record appears immediately.
 */
export function useSubmitCashPayment() {
  const qc = useQueryClient();
  return useMutation<
    CashPaymentResponse,
    Error,
    { projectId: string; amount: number; description: string; receiptUrl?: string }
  >({
    mutationFn: submitCashPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
    },
  });
}
