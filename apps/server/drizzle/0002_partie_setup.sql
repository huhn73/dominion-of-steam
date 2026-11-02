CREATE TABLE "invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"player_id" text NOT NULL,
	"from_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "match_seats" (
	"match_id" text NOT NULL,
	"seat" integer NOT NULL,
	"kind" text NOT NULL,
	"player_id" text,
	"participant_id" text,
	"faction_id" text,
	"ai_personality_id" text,
	"ai_difficulty" text,
	"ready" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone,
	CONSTRAINT "match_seats_match_id_seat_pk" PRIMARY KEY("match_id","seat")
);
--> statement-breakpoint
CREATE TABLE "setup_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"invite_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "state" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "host_id" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "setup" jsonb;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "invite_token" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_from_id_players_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_seats" ADD CONSTRAINT "match_seats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_seats" ADD CONSTRAINT "match_seats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_reservations" ADD CONSTRAINT "setup_reservations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_match_player_unique" ON "invitations" USING btree ("match_id","player_id");--> statement-breakpoint
CREATE INDEX "invitations_player_idx" ON "invitations" USING btree ("player_id","status");--> statement-breakpoint
CREATE INDEX "match_seats_player_idx" ON "match_seats" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "setup_reservations_player_unique" ON "setup_reservations" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "setup_reservations_token_unique" ON "setup_reservations" USING btree ("invite_token");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_host_id_players_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "matches_invite_token_unique" ON "matches" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "matches_host_idx" ON "matches" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");