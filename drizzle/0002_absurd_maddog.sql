CREATE TABLE "intake_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"goals" jsonb NOT NULL,
	"health" jsonb NOT NULL,
	"lifestyle" jsonb NOT NULL,
	"availability" jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "intake_forms_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "intake_forms" ADD CONSTRAINT "intake_forms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;