import { z } from 'zod';

const PASSWORD_MESSAGE =
  'Password must be 8-72 characters and contain at least one letter and one number.';

export const passwordSchema = z
  .string()
  .min(8, PASSWORD_MESSAGE)
  .max(72, PASSWORD_MESSAGE)
  .regex(/[a-zA-Z]/, PASSWORD_MESSAGE)
  .regex(/[0-9]/, PASSWORD_MESSAGE);

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(60, 'Name must be at most 60 characters.'),
  email: z.string().trim().toLowerCase().email('Please provide a valid email address.'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address.'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid reset token.'),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: passwordSchema,
});