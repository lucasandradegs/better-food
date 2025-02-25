-- Adiciona novas colunas na tabela notifications
ALTER TABLE public.notifications
ADD COLUMN viewed BOOLEAN DEFAULT false,
ADD COLUMN path TEXT;

-- Atualiza as notificações existentes para viewed = false
UPDATE public.notifications SET viewed = false WHERE viewed IS NULL;

-- Torna a coluna viewed NOT NULL após a atualização dos dados existentes
ALTER TABLE public.notifications ALTER COLUMN viewed SET NOT NULL;

-- Atualiza a função get_unread_notifications_count para considerar viewed
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count(p_user_id uuid)
RETURNS integer AS $$
BEGIN
    RETURN (
        SELECT count(*)
        FROM public.notifications
        WHERE user_id = p_user_id
        AND viewed = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 