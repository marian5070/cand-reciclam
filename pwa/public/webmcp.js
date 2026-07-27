/**
 * WebMCP (navigator.modelContext — Chrome origin trial): exposes Bucharest
 * waste-collection data as in-browser tools for AI agents. Vanilla JS, no
 * dependencies, same-origin fetches only (CSP connect-src 'self'); strict
 * no-op on browsers without the API. Editorial contract: every schedule
 * carries its official sourceUrl — tools never drop provenance and never
 * invent schedules.
 */
(function () {
  'use strict';
  try {
    var mc = navigator.modelContext;
    if (!mc || typeof mc.provideContext !== 'function') return;

    var MCP_NOTE =
      ' Full MCP server (also in the ChatGPT apps catalog): https://cand-reciclam.madeinro.eu/mcp (Streamable HTTP, card at /.well-known/mcp.json). Agent access guide: /auth.md';

    var CACHE_TTL_MS = 5 * 60 * 1000;
    var cache = new Map();
    function cachedJson(url) {
      var hit = cache.get(url);
      if (hit && Date.now() - hit.t < CACHE_TTL_MS) return Promise.resolve(hit.v);
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      }).then(function (v) {
        cache.set(url, { t: Date.now(), v: v });
        return v;
      });
    }
    function ok(data) {
      return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    }
    function err(msg) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: msg }) }], isError: true };
    }

    var tools = [
      {
        name: 'recycling_site_search_street',
        description:
          'Search Bucharest streets by name (autocomplete, min 2 characters). Returns street ids to pass to recycling_site_schedule.' + MCP_NOTE,
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string', description: 'Street name fragment, min 2 chars' } },
          required: ['query'],
        },
        execute: function (args) {
          var q = ((args || {}).query || '').trim();
          if (q.length < 2) return Promise.resolve(err('query needs at least 2 characters.'));
          return cachedJson('/api/streets?q=' + encodeURIComponent(q)).then(ok, function () {
            return err('Street search unavailable right now.');
          });
        },
      },
      {
        name: 'recycling_site_schedule',
        description:
          'Waste-collection schedules for one street (street_id from recycling_site_search_street; optional house number for odd/even matching). Each row includes the RRULE, overrideDates (which take precedence), operator and the official sourceUrl + sourceQuality — preserve the source when relaying; the site never invents schedules.' + MCP_NOTE,
        inputSchema: {
          type: 'object',
          properties: {
            street_id: { type: 'string', description: 'Street id from the search tool' },
            number: { type: 'string', description: 'Optional house number' },
          },
          required: ['street_id'],
        },
        execute: function (args) {
          var a = args || {};
          if (!a.street_id) return Promise.resolve(err('street_id is required.'));
          var url = '/api/schedule?street_id=' + encodeURIComponent(a.street_id) +
            (a.number ? '&number=' + encodeURIComponent(a.number) : '');
          return cachedJson(url).then(ok, function () {
            return err('Schedule lookup unavailable right now.');
          });
        },
      },
      {
        name: 'recycling_site_sectors',
        description:
          'Coverage and data-quality status for all 6 Bucharest sectors: operator, official sources with verification dates, and an honest status enum (per-address / partial / frequency-only / transition / via-partner / no-public-data).' + MCP_NOTE,
        inputSchema: { type: 'object', properties: {} },
        execute: function () {
          return cachedJson('/data/agents/sectors.json').then(ok, function () {
            return err('Sector data unavailable right now.');
          });
        },
      },
      {
        name: 'recycling_site_sorting_guide',
        description:
          'Waste-sorting guide: what goes in which bin (accepts/rejects/prep) plus special disposal points for batteries, used oil, medicines, WEEE, bulky waste, textiles and SGR packaging.' + MCP_NOTE,
        inputSchema: { type: 'object', properties: {} },
        execute: function () {
          return cachedJson('/data/agents/guide.json').then(ok, function () {
            return err('Sorting guide unavailable right now.');
          });
        },
      },
    ];

    mc.provideContext({ tools: tools });
  } catch (e) {
    /* Experimental API — must never break the page. */
  }
})();
