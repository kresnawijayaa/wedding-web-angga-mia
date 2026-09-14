CREATE TYPE "public"."attendance" AS ENUM('attending', 'not_attending');--> statement-breakpoint
CREATE TYPE "public"."wish_status" AS ENUM('pending', 'approved', 'hidden');--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"phone" varchar(24) NOT NULL,
	"invitation_token" varchar(64) NOT NULL,
	"max_guests" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guests_max_guests_check" CHECK ("guests"."max_guests" between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"attendance" "attendance" NOT NULL,
	"guest_count" integer DEFAULT 1 NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rsvps_guest_count_check" CHECK ("rsvps"."guest_count" between 0 and 10)
);
--> statement-breakpoint
CREATE TABLE "wishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"message" text NOT NULL,
	"status" "wish_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishes" ADD CONSTRAINT "wishes_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "guests_phone_unique" ON "guests" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_invitation_token_unique" ON "guests" USING btree ("invitation_token");--> statement-breakpoint
CREATE UNIQUE INDEX "rsvps_guest_unique" ON "rsvps" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "wishes_status_created_index" ON "wishes" USING btree ("status","created_at");