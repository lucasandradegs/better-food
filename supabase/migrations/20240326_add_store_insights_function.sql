-- Função para gerar insights da loja
CREATE OR REPLACE FUNCTION get_store_insights(p_store_id UUID, p_days_ago INTEGER)
RETURNS TABLE (
    insight_type TEXT,
    title TEXT,
    description TEXT,
    metric_value DECIMAL,
    trend_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH current_period AS (
        SELECT 
            COUNT(*) as orders_count,
            COALESCE(SUM(total_amount), 0) as total_revenue
        FROM orders o
        INNER JOIN payments p ON p.order_id = o.id
        WHERE o.store_id = p_store_id
        AND o.created_at >= NOW() - (p_days_ago || ' days')::INTERVAL
        AND p.status = 'PAID'
        AND o.status NOT IN ('cancelled', 'refunded')
    ),
    previous_period AS (
        SELECT 
            COUNT(*) as orders_count,
            COALESCE(SUM(total_amount), 0) as total_revenue
        FROM orders o
        INNER JOIN payments p ON p.order_id = o.id
        WHERE o.store_id = p_store_id
        AND o.created_at >= NOW() - (p_days_ago * 2 || ' days')::INTERVAL
        AND o.created_at < NOW() - (p_days_ago || ' days')::INTERVAL
        AND p.status = 'PAID'
        AND o.status NOT IN ('cancelled', 'refunded')
    )
    SELECT 
        'revenue'::TEXT as insight_type,
        'Faturamento'::TEXT as title,
        CASE 
            WHEN cp.total_revenue > pp.total_revenue THEN 'Aumento no faturamento em relação ao período anterior'
            ELSE 'Redução no faturamento em relação ao período anterior'
        END::TEXT as description,
        cp.total_revenue as metric_value,
        CASE 
            WHEN pp.total_revenue = 0 THEN 0
            ELSE ROUND(((cp.total_revenue - pp.total_revenue) / pp.total_revenue * 100)::numeric, 1)
        END as trend_percentage
    FROM current_period cp
    CROSS JOIN previous_period pp
    
    UNION ALL
    
    SELECT 
        'orders'::TEXT as insight_type,
        'Pedidos'::TEXT as title,
        CASE 
            WHEN cp.orders_count > pp.orders_count THEN 'Aumento no número de pedidos em relação ao período anterior'
            ELSE 'Redução no número de pedidos em relação ao período anterior'
        END::TEXT as description,
        cp.orders_count::decimal as metric_value,
        CASE 
            WHEN pp.orders_count = 0 THEN 0
            ELSE ROUND(((cp.orders_count - pp.orders_count) / pp.orders_count * 100)::numeric, 1)
        END as trend_percentage
    FROM current_period cp
    CROSS JOIN previous_period pp;
END;
$$ LANGUAGE plpgsql; 