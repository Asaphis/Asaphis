-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'TRUSTED_MEMBER', 'MODERATOR', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'SECURITY_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'LIMITED', 'VERIFICATION_REQUIRED', 'TRAVEL_RESTRICTED', 'COMMENT_RESTRICTED', 'SUBMISSION_RESTRICTED', 'UPLOAD_RESTRICTED', 'PAYMENT_RESTRICTED', 'SECURITY_HOLD', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "MembershipStage" AS ENUM ('REGISTERED', 'PHONE_VERIFICATION', 'IDENTITY_VERIFICATION', 'ELIGIBILITY_CHECK', 'SECURITY_CHECK', 'CONTRIBUTION', 'ACTIVE_MEMBER');

-- CreateEnum
CREATE TYPE "IdentityStatus" AS ENUM ('NOT_STARTED', 'PHONE_VERIFIED', 'SUBMITTED', 'PROCESSING', 'VERIFIED', 'FAILED', 'NEEDS_REVIEW', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PhoneChannel" AS ENUM ('SMS', 'WHATSAPP', 'VOICE', 'EMAIL');

-- CreateEnum
CREATE TYPE "VerificationResult" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'NEEDS_REVIEW', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AccessDecision" AS ENUM ('ALLOW', 'DENY', 'REQUIRE_MFA', 'REQUIRE_VERIFICATION', 'LIMITED_ACCESS', 'MANUAL_REVIEW', 'TEMPORARY_RESTRICTION');

-- CreateEnum
CREATE TYPE "ContentVisibility" AS ENUM ('PUBLIC', 'MEMBER', 'VERIFIED_MEMBER', 'TRUSTED_MEMBER', 'INTERNAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'HIDDEN', 'ARCHIVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "TravelStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'PUSH', 'EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('OPEN', 'WAITING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RestrictionType" AS ENUM ('LIMITED', 'VERIFICATION_REQUIRED', 'TRAVEL_RESTRICTED', 'COMMENT_RESTRICTED', 'SUBMISSION_RESTRICTED', 'UPLOAD_RESTRICTED', 'PAYMENT_RESTRICTED', 'SECURITY_HOLD', 'SUSPENDED', 'BANNED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "phone" TEXT,
    "phoneVerifiedAt" TIMESTAMP(3),
    "passwordHash" TEXT,
    "roles" "UserRole"[] DEFAULT ARRAY['MEMBER']::"UserRole"[],
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "membershipStage" "MembershipStage" NOT NULL DEFAULT 'REGISTERED',
    "termsAcceptedAt" TIMESTAMP(3),
    "privacyAcceptedAt" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberCode" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "initials" TEXT,
    "citizenshipCountry" TEXT,
    "currentCountry" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "trustStatus" TEXT NOT NULL DEFAULT 'standard',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "allowedDocuments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verificationProvider" TEXT NOT NULL DEFAULT 'mock',
    "govIdCheckEnabled" BOOLEAN NOT NULL DEFAULT false,
    "phoneRequired" BOOLEAN NOT NULL DEFAULT true,
    "livenessRequired" BOOLEAN NOT NULL DEFAULT true,
    "manualReview" BOOLEAN NOT NULL DEFAULT true,
    "eligibilityRule" TEXT NOT NULL DEFAULT '',
    "travelRule" TEXT NOT NULL DEFAULT '',
    "accessRule" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "contributionAmount" DECIMAL(12,2),
    "paymentProviders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "paymentMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usesGlobalFallback" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "CountryRule" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "config" JSONB NOT NULL DEFAULT '{}',
    "secretConfigured" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "channel" "PhoneChannel" NOT NULL DEFAULT 'SMS',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "countryCode" TEXT,
    "documentType" TEXT,
    "status" "IdentityStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "providerReference" TEXT,
    "matchScore" DECIMAL(5,4),
    "documentHash" TEXT,
    "idNumberLast4" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityVerification" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "status" "VerificationResult" NOT NULL DEFAULT 'PENDING',
    "resultSummary" TEXT,
    "rawResponse" JSONB,
    "riskIndicators" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityDocument" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "label" TEXT,
    "deviceType" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastIp" TEXT,
    "lastCountry" TEXT,
    "trusted" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "refreshHash" TEXT NOT NULL,
    "ip" TEXT,
    "country" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "signals" JSONB NOT NULL DEFAULT '{}',
    "previousCountry" TEXT,
    "currentCountry" TEXT,
    "level" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "level" "RiskLevel" NOT NULL,
    "score" INTEGER NOT NULL,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rules" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessDecisionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "decision" "AccessDecision" NOT NULL,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "context" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verifiedCountry" TEXT,
    "currentIpCountry" TEXT,
    "destination" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "additionalInformation" TEXT,
    "status" "TravelStatus" NOT NULL DEFAULT 'PENDING',
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelAccessGrant" (
    "id" TEXT NOT NULL,
    "travelRequestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restriction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RestrictionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "affectedFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "appliedBy" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "liftedAt" TIMESTAMP(3),
    "liftedBy" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Restriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestrictionHistory" (
    "id" TEXT NOT NULL,
    "restrictionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "note" TEXT,
    "previousState" JSONB,
    "newState" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestrictionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "SupportStatus" NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL DEFAULT 'member',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Article',
    "body" TEXT NOT NULL DEFAULT '',
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ContentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "summary" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSubmission" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewerNote" TEXT,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "targetKind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "flags" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actorRole" TEXT,
    "targetKind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunitySetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunitySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "audience" TEXT NOT NULL DEFAULT 'member',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "push" BOOLEAN NOT NULL DEFAULT false,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "sms" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "categories" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentConfiguration" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "providers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "methods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "providerPriority" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "countryCode" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "method" TEXT,
    "provider" TEXT,
    "providerReference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "webhookVerified" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "kind" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "scanStatus" TEXT NOT NULL DEFAULT 'pending',
    "private" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "props" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "adminRole" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "previousState" JSONB,
    "newState" JSONB,
    "ip" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_memberCode_key" ON "Member"("memberCode");

-- CreateIndex
CREATE INDEX "Member_memberCode_idx" ON "Member"("memberCode");

-- CreateIndex
CREATE INDEX "Member_citizenshipCountry_idx" ON "Member"("citizenshipCountry");

-- CreateIndex
CREATE UNIQUE INDEX "CountryRule_countryCode_key_key" ON "CountryRule"("countryCode", "key");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationProvider_name_key" ON "VerificationProvider"("name");

-- CreateIndex
CREATE INDEX "PhoneVerification_userId_createdAt_idx" ON "PhoneVerification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PhoneVerification_phone_idx" ON "PhoneVerification"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityProfile_userId_key" ON "IdentityProfile"("userId");

-- CreateIndex
CREATE INDEX "IdentityVerification_profileId_createdAt_idx" ON "IdentityVerification"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "Device_userId_lastSeenAt_idx" ON "Device"("userId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Device_userId_deviceKey_key" ON "Device"("userId", "deviceKey");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshHash_key" ON "Session"("refreshHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_refreshHash_idx" ON "Session"("refreshHash");

-- CreateIndex
CREATE INDEX "RiskEvent_userId_createdAt_idx" ON "RiskEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RiskEvent_level_status_idx" ON "RiskEvent"("level", "status");

-- CreateIndex
CREATE INDEX "RiskScore_userId_createdAt_idx" ON "RiskScore"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AccessPolicy_name_key" ON "AccessPolicy"("name");

-- CreateIndex
CREATE INDEX "AccessDecisionLog_userId_createdAt_idx" ON "AccessDecisionLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AccessDecisionLog_action_decision_idx" ON "AccessDecisionLog"("action", "decision");

-- CreateIndex
CREATE INDEX "TravelRequest_userId_status_idx" ON "TravelRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "TravelAccessGrant_userId_endsAt_idx" ON "TravelAccessGrant"("userId", "endsAt");

-- CreateIndex
CREATE INDEX "Restriction_userId_active_idx" ON "Restriction"("userId", "active");

-- CreateIndex
CREATE INDEX "SupportRequest_status_createdAt_idx" ON "SupportRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportRequest_userId_idx" ON "SupportRequest"("userId");

-- CreateIndex
CREATE INDEX "ContentItem_status_visibility_idx" ON "ContentItem"("status", "visibility");

-- CreateIndex
CREATE INDEX "ContentItem_section_sortOrder_idx" ON "ContentItem"("section", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_contentId_version_key" ON "ContentVersion"("contentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "LandingSection_key_key" ON "LandingSection"("key");

-- CreateIndex
CREATE INDEX "ContentSubmission_status_createdAt_idx" ON "ContentSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_targetKind_targetId_idx" ON "Comment"("targetKind", "targetId");

-- CreateIndex
CREATE INDEX "Comment_status_idx" ON "Comment"("status");

-- CreateIndex
CREATE INDEX "ModerationAction_targetKind_targetId_idx" ON "ModerationAction"("targetKind", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunitySetting_key_key" ON "CommunitySetting"("key");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_category_idx" ON "Notification"("category");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentConfiguration_countryCode_currency_key" ON "PaymentConfiguration"("countryCode", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerReference_key" ON "Payment"("providerReference");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FileAsset_ownerId_idx" ON "FileAsset"("ownerId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminEmail_createdAt_idx" ON "AdminAuditLog"("adminEmail", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneVerification" ADD CONSTRAINT "PhoneVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityProfile" ADD CONSTRAINT "IdentityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityDocument" ADD CONSTRAINT "IdentityDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityDocument" ADD CONSTRAINT "IdentityDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskEvent" ADD CONSTRAINT "RiskEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessDecisionLog" ADD CONSTRAINT "AccessDecisionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelAccessGrant" ADD CONSTRAINT "TravelAccessGrant_travelRequestId_fkey" FOREIGN KEY ("travelRequestId") REFERENCES "TravelRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restriction" ADD CONSTRAINT "Restriction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestrictionHistory" ADD CONSTRAINT "RestrictionHistory_restrictionId_fkey" FOREIGN KEY ("restrictionId") REFERENCES "Restriction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

