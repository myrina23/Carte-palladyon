CREATE TABLE `snapshotCollectionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectionId` int NOT NULL,
	`label` varchar(160) NOT NULL,
	`snapshotJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `snapshotCollectionItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `snapshotCollections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`shareKey` varchar(64) NOT NULL,
	`visibility` enum('private','shared') NOT NULL DEFAULT 'private',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `snapshotCollections_id` PRIMARY KEY(`id`),
	CONSTRAINT `snapshotCollections_shareKey_unique` UNIQUE(`shareKey`)
);
--> statement-breakpoint
ALTER TABLE `snapshotCollectionItems` ADD CONSTRAINT `snapshotCollectionItems_collectionId_snapshotCollections_id_fk` FOREIGN KEY (`collectionId`) REFERENCES `snapshotCollections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `snapshotCollections` ADD CONSTRAINT `snapshotCollections_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;