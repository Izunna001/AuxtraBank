import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  type User as FirebaseUser,
  type AuthError,
} from 'firebase/auth';

export type ReauthResult = { ok: true } | { ok: false; message: string; code?: string };

/**
 * Re-authenticate the current Firebase user with email + password.
 * Required before sensitive operations (password change, PIN reset, etc.).
 */
export async function reauthenticateWithPassword(
  user: FirebaseUser | null,
  password: string
): Promise<ReauthResult> {
  if (!user) {
    return { ok: false, message: 'You are not signed in. Please log in again.', code: 'not-authenticated' };
  }
  if (!user.email) {
    return {
      ok: false,
      message: 'This account has no email/password credential to re-authenticate.',
      code: 'no-email',
    };
  }
  if (!password || !password.trim()) {
    return { ok: false, message: 'Enter your current account password to continue.', code: 'empty-password' };
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    return { ok: true };
  } catch (err: unknown) {
    const code = (err as AuthError)?.code || '';
    return { ok: false, message: mapReauthError(code, err), code };
  }
}

export function mapReauthError(code: string, err?: unknown): string {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Wait a few minutes and try again.';
    case 'auth/user-mismatch':
      return 'This password does not match the signed-in account.';
    case 'auth/user-not-found':
      return 'Account not found. Please log in again.';
    case 'auth/requires-recent-login':
      return 'For security, please enter your password again to continue.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    default: {
      const msg = (err as Error)?.message;
      if (msg && !msg.includes('Firebase')) return msg;
      return 'Authentication failed. Check your password and try again.';
    }
  }
}
