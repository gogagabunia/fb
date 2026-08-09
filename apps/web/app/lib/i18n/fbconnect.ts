import type { Lang } from '../i18n';

export const fbConnectStrings = {
  title: { ka: 'Facebook-ის კავშირი', en: 'Facebook Connection' },
  subtitleBefore: { ka: 'საჭიროა', en: 'Required to sync' },
  subtitlePrivate: { ka: 'დახურული', en: 'private' },
  subtitleAfter: {
    ka: 'ჯგუფების სინქრონიზაციისთვის. ღია ჯგუფები უამისოდაც სინქრონდება.',
    en: 'groups. Public groups sync without it.',
  },
  badgeActive: { ka: 'Facebook დაკავშირებულია', en: 'Facebook connected' },
  badgeExpired: { ka: 'საჭიროა ხელახლა დაკავშირება', en: 'Reconnect needed' },
  badgeNone: { ka: 'არ არის დაკავშირებული', en: 'Not connected' },
  connectedSince: { ka: 'დაკავშირებულია {date}-დან.', en: 'Connected since {date}.' },
  reconnect: { ka: 'ხელახლა დააკავშირე Facebook', en: 'Reconnect Facebook' },
  connect: { ka: 'დააკავშირე Facebook', en: 'Connect Facebook' },
  disconnect: { ka: 'გათიშვა', en: 'Disconnect' },
  extensionEasier: { ka: 'უფრო მარტივად: გამოიყენე ბრაუზერის გაფართოება', en: 'Easier: use the browser extension' },
  extensionDesc: {
    ka: 'ერთი დაჭერა, კოპირების გარეშე. გამართვას დაახლოებით ერთი წუთი სჭირდება.',
    en: 'One click, no copying. Takes about a minute to set up.',
  },
  extensionLink: { ka: 'ჩამოტვირთვა და ინსტალაციის ინსტრუქცია →', en: 'Download and install instructions →' },
  pasteHelp: {
    ka: 'ან ხელით ჩასვი Facebook-ის სესიის ქუქები (JSON ექსპორტი cookie-export გაფართოებიდან, facebook.com-ზე შესული). ინახება დაშიფრულად და გამოიყენება მხოლოდ შენი ჯგუფების წასაკითხად.',
    en: 'Or paste your Facebook session cookies by hand (JSON export from a cookie-export extension while logged into facebook.com). Stored encrypted and only used to read your groups.',
  },
  saveFailed: { ka: 'სესიის შენახვა ვერ მოხერხდა.', en: 'Failed to save session.' },
  saving: { ka: 'ინახება…', en: 'Saving…' },
  saveSession: { ka: 'სესიის შენახვა', en: 'Save session' },
} as const satisfies Record<string, Record<Lang, string>>;
