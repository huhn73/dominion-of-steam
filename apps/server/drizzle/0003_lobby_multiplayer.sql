CREATE TABLE "app_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"event" text NOT NULL,
	"kind" text NOT NULL,
	"match_id" text,
	"round" integer,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"url" text NOT NULL,
	"dedupe_key" text,
	"push_status" text NOT NULL,
	"email_status" text NOT NULL,
	"email_due_at" timestamp with time zone,
	"email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"match_id" text NOT NULL,
	"player_id" text NOT NULL,
	"target_id" text NOT NULL,
	"reminded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "reminders_match_id_player_id_pk" PRIMARY KEY("match_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "match_seats" ADD COLUMN "free_kind" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_dedupe_unique" ON "notifications" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "notifications_push_idx" ON "notifications" USING btree ("push_status");--> statement-breakpoint
CREATE INDEX "notifications_email_idx" ON "notifications" USING btree ("email_status","email_due_at");--> statement-breakpoint
CREATE INDEX "notifications_player_idx" ON "notifications" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_unique" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "push_subscriptions_player_idx" ON "push_subscriptions" USING btree ("player_id");