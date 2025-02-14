-- Create store categories table
CREATE TABLE store_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product categories table
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stores table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES store_categories(id),
    order_count INTEGER DEFAULT 0,
    logo_url TEXT,
    admin_id UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_admin UNIQUE (admin_id)
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID NOT NULL REFERENCES product_categories(id),
    is_available BOOLEAN DEFAULT true,
    image_url TEXT,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_stores_admin_id ON stores(admin_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_stores_category_id ON stores(category_id);

-- Enable RLS on all tables
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
CREATE POLICY "Categories are viewable by everyone"
    ON store_categories FOR SELECT
    USING (true);

CREATE POLICY "Categories are manageable by admins only"
    ON store_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Product categories are viewable by everyone"
    ON product_categories FOR SELECT
    USING (true);

CREATE POLICY "Product categories are manageable by admins only"
    ON product_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS policies for stores
CREATE POLICY "Stores are viewable by everyone"
    ON stores FOR SELECT
    USING (true);

CREATE POLICY "Stores are insertable by admins only"
    ON stores FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Stores are updatable by store admin"
    ON stores FOR UPDATE
    USING (admin_id = auth.uid());

CREATE POLICY "Stores are deletable by store admin"
    ON stores FOR DELETE
    USING (admin_id = auth.uid());

-- RLS policies for products
CREATE POLICY "Products are viewable by everyone"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Products are insertable by store admin"
    ON products FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = products.store_id
            AND stores.admin_id = auth.uid()
        )
    );

CREATE POLICY "Products are updatable by store admin"
    ON products FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = products.store_id
            AND stores.admin_id = auth.uid()
        )
    );

CREATE POLICY "Products are deletable by store admin"
    ON products FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = products.store_id
            AND stores.admin_id = auth.uid()
        )
    );

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_categories_updated_at
    BEFORE UPDATE ON store_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial categories (você pode modificar ou adicionar mais conforme necessário)
INSERT INTO store_categories (name) VALUES
    ('Pizzaria'),
    ('Hamburgueria'),
    ('Sushi'),
    ('Mexicana'),
    ('Doceria'),
    ('Cafeteria'),
    ('Sorveteria'),
    ('Restaurante');

INSERT INTO product_categories (name) VALUES
    ('Bebidas'),
    ('Entradas'),
    ('Pratos Principais'),
    ('Sobremesas'),
    ('Lanches'),
    ('Combos'),
    ('Promoções'),
    ('Porções'); 