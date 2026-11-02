CREATE TABLE "email_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_changes" ADD CONSTRAINT "email_changes_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_changes_player_unique" ON "email_changes" USING btree ("player_id");