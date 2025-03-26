-- Função para calcular métricas da loja
CREATE OR REPLACE FUNCTION get_store_metrics(p_store_id UUID, p_days_ago INTEGER)
RETURNS TABLE (
    total_orders INTEGER,
    total_revenue DECIMAL,
    average_order_value DECIMAL,
    total_products INTEGER,
    top_products JSON,
    sales_by_day JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH order_metrics AS (
        SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COALESCE(AVG(total_amount), 0) as average_order_value
        FROM orders o
        INNER JOIN payments p ON p.order_id = o.id
        WHERE o.store_id = p_store_id
        AND o.created_at >= NOW() - (p_days_ago || ' days')::INTERVAL
        AND p.status = 'PAID'
        AND o.status NOT IN ('cancelled', 'refunded')
    ),
    products_count AS (
        SELECT COUNT(*) as total_products
        FROM products
        WHERE store_id = p_store_id
    ),
    top_products_data AS (
        SELECT 
            p.id,
            p.name,
            p.image_url,
            COUNT(oi.id) as total_sales,
            COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_revenue
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o ON o.id = oi.order_id
        LEFT JOIN payments pay ON pay.order_id = o.id
        WHERE p.store_id = p_store_id
        AND o.created_at >= NOW() - (p_days_ago || ' days')::INTERVAL
        AND pay.status = 'PAID'
        AND o.status NOT IN ('cancelled', 'refunded')
        GROUP BY p.id, p.name, p.image_url
        ORDER BY total_sales DESC
        LIMIT 5
    ),
    daily_sales AS (
        SELECT 
            DATE(o.created_at) as date,
            COALESCE(SUM(o.total_amount), 0) as total
        FROM orders o
        INNER JOIN payments p ON p.order_id = o.id
        WHERE o.store_id = p_store_id
        AND o.created_at >= NOW() - (p_days_ago || ' days')::INTERVAL
        AND p.status = 'PAID'
        AND o.status NOT IN ('cancelled', 'refunded')
        GROUP BY DATE(o.created_at)
        ORDER BY DATE(o.created_at)
    )
    SELECT 
        om.total_orders,
        om.total_revenue,
        om.average_order_value,
        pc.total_products,
        COALESCE(json_agg(tp.*), '[]'::json) as top_products,
        COALESCE(json_agg(ds.*), '[]'::json) as sales_by_day
    FROM order_metrics om
    CROSS JOIN products_count pc
    LEFT JOIN top_products_data tp ON true
    LEFT JOIN daily_sales ds ON true
    GROUP BY om.total_orders, om.total_revenue, om.average_order_value, pc.total_products;
END;
$$ LANGUAGE plpgsql; 