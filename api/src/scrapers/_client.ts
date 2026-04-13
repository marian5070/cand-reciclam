import got, { type OptionsOfTextResponseBody } from 'got';
import { CookieJar } from 'tough-cookie';

export const UA = 'CandReciclamBot/0.1 (+https://cand-reciclam.madeinro.eu; informational)';

export function makeClient() {
  const cookieJar = new CookieJar();
  const client = got.extend({
    cookieJar,
    headers: { 'user-agent': UA },
    retry: { limit: 2, methods: ['GET', 'POST'] },
    timeout: { request: 15_000 },
    followRedirect: true,
  } as OptionsOfTextResponseBody);
  return { client, cookieJar };
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
