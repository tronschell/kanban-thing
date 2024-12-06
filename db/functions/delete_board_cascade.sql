CREATE OR REPLACE FUNCTION delete_board_cascade(board_id_param UUID)
RETURNS void AS $$
BEGIN
    -- Delete card history first (references cards)
    DELETE FROM card_history
    WHERE card_id IN (
        SELECT id FROM cards
        WHERE column_id IN (
            SELECT id FROM columns
            WHERE board_id = board_id_param
        )
    );

    -- Delete card tags (references cards and tags)
    DELETE FROM card_tags
    WHERE card_id IN (
        SELECT id FROM cards
        WHERE column_id IN (
            SELECT id FROM columns
            WHERE board_id = board_id_param
        )
    );

    -- Delete tags associated with the board
    DELETE FROM tags
    WHERE board_id = board_id_param;

    -- Delete cards (references columns)
    DELETE FROM cards
    WHERE column_id IN (
        SELECT id FROM columns
        WHERE board_id = board_id_param
    );

    -- Delete columns (references board)
    DELETE FROM columns
    WHERE board_id = board_id_param;

    -- Delete board users (references board)
    DELETE FROM board_users
    WHERE board_id = board_id_param;

    -- Finally delete the board itself
    DELETE FROM boards
    WHERE id = board_id_param;
END;
$$ LANGUAGE plpgsql; 