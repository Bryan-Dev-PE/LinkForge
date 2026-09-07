import { useState, type FormEvent } from 'react';
import { KeyRound, UserRound } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Alert, Button, Card, Field, Input } from '../../components/ui';

export function Settings() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileLoading(true);
    try {
      const data = await api.put<{ user: typeof user }>('/api/auth/profile', { name, email });
      setUser(data.user);
      setProfileSuccess('Profile updated.');
    } catch (err) {
      setProfileError(err instanceof ApiRequestError ? err.message : 'Could not update your profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password updated. Use it next time you sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof ApiRequestError ? err.message : 'Could not change your password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your profile and password.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <UserRound className="h-4 w-4 text-brand-600" />
            Profile
          </h2>
          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <Field label="Name" htmlFor="profile-name" required>
              <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={profileLoading} />
            </Field>
            <Field label="Email" htmlFor="profile-email" required>
              <Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={profileLoading} />
            </Field>
            {profileError ? <Alert tone="error">{profileError}</Alert> : null}
            {profileSuccess ? <Alert tone="success">{profileSuccess}</Alert> : null}
            <Button type="submit" loading={profileLoading}>
              Save profile
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <KeyRound className="h-4 w-4 text-brand-600" />
            Change password
          </h2>
          <form onSubmit={changePassword} className="mt-5 space-y-4">
            <Field label="Current password" htmlFor="current-password" required>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={passwordLoading}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New password" htmlFor="new-password" hint="At least 8 characters." required>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                  disabled={passwordLoading}
                />
              </Field>
              <Field label="Confirm" htmlFor="confirm-password" required>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                  disabled={passwordLoading}
                />
              </Field>
            </div>
            {passwordError ? <Alert tone="error">{passwordError}</Alert> : null}
            {passwordSuccess ? <Alert tone="success">{passwordSuccess}</Alert> : null}
            <Button type="submit" loading={passwordLoading}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}