-- Função para buscar avaliações da loja
CREATE OR REPLACE FUNCTION get_store_ratings(p_store_id UUID)
RETURNS TABLE (
    avg_rating DECIMAL,
    total_ratings INTEGER,
    ratings JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH ratings_summary AS (
        SELECT 
            COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as avg_rating,
            COUNT(*) as total_ratings
        FROM order_ratings
        WHERE store_id = p_store_id
    ),
    detailed_ratings AS (
        SELECT 
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', r.id,
                        'rating', r.rating,
                        'food_rating', r.food_rating,
                        'delivery_rating', r.delivery_rating,
                        'comment', r.comment,
                        'created_at', r.created_at,
                        'user', json_build_object(
                            'name', (
                                SELECT string_agg(part, ' ') 
                                FROM (
                                    SELECT part 
                                    FROM unnest(string_to_array(u.raw_user_meta_data->>'name', ' ')) part 
                                    LIMIT 2
                                ) s
                            ),
                            'avatar_url', u.raw_user_meta_data->>'picture',
                            'email', p.email
                        )
                    ) ORDER BY r.created_at DESC
                ),
                '[]'::json
            ) as ratings
        FROM order_ratings r
        LEFT JOIN profiles p ON p.id = r.user_id
        LEFT JOIN auth.users u ON u.id = p.id
        WHERE r.store_id = p_store_id
    )
    SELECT 
        rs.avg_rating,
        rs.total_ratings,
        dr.ratings
    FROM ratings_summary rs
    CROSS JOIN detailed_ratings dr;
END;
$$ LANGUAGE plpgsql; 