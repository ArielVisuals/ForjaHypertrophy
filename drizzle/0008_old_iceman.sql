ALTER TABLE "exercises" ADD COLUMN "source_id" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "gif_url" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "body_part" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "target" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "secondary_muscles" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "instruction_steps" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_source_id_unique" UNIQUE("source_id");