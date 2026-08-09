import Link from 'next/link';
import { cookies } from 'next/headers';
import { getCurrentUser } from '../auth-actions';
import Sidebar from '../components/sidebar';
import { getLang, makeT, LANG_COOKIE } from '../lib/i18n';
import { miscStrings } from '../lib/i18n/misc';

export async function generateMetadata() {
  const lang = getLang((await cookies()).get(LANG_COOKIE)?.value);
  return { title: miscStrings.cfMetaTitle[lang] };
}

export default async function ConnectFacebookPage() {
  const lang = getLang((await cookies()).get(LANG_COOKIE)?.value);
  const tr = makeT(miscStrings, lang);
  const user = await getCurrentUser();

  const steps = [
    { title: tr('cfStep1Title'), body: tr('cfStep1Body') },
    { title: tr('cfStep2Title'), body: tr('cfStep2Body') },
    { title: tr('cfStep3Title'), body: tr('cfStep3Body') },
    { title: tr('cfStep4Title'), body: tr('cfStep4Body') },
    { title: tr('cfStep5Title'), body: tr('cfStep5Body') },
    { title: tr('cfStep6Title'), body: tr('cfStep6Body') }
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        <Sidebar activePage="settings" user={user} />

        <main className="flex-grow p-md md:p-xl overflow-y-auto max-w-container-max h-full">
          <header className="border-b border-outline-variant/20 pb-md mb-xl">
            <h1 className="text-display-lg font-bold text-primary">{tr('cfTitle')}</h1>
            <p className="text-body-lg text-on-surface-variant mt-xs max-w-2xl">
              {tr('cfIntro')}
            </p>
          </header>

          {/* Download */}
          <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-xl mb-xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-md justify-between">
              <div>
                <h2 className="text-title-lg font-bold text-primary">GroupMarket Connector</h2>
                <p className="text-body-sm text-on-surface-variant mt-xs">
                  {tr('cfBrowsers')}
                </p>
              </div>
              <a
                href="/groupmarket-connector.zip"
                download
                className="bg-primary text-on-primary px-xl py-md rounded-xl font-bold text-label-md shadow-md hover:shadow-lg transition-all active:scale-95 text-center whitespace-nowrap"
              >
                {tr('cfDownload')}
              </a>
            </div>

            {/* Chrome removed inline installation in 2018, so a site cannot install
                an extension for the user. Saying so is better than a button that
                cannot do what its label implies. */}
            <p className="text-body-xs text-on-surface-variant mt-lg border-t border-outline-variant/20 pt-md">
              {tr('cfNoInlineInstall')}
            </p>
          </section>

          {/* Steps */}
          <section className="mb-xl">
            <h2 className="text-title-lg font-bold text-primary mb-md">{tr('cfInstalling')}</h2>
            <ol className="space-y-md">
              {steps.map((step, i) => (
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
            <h2 className="text-title-lg font-bold text-primary mb-sm">{tr('cfAccessTitle')}</h2>
            <ul className="text-body-sm text-on-surface-variant space-y-xs list-disc pl-lg">
              <li>{tr('cfAccessCookies')}</li>
              <li>{tr('cfAccessSession')}</li>
            </ul>
            <p className="text-body-sm text-on-surface-variant mt-md">
              {tr('cfAccessNote')}{' '}
              <Link href="/settings" className="text-primary underline font-semibold">
                {tr('cfSettingsLink')}
              </Link>
              .
            </p>
          </section>

          {/* The honest caveat */}
          <section className="border border-amber-300 bg-amber-50 rounded-xl p-xl mb-xl">
            <h2 className="text-title-md font-bold text-amber-900 mb-sm">{tr('cfCaveatTitle')}</h2>
            <p className="text-body-sm text-amber-900">
              {tr('cfCaveatBody')}
            </p>
          </section>

          <div className="flex gap-md flex-wrap pb-xl">
            <Link
              href="/settings"
              className="bg-primary text-on-primary px-xl py-md rounded-xl font-bold text-label-md shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              {tr('cfCheckStatus')}
            </Link>
            <Link
              href="/dashboard"
              className="bg-surface-container-high text-primary px-xl py-md rounded-xl font-bold text-label-md hover:bg-surface-container-highest transition-all"
            >
              {tr('cfBackToDashboard')}
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
