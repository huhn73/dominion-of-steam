ALTER TABLE "matches" ADD COLUMN "ai_pending" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "matches_ai_pending_idx" ON "matches" USING btree ("id") WHERE "matches"."ai_pending";--> statement-breakpoint
UPDATE "matches" SET "ai_pending" = true WHERE "status" = 'running' AND "state" IS NOT NULL AND ("state"->'participants'->(("state"->>'seat')::int)->>'isAI')::boolean;
