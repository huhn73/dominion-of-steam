ALTER TABLE "players" ADD COLUMN "news_seen_version" text;--> statement-breakpoint
-- Existing players know everything up to 0.10.1; the first hint comes with the next release
UPDATE "players" SET "news_seen_version" = '0.10.1';
