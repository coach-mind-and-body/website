ALTER TABLE `habit_templates` ADD `type` enum('boolean','numeric') DEFAULT 'boolean' NOT NULL;--> statement-breakpoint
ALTER TABLE `habit_templates` ADD `targetValue` int;--> statement-breakpoint
ALTER TABLE `habit_templates` ADD `unit` varchar(50);--> statement-breakpoint
ALTER TABLE `user_habit_logs` ADD `numericValue` int;--> statement-breakpoint
ALTER TABLE `user_habits` ADD `type` enum('boolean','numeric') DEFAULT 'boolean' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_habits` ADD `targetValue` int;--> statement-breakpoint
ALTER TABLE `user_habits` ADD `unit` varchar(50);