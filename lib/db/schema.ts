import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true }).defaultNow().notNull();

export const accountStatus = pgEnum("account_status", ["active", "paused", "deleted"]);
export const sparkStatus = pgEnum("spark_status", ["pending", "accepted", "declined", "cancelled"]);
export const roomType = pgEnum("room_type", ["activity", "game", "music", "social"]);
export const roomRole = pgEnum("room_role", ["host", "participant", "spectator"]);
export const requestStatus = pgEnum("request_status", ["pending", "accepted", "declined", "cancelled"]);
export const reportStatus = pgEnum("report_status", ["open", "reviewing", "resolved", "dismissed"]);
export const notificationAudience = pgEnum("notification_audience", ["all", "active", "city"]);


export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  authUserId: text("auth_user_id").notNull(),
  email: text("email"),
  phone: text("phone"),
  passwordHash: text("password_hash"),
  status: accountStatus("status").default("active").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
}, (t) => ({
  authUserIdx: uniqueIndex("users_auth_user_id_idx").on(t.authUserId),
  emailIdx: uniqueIndex("users_email_idx").on(t.email),
}));

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  dateOfBirth: timestamp("date_of_birth", { mode: "date" }),
  city: text("city"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  voiceIntroUrl: text("voice_intro_url"),
  relationshipGoals: jsonb("relationship_goals").$type<string[]>().default([]).notNull(),
  communicationStyle: text("communication_style"),
  lifestylePreferences: jsonb("lifestyle_preferences").$type<Record<string, unknown>>().default({}).notNull(),
  familyExpectations: jsonb("family_expectations").$type<Record<string, unknown>>().default({}).notNull(),
  privacySettings: jsonb("privacy_settings").$type<Record<string, unknown>>().default({}).notNull(),
  verification: jsonb("verification").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const identityVerificationStatus = pgEnum("identity_verification_status", ["pending", "verified", "rejected", "restricted"]);
export const mediaType = pgEnum("media_type", ["photo", "video"]);

export const identityVerifications = pgTable("identity_verifications", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  legalName: text("legal_name").notNull(),
  governmentIdType: text("government_id_type").notNull(),
  governmentIdLast4: text("government_id_last4"),
  selfieFrontUrl: text("selfie_front_url"),
  selfieLeftUrl: text("selfie_left_url"),
  selfieRightUrl: text("selfie_right_url"),
  status: identityVerificationStatus("status").default("pending").notNull(),
  provider: text("provider"),
  providerReference: text("provider_reference"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const identitySignals = pgTable("identity_signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  signalType: text("signal_type").notNull(),
  fingerprint: text("fingerprint").notNull(),
  confidence: real("confidence"),
  action: text("action").notNull(),
  createdAt: ts("created_at"),
});

export const profileMedia = pgTable("profile_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mediaType("type").notNull(),
  storageKey: text("storage_key").notNull(),
  thumbnailKey: text("thumbnail_key"),
  position: integer("position").default(0).notNull(),
  moderationStatus: text("moderation_status").default("pending").notNull(),
  createdAt: ts("created_at"),
}, (t) => ({
  userPositionIdx: uniqueIndex("profile_media_user_position_idx").on(t.userId, t.position),
}));

export const interests = pgTable("interests", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  category: text("category"),
}, (t) => ({
  slugIdx: uniqueIndex("interests_slug_idx").on(t.slug),
}));

export const userInterests = pgTable("user_interests", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  interestId: uuid("interest_id").notNull().references(() => interests.id, { onDelete: "cascade" }),
  createdAt: ts("created_at"),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.interestId] }),
}));

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  city: text("city"),
  capacity: integer("capacity"),
  isPublic: boolean("is_public").default(true).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: ts("created_at"),
});

export const activityParticipants = pgTable("activity_participants", {
  activityId: uuid("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("participant").notNull(),
  joinedAt: ts("joined_at"),
}, (t) => ({
  pk: primaryKey({ columns: [t.activityId, t.userId] }),
}));

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: roomType("type").notNull(),
  city: text("city"),
  description: text("description"),
  activityId: uuid("activity_id").references(() => activities.id, { onDelete: "set null" }),
  hostUserId: uuid("host_user_id").references(() => users.id, { onDelete: "set null" }),
  capacity: integer("capacity"),
  cameraDefault: boolean("camera_default").default(false).notNull(),
  micDefault: boolean("mic_default").default(false).notNull(),
  isLive: boolean("is_live").default(false).notNull(),
  createdAt: ts("created_at"),
});

export const roomMembers = pgTable("room_members", {
  roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: roomRole("role").default("participant").notNull(),
  joinedAt: ts("joined_at"),
  leftAt: timestamp("left_at", { withTimezone: true }),
}, (t) => ({
  pk: primaryKey({ columns: [t.roomId, t.userId] }),
}));

export const sparks = pgTable("sparks", {
  id: uuid("id").defaultRandom().primaryKey(),
  fromUserId: uuid("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: uuid("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: sparkStatus("status").default("pending").notNull(),
  message: text("message"),
  createdAt: ts("created_at"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

export const matches = pgTable("matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  userAId: uuid("user_a_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userBId: uuid("user_b_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  source: text("source").default("spark").notNull(),
  createdAt: ts("created_at"),
}, (t) => ({
  pairIdx: uniqueIndex("matches_pair_idx").on(t.userAId, t.userBId),
}));

export const encryptionPublicKeys = pgTable("encryption_public_keys", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  publicKeyJwk: jsonb("public_key_jwk").$type<Record<string, unknown>>().notNull(),
  keyVersion: integer("key_version").default(1).notNull(),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  matchId: uuid("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: ts("created_at"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const memories = pgTable("memories", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  otherUserId: uuid("other_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fact: text("fact").notNull(),
  sourceMessageId: uuid("source_message_id").references(() => messages.id, { onDelete: "set null" }),
  confirmed: boolean("confirmed").default(false).notNull(),
  createdAt: ts("created_at"),
});

export const compassResponses = pgTable("compass_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  response: jsonb("response").$type<Record<string, unknown>>().notNull(),
  visibility: text("visibility").default("match").notNull(),
  updatedAt: ts("updated_at"),
}, (t) => ({
  userCategoryIdx: uniqueIndex("compass_user_category_idx").on(t.userId, t.category),
}));

export const missions = pgTable("missions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: ts("created_at"),
});

export const missionAttempts = pgTable("mission_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchId: uuid("match_id").references(() => matches.id, { onDelete: "set null" }),
  score: real("score"),
  result: jsonb("result").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: ts("created_at"),
});

export const connectionEvents = pgTable("connection_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userAId: uuid("user_a_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userBId: uuid("user_b_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  occurredAt: ts("occurred_at"),
});

export const datePlans = pgTable("date_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  matchId: uuid("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  city: text("city"),
  venue: text("venue"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  safetyPlan: jsonb("safety_plan").$type<Record<string, unknown>>().default({}).notNull(),
  status: text("status").default("draft").notNull(),
  createdAt: ts("created_at"),
});

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  reporterId: uuid("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reportedUserId: uuid("reported_user_id").references(() => users.id, { onDelete: "set null" }),
  category: text("category").notNull(),
  details: text("details"),
  status: reportStatus("status").default("open").notNull(),
  createdAt: ts("created_at"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const blocks = pgTable("blocks", {
  blockerId: uuid("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedId: uuid("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: ts("created_at"),
}, (t) => ({
  pk: primaryKey({ columns: [t.blockerId, t.blockedId] }),
}));

export const festivals = pgTable("festivals", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  city: text("city"),
  coverEmoji: text("cover_emoji").default("🎉").notNull(),
  isLive: boolean("is_live").default(false).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: ts("created_at"),
}, (t) => ({
  slugIdx: uniqueIndex("festivals_slug_idx").on(t.slug),
}));

export const festivalActivities = pgTable("festival_activities", {
  festivalId: uuid("festival_id").notNull().references(() => festivals.id, { onDelete: "cascade" }),
  activityId: uuid("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.festivalId, t.activityId] }),
}));

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  audience: notificationAudience("audience").default("all").notNull(),
  city: text("city"),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "cascade" }),
  showPopup: boolean("show_popup").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: ts("created_at"),
});

export const notificationReads = pgTable("notification_reads", {
  notificationId: uuid("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.notificationId, t.userId] }),
}));

export const cheers = pgTable("cheers", {
  id: uuid("id").defaultRandom().primaryKey(),
  fromUserId: uuid("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: uuid("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
  reaction: text("reaction").default("👏").notNull(),
  createdAt: ts("created_at"),
});
