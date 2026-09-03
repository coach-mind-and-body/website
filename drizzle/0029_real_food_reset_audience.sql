-- Add Real Food Reset challenge audience for newsletter sends
ALTER TABLE `email_newsletters`
  MODIFY COLUMN `audienceGroup` ENUM('finance','health','all','snack_hack','real_food_reset') NOT NULL DEFAULT 'health';
