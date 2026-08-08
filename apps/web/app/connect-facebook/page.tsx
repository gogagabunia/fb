import Link from 'next/link';
import { getCurrentUser } from '../auth-actions';
import Sidebar from '../components/sidebar';

export const metadata = {
  title: 'Connect Facebook — GroupMarket'
};

const STEPS = [
  {
    title: 'Download and unzip',
    body: 'Use the button above, then unzip it. You should end up with a folder containing manifest.json.'
  },
  {
    title: 'Open your browser’s extensions page',
    body: 'Type chrome://extensions in the address bar (edge://extensions on Edge, brave://extensions on Brave) and press Enter.'
  },
  {
    title: 'Turn on Developer mode',
    body: 'The toggle is in the top-right corner of that page.'
  },
  {
    title: 'Click "Load unpacked"',
    body: 'Select the unzipped folder — the one with manifest.json directly inside it, not its parent.'
  },
  {
    title: 'Log into Facebook in the same browser',
    body: 'The extension reads the session you already have. If you are not logged in, it has nothing to send.'
  },
  {
    title: 'Click the extension icon, then "Connect this Facebook account"',
    body: 'Come back here and your status will show as connected.'
  }
];

export default async function ConnectFacebookPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        <Sidebar activePage="settings" user={user} />

        <main className="flex-grow p-md md:p-xl overflow-y-auto max-w-container-max h-full">
          <header className="border-b border-outline-variant/20 pb-md mb-xl">
            <h1 className="text-display-lg font-bold text-primary">Connect Facebook</h1>
            <p className="text-body-lg text-on-surface-variant mt-xs max-w-2xl">
              Syncing a group needs a logged-in Facebook session. The GroupMarket Connector
              extension attaches yours in one click — no password, no copying cookies by hand.
            </p>
          </header>

          {/* Download */}
          <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-xl mb-xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-md justify-between">
              <div>
                <h2 className="text-title-lg font-bold text-primary">GroupMarket Connector</h2>
                <p className="text-body-sm text-on-surface-variant mt-xs">
                  Chrome, Edge, Brave and Opera. Not Firefox — it uses a different extension API.
                </p>
              </div>
              <a
                href="/groupmarket-connector.zip"
                download
                className="bg-primary text-on-primary px-xl py-md rounded-xl font-bold text-label-md shadow-md hover:shadow-lg transition-all active:scale-95 text-center whitespace-nowrap"
              >
                Download extension
              </a>
            </div>

            {/* Chrome removed inline installation in 2018, so a site cannot install
                an extension for the user. Saying so is better than a button that
                cannot do what its label implies. */}
            <p className="text-body-xs text-on-surface-variant mt-lg border-t border-outline-variant/20 pt-md">
              Browsers do not allow a website to install an extension directly — that was removed
              from Chrome in 2018. The six steps below are the manual route, and they take about a
              minute.
            </p>
          </section>

          {/* Steps */}
          <section className="mb-xl">
            <h2 className="text-title-lg font-bold text-primary mb-md">Installing it</h2>
            <ol className="space-y-md">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-md bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg"
                >
                  <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center text-label-sm">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-body-lg text-primary">{step.title}</h3>
                    <p className="text-body-sm text-on-surface-variant mt-xs">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* What it can see */}
          <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-xl mb-xl">
            <h2 className="text-title-lg font-bold text-primary mb-sm">What it can access</h2>
            <ul className="text-body-sm text-on-surface-variant space-y-xs list-disc pl-lg">
              <li>Your facebook.com cookies — the session that proves you are logged in.</li>
              <li>Your GroupMarket session cookie, so it knows which account to attach them to.</li>
            </ul>
            <p className="text-body-sm text-on-surface-variant mt-md">
              It never sees your Facebook password. The session is encrypted before it is stored and
              is never shown back to you or anyone else. You can revoke it any time from{' '}
              <Link href="/settings" className="text-primary underline font-semibold">
                Settings
              </Link>
              .
            </p>
          </section>

          {/* The honest caveat */}
          <section className="border border-amber-300 bg-amber-50 rounded-xl p-xl mb-xl">
            <h2 className="text-title-md font-bold text-amber-900 mb-sm">Worth knowing</h2>
            <p className="text-body-sm text-amber-900">
              Reading group posts with a member&apos;s session goes against Facebook&apos;s terms of
              service, and accounts doing it can be restricted. The extension does not change that
              risk — it only makes attaching the session easier. Consider using an account you can
              afford to lose access to.
            </p>
          </section>

          <div className="flex gap-md flex-wrap pb-xl">
            <Link
              href="/settings"
              className="bg-primary text-on-primary px-xl py-md rounded-xl font-bold text-label-md shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              Check connection status
            </Link>
            <Link
              href="/dashboard"
              className="bg-surface-container-high text-primary px-xl py-md rounded-xl font-bold text-label-md hover:bg-surface-container-highest transition-all"
            >
              Back to dashboard
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
