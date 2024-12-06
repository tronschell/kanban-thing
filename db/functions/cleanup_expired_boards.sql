CREATE OR REPLACE FUNCTION cleanup_expired_boards()
RETURNS void AS $$
DECLARE
  expired_board_ids UUID[];
BEGIN
  -- Get all expired board IDs
  SELECT ARRAY_AGG(id)
  INTO expired_board_ids
  FROM boards
  WHERE expires_at < NOW();

  -- If there are no expired boards, exit early
  IF array_length(expired_board_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Delete card history for expired boards
  DELETE FROM card_history
  WHERE card_id IN (
    SELECT c.id 
    FROM cards c
    JOIN columns col ON c.column_id = col.id
    WHERE col.board_id = ANY(expired_board_ids)
  );

  -- Delete cards from expired boards
  DELETE FROM cards
  WHERE column_id IN (
    SELECT id 
    FROM columns 
    WHERE board_id = ANY(expired_board_ids)
  );

  -- Delete columns from expired boards
  DELETE FROM columns
  WHERE board_id = ANY(expired_board_ids);

  -- Delete board users from expired boards
  DELETE FROM board_users
  WHERE board_id = ANY(expired_board_ids);

  -- Finally delete expired boards
  DELETE FROM boards
  WHERE id = ANY(expired_board_ids);
END;
$$ LANGUAGE plpgsql;

-- Schedule the cleanup to run daily at midnight
SELECT cron.schedule('cleanup-expired-boards', '0 0 * * *', 'SELECT cleanup_expired_boards()');