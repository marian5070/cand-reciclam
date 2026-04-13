import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uuid,
  pgEnum,
  uniqueIndex,
  index,
  boolean,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const wasteTypeEnum = pgEnum('waste_type', [
  'menajer',
  'reciclabil_uscat',
  'bio',
  'voluminoase',
  'deee',
  'textile',
  'sticla',
]);

export const buildingTypeEnum = pgEnum('building_type', ['case', 'blocuri']);

export const parityEnum = pgEnum('parity', ['odd', 'even', 'both']);

export const sourceQualityEnum = pgEnum('source_quality', [
  'street_number',
  'sector_uniform',
  'provisional',
  'manual',
]);

export const exceptionActionEnum = pgEnum('exception_action', ['canceled', 'moved_to']);

export const sectors = pgTable('sectors', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
});

export const operators = pgTable('operators', {
  id: serial('id').primaryKey(),
  sectorId: integer('sector_id')
    .notNull()
    .references(() => sectors.id),
  name: text('name').notNull(),
  url: text('url'),
  phone: text('phone'),
  email: text('email'),
});

export const zones = pgTable('zones', {
  id: serial('id').primaryKey(),
  sectorId: integer('sector_id')
    .notNull()
    .references(() => sectors.id),
  name: text('name').notNull(),
  operatorId: integer('operator_id').references(() => operators.id),
});

export const streets = pgTable(
  'streets',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex('streets_slug_idx').on(t.slug),
    nameIdx: index('streets_name_trgm_idx').on(t.name),
  }),
);

export const streetSegments = pgTable(
  'street_segments',
  {
    id: serial('id').primaryKey(),
    streetId: integer('street_id')
      .notNull()
      .references(() => streets.id, { onDelete: 'cascade' }),
    sectorId: integer('sector_id')
      .notNull()
      .references(() => sectors.id),
    numberFrom: integer('number_from'),
    numberTo: integer('number_to'),
    parity: parityEnum('parity').notNull().default('both'),
    zoneId: integer('zone_id').references(() => zones.id),
    sourceUrl: text('source_url'),
    sourceFetchedAt: timestamp('source_fetched_at', { withTimezone: true }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
  },
  (t) => ({
    streetIdx: index('street_segments_street_idx').on(t.streetId),
  }),
);

export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  zoneId: integer('zone_id')
    .notNull()
    .references(() => zones.id, { onDelete: 'cascade' }),
  wasteType: wasteTypeEnum('waste_type').notNull(),
  rrule: text('rrule').notNull(),
  buildingType: buildingTypeEnum('building_type'),
  sourceQuality: sourceQualityEnum('source_quality').notNull().default('manual'),
  sourceUrl: text('source_url'),
  sourceNote: text('source_note'),
  /** Explicit list of dates from source (YYYY-MM-DD). When present, overrides RRULE. */
  overrideDates: text('override_dates').array(),
  sourceFetchedAt: timestamp('source_fetched_at', { withTimezone: true }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
});

export const scheduleExceptions = pgTable('schedule_exceptions', {
  id: serial('id').primaryKey(),
  scheduleId: integer('schedule_id')
    .notNull()
    .references(() => schedules.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: false, mode: 'date' }).notNull(),
  action: exceptionActionEnum('action').notNull(),
  movedTo: timestamp('moved_to', { withTimezone: false, mode: 'date' }),
  note: text('note'),
});

export const disposalPoints = pgTable('disposal_points', {
  id: serial('id').primaryKey(),
  wasteType: wasteTypeEnum('waste_type').notNull(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  lat: text('lat'),
  lng: text('lng'),
  notes: text('notes'),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  streetId: integer('street_id').references(() => streets.id),
  streetNumber: integer('street_number'),
  pushEndpoint: text('push_endpoint'),
  pushP256dh: text('push_p256dh'),
  pushAuth: text('push_auth'),
  notifyHour: integer('notify_hour'),
});

export const feedbackReports = pgTable('feedback_reports', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  scheduleId: integer('schedule_id').references(() => schedules.id, { onDelete: 'set null' }),
  reportedDate: timestamp('reported_date', { withTimezone: false, mode: 'date' }),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolved: boolean('resolved').notNull().default(false),
});

/**
 * Cache for Nominatim geocoding — respect their 1 req/s policy.
 * Key by normalized query (lowercased, stripped).
 */
export const geocodeCache = pgTable('geocode_cache', {
  query: text('query').primaryKey(),
  lat: text('lat'),
  lng: text('lng'),
  displayName: text('display_name'),
  found: boolean('found').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const sectorsRel = relations(sectors, ({ many }) => ({
  operators: many(operators),
  zones: many(zones),
  segments: many(streetSegments),
}));

export const streetsRel = relations(streets, ({ many }) => ({
  segments: many(streetSegments),
}));

export const segmentsRel = relations(streetSegments, ({ one }) => ({
  street: one(streets, { fields: [streetSegments.streetId], references: [streets.id] }),
  sector: one(sectors, { fields: [streetSegments.sectorId], references: [sectors.id] }),
  zone: one(zones, { fields: [streetSegments.zoneId], references: [zones.id] }),
}));

export const zonesRel = relations(zones, ({ one, many }) => ({
  sector: one(sectors, { fields: [zones.sectorId], references: [sectors.id] }),
  operator: one(operators, { fields: [zones.operatorId], references: [operators.id] }),
  schedules: many(schedules),
}));

export const schedulesRel = relations(schedules, ({ one, many }) => ({
  zone: one(zones, { fields: [schedules.zoneId], references: [zones.id] }),
  exceptions: many(scheduleExceptions),
}));
