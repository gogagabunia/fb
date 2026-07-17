'use client';

import { useEffect, useState } from 'react';
import { getFbConnectionStatus, saveFacebookSession, disconnectFacebookSession } from '../actions';

type Status = 'ACTIVE' | 'EXPIRED' | 'NONE';

/**
 * Facebook connection panel for the group owner. Private groups can only sync
 * once the owner has connected their Facebook session here.
 *
 * The session is captured client-side (companion extension → POST /api/fb-session,
 * or the paste fallback below) and stored AES-encrypted server-side. We never
 * display the stored cookies back.
 */
export default function FacebookConnect() {
  const [status, setStatus] = useState<Status>('NONE');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [cookieText, setCookieText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const s = await getFbConnectionStatus();
    setStatus(s.status);
    setSavedAt(s.savedAt ? new Date(s.savedAt).toLocaleDateString() : null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await saveFacebookSession(cookieText.trim());
    setSaving(false);
    if (res.success) {
      setCookieText('');
      setOpen(false);
      await refresh();
    } else {
      setMsg(res.error || 'Failed to save session.');
    }
  }

  async function handleDisconnect() {
    await disconnectFacebookSession();
    await refresh();
  }

  const badge = {
    ACTIVE: { label: 'Facebook connected', color: '#0a7d33', bg: '#e6f5eb' },
    EXPIRED: { label: 'Reconnect needed', color: '#b23c17', bg: '#fdeae2' },
    NONE: { label: 'Not connected', color: '#5f6368', bg: '#f1f3f4' },
  }[status];

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 20, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Facebook Connection</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5f6368' }}>
            Required to sync <strong>private</strong> groups. Public groups sync without it.
          </p>
        </div>
        {!loading && (
          <span style={{ background: badge.bg, color: badge.color, fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {badge.label}
          </span>
        )}
      </div>

      {status === 'ACTIVE' && savedAt && (
        <p style={{ fontSize: 12, color: '#5f6368', marginTop: 12 }}>Connected since {savedAt}.</p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => { setOpen(!open); setMsg(null); }}
          style={{ background: '#1877f2', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          {status === 'ACTIVE' ? 'Reconnect Facebook' : 'Connect Facebook'}
        </button>
        {status === 'ACTIVE' && (
          <button
            onClick={handleDisconnect}
            style={{ background: '#fff', color: '#b23c17', border: '1px solid #e0c0b5', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            Disconnect
          </button>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <p style={{ fontSize: 13, color: '#3c4043', margin: '0 0 8px' }}>
            Paste your Facebook session cookies (JSON export from a cookie-export
            extension while logged into facebook.com). This is stored encrypted and
            only used to read your groups.
          </p>
          <textarea
            value={cookieText}
            onChange={(e) => setCookieText(e.target.value)}
            placeholder='[{"name":"c_user","value":"..."},{"name":"xs","value":"..."}, ...]'
            rows={5}
            style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: 12, padding: 10, borderRadius: 8, border: '1px solid #dadce0', resize: 'vertical' }}
          />
          {msg && <p style={{ color: '#b23c17', fontSize: 13, margin: '8px 0 0' }}>{msg}</p>}
          <div style={{ marginTop: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving || !cookieText.trim()}
              style={{ background: saving ? '#9bbcf0' : '#1877f2', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 14, cursor: saving ? 'default' : 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
