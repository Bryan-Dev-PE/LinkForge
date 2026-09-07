import type { Request, Response } from 'express';
import {
  changeUserPassword,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetUserPassword,
  toPublicUserSafe,
} from '../services/auth.service';
import { updateUserProfile } from '../services/user.service';
import { clearAuthCookie, setAuthCookie } from '../services/token.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/sendSuccess';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await registerUser(req.body);
  setAuthCookie(res, token);
  sendSuccess(res, { user }, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await loginUser(req.body);
  setAuthCookie(res, token);
  sendSuccess(res, { user });
});

export const logout = (_req: Request, res: Response) => {
  clearAuthCookie(res);
  sendSuccess(res, { loggedOut: true });
};

export const me = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, { user: toPublicUserSafe(req.user!) });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetUrl } = await requestPasswordReset(req.body.email);
  sendSuccess(res, {
    message: 'If an account exists for that email, a password reset link has been sent.',
    resetUrl,
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await resetUserPassword(req.body.token, req.body.password);
  sendSuccess(res, { message: 'Your password has been reset. You can now sign in.' });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await changeUserPassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  sendSuccess(res, { message: 'Your password has been updated.' });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const updated = await updateUserProfile(req.user!.id, { name: req.body.name, email: req.body.email });
  sendSuccess(res, { user: toPublicUserSafe(updated) });
});