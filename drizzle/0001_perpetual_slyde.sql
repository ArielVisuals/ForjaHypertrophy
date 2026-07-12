CREATE TABLE "nutrition_staples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"calories" numeric(7, 2) NOT NULL,
	"protein_g" numeric(6, 2),
	"carbs_g" numeric(6, 2),
	"fats_g" numeric(6, 2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nutrition_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"calories" integer DEFAULT 2500 NOT NULL,
	"protein_g" integer DEFAULT 180 NOT NULL,
	"carbs_g" integer DEFAULT 300 NOT NULL,
	"fats_g" integer DEFAULT 70 NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"display_name" text,
	"role" text DEFAULT 'athlete' NOT NULL,
	"coach_id" text,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "training_programs" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "training_programs" ALTER COLUMN "duration_weeks" SET DEFAULT 8;--> statement-breakpoint
ALTER TABLE "training_programs" ALTER COLUMN "active" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "training_programs" ADD COLUMN "level" text;--> statement-breakpoint
ALTER TABLE "training_programs" ADD COLUMN "split_type" text;--> statement-breakpoint
ALTER TABLE "training_programs" ADD COLUMN "focus" text;--> statement-breakpoint
ALTER TABLE "training_programs" ADD COLUMN "is_master" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD COLUMN "analysis_summary" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;