// Polls camera state every 2s to observe position changes.
// Usage: node scripts/poll-camera-state.mjs

import keytar from 'keytar';
import { CookieJar } from 'tough-cookie';
import fetchCookie from 'fetch-cookie';

const SERVICE_NAME = 'SmartHomeControlApp';
const ACCOUNT_NAME_X_TOKEN = 'YandexXToken';
const DEVICE_ID = '348b6d71-3297-40d1-906e-56c0559a91c8';

const getSession = async (xToken) => {
    const jar = new CookieJar();
    const f = fetchCookie(fetch, jar);

    const auth = await fetch('https://mobileproxy.passport.yandex.net/1/bundle/auth/x_token/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Ya-Consumer-Authorization': `OAuth ${xToken}`,
        },
        body: 'type=x-token&retpath=https%3A%2F%2Fiot.quasar.yandex.ru',
    });
    const authData = await auth.json();
    if (!authData.status || authData.status === 'error') {
        throw new Error('Auth failed: ' + JSON.stringify(authData));
    }

    // Get CSRF token
    const page = await f('https://iot.quasar.yandex.ru/m/user/devices');
    const html = await page.text();
    const csrfMatch = html.match(/"csrfToken2":"(.+?)"/);
    const csrf = csrfMatch?.[1];

    return { fetch: f, csrf };
};

const getDevice = async (session) => {
    const res = await session.fetch(`https://iot.quasar.yandex.ru/m/v3/user/devices`);
    if (!res.ok) return null;
    const data = await res.json();
    for (const house of data.households ?? []) {
        const dev = (house.all ?? []).find(d => d.id === DEVICE_ID);
        if (dev) return dev;
    }
    return null;
};

const extractPtz = (dev) => {
    if (!dev) return null;
    const caps = dev.capabilities ?? [];
    return caps
        .filter(c => c.type === 'devices.capabilities.range' &&
            ['camera_pan', 'camera_tilt'].includes(c.parameters?.instance))
        .map(c => `${c.parameters.instance}=${JSON.stringify(c.state)}`);
};

console.log('Loading x-token from keytar...');
const xToken = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME_X_TOKEN);
if (!xToken) { console.error('X_TOKEN not found'); process.exit(1); }

console.log('Authenticating Quasar session...');
const session = await getSession(xToken.trim());
console.log('Session ready. Polling camera state every 2s (Ctrl+C to stop)...\n');

let prev = null;
while (true) {
    try {
        const dev = await getDevice(session);
        const ptz = extractPtz(dev);
        const str = JSON.stringify(ptz);
        if (str !== prev) {
            console.log(new Date().toISOString(), '→', ptz ?? 'null');
            prev = str;
        }
    } catch (e) {
        console.error('Poll error:', e.message);
    }
    await new Promise(r => setTimeout(r, 2000));
}
