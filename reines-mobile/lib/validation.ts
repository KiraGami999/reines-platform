import { z } from "zod";

/** Login form */
export const loginSchema = z.object({
  email:    z.string().min(1, "Email is required.").email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});
export type LoginForm = z.infer<typeof loginSchema>;

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
