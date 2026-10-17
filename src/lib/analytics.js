// Lets Peyton keep their own devices out of Google Analytics. The switch on
// the admin dashboard saves a flag on the device, and the public pages skip
// loading Google Tag Manager wherever that flag is set.
// The flag is kept in both localStorage and a cookie, and rewritten on every
// visit: browsers cap cookie lifetimes (Chrome at 400 days), so refreshing it
// is what keeps it from ever lapsing while the device keeps visiting.

const KEY = 'chesto-no-analytics'
const MAX_AGE = 400 * 24 * 60 * 60

export function isAnalyticsOff() {
  let stored = false
  try { stored = localStorage.getItem(KEY) === '1' } catch { /* storage blocked */ }
  return stored || document.cookie.split('; ').includes(`${KEY}=1`)
}

export function setAnalyticsOff(off) {
  try {
    if (off) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch { /* storage blocked */ }
  document.cookie = `${KEY}=${off ? 1 : ''}; Max-Age=${off ? MAX_AGE : 0}; Path=/; SameSite=Lax; Secure`
}

// Refresh the flag (and restore whichever copy the browser cleared) on load
if (isAnalyticsOff()) setAnalyticsOff(true)
