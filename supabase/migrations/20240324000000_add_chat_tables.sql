-- Criar enum para status do chat
CREATE TYPE chat_status AS ENUM ('active', 'closed');

-- Criar tabela de chats
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  status chat_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(store_id, user_id, order_id)
);

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Criar função para atualizar updated_at do chat
CREATE OR REPLACE FUNCTION update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats SET updated_at = NOW() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at do chat quando uma nova mensagem é enviada
CREATE TRIGGER update_chat_updated_at_trigger
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_updated_at();

-- Criar políticas de segurança
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para chats
CREATE POLICY "Users can view their own chats"
ON chats FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM stores 
    WHERE id = store_id AND admin_id = auth.uid()
  )
);

CREATE POLICY "Users can create chats"
ON chats FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id 
    AND user_id = auth.uid()
    AND store_id = chats.store_id
  )
);

-- Políticas para mensagens
CREATE POLICY "Users can view messages from their chats"
ON chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chats
    WHERE id = chat_id
    AND (
      user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM stores 
        WHERE id = store_id AND admin_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can send messages to their chats"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chats
    WHERE id = chat_id
    AND (
      user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM stores 
        WHERE id = store_id AND admin_id = auth.uid()
      )
    )
  ) AND sender_id = auth.uid()
);

-- Criar função para buscar chats com informações do usuário
CREATE OR REPLACE FUNCTION get_chat_with_user_info(p_chat_id UUID)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  user_id UUID,
  order_id UUID,
  status chat_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_name TEXT,
  user_avatar_url TEXT,
  user_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.store_id,
    c.user_id,
    c.order_id,
    c.status,
    c.created_at,
    c.updated_at,
    (
      SELECT string_agg(part, ' ') 
      FROM (
        SELECT part 
        FROM unnest(string_to_array(u.raw_user_meta_data->>'name', ' ')) part 
        LIMIT 2
      ) s
    ) as user_name,
    u.raw_user_meta_data->>'picture' as user_avatar_url,
    p.email as user_email
  FROM chats c
  LEFT JOIN profiles p ON p.id = c.user_id
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE c.id = p_chat_id;
END;
$$ LANGUAGE plpgsql; 