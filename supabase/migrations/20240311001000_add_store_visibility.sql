-- Adiciona a coluna is_visible na tabela stores
ALTER TABLE stores
ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT true;

-- Atualiza a política RLS de visualização para considerar o campo is_visible
DROP POLICY IF EXISTS "Stores are viewable by everyone" ON stores;
CREATE POLICY "Stores are viewable by everyone"
    ON stores FOR SELECT
    USING (
        is_visible = true 
        OR 
        auth.uid() = admin_id
    );

-- Cria um índice para melhorar a performance de consultas por visibilidade
CREATE INDEX idx_stores_visibility ON stores(is_visible);

-- Comentário na coluna para documentação
COMMENT ON COLUMN stores.is_visible IS 'Controla se a loja está visível para o público. Se false, apenas o admin da loja pode ver.'; 