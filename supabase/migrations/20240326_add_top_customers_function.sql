-- Função para buscar os melhores clientes da loja
CREATE OR REPLACE FUNCTION get_top_customers(store_id_param UUID, limit_param INTEGER)
RETURNS TABLE (
    email TEXT,
    orders BIGINT,
    total_spent DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.email,
        COUNT(o.id) as orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent
    FROM orders o
    INNER JOIN profiles p ON p.id = o.user_id
    INNER JOIN payments pay ON pay.order_id = o.id
    WHERE o.store_id = store_id_param
    AND pay.status = 'PAID'
    AND o.status NOT IN ('cancelled', 'refunded')
    GROUP BY p.email
    ORDER BY orders DESC, total_spent DESC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql; 