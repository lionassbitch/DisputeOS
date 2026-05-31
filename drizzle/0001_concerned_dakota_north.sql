CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(128) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`fileKey` varchar(1024) NOT NULL,
	`fileUrl` varchar(2048) NOT NULL,
	`extractedText` text,
	`status` enum('uploaded','processing','parsed','analyzed','error') NOT NULL DEFAULT 'uploaded',
	`bureausFound` json,
	`errorMessage` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `credit_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dispute_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportId` int NOT NULL,
	`bureau` varchar(64) NOT NULL,
	`furnisher` varchar(256) NOT NULL,
	`accountName` varchar(256) NOT NULL,
	`accountNumber` varchar(128),
	`issueType` varchar(128) NOT NULL,
	`disputeReason` text NOT NULL,
	`confidenceScore` decimal(5,2) NOT NULL,
	`evidenceChecklist` json,
	`riskFlag` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`complianceFlag` boolean NOT NULL DEFAULT true,
	`recommendedRound` int NOT NULL DEFAULT 1,
	`deadlineStatus` enum('pending','active','approaching','overdue','resolved') NOT NULL DEFAULT 'pending',
	`userStatus` enum('pending_review','approved','rejected','edited') NOT NULL DEFAULT 'pending_review',
	`userNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dispute_candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dispute_letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`candidateId` int NOT NULL,
	`bureau` varchar(64) NOT NULL,
	`furnisher` varchar(256) NOT NULL,
	`letterContent` text NOT NULL,
	`letterPdfKey` varchar(1024),
	`letterPdfUrl` varchar(2048),
	`status` enum('draft','pending_review','approved','sent','delivered','responded') NOT NULL DEFAULT 'draft',
	`disputeRound` int NOT NULL DEFAULT 1,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dispute_letters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follow_up_rounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`candidateId` int NOT NULL,
	`letterId` int,
	`roundNumber` int NOT NULL,
	`scheduledDate` timestamp NOT NULL,
	`status` enum('scheduled','ready','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`triggerReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `follow_up_rounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mail_packets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`letterId` int NOT NULL,
	`provider` varchar(64) NOT NULL DEFAULT 'mock',
	`recipientName` varchar(256) NOT NULL,
	`recipientAddress` text NOT NULL,
	`trackingNumber` varchar(128),
	`dateSent` timestamp,
	`deadline` timestamp,
	`deliveryResult` enum('pending','in_transit','delivered','returned','failed') NOT NULL DEFAULT 'pending',
	`responseReceived` boolean NOT NULL DEFAULT false,
	`responseDate` timestamp,
	`responseNotes` text,
	`letterPdfKey` varchar(1024),
	`letterPdfUrl` varchar(2048),
	`status` enum('queued','processing','sent','delivered','failed','cancelled') NOT NULL DEFAULT 'queued',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mail_packets_id` PRIMARY KEY(`id`)
);
