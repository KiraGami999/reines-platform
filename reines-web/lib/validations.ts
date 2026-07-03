import { z } from "zod";

/**
 * Public self-registration schema.
 * Role is intentionally omitted — the API always assigns CLIENT.
 * Use createUserSchema (admin-only) for assigning other roles.
 */
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Credentials submitted to NextAuth's authorize() — includes the email OTP
 * required as the second factor. The OTP is validated server-side against the
 * hashed code stored in the EmailOtp table.
 */
export const credentialsSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  otp:      z.string().regex(/^\d{6}$/, "Enter the 6-digit code").optional(),
});

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordConfirmSchema = z.object({
  email:    z.string().email("Invalid email address"),
  code:     z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  password: passwordField,
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  code:  z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type RegisterInput        = z.infer<typeof registerSchema>;
export type LoginInput           = z.infer<typeof loginSchema>;
export type CredentialsInput     = z.infer<typeof credentialsSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordConfirm = z.infer<typeof resetPasswordConfirmSchema>;
export type VerifyEmailInput     = z.infer<typeof verifyEmailSchema>;

export const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Please provide a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

// ─── Admin schemas ─────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role:     z.enum(["ADMIN", "PROJECT_MANAGER", "CLIENT"] as const).refine(Boolean, "Select a valid role"),
});

export const updateUserSchema = z.object({
  name:     z.string().min(2).optional(),
  email:    z.string().email().optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role:     z.enum(["ADMIN", "PROJECT_MANAGER", "CLIENT"] as const).optional(),
});

export const projectStatusEnum = z.enum(
  ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"] as const
);

export const createProjectSchema = z.object({
  title:       z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  clientId:    z.string().min(1, "Select a client"),
  managerId:   z.string().min(1, "Select a manager"),
  status:      projectStatusEnum.default("PLANNING"),
  budget:      z.number().positive("Budget must be a positive number").optional().nullable(),
  startDate:   z.string().datetime({ offset: true }).optional().nullable(),
  endDate:     z.string().datetime({ offset: true }).optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const sendMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message is too long (max 2 000 chars)"),
});

/**
 * Gallery update schema.
 * imageUrl accepts either a relative `/uploads/…` path or an absolute https URL.
 * Validation of the relative path is enforced server-side via isSafeUploadUrl.
 */
export const createGalleryUpdateSchema = z.object({
  note:            z.string().min(1, "Please add a note for this update").max(1000, "Note is too long (max 1 000 chars)"),
  imageUrl:        z.string().optional().nullable(),
  documentUrl:     z.string().optional().nullable(),
  documentName:    z.string().trim().max(180).optional().nullable(),
  documentType:    z.string().trim().max(120).optional().nullable(),
  progressPercent: z.number().int().min(0).max(100).optional().nullable(),
});

export type CreateUserInput    = z.infer<typeof createUserSchema>;
export type UpdateUserInput    = z.infer<typeof updateUserSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
