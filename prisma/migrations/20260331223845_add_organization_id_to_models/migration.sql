-- AlterTable
ALTER TABLE "compliance_items" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "data_validations" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "emission_facilities" ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'active',
ADD COLUMN     "worksite_id" VARCHAR(50);

-- AlterTable
ALTER TABLE "esg_metrics" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "esg_reports" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "kpi_change_log" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "kpi_disclosure_mappings" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "kpi_masters" ADD COLUMN     "calc_rule" TEXT,
ADD COLUMN     "calc_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "kpi_performance" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "kpi_targets" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "materiality_issues" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "org_departments" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "org_duties" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "org_positions" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "org_teams" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "business_number" VARCHAR(30),
ADD COLUMN     "contact_email" VARCHAR(255),
ADD COLUMN     "contact_name" VARCHAR(100),
ADD COLUMN     "contact_phone" VARCHAR(30),
ADD COLUMN     "contract_end_date" DATE,
ADD COLUMN     "contract_start_date" DATE,
ADD COLUMN     "distance_api_settings" TEXT,
ADD COLUMN     "memo" TEXT,
ADD COLUMN     "selected_frameworks" TEXT,
ADD COLUMN     "status" VARCHAR(30) NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "reduction_projects" ADD COLUMN     "organization_id" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "approval_status" VARCHAR(30) NOT NULL DEFAULT 'approved',
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" VARCHAR(36),
ADD COLUMN     "is_platform_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organization_id" INTEGER,
ADD COLUMN     "rejection_reason" VARCHAR(500);

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "organization_id" INTEGER;

-- CreateTable
CREATE TABLE "activity_audit_logs" (
    "id" SERIAL NOT NULL,
    "facility_id" VARCHAR(50) NOT NULL,
    "year" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "actor" VARCHAR(100) NOT NULL DEFAULT '시스템',
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_id" VARCHAR(36) NOT NULL,
    "actor_name" VARCHAR(255) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" VARCHAR(50) NOT NULL,
    "target_name" VARCHAR(255),
    "detail" TEXT,
    "ip_address" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "author_id" VARCHAR(36) NOT NULL,
    "author_name" VARCHAR(255) NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" SERIAL NOT NULL,
    "subject" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "status" VARCHAR(30) NOT NULL DEFAULT 'open',
    "priority" VARCHAR(30) NOT NULL DEFAULT 'normal',
    "requester_id" VARCHAR(36) NOT NULL,
    "requester_name" VARCHAR(255) NOT NULL,
    "requester_email" VARCHAR(255),
    "organization_id" INTEGER,
    "assignee_id" VARCHAR(36),
    "assignee_name" VARCHAR(255),
    "reply" TEXT,
    "replied_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "monthly_price" INTEGER NOT NULL DEFAULT 0,
    "max_users" INTEGER NOT NULL DEFAULT 5,
    "max_worksites" INTEGER NOT NULL DEFAULT 1,
    "features" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_subscriptions" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "memo" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_configs" (
    "id" SERIAL NOT NULL,
    "project_id" VARCHAR(100) NOT NULL,
    "bot_name" VARCHAR(200) NOT NULL DEFAULT 'ESG_On 어시스턴트',
    "theme" VARCHAR(20) NOT NULL DEFAULT 'light',
    "placeholder" VARCHAR(500),
    "welcome_message" TEXT,
    "rag_namespace" VARCHAR(200),
    "chat_api_url" VARCHAR(500),
    "confirm_api_url" VARCHAR(500),
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "position" VARCHAR(30) NOT NULL DEFAULT 'bottom-right',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common_codes" (
    "id" SERIAL NOT NULL,
    "code_group" VARCHAR(50) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "common_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_sources" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "source_type" VARCHAR(50) NOT NULL,
    "scope" INTEGER,
    "endpoint" VARCHAR(500),
    "auth_type" VARCHAR(30) NOT NULL DEFAULT 'api_key',
    "auth_config" TEXT,
    "field_mapping" TEXT,
    "sync_interval" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "last_sync_status" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_sync_logs" (
    "id" SERIAL NOT NULL,
    "source_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "records_total" INTEGER NOT NULL DEFAULT 0,
    "records_saved" INTEGER NOT NULL DEFAULT 0,
    "records_failed" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "detail" TEXT,
    "duration_ms" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "integration_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_audit_logs_target_type_target_id_idx" ON "platform_audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "platform_audit_logs_created_at_idx" ON "platform_audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "notices_is_published_created_at_idx" ON "notices"("is_published", "created_at" DESC);

-- CreateIndex
CREATE INDEX "support_tickets_status_created_at_idx" ON "support_tickets"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE INDEX "org_subscriptions_organization_id_idx" ON "org_subscriptions"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_configs_project_id_key" ON "chatbot_configs"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "common_codes_code_group_code_key" ON "common_codes"("code_group", "code");

-- CreateIndex
CREATE INDEX "integration_sync_logs_source_id_started_at_idx" ON "integration_sync_logs"("source_id", "started_at" DESC);

-- AddForeignKey
ALTER TABLE "emission_facilities" ADD CONSTRAINT "emission_facilities_worksite_id_fkey" FOREIGN KEY ("worksite_id") REFERENCES "worksites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_audit_logs" ADD CONSTRAINT "activity_audit_logs_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "emission_facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_masters" ADD CONSTRAINT "kpi_masters_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_targets" ADD CONSTRAINT "kpi_targets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_performance" ADD CONSTRAINT "kpi_performance_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_change_log" ADD CONSTRAINT "kpi_change_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esg_metrics" ADD CONSTRAINT "esg_metrics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esg_reports" ADD CONSTRAINT "esg_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_items" ADD CONSTRAINT "compliance_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_disclosure_mappings" ADD CONSTRAINT "kpi_disclosure_mappings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiality_issues" ADD CONSTRAINT "materiality_issues_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reduction_projects" ADD CONSTRAINT "reduction_projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_validations" ADD CONSTRAINT "data_validations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_departments" ADD CONSTRAINT "org_departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_teams" ADD CONSTRAINT "org_teams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_positions" ADD CONSTRAINT "org_positions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_duties" ADD CONSTRAINT "org_duties_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_subscriptions" ADD CONSTRAINT "org_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_sources" ADD CONSTRAINT "integration_sources_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_sync_logs" ADD CONSTRAINT "integration_sync_logs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "integration_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
