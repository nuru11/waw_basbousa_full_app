-- Fix corrupted transfers.amount_remaining from purchases (FIFO rebuild result).
-- Total remaining: 526359 - 712451 = -186092

UPDATE transfers SET amount_remaining = 0.00 WHERE id IN (22, 23, 24);
UPDATE transfers SET amount_remaining = -186092.00 WHERE id = 25;
