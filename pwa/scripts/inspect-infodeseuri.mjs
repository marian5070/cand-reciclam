import { chromium } from 'playwright';

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

// Intercept Firestore requests
const firestoreRequests = [];
page.on('request', (req) => {
  const url = req.url();
  if (url.includes('firestore') || url.includes('firebaseio')) {
    firestoreRequests.push({ method: req.method(), url: url.slice(0, 200) });
  }
});

page.on('response', async (res) => {
  const url = res.url();
  if (url.includes('firestore.googleapis.com') && res.ok()) {
    try {
      const text = (await res.text()).slice(0, 2000);
      console.log('\n--- FIRESTORE RESPONSE ---');
      console.log(url.slice(0, 200));
      console.log(text);
    } catch {}
  }
});

await page.goto('https://calendar.infodeseuri.ro/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);

// Try interacting — search for Bucharest / Sector 6
const content = await page.content();
console.log('\n=== Page text mentions ===');
const relevant = content.match(/(Bucur|Sector [1-6]|URBAN|Romprest|Supercom|Salubr)[^<]{0,60}/gi) || [];
[...new Set(relevant)].slice(0, 20).forEach((s) => console.log(' ', s));

console.log(`\n=== ${firestoreRequests.length} Firestore requests ===`);
firestoreRequests.slice(0, 10).forEach((r) => console.log(' ', r.method, r.url));

await b.close();
