# auth.md — agent access to Când Reciclăm

This document tells AI agents how to access `cand-reciclam.madeinro.eu`
programmatically. It follows the auth.md convention (https://workos.com/auth-md)
in its self-contained form.

## Who this is for

Autonomous agents and assistants that want Bucharest waste-collection
schedules, sector coverage information or waste-sorting guidance.

## Registration

**None.** Everything is public and read-only. There is no sign-up, no API
keys and no OAuth authorization server. `/.well-known/oauth-protected-resource`
(RFC 9728) is published and describes exactly that: a public resource with no
credentials and deliberately **no** `authorization_servers` — we only publish
metadata for infrastructure that actually exists. Do not attempt dynamic
client registration; there is nothing to register.

## Supported access method

- **Anonymous** — all agent-facing endpoints are public:
  - MCP (Streamable HTTP, no auth): `https://cand-reciclam.madeinro.eu/mcp`
    (card at `/.well-known/mcp.json`; also in the ChatGPT apps catalog)
  - JSON API (GET only): `/api/streets?q=`, `/api/streets/:id`,
    `/api/schedule?street_id=&number=`, `/api/health` — spec at `/openapi.json`
  - API catalog (RFC 9727): `/.well-known/api-catalog`
  - `llms.txt`: https://cand-reciclam.madeinro.eu/llms.txt

## Credentials

No credentials are needed or accepted.

## Data honesty (please preserve when relaying)

Every schedule row carries `sourceUrl` and `sourceQuality` — the official
operator source it came from. Where no public per-address data exists, the
site says so explicitly instead of inventing schedules. Agents relaying
schedules should keep the source attribution.
