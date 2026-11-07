CREATE TABLE "player_results" (
	"player_id" text NOT NULL,
	"match_id" text NOT NULL,
	"match_name" text NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"result" text NOT NULL,
	"placement" integer NOT NULL,
	"player_count" integer NOT NULL,
	"rounds" integer NOT NULL,
	"faction_id" text NOT NULL,
	"cities_captured" integer NOT NULL,
	"units_built" integer NOT NULL,
	"victory_condition" text,
	"end_reason" text,
	"beat_hard_ai" boolean DEFAULT false NOT NULL,
	"opponents" jsonb NOT NULL,
	CONSTRAINT "player_results_player_id_match_id_pk" PRIMARY KEY("player_id","match_id")
);
--> statement-breakpoint
ALTER TABLE "player_results" ADD CONSTRAINT "player_results_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_results" ADD CONSTRAINT "player_results_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_results_history" ON "player_results" USING btree ("player_id","ended_at","match_id");