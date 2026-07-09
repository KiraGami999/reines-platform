import { z } from "zod";

/** Login form */
export const loginSchema = z.object({
  email:    z.string().min(1, "Email is required.").email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});
export type LoginForm = z.infer<typeof loginSchema>;

/** Public self-registration — matches reines-web registerSchema */
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().min(1, "Email is required.").email("Invalid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter.")
    .regex(/[0-9]/, "Must contain at least one number."),
});
export type RegisterForm = z.infer<typeof registerSchema>;

/** Send message form */
export const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty.").max(2000, "Message is too long."),
});
export type MessageForm = z.infer<typeof messageSchema>;

/** Update profile form */
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
});
export type ProfileForm = z.infer<typeof profileSchema>;
