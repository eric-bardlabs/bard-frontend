import { relations, type InferSelectModel, sql, SQL } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  date,
  pgEnum,
  numeric,
  json,
  primaryKey,
  customType,
  unique,
} from "drizzle-orm/pg-core";
import { typeid } from "typeid-js";

export type User = InferSelectModel<typeof user>;

export type AddedCollaborator = InferSelectModel<typeof collaborator>;

export type OrganizationCollaboratorProfile = InferSelectModel<
  typeof organizationCollaboratorProfile
>;
export type CollaboratorProfile = InferSelectModel<typeof collaboratorProfile>;

export type CollaboratorRole = InferSelectModel<typeof collaboratorRole>;
export type SpotifyAlbum = InferSelectModel<typeof spotifyAlbum>;
export type SpotifyTrack = InferSelectModel<typeof spotifyTrack>;

export type SpotifyArtist = InferSelectModel<typeof spotifyArtist>;

export type SurveyResult = InferSelectModel<typeof surveyResult>;

export type ReminderIndicator = InferSelectModel<typeof reminderIndicator>;

export type Reminder = InferSelectModel<typeof reminder>;

export type ShareLink = InferSelectModel<typeof shareLink>;

export type SongCollaboratorProfile = InferSelectModel<
  typeof songCollaborator
> & { collaboratorProfile: CollaboratorProfile };
// const mySchema = pgTableCreator((name) => `bard_${name}`);

const tsVector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

/**
 * EXPLANATION
 *
 * Every user is part of an organization
 *
 * Every organization has 1 or more users
 *
 * Every management is an association of organizations a user is able to move between
 *
 * Single artists will be part of their own organization
 *
 * Managers of multiple musicians or have collaborated on multiple things will
 * be part of several organizations joined via the management table
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  emailAddress: text("email_address"),
  profilePic: text("profile_pic"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  organizationId: text("organization_id"), // TODO: deprecate this field
  isDeleted: boolean("is_deleted").default(false),
  isAdmin: boolean("is_admin").default(false),
  isSuperManager: boolean("is_super_manager").default(false),
  allowSms: boolean("allow_sms").default(false),
  phone: text("phone"),
  initialStep: integer("initial_step"),
  initialData: json("initial_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const spotifyArtist = pgTable("spotifyArtist", {
  id: text("id").primaryKey(),
  name: text("name"),
  profilePic: text("profile_pic"),
  followers: integer("followers"),
  popularity: integer("popularity"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const spotifyAlbum = pgTable(
  "spotifyAlbum",
  {
    id: text("id").primaryKey(),
    spotifyAlbumId: text("spotify_album_id"),
    title: text("title"),
    releaseDate: text("release_date"),
    startDate: text("start_date"),
    renewalDate: text("renewal_date"),
    totalTracks: integer("total_tracks"),
    organizationId: text("organization_id"),
    albumArtUrl: text("album_art_url"),
    upc: text("upc"),
    ean: text("ean"),
    isrc: text("isrc"),
    labelCollaboratorId: text("label_collaborator_id"),
    labelPayoutPlatform: text("label_payout_link"),
    labelAccountingStartDate: date("label_accounting_start_date"),
    labelAccountingEndDate: date("label_accounting_end_date"),
    publisherCollaboratorId: text("publisher_collaborator_id"),
    publisherPayoutPlatform: text("publisher_payout_link"),
    publisherAccountingStartDate: date("publisher_accounting_start_date"),
    publisherAccountingEndDate: date("publisher_accounting_end_date"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    spotifyAlbumOrgKey: unique().on(t.spotifyAlbumId, t.organizationId),
  })
);

export const bardSession = pgTable("bardSession", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id"),
  gcId: text("gc_id").unique(),
  title: text("title"),
  description: text("description"),
  location: text("location"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  notes: text("notes"),
  fts: tsVector("fts").generatedAlwaysAs(
    (): SQL => sql`to_tsvector('english', ${bardSession.title})`
  ),
});

export const spotifyTrack = pgTable(
  "spotifyTrack",
  {
    id: text("id").primaryKey(),
    spotifyTrackId: text("spotify_track_id"),
    displayName: text("display_name"),
    organizationId: text("organization_id"),
    albumId: text("album_id").references(() => spotifyAlbum.id, {
      onDelete: "cascade",
    }),
    durationMs: text("duration_ms"),
    upc: text("upc"),
    ean: text("ean"),
    isrc: text("isrc"),
    status: text("status"),
    spotifyCode: text("spotify_code"),
    appleCode: text("apple_code"),
    sxid: text("sxid"),
    artistId: text("artist_id"),
    sync: text("sync"),
    pitch: text("pitch"),
    projectStartDate: date("project_start_date"),
    releaseDate: date("release_date"),
    songWriterSplits: text("song_writer_splits"),
    publisherSplits: text("publisher_splits"),
    masterSplits: text("master_splits"),

    registrationStatus: text("registration_status"),
    masterFeeStatus: text("master_fee_status"),
    masterFeeAmount: numeric("master_fee_amount", { precision: 10, scale: 2 }),
    splitsConfirmationStatus: text("splits_confirmation_status"),
    initialSource: text("initial_source"),

    fts: tsVector("fts").generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', ${spotifyTrack.displayName})`
    ),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    spotifyTrackOrgKey: unique().on(t.spotifyTrackId, t.organizationId),
  })
);

export const collaborator = pgTable("collaborator", {
  id: text("id").primaryKey(),
  legalName: text("legal_name"),
  artistName: text("artist_name"),
  email: text("email"),
  profilePic: text("profile_pic"),
  organizationId: text("organization_id"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const collaboratorProfile = pgTable(
  "collaboratorProfile",
  {
    id: text("id").primaryKey(),
    spotifyArtistId: text("spotify_artist_id"),
    clerkUserId: text("clerk_user_id").references(() => user.id),
    organizationId: text("organization_id"),
    legalName: text("legal_name"),
    artistName: text("artist_name"),
    email: text("email"),
    profilePic: text("profile_pic"),
    phoneNumber: text("phone_number"),
    region: text("region"),
    proId: text("pro_id"),
    pro: text("pro"),
    profileLink: text("profile_link"),
    bio: text("bio"),
    isPartOfOrganization: boolean("is_part_of_organization").default(false),
    
    initialSource: text("initial_source"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    spotifyArtistOrgKey: unique().on(t.spotifyArtistId, t.organizationId),
  })
);

export const bardSessionTrack = pgTable(
  "bardSessionTrack",
  {
    bardSessionId: text("bard_session_id")
      .references(() => bardSession.id, { onDelete: "cascade" })
      .notNull(),
    spotifyTrackId: text("spotify_track_id")
      .references(() => spotifyTrack.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.bardSessionId, table.spotifyTrackId] }),
    };
  }
);

export const bardSessionCollaborator = pgTable(
  "bardSessionCollaborator",
  {
    bardSessionId: text("bard_session_id")
      .references(() => bardSession.id, { onDelete: "cascade" })
      .notNull(),
    collaboratorProfileId: text("collaborator_profile_id")
      .references(() => collaboratorProfile.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.bardSessionId, table.collaboratorProfileId],
      }),
    };
  }
);

export const collaboratorRole = pgTable("collaboratorRole", {
  id: text("id").primaryKey(),
  role: text("name"),
  collaboratorId: text("collaborator_id").references(() => collaborator.id),
  collaboratorProfileId: text("collaborator_profile_id").references(
    () => collaboratorProfile.id,
    {
      onDelete: "cascade",
    }
  ),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const songCollaborator = pgTable(
  "songCollaborator",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => typeid("scollab").toString()),
    songId: text("song_id").references(() => spotifyTrack.id, {
      onDelete: "cascade",
    }),
    collaboratorId: text("collaborator_id").references(() => collaborator.id, {
      onDelete: "cascade",
    }),
    collaboratorProfileId: text("collaborator_profile_id").references(
      () => collaboratorProfile.id,
      {
        onDelete: "cascade",
      }
    ),

    role: text("role"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    uniqueKey1: unique().on(t.songId, t.collaboratorProfileId),
  })
);

export const collaboratorRelation = pgTable(
  "collaboratorRelation",
  {
    collaboratorProfileId: text("collaborator_profile_id").references(
      () => collaboratorProfile.id,
      {
        onDelete: "cascade",
      }
    ),
    parentId: text("parent_id").references(() => collaboratorProfile.id, {
      onDelete: "cascade",
    }),
    organizationId: text("organization_id").notNull(),
    type: text("type"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    uniqueKey1: unique().on(
      t.collaboratorProfileId,
      t.parentId,
      t.organizationId,
      t.type
    ),
  })
);

export const orgCollabProfileEnum = pgEnum("collab_status", [
  "INVITED_BY_ORG",
  "SHARED_BASIC",
  "SHARED_BUSINESS",
]);

export const organizationCollaboratorProfile = pgTable(
  "organizationCollaboratorProfile",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => typeid("orgCollab").toString()),
    organizationId: text("organization_id").notNull(),
    collaboratorProfileId: text("collaborator_profile_id")
      .notNull()
      .references(() => collaboratorProfile.id, {
        onDelete: "cascade",
      }),
    collabStatus: orgCollabProfileEnum("collab_status"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    uniqueKey1: unique().on(t.organizationId, t.collaboratorProfileId),
  })
);

export const surveyResult = pgTable("survey_result", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("invt").toString()),
  sessionId: text("session_id")
    .notNull()
    .references(() => bardSession.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  attended: boolean("attended").notNull(),
  collaborators: json("collaborators").notNull(),
  songs: json("songs").notNull(),
  splits: json("splits"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reminderIndicator = pgTable("reminder_indicator", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("remdind").toString()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull(),
  types: json("types").notNull(),
  date: date("date", { mode: "date" }).notNull(),
});

export const reminder = pgTable("reminder", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("remd").toString()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull(),
  content: json("content").notNull(),
  type: text("type").notNull(),
  level: text("level").notNull(),
  actionType: text("action_type").notNull(),
  importance: integer("importance").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shareLink = pgTable("share_link", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("share").toString()),
  songId: text("song_id")
    .notNull()
    .references(() => spotifyTrack.id),
  organizationId: text("organization_id").notNull(),
  expiredAt: timestamp("expired_at").notNull(),
  allowTabs: json("allow_tabs").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const surveySubmitter = relations(surveyResult, ({ one }) => {
  return {
    user: one(user, {
      fields: [surveyResult.userId],
      references: [user.id],
    }),
  };
});

export const trackAlbumRelation = relations(spotifyTrack, ({ one, many }) => ({
  album: one(spotifyAlbum, {
    fields: [spotifyTrack.albumId],
    references: [spotifyAlbum.id],
  }),
  collaboratorsV2: many(songCollaborator),
}));

export const songCollaboratorRelation = relations(
  songCollaborator,
  ({ one }) => ({
    song: one(spotifyTrack, {
      fields: [songCollaborator.songId],
      references: [spotifyTrack.id],
    }),
    collaboratorProfile: one(collaboratorProfile, {
      fields: [songCollaborator.collaboratorProfileId],
      references: [collaboratorProfile.id],
    }),
  })
);

export const collaboratorProfileToRoles = relations(
  collaboratorProfile,
  ({ one, many }) => ({
    collabOrganization: many(organizationCollaboratorProfile),
    roles: many(collaboratorRole),
  })
);

export const collaboratorProfileOrganizationRelation = relations(
  organizationCollaboratorProfile,
  ({ one, many }) => ({
    collaboratorProfile: one(collaboratorProfile, {
      fields: [organizationCollaboratorProfile.collaboratorProfileId],
      references: [collaboratorProfile.id],
    }),
  })
);

export const collaboratorRoleRelation = relations(
  collaboratorRole,
  ({ one }) => ({
    collaborator: one(collaborator, {
      fields: [collaboratorRole.collaboratorId],
      references: [collaborator.id],
    }),
    collaboratorProfile: one(collaboratorProfile, {
      fields: [collaboratorRole.collaboratorProfileId],
      references: [collaboratorProfile.id],
    }),
  })
);

export const albumToTracks = relations(spotifyAlbum, ({ many }) => ({
  tracks: many(spotifyTrack),
}));

export const trackRelations = relations(spotifyTrack, ({ many }) => ({
  bardSessionTracks: many(bardSessionTrack),
  songCollaborators: many(songCollaborator),
}));
export const sessionRelations = relations(bardSession, ({ many }) => ({
  bardSessionTracks: many(bardSessionTrack),
  bardSessionCollaborators: many(bardSessionCollaborator),
}));
export const collaboratorProfileRelations = relations(
  collaboratorProfile,
  ({ many }) => ({
    bardSessionCollaborators: many(bardSessionCollaborator),
    songCollaborators: many(songCollaborator),
  })
);
export const bardSessionTrackRelations = relations(
  bardSessionTrack,
  ({ one }) => ({
    bardSession: one(bardSession, {
      fields: [bardSessionTrack.bardSessionId],
      references: [bardSession.id],
    }),
    spotifyTrack: one(spotifyTrack, {
      fields: [bardSessionTrack.spotifyTrackId],
      references: [spotifyTrack.id],
    }),
  })
);
export const bardSessionCollaboratorRelations = relations(
  bardSessionCollaborator,
  ({ one }) => ({
    bardSession: one(bardSession, {
      fields: [bardSessionCollaborator.bardSessionId],
      references: [bardSession.id],
    }),
    collaboratorProfile: one(collaboratorProfile, {
      fields: [bardSessionCollaborator.collaboratorProfileId],
      references: [collaboratorProfile.id],
    }),
  })
);
