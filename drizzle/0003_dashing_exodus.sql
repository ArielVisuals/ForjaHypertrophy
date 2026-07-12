CREATE TABLE "program_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"is_rest" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_day_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"name" text NOT NULL,
	"muscle_group" text NOT NULL,
	"target_sets" integer NOT NULL,
	"rep_range" text NOT NULL,
	"rir_target" integer,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "training_programs" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "program_days" ADD CONSTRAINT "program_days_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_exercises" ADD CONSTRAINT "program_exercises_program_day_id_program_days_id_fk" FOREIGN KEY ("program_day_id") REFERENCES "public"."program_days"("id") ON DELETE cascade ON UPDATE no action;