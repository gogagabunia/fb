/**
 * Translations for the error boundary, not-found page, and connect-facebook
 * page. Same shape as the welcome-page dictionary in lib/i18n.ts — flat keys,
 * Georgian first.
 */

import type { Lang } from '../i18n';

export const miscStrings = {
  // Shared chrome (error + not-found)
  browseMarketplace: {
    ka: 'მარკეტპლეისის დათვალიერება',
    en: 'Browse Marketplace',
  },
  footerRights: {
    ka: '© {year} GroupMarket Inc. ყველა უფლება დაცულია.',
    en: '© {year} GroupMarket Inc. All rights reserved.',
  },

  // Error boundary
  errorTitle: {
    ka: 'რაღაც შეცდომა მოხდა',
    en: 'Something went wrong',
  },
  errorBody: {
    ka: 'მოთხოვნის დამუშავებისას მოულოდნელი შეცდომა მოხდა. არ ინერვიულო — შენი მონაცემები უსაფრთხოდაა.',
    en: "An unexpected application error occurred while processing your request. Don't worry, your data is safe.",
  },
  tryAgain: {
    ka: 'თავიდან ცდა',
    en: 'Try Again',
  },
  goHome: {
    ka: 'მთავარზე დაბრუნება',
    en: 'Go Home',
  },
  techDetails: {
    ka: 'ტექნიკური დეტალები (ადმინისტრატორებისთვის)',
    en: 'Technical Details (for administrators)',
  },
  errorNameLabel: {
    ka: 'შეცდომის სახელი:',
    en: 'Error Name:',
  },
  runtimeErrorFallback: {
    ka: 'გაშვების შეცდომა',
    en: 'Runtime Error',
  },
  messageLabel: {
    ka: 'შეტყობინება:',
    en: 'Message:',
  },
  noMessageFallback: {
    ka: 'აღწერითი შეტყობინება არ არის.',
    en: 'No descriptive message provided.',
  },
  errorFooterNote: {
    ka: 'შეცდომა ლოკალურად დაფიქსირდა. თუ პრობლემა გაგრძელდა, დაუკავშირდი GroupMarket-ის მხარდაჭერას ზემოთ მოცემული დეტალებით.',
    en: 'The error was captured locally. If this persists, please contact GroupMarket customer support with the above details.',
  },

  // Not-found page
  nfTitle: {
    ka: 'გზა აგებნა?',
    en: 'Lost in the Grid?',
  },
  nfBody: {
    ka: 'ვერ ვიპოვეთ გვერდი ან განცხადება, რომელსაც ეძებდი. შესაძლოა გადატანილი, დაარქივებული ან წაშლილია.',
    en: "We couldn't find the page or listing you were searching for. It may have been relocated, archived, or deleted.",
  },
  nfHelperTitle: {
    ka: 'ნავიგაციის დამხმარე',
    en: 'Navigation Helper',
  },
  nfHelperBody: {
    ka: 'აი, რამდენიმე სწრაფი გზა, რომ სწორ გზაზე დაბრუნდე:',
    en: 'Here are some quick shortcuts to get you back on track:',
  },
  nfMarketplace: {
    ka: 'მარკეტპლეისი',
    en: 'Marketplace',
  },
  nfMarketplaceDesc: {
    ka: 'დაათვალიერე დამტკიცებული განცხადებები',
    en: 'Browse approved listings',
  },
  nfDashboard: {
    ka: 'გამყიდველის დაფა',
    en: 'Seller Dashboard',
  },
  nfDashboardDesc: {
    ka: 'მართე სინქრონიზაციები და ლოგები',
    en: 'Manage syncs & logs',
  },
  nfGoHome: {
    ka: 'მთავარ გვერდზე დაბრუნება',
    en: 'Go to Home Page',
  },

  // Connect Facebook page
  cfMetaTitle: {
    ka: 'Facebook-ის დაკავშირება — GroupMarket',
    en: 'Connect Facebook — GroupMarket',
  },
  cfTitle: {
    ka: 'Facebook-ის დაკავშირება',
    en: 'Connect Facebook',
  },
  cfIntro: {
    ka: 'ჯგუფის სინქრონიზაციას სჭირდება Facebook-ის აქტიური სესია. GroupMarket Connector გაფართოება შენსას ერთი დაჭერით აბამს — პაროლისა და ქუქიების ხელით კოპირების გარეშე.',
    en: 'Syncing a group needs a logged-in Facebook session. The GroupMarket Connector extension attaches yours in one click — no password, no copying cookies by hand.',
  },
  cfBrowsers: {
    ka: 'მუშაობს Chrome-ზე, Edge-ზე, Brave-სა და Opera-ზე. Firefox-ზე — არა, ის სხვა გაფართოების API-ს იყენებს.',
    en: 'Chrome, Edge, Brave and Opera. Not Firefox — it uses a different extension API.',
  },
  cfDownload: {
    ka: 'გაფართოების ჩამოტვირთვა',
    en: 'Download extension',
  },
  cfNoInlineInstall: {
    ka: 'ბრაუზერები საიტს გაფართოების პირდაპირ დაყენების უფლებას არ აძლევენ — Chrome-მა ეს 2018 წელს გააუქმა. ქვემოთ მოცემული ექვსი ნაბიჯი ხელით გასავლელი გზაა და დაახლოებით ერთი წუთი სჭირდება.',
    en: 'Browsers do not allow a website to install an extension directly — that was removed from Chrome in 2018. The six steps below are the manual route, and they take about a minute.',
  },
  cfInstalling: {
    ka: 'დაყენება',
    en: 'Installing it',
  },
  cfStep1Title: {
    ka: 'ჩამოტვირთე და ამოაარქივე',
    en: 'Download and unzip',
  },
  cfStep1Body: {
    ka: 'გამოიყენე ზემოთ მოცემული ღილაკი და ამოაარქივე ფაილი. უნდა მიიღო საქაღალდე, რომელშიც manifest.json დევს.',
    en: 'Use the button above, then unzip it. You should end up with a folder containing manifest.json.',
  },
  cfStep2Title: {
    ka: 'გახსენი ბრაუზერის გაფართოებების გვერდი',
    en: 'Open your browser’s extensions page',
  },
  cfStep2Body: {
    ka: 'მისამართის ველში აკრიფე chrome://extensions (Edge-ზე — edge://extensions, Brave-ზე — brave://extensions) და დააჭირე Enter-ს.',
    en: 'Type chrome://extensions in the address bar (edge://extensions on Edge, brave://extensions on Brave) and press Enter.',
  },
  cfStep3Title: {
    ka: 'ჩართე დეველოპერის რეჟიმი (Developer mode)',
    en: 'Turn on Developer mode',
  },
  cfStep3Body: {
    ka: 'გადამრთველი ამ გვერდის ზედა მარჯვენა კუთხეშია.',
    en: 'The toggle is in the top-right corner of that page.',
  },
  cfStep4Title: {
    ka: 'დააჭირე "Load unpacked"-ს',
    en: 'Click "Load unpacked"',
  },
  cfStep4Body: {
    ka: 'აირჩიე ამოარქივებული საქაღალდე — ის, რომელშიც manifest.json პირდაპირ დევს, და არა მისი მშობელი საქაღალდე.',
    en: 'Select the unzipped folder — the one with manifest.json directly inside it, not its parent.',
  },
  cfStep5Title: {
    ka: 'შედი Facebook-ზე იმავე ბრაუზერში',
    en: 'Log into Facebook in the same browser',
  },
  cfStep5Body: {
    ka: 'გაფართოება კითხულობს სესიას, რომელიც უკვე გაქვს. თუ შესული არ ხარ, გასაგზავნი არაფერი აქვს.',
    en: 'The extension reads the session you already have. If you are not logged in, it has nothing to send.',
  },
  cfStep6Title: {
    ka: 'დააჭირე გაფართოების ხატულას, შემდეგ — "Connect this Facebook account"-ს',
    en: 'Click the extension icon, then "Connect this Facebook account"',
  },
  cfStep6Body: {
    ka: 'დაბრუნდი აქ და შენი სტატუსი დაკავშირებულად გამოჩნდება.',
    en: 'Come back here and your status will show as connected.',
  },
  cfAccessTitle: {
    ka: 'რაზე აქვს წვდომა',
    en: 'What it can access',
  },
  cfAccessCookies: {
    ka: 'შენი facebook.com ქუქიები — სესია, რომელიც ადასტურებს, რომ შესული ხარ.',
    en: 'Your facebook.com cookies — the session that proves you are logged in.',
  },
  cfAccessSession: {
    ka: 'შენი GroupMarket სესიის ქუქი, რომ იცოდეს, რომელ ანგარიშს მიაბას ისინი.',
    en: 'Your GroupMarket session cookie, so it knows which account to attach them to.',
  },
  cfAccessNote: {
    ka: 'ის ვერასდროს ხედავს შენს Facebook პაროლს. სესია შენახვამდე იშიფრება და აღარასდროს ჩანს — არც შენთვის, არც სხვისთვის. გაუქმება ნებისმიერ დროს შეგიძლია აქედან:',
    en: 'It never sees your Facebook password. The session is encrypted before it is stored and is never shown back to you or anyone else. You can revoke it any time from',
  },
  cfSettingsLink: {
    ka: 'პარამეტრები',
    en: 'Settings',
  },
  cfCaveatTitle: {
    ka: 'გაითვალისწინე',
    en: 'Worth knowing',
  },
  cfCaveatBody: {
    ka: 'წევრის სესიით ჯგუფის პოსტების წაკითხვა ეწინააღმდეგება Facebook-ის მოხმარების წესებს და ასეთი ანგარიშები შეიძლება შეიზღუდოს. გაფართოება ამ რისკს არ ცვლის — ის მხოლოდ სესიის მიბმას ამარტივებს. იფიქრე ისეთი ანგარიშის გამოყენებაზე, რომლის დაკარგვასაც გადაიტან.',
    en: "Reading group posts with a member's session goes against Facebook's terms of service, and accounts doing it can be restricted. The extension does not change that risk — it only makes attaching the session easier. Consider using an account you can afford to lose access to.",
  },
  cfCheckStatus: {
    ka: 'შეამოწმე კავშირის სტატუსი',
    en: 'Check connection status',
  },
  cfBackToDashboard: {
    ka: 'დაფაზე დაბრუნება',
    en: 'Back to dashboard',
  },
} as const satisfies Record<string, Record<Lang, string>>;
