/**
 * Settings page translations. Same shape as the welcome-page dictionary in
 * lib/i18n.ts — flat keys, Georgian first.
 */

import type { Lang } from '../i18n';

export const settingsStrings = {
  title: {
    ka: 'ანგარიშის პარამეტრები',
    en: 'Account Settings',
  },
  subtitle: {
    ka: 'მართე შენი მონაცემები, შესვლის პაროლი და პარამეტრები.',
    en: 'Manage your user details, login security credentials, and preferences.',
  },

  // Profile form
  profileHeading: {
    ka: 'პროფილის განახლება',
    en: 'Update Profile Info',
  },
  firstNameLabel: {
    ka: 'სახელი',
    en: 'First Name',
  },
  firstNamePlaceholder: {
    ka: 'სახელი',
    en: 'First Name',
  },
  lastNameLabel: {
    ka: 'გვარი',
    en: 'Last Name',
  },
  lastNamePlaceholder: {
    ka: 'გვარი (არასავალდებულო)',
    en: 'Last Name (Optional)',
  },
  emailLabel: {
    ka: 'ელფოსტა',
    en: 'Email Address',
  },
  emailNote: {
    ka: 'ელფოსტის შეცვლა უსაფრთხოების გამო შეუძლებელია.',
    en: 'Email cannot be modified for security.',
  },
  saveProfile: {
    ka: 'პროფილის შენახვა',
    en: 'Save Profile Details',
  },
  savingProfile: {
    ka: 'ინახება...',
    en: 'Saving Details...',
  },
  profileUpdated: {
    ka: 'პროფილი წარმატებით განახლდა!',
    en: 'Profile details updated successfully!',
  },
  profileUpdateFailed: {
    ka: 'პროფილის განახლება ვერ მოხერხდა.',
    en: 'Failed to update profile details.',
  },
  errorOccurred: {
    ka: 'მოხდა შეცდომა.',
    en: 'Error occurred.',
  },

  // Password form
  passwordHeading: {
    ka: 'პაროლის შეცვლა',
    en: 'Change Security Password',
  },
  currentPasswordLabel: {
    ka: 'მიმდინარე პაროლი',
    en: 'Current Password',
  },
  newPasswordLabel: {
    ka: 'ახალი პაროლი',
    en: 'New Password',
  },
  newPasswordPlaceholder: {
    ka: 'მინიმუმ 6 სიმბოლო',
    en: 'At least 6 characters',
  },
  confirmNewPasswordLabel: {
    ka: 'გაიმეორე ახალი პაროლი',
    en: 'Confirm New Password',
  },
  updatePassword: {
    ka: 'პაროლის განახლება',
    en: 'Update Password Credentials',
  },
  updatingPassword: {
    ka: 'პაროლი ახლდება...',
    en: 'Updating Password...',
  },
  passwordChanged: {
    ka: 'პაროლი წარმატებით შეიცვალა!',
    en: 'Password successfully changed!',
  },
  incorrectCurrentPassword: {
    ka: 'მიმდინარე პაროლი არასწორია.',
    en: 'Incorrect current password.',
  },
  newPasswordTooShort: {
    ka: 'ახალი პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო.',
    en: 'New password must be at least 6 characters.',
  },
  newPasswordsDoNotMatch: {
    ka: 'ახალი პაროლები არ ემთხვევა.',
    en: 'New passwords do not match.',
  },
} as const satisfies Record<string, Record<Lang, string>>;
