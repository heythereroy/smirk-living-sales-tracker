-- The live `products` table is currently empty. Run this once in the
-- Supabase SQL Editor to load the 20 launch products (from the original
-- product list). image_url is left null — add photos later via
-- Admin -> Products, or paste URLs directly here first.

insert into products (name, price, category, image_url) values
  ('Watermelon', 500, 'Salt & Pepper Sprinklers', null),
  ('Cactus', 500, 'Salt & Pepper Sprinklers', null),
  ('Mushroom', 500, 'Salt & Pepper Sprinklers', null),
  ('Badla Bhui Mug (Set)', 700, 'Mugs & Bowls', null),
  ('Potli Mug (Set)', 650, 'Mugs & Bowls', null),
  ('Bow Mug Heart (Set)', 650, 'Mugs & Bowls', null),
  ('Bow Mug Dots (Set)', 650, 'Mugs & Bowls', null),
  ('Strawberry Mug (Set)', 650, 'Mugs & Bowls', null),
  ('Cappuccino Mug Pista Green (Set)', 700, 'Mugs & Bowls', null),
  ('Cappuccino Mug Ivory (Set)', 700, 'Mugs & Bowls', null),
  ('Cappuccino Mug Teal Green (Set)', 700, 'Mugs & Bowls', null),
  ('Blue Striped Mug (Set)', 550, 'Mugs & Bowls', null),
  ('White Plane Mug (Set)', 450, 'Mugs & Bowls', null),
  ('Pink Heart Cup & Saucer', 400, 'Mugs & Bowls', null),
  ('Orange Round Bowl', 999, 'Mugs & Bowls', null),
  ('Pear Shaped Bowl', 999, 'Mugs & Bowls', null),
  ('Apple Shaped Bowl', 1999, 'Mugs & Bowls', null),
  ('Pizza Plate (Single)', 200, 'Serveware', null),
  ('Pizza Set (7 piece)', 1200, 'Serveware', null),
  ('Strawberry Plate Set', 1299, 'Serveware', null);
