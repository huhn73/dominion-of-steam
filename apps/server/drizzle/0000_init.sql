CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mode" text NOT NULL,
	"status" text NOT NULL,
	"round" integer NOT NULL,
	"seed" text NOT NULL,
	"turn_deadline" timestamp with time zone,
	"state" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turns" (
	"match_id" text NOT NULL,
	"round" integer NOT NULL,
	"participant_id" text NOT NULL,
	"actions" jsonb NOT NULL,
	"ended_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "turns_match_id_round_participant_id_pk" PRIMARY KEY("match_id","round","participant_id")
);
--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;