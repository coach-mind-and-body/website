ALTER TABLE `calorie_logs` ADD `recipeId` int;
ALTER TABLE `calorie_logs` ADD `servings` int NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS `recipes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(160) NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text,
  `imageUrl` varchar(1000),
  `source` enum('coach','fatsecret','imported') NOT NULL DEFAULT 'coach',
  `fatsecretRecipeId` varchar(32),
  `fatsecretFoodId` varchar(32),
  `tagsJson` text,
  `mealSlotsJson` text,
  `prepMinutes` int NOT NULL DEFAULT 0,
  `cookMinutes` int NOT NULL DEFAULT 0,
  `servings` int NOT NULL DEFAULT 1,
  `calories` int NOT NULL DEFAULT 0,
  `protein` int NOT NULL DEFAULT 0,
  `carbs` int NOT NULL DEFAULT 0,
  `fat` int NOT NULL DEFAULT 0,
  `fiber` int NOT NULL DEFAULT 0,
  `ingredientsJson` text,
  `stepsJson` text,
  `notes` text,
  `showNutrition` boolean NOT NULL DEFAULT true,
  `isPublished` boolean NOT NULL DEFAULT false,
  `isFeatured` boolean NOT NULL DEFAULT false,
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `recipes_id` PRIMARY KEY(`id`),
  CONSTRAINT `recipes_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE IF NOT EXISTS `meal_plans` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text,
  `notes` text,
  `tagsJson` text,
  `servingsDefault` int NOT NULL DEFAULT 1,
  `showNutrition` boolean NOT NULL DEFAULT true,
  `isPublished` boolean NOT NULL DEFAULT false,
  `isFeatured` boolean NOT NULL DEFAULT false,
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `meal_plans_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `meal_plan_slots` (
  `id` int AUTO_INCREMENT NOT NULL,
  `mealPlanId` int NOT NULL,
  `dayOfWeek` int NOT NULL,
  `slot` enum('breakfast','lunch','dinner','snack','snack2') NOT NULL,
  `recipeId` int NOT NULL,
  `servings` int NOT NULL DEFAULT 1,
  `sortOrder` int NOT NULL DEFAULT 0,
  `notes` varchar(500),
  CONSTRAINT `meal_plan_slots_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `meal_plan_assignments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `mealPlanId` int NOT NULL,
  `userId` int NOT NULL,
  `startDate` varchar(10),
  `notes` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `meal_plan_assignments_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `recipe_favorites` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `recipeId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `recipe_favorites_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `shopping_list_items` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `mealPlanId` int,
  `name` varchar(500) NOT NULL,
  `amount` varchar(64),
  `unit` varchar(64),
  `aisle` varchar(32) NOT NULL DEFAULT 'other',
  `isChecked` boolean NOT NULL DEFAULT false,
  `source` enum('plan','custom') NOT NULL DEFAULT 'custom',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `shopping_list_items_id` PRIMARY KEY(`id`)
);
