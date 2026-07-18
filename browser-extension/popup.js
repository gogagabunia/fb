const btn = document.getElementById('connect');
const statusEl = document.getElementById('status');
const appUrlInput = document.getElementById('appUrl');

function show(kind, msg) {
  statusEl.className = kind;
  statusEl.textContent = msg;
}

btn.addEventListener('click', async () => {
  const appUrl = appUrlInput.value.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//.test(appUrl)) {
    show('err', 'Enter a valid GroupMarket URL (https://…).');
    return;
  }

  btn.disabled = true;
  show('info', 'Reading your Facebook session…');

  try {
    // 1. The app session token (proves which GroupMarket account to attach to).
    //    chrome.cookies can read httpOnly cookies; the plain fetch below could not.
    const appCookie = await chrome.cookies.get({ url: appUrl, name: 'groupmarket_session' });
    if (!appCookie || !appCookie.value) {
      show('err', 'You are not logged into GroupMarket in this browser. Open ' + appUrl + ', log in, then try again.');
      btn.disabled = false;
      return;
    }

    // 2. All facebook.com cookies for the logged-in account.
    const fbCookies = await chrome.cookies.getAll({ domain: 'facebook.com' });
    const cookies = fbCookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      secure: c.secure,
      httpOnly: c.httpOnly,
    }));

    const hasSession = cookies.some((c) => c.name === 'c_user') && cookies.some((c) => c.name === 'xs');
    if (!hasSession) {
      show('err', 'No Facebook login found. Open facebook.com and log in first, then try again.');
      btn.disabled = false;
      return;
    }

    show('info', 'Sending ' + cookies.length + ' cookies to GroupMarket…');

    // 3. POST to the app, authenticated with the app session token.
    const res = await fetch(appUrl + '/api/fb-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + appCookie.value,
      },
      body: JSON.stringify({ cookies }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      show('ok', '✓ Facebook connected to GroupMarket! You can close this and sync your groups.');
    } else {
      show('err', data.error || ('Failed (HTTP ' + res.status + ').'));
    }
  } catch (e) {
    show('err', 'Error: ' + (e && e.message ? e.message : String(e)));
  } finally {
    btn.disabled = false;
  }
});
