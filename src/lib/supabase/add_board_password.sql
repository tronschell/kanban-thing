-- Add password_hash column to boards table
ALTER TABLE boards
ADD COLUMN password_hash TEXT DEFAULT NULL;

-- Create function to verify board password
CREATE OR REPLACE FUNCTION verify_board_password(
  board_id_param UUID,
  password_attempt TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get the stored hash for the board
  SELECT password_hash INTO stored_hash
  FROM boards
  WHERE id = board_id_param;
  
  -- If no password is set, return true
  IF stored_hash IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Compare password attempt with stored hash
  RETURN stored_hash = crypt(password_attempt, stored_hash);
END;
$$;

-- Create function to set board password
CREATE OR REPLACE FUNCTION set_board_password(
  board_id_param UUID,
  new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE boards
  SET password_hash = 
    CASE 
      WHEN new_password IS NULL OR new_password = '' 
      THEN NULL 
      ELSE crypt(new_password, gen_salt('bf'))
    END
  WHERE id = board_id_param;
  
  RETURN FOUND;
END;
$$; 