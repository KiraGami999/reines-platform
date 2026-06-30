/** Generic API error returned by the backend */
export interface ApiError {
  error:   string;
  issues?: Record<string, string[]>;
}

/** Paginated response envelope (for future use) */
export interface PaginatedResponse<T> {
  data:    T[];
  total:   number;
  page:    number;
  perPage: number;
}

/** Notification payload pushed to device (matches lib/push.ts PushPayload) */
export interface PushNotificationData {
  type:       "message" | "payment" | "project" | "gallery";
  projectId?: string;
  paymentId?: string;
  updateId?:  string;   // gallery update ID for direct deep-link
  title:      string;
  body:       string;
}
