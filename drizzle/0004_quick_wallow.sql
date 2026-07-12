CREATE TABLE "meal_plan_meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_plan_id" uuid NOT NULL,
	"slot" text NOT NULL,
	"order" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"calories" numeric(7, 2) NOT NULL,
	"protein_g" numeric(6, 2),
	"carbs_g" numeric(6, 2),
	"fats_g" numeric(6, 2)
);
--> statement-breakpoint
CREATE TABLE "meal_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" text NOT NULL,
	"assigned_to" text NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"calories" integer NOT NULL,
	"protein_g" integer NOT NULL,
	"carbs_g" integer NOT NULL,
	"fats_g" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD COLUMN "meal_plan_meal_id" uuid;--> statement-breakpoint
ALTER TABLE "meal_plan_meals" ADD CONSTRAINT "meal_plan_meals_meal_plan_id_meal_plans_id_fk" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."meal_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD CONSTRAINT "nutrition_logs_meal_plan_meal_id_meal_plan_meals_id_fk" FOREIGN KEY ("meal_plan_meal_id") REFERENCES "public"."meal_plan_meals"("id") ON DELETE set null ON UPDATE no action;