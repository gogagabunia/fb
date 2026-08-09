/**
 * Login + register page translations. Same shape as the welcome-page
 * dictionary in lib/i18n.ts — flat keys, Georgian first.
 */

import type { Lang } from '../i18n';

export const authStrings = {
  // Shared
  genericError: {
    ka: 'რაღაც შეცდომა მოხდა. სცადე თავიდან.',
    en: 'Something went wrong. Please try again.',
  },
  emailLabel: {
    ka: 'ელფოსტა',
    en: 'Email Address',
  },
  emailLabelRequired: {
    ka: 'ელფოსტა *',
    en: 'Email Address *',
  },
  passwordLabel: {
    ka: 'პაროლი',
    en: 'Password',
  },
  passwordLabelRequired: {
    ka: 'პაროლი *',
    en: 'Password *',
  },

  // Login page
  headerCreateAccount: {
    ka: 'ანგარიშის შექმნა',
    en: 'Create Account',
  },
  welcomeBack: {
    ka: 'კეთილი იყოს დაბრუნება',
    en: 'Welcome Back',
  },
  loginSubtitle: {
    ka: 'შედი შენს GroupMarket გამყიდველის პორტალში',
    en: 'Sign in to your GroupMarket seller portal',
  },
  signIn: {
    ka: 'შესვლა',
    en: 'Sign In',
  },
  signingIn: {
    ka: 'შესვლა მიმდინარეობს...',
    en: 'Signing in...',
  },
  noAccount: {
    ka: 'არ გაქვს ანგარიში?',
    en: "Don't have an account?",
  },
  createOneFree: {
    ka: 'შექმენი უფასოდ',
    en: 'Create one for free',
  },

  // Register page
  headerSignIn: {
    ka: 'შესვლა',
    en: 'Sign In',
  },
  createAccountTitle: {
    ka: 'ანგარიშის შექმნა',
    en: 'Create Account',
  },
  registerSubtitle: {
    ka: 'აქციე შენი Facebook ჯგუფები პრემიუმ მარკეტპლეისად',
    en: 'Start turning your Facebook groups into premium marketplaces',
  },
  whatBringsYou: {
    ka: 'რისთვის მოხვედი? *',
    en: 'What brings you here? *',
  },
  wantToBuy: {
    ka: 'მინდა ვიყიდო',
    en: 'I want to buy',
  },
  wantToBuyDesc: {
    ka: 'დაათვალიერე განცხადებები და შეინახე ფავორიტები',
    en: 'Browse listings and save favorites',
  },
  wantToSell: {
    ka: 'მინდა გავყიდო',
    en: 'I want to sell',
  },
  wantToSellDesc: {
    ka: 'გადმოიტანე განცხადებები შენი Facebook ჯგუფიდან',
    en: 'Import listings from my Facebook group',
  },
  firstNameLabel: {
    ka: 'სახელი *',
    en: 'First Name *',
  },
  firstNamePlaceholder: {
    ka: 'გიორგი',
    en: 'John',
  },
  lastNameLabel: {
    ka: 'გვარი',
    en: 'Last Name',
  },
  lastNamePlaceholder: {
    ka: 'ბერიძე',
    en: 'Doe',
  },
  passwordMinPlaceholder: {
    ka: 'მინ. 6 სიმბოლო',
    en: 'Min. 6 characters',
  },
  confirmPasswordLabel: {
    ka: 'გაიმეორე პაროლი *',
    en: 'Confirm Password *',
  },
  confirmPasswordPlaceholder: {
    ka: 'გაიმეორე პაროლი',
    en: 'Repeat your password',
  },
  createAccountButton: {
    ka: 'ანგარიშის შექმნა',
    en: 'Create Account',
  },
  creatingAccount: {
    ka: 'ანგარიში იქმნება...',
    en: 'Creating account...',
  },
  alreadyHaveAccount: {
    ka: 'უკვე გაქვს ანგარიში?',
    en: 'Already have an account?',
  },
  signInHere: {
    ka: 'შედი აქ',
    en: 'Sign in here',
  },
  passwordTooShort: {
    ka: 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო.',
    en: 'Password must be at least 6 characters.',
  },
  passwordsDoNotMatch: {
    ka: 'პაროლები არ ემთხვევა.',
    en: 'Passwords do not match.',
  },
} as const satisfies Record<string, Record<Lang, string>>;
