import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';

export async function streetsRoutes(app: FastifyInstance) {
  app.get('/api/streets', async (req, reply) => {
    const q = (req.query as Record<string, string>)?.q?.trim();
    if (!q || q.length < 2) return reply.send([]);

    const pattern = `%${q.toLowerCase()}%`;
    const rows = await db.execute<{
      id: number;
      name: string;
      slug: string;
      segment_count: number;
      sectors: number[];
      min_n: number | null;
      max_n: number | null;
    }>(sql`
      SELECT s.id, s.name, s.slug,
        COUNT(seg.id)::int AS segment_count,
        COALESCE(array_agg(DISTINCT seg.sector_id) FILTER (WHERE seg.id IS NOT NULL), '{}') AS sectors,
        MIN(seg.number_from) AS min_n,
        MAX(seg.number_to) AS max_n
      FROM streets s
      LEFT JOIN street_segments seg ON seg.street_id = s.id
      WHERE LOWER(s.name) LIKE ${pattern}
      GROUP BY s.id, s.name, s.slug
      ORDER BY
        CASE WHEN LOWER(s.name) LIKE ${`${q.toLowerCase()}%`} THEN 0 ELSE 1 END,
        LENGTH(s.name), s.name
      LIMIT 20
    `);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sectors: r.sectors,
      numberRange: r.min_n !== null ? { from: r.min_n, to: r.max_n } : null,
      segmentCount: r.segment_count,
    }));
  });

  app.get('/api/streets/:id', async (req, reply) => {
    const params = req.params as { id: string };
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return reply.code(400).send({ error: 'invalid id' });
    }
    const rows = await db.execute<{
      id: number;
      name: string;
      slug: string;
      sectors: number[];
      min_n: number | null;
      max_n: number | null;
    }>(sql`
      SELECT s.id, s.name, s.slug,
        COALESCE(array_agg(DISTINCT seg.sector_id) FILTER (WHERE seg.id IS NOT NULL), '{}') AS sectors,
        MIN(seg.number_from) AS min_n,
        MAX(seg.number_to) AS max_n
      FROM streets s
      LEFT JOIN street_segments seg ON seg.street_id = s.id
      WHERE s.id = ${id}
      GROUP BY s.id, s.name, s.slug
      LIMIT 1
    `);
    const r = rows[0];
    if (!r) return reply.code(404).send({ error: 'not found' });
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      sectors: r.sectors,
      numberRange: r.min_n !== null ? { from: r.min_n, to: r.max_n } : null,
    };
  });

  app.get('/api/schedule', async (req, reply) => {
    const query = req.query as Record<string, string>;
    const streetId = Number(query.street_id);
    const number = query.number ? Number(query.number) : undefined;
    if (!Number.isFinite(streetId)) {
      return reply.code(400).send({ error: 'street_id required' });
    }

    const rows = await db.execute<{
      schedule_id: number;
      waste_type: string;
      rrule: string;
      building_type: string | null;
      source_quality: string;
      source_url: string | null;
      override_dates: string[] | null;
      zone_id: number;
      zone_name: string;
      sector_id: number;
      operator_name: string | null;
      operator_url: string | null;
      segment_from: number | null;
      segment_to: number | null;
    }>(sql`
      SELECT
        sch.id AS schedule_id,
        sch.waste_type,
        sch.rrule,
        sch.building_type,
        sch.source_quality,
        sch.override_dates,
        COALESCE(sch.source_url, seg.source_url) AS source_url,
        z.id AS zone_id,
        z.name AS zone_name,
        seg.sector_id,
        op.name AS operator_name,
        op.url AS operator_url,
        seg.number_from AS segment_from,
        seg.number_to AS segment_to
      FROM street_segments seg
      JOIN zones z ON z.id = seg.zone_id
      JOIN schedules sch ON sch.zone_id = z.id
      LEFT JOIN operators op ON op.id = z.operator_id
      WHERE seg.street_id = ${streetId}
        ${number !== undefined
          ? sql`AND ${number} BETWEEN seg.number_from AND COALESCE(seg.number_to, 2147483647)
                AND (seg.parity = 'both'
                  OR (${number % 2} = 1 AND seg.parity = 'odd')
                  OR (${number % 2} = 0 AND seg.parity = 'even'))`
          : sql``}
      ORDER BY sch.waste_type
    `);

    return rows.map((r) => ({
      scheduleId: r.schedule_id,
      wasteType: r.waste_type,
      rrule: r.rrule,
      buildingType: r.building_type,
      sourceQuality: r.source_quality,
      sourceUrl: r.source_url,
      overrideDates: r.override_dates ?? null,
      operator: r.operator_name,
      sectorId: r.sector_id,
      zone: r.zone_name,
      numberRange: { from: r.segment_from, to: r.segment_to },
    }));
  });
}
