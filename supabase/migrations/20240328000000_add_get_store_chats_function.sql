-- Função para buscar chats da loja
CREATE OR REPLACE FUNCTION get_store_chats(store_id_param UUID)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  user_id UUID,
  order_id UUID,
  status chat_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_name TEXT,
  user_email TEXT,
  user_avatar_url TEXT,
  last_viewed_at TIMESTAMPTZ,
  has_new_messages BOOLEAN
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH last_messages AS (
    SELECT 
      chat_id,
      MAX(chat_messages.created_at) as last_message_at
    FROM chat_messages
    GROUP BY chat_id
  )
  SELECT 
    c.id,
    c.store_id,
    c.user_id,
    c.order_id,
    c.status,
    c.created_at,
    c.updated_at,
    COALESCE(
      (
        SELECT string_agg(part, ' ') 
        FROM (
          SELECT part 
          FROM unnest(string_to_array(u.raw_user_meta_data->>'name', ' ')) part 
          LIMIT 2
        ) s
      ),
      p.email
    ) as user_name,
    p.email as user_email,
    u.raw_user_meta_data->>'picture' as user_avatar_url,
    c.last_viewed_at,
    COALESCE(c.has_new_messages, false) as has_new_messages
  FROM chats c
  INNER JOIN profiles p ON p.id = c.user_id
  INNER JOIN auth.users u ON u.id = p.id
  LEFT JOIN last_messages lm ON c.id = lm.chat_id
  WHERE c.store_id = store_id_param
  AND c.status = 'active'
  ORDER BY c.updated_at DESC;
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION get_store_chats TO authenticated; 