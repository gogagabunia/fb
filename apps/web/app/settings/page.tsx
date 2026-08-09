'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, updatePasswordAction } from '../auth-actions';
import { updateProfileDetailsAction } from '../actions';
import Sidebar from '../components/sidebar';
import { DashboardSkeleton } from '../components/skeleton';
import { makeT } from '../lib/i18n';
import { settingsStrings } from '../lib/i18n/settings';
import { useLang } from '../components/lang-provider';

export default function SettingsPage() {
  const tr = makeT(settingsStrings, useLang());
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  async function loadData() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        setFirstName(currentUser.firstName || '');
        setLastName(currentUser.lastName || '');
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingProfile(true);
    setProfileMessage(null);

    try {
      const result = await updateProfileDetailsAction(firstName, lastName);
      if (result.success) {
        setProfileMessage({ text: tr('profileUpdated'), type: 'success' });
        // Reload user info to sync other components
        loadData();
      } else {
        setProfileMessage({ text: result.error || tr('profileUpdateFailed'), type: 'error' });
      }
    } catch (error: any) {
      setProfileMessage({ text: error.message || tr('errorOccurred'), type: 'error' });
    } finally {
      setSubmittingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingPassword(true);
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ text: tr('newPasswordTooShort'), type: 'error' });
      setSubmittingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: tr('newPasswordsDoNotMatch'), type: 'error' });
      setSubmittingPassword(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('currentPassword', currentPassword);
      formData.append('newPassword', newPassword);
      formData.append('confirmPassword', confirmPassword);

      const result = await updatePasswordAction(formData);
      if (result.success) {
        setPasswordMessage({ text: tr('passwordChanged'), type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ text: result.error || tr('incorrectCurrentPassword'), type: 'error' });
      }
    } catch (error: any) {
      setPasswordMessage({ text: error.message || tr('errorOccurred'), type: 'error' });
    } finally {
      setSubmittingPassword(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-secondary-container">
      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        {/* Shared Sidebar */}
        <Sidebar activePage="settings" user={user} />

        {/* Content Canvas */}
        <main className="flex-grow p-md md:p-xl overflow-y-auto max-w-container-max h-full flex flex-col items-center">
          <div className="w-full max-w-3xl py-lg space-y-xl">
            {/* Header */}
            <header className="border-b border-outline-variant/20 pb-md">
              <h2 className="text-display-lg font-bold text-primary">{tr('title')}</h2>
              <p className="text-body-lg text-on-surface-variant mt-xs">
                {tr('subtitle')}
              </p>
            </header>

            {loading ? (
              <DashboardSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                {/* Profile Form */}
                <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
                  <form onSubmit={handleProfileSubmit} className="space-y-md">
                    <h3 className="text-title-lg font-bold text-primary border-b border-outline-variant/10 pb-xs">
                      {tr('profileHeading')}
                    </h3>

                    {profileMessage && (
                      <div
                        className={`p-md rounded-lg text-label-md font-semibold ${
                          profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-error-container/20 text-error border border-error/10'
                        }`}
                      >
                        {profileMessage.text}
                      </div>
                    )}

                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm font-bold text-on-surface-variant">{tr('firstNameLabel')}</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full h-11 px-md rounded-lg border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                        placeholder={tr('firstNamePlaceholder')}
                      />
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm font-bold text-on-surface-variant">{tr('lastNameLabel')}</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full h-11 px-md rounded-lg border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                        placeholder={tr('lastNamePlaceholder')}
                      />
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm font-bold text-on-surface-variant">{tr('emailLabel')}</label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full h-11 px-md rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface-variant opacity-75 outline-none cursor-not-allowed text-body-md"
                      />
                      <span className="text-[10px] text-slate-400">{tr('emailNote')}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingProfile}
                      className="w-full h-11 bg-primary text-on-primary rounded-lg text-label-md font-bold shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-xs"
                    >
                      {submittingProfile ? tr('savingProfile') : tr('saveProfile')}
                    </button>
                  </form>
                </div>

                {/* Password Form */}
                <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
                  <form onSubmit={handlePasswordSubmit} className="space-y-md">
                    <h3 className="text-title-lg font-bold text-primary border-b border-outline-variant/10 pb-xs">
                      {tr('passwordHeading')}
                    </h3>

                    {passwordMessage && (
                      <div
                        className={`p-md rounded-lg text-label-md font-semibold ${
                          passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-error-container/20 text-error border border-error/10'
                        }`}
                      >
                        {passwordMessage.text}
                      </div>
                    )}

                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm font-bold text-on-surface-variant">{tr('currentPasswordLabel')}</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full h-11 px-md rounded-lg border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm font-bold text-on-surface-variant">{tr('newPasswordLabel')}</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-11 px-md rounded-lg border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                        placeholder={tr('newPasswordPlaceholder')}
                      />
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm font-bold text-on-surface-variant">{tr('confirmNewPasswordLabel')}</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-11 px-md rounded-lg border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingPassword}
                      className="w-full h-11 bg-secondary text-on-secondary rounded-lg text-label-md font-bold shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-xs"
                    >
                      {submittingPassword ? tr('updatingPassword') : tr('updatePassword')}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
