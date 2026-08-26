CREATE TABLE `relationProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceActor` varchar(120) NOT NULL,
	`targetActor` varchar(120) NOT NULL,
	`relationType` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`detail` text NOT NULL,
	`sourceUrl` varchar(1000) NOT NULL,
	`startYear` int,
	`endYear` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`submitterId` int NOT NULL,
	`reviewerId` int,
	`reviewNote` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relationProposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `relationProposals` ADD CONSTRAINT `relationProposals_submitterId_users_id_fk` FOREIGN KEY (`submitterId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `relationProposals` ADD CONSTRAINT `relationProposals_reviewerId_users_id_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;