CREATE TABLE "account_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"purpose" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account_tokens" ADD CONSTRAINT "account_tokens_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_tokens_player_purpose_unique" ON "account_tokens" USING btree ("player_id","purpose");--> statement-breakpoint
-- Bestehende Spieler gelten als bestätigt (Dev-Konten, bisherige Tester)
UPDATE "players" SET "email_verified_at" = now() WHERE "email_verified_at" IS NULL;--> statement-breakpoint
-- Offene E-Mail-Änderungen wandern in die neue Tabelle (0006 löscht die alte)
INSERT INTO "account_tokens" ("id", "player_id", "purpose", "email", "created_at", "expires_at")
SELECT "id", "player_id", 'change_email', "email", "created_at", "expires_at" FROM "email_changes";
