---
name: query-cand-reciclam
description: Query Când Reciclăm (cand-reciclam.madeinro.eu) — Bucharest waste-collection schedules built exclusively from official operator sources — via the public MCP server (also in the ChatGPT apps catalog), the read-only JSON API or in-browser WebMCP tools. Use for "when is recycling collected at address X" and waste-sorting questions.
---

# Query Când Reciclăm — Bucharest waste-collection schedules

Per-address waste-collection schedules for Bucharest, built exclusively from
official operator sources (Romprest, Rebu, Supercom…). Editorial contract:
every schedule carries its official `sourceUrl` + `sourceQuality`; where no
public per-address data exists, the site says so explicitly instead of
inventing schedules. Agent access guide: `/auth.md`.

## Option 1 — MCP server (public, no auth; in the ChatGPT apps catalog)

Streamable HTTP endpoint: `https://cand-reciclam.madeinro.eu/mcp`.
Card: `/.well-known/mcp.json`.

| Tool | Purpose |
|---|---|
| `recycling_search_street` | Find a street and its id |
| `recycling_collection_schedule` | Schedules for a street/number, with source attribution |
| `recycling_sector_status` | Per-sector coverage and data-quality status |
| `recycling_sorting_guide` | What goes in which bin + special disposal points |
| `recycling_freshness` | When the data was last verified |

## Option 2 — read-only JSON API

Spec: `https://cand-reciclam.madeinro.eu/openapi.json`. Endpoints:
`GET /api/streets?q=`, `GET /api/streets/{id}`,
`GET /api/schedule?street_id=&number=`, `GET /api/health`.
Catalog (RFC 9727): `/.well-known/api-catalog`.

## In-browser (WebMCP)

Pages register `recycling_site_*` tools via `navigator.modelContext`
(Chrome origin trial), reading the same API and data snapshots the UI uses.

## Honesty notes

- Schedules follow RFC 5545 RRULEs; `overrideDates` take precedence when the
  operator announces exceptions.
- The status enum for sectors is honest about gaps: `per-address`, `partial`,
  `frequency-only`, `transition`, `via-partner`, `no-public-data`.
- Preserve `sourceUrl` attribution when relaying schedules to users.
