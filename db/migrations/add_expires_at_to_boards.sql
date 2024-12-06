ALTER TABLE boards 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE 
DEFAULT (NOW() + INTERVAL '2 months');

-- Update existing boards to have an expiration date
UPDATE boards 
SET expires_at = created_at + INTERVAL '2 months' 
WHERE expires_at IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE boards 
ALTER COLUMN expires_at SET NOT NULL; 