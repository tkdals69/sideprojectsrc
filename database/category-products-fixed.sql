-- 카테고리별 상품 데이터 추가
-- Electronics 카테고리 상품들
INSERT INTO catalog_service.products (id, name, description, price, category, image_url, is_active, created_at, updated_at) VALUES
-- 스마트폰
('650e8400-e29b-41d4-a716-446655440011', 'iPhone 15 Pro Max', 'Apple iPhone 15 Pro Max 256GB Natural Titanium', 1199.99, 'Electronics', 'https://example.com/iphone15promax.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440012', 'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24 Ultra 512GB Titanium Black', 1299.99, 'Electronics', 'https://example.com/galaxys24ultra.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440013', 'Google Pixel 8 Pro', 'Google Pixel 8 Pro 256GB Obsidian', 999.99, 'Electronics', 'https://example.com/pixel8pro.jpg', true, NOW(), NOW()),

-- 노트북
('650e8400-e29b-41d4-a716-446655440014', 'MacBook Pro 16" M3', 'Apple MacBook Pro 16-inch M3 Pro 512GB Space Gray', 2499.99, 'Electronics', 'https://example.com/macbookpro16.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440015', 'Dell XPS 15', 'Dell XPS 15 9530 Intel i7 16GB 512GB', 1899.99, 'Electronics', 'https://example.com/dellxps15.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440016', 'Surface Laptop 5', 'Microsoft Surface Laptop 5 13.5" Intel i7 16GB 512GB', 1299.99, 'Electronics', 'https://example.com/surfacelaptop5.jpg', true, NOW(), NOW()),

-- 태블릿
('650e8400-e29b-41d4-a716-446655440017', 'iPad Pro 12.9" M2', 'Apple iPad Pro 12.9-inch M2 256GB Space Gray', 1099.99, 'Electronics', 'https://example.com/ipadpro12.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440018', 'Samsung Galaxy Tab S9', 'Samsung Galaxy Tab S9 11" 256GB Graphite', 799.99, 'Electronics', 'https://example.com/galaxytabs9.jpg', true, NOW(), NOW()),

-- 오디오
('650e8400-e29b-41d4-a716-446655440019', 'AirPods Pro 2nd Gen', 'Apple AirPods Pro 2nd Generation with MagSafe Case', 249.99, 'Electronics', 'https://example.com/airpodspro2.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440020', 'Sony WH-1000XM5', 'Sony WH-1000XM5 Wireless Noise Canceling Headphones', 399.99, 'Electronics', 'https://example.com/sonywh1000xm5.jpg', true, NOW(), NOW()),

-- 게임
('650e8400-e29b-41d4-a716-446655440021', 'PlayStation 5', 'Sony PlayStation 5 Console', 499.99, 'Electronics', 'https://example.com/ps5.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440022', 'Xbox Series X', 'Microsoft Xbox Series X Console', 499.99, 'Electronics', 'https://example.com/xboxseriesx.jpg', true, NOW(), NOW()),

-- Fashion 카테고리 상품들
('650e8400-e29b-41d4-a716-446655440023', 'Nike Air Max 270', 'Nike Air Max 270 Mens Running Shoes', 150.99, 'Fashion', 'https://example.com/nikeairmax270.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440024', 'Adidas Ultraboost 22', 'Adidas Ultraboost 22 Mens Running Shoes', 180.99, 'Fashion', 'https://example.com/adidasultraboost22.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440025', 'Levis 501 Original Jeans', 'Levis 501 Original Fit Jeans Mens', 89.99, 'Fashion', 'https://example.com/levis501.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440026', 'Uniqlo Heattech Crew Neck', 'Uniqlo Heattech Crew Neck Long Sleeve T-Shirt', 19.99, 'Fashion', 'https://example.com/uniqloheattech.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440027', 'Zara Blazer', 'Zara Womens Blazer Jacket', 79.99, 'Fashion', 'https://example.com/zarablazer.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440028', 'H&M Basic T-Shirt', 'H&M Basic Cotton T-Shirt', 9.99, 'Fashion', 'https://example.com/hmbasictshirt.jpg', true, NOW(), NOW()),

-- Home & Kitchen 카테고리 상품들
('650e8400-e29b-41d4-a716-446655440029', 'Instant Pot Duo 7-in-1', 'Instant Pot Duo 7-in-1 Electric Pressure Cooker', 99.99, 'Home & Kitchen', 'https://example.com/instantpotduo.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440030', 'KitchenAid Stand Mixer', 'KitchenAid Artisan Stand Mixer 5-Qt', 299.99, 'Home & Kitchen', 'https://example.com/kitchenaidmixer.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440031', 'Dyson V15 Detect', 'Dyson V15 Detect Cordless Vacuum Cleaner', 649.99, 'Home & Kitchen', 'https://example.com/dysonv15.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440032', 'Ninja Foodi Blender', 'Ninja Foodi Personal Blender for Shakes', 79.99, 'Home & Kitchen', 'https://example.com/ninjafoodi.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440033', 'Casper Mattress', 'Casper Original Mattress Queen Size', 1095.00, 'Home & Kitchen', 'https://example.com/caspermattress.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440034', 'Roomba i7+', 'iRobot Roomba i7+ Robot Vacuum', 599.99, 'Home & Kitchen', 'https://example.com/roombai7.jpg', true, NOW(), NOW()),

-- Sports 카테고리 상품들
('650e8400-e29b-41d4-a716-446655440035', 'Wilson Pro Staff Tennis Racket', 'Wilson Pro Staff 97 Tennis Racket', 199.99, 'Sports', 'https://example.com/wilsonprostaff.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440036', 'Nike Basketball', 'Nike Official Game Basketball', 29.99, 'Sports', 'https://example.com/nikebasketball.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440037', 'Adidas Soccer Cleats', 'Adidas Predator Edge Soccer Cleats', 149.99, 'Sports', 'https://example.com/adidaspredator.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440038', 'Yoga Mat Premium', 'Liforme Yoga Mat with Alignment Lines', 89.99, 'Sports', 'https://example.com/liformeyogamat.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440039', 'Garmin Forerunner 945', 'Garmin Forerunner 945 GPS Running Watch', 599.99, 'Sports', 'https://example.com/garminforerunner945.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440040', 'Peloton Bike', 'Peloton Original Bike', 1495.00, 'Sports', 'https://example.com/pelotonbike.jpg', true, NOW(), NOW()),

-- Books 카테고리 상품들
('650e8400-e29b-41d4-a716-446655440041', 'Atomic Habits', 'Atomic Habits by James Clear', 16.99, 'Books', 'https://example.com/atomichabits.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440042', 'The Lean Startup', 'The Lean Startup by Eric Ries', 18.99, 'Books', 'https://example.com/leanstartup.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440043', 'Clean Code', 'Clean Code by Robert C. Martin', 45.99, 'Books', 'https://example.com/cleancode.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440044', 'Sapiens', 'Sapiens by Yuval Noah Harari', 19.99, 'Books', 'https://example.com/sapiens.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440045', 'The Psychology of Money', 'The Psychology of Money by Morgan Housel', 14.99, 'Books', 'https://example.com/psychologyofmoney.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440046', 'Dune', 'Dune by Frank Herbert', 17.99, 'Books', 'https://example.com/dune.jpg', true, NOW(), NOW()),

-- Beauty 카테고리 상품들
('650e8400-e29b-41d4-a716-446655440047', 'La Mer Cream', 'La Mer The Moisturizing Cream 1oz', 180.00, 'Beauty', 'https://example.com/lamercream.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440048', 'SK-II Facial Treatment Essence', 'SK-II Facial Treatment Essence 5.4oz', 199.99, 'Beauty', 'https://example.com/sk2essence.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440049', 'Chanel No. 5 Perfume', 'Chanel No. 5 Eau de Parfum 3.4oz', 150.00, 'Beauty', 'https://example.com/chanelno5.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440050', 'Dyson Supersonic Hair Dryer', 'Dyson Supersonic Hair Dryer', 399.99, 'Beauty', 'https://example.com/dysonsupersonic.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440051', 'The Ordinary Niacinamide', 'The Ordinary Niacinamide 10% + Zinc 1%', 7.20, 'Beauty', 'https://example.com/theordinaryniacinamide.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440052', 'Fenty Beauty Foundation', 'Fenty Beauty Pro Filtr Soft Matte Foundation', 35.00, 'Beauty', 'https://example.com/fentybeautyfoundation.jpg', true, NOW(), NOW()),

-- Health & Wellness 카테고리 상품들
('650e8400-e29b-41d4-a716-446655440053', 'Apple Watch Series 9', 'Apple Watch Series 9 GPS 45mm', 429.99, 'Health & Wellness', 'https://example.com/applewatchseries9.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440054', 'Fitbit Charge 5', 'Fitbit Charge 5 Fitness Tracker', 179.99, 'Health & Wellness', 'https://example.com/fitbitcharge5.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440055', 'Vitamix A3500', 'Vitamix A3500 Ascent Series Blender', 599.99, 'Health & Wellness', 'https://example.com/vitamixa3500.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440056', 'Theragun Elite', 'Theragun Elite Percussive Therapy Device', 399.99, 'Health & Wellness', 'https://example.com/theragunelite.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440057', 'Nutribullet Pro', 'Nutribullet Pro 900 Series Blender', 99.99, 'Health & Wellness', 'https://example.com/nutribulletpro.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440058', 'Oura Ring Gen 3', 'Oura Ring Gen 3 Heritage Gold', 299.99, 'Health & Wellness', 'https://example.com/ouraringgen3.jpg', true, NOW(), NOW()),

-- Automotive 카테고리 상품들
('650e8400-e29b-41d4-a716-446655440059', 'Tesla Model 3', 'Tesla Model 3 Standard Range Plus', 39990.00, 'Automotive', 'https://example.com/teslamodel3.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440060', 'BMW i4', 'BMW i4 eDrive40 Electric Sedan', 55400.00, 'Automotive', 'https://example.com/bmwi4.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440061', 'Mercedes EQS', 'Mercedes-Benz EQS 450+ Electric Sedan', 102310.00, 'Automotive', 'https://example.com/mercedeseqs.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440062', 'Audi e-tron GT', 'Audi e-tron GT quattro Electric Coupe', 106500.00, 'Automotive', 'https://example.com/audietrongt.jpg', true, NOW(), NOW()),

-- Pet Supplies 카테고리 상품들
('650e8400-e29b-41d4-a716-446655440063', 'Royal Canin Dog Food', 'Royal Canin Adult Dog Food 30lb', 89.99, 'Pet Supplies', 'https://example.com/royalcanindogfood.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440064', 'Whiskas Cat Food', 'Whiskas Adult Cat Food 16lb', 24.99, 'Pet Supplies', 'https://example.com/whiskascatfood.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440065', 'Kong Classic Dog Toy', 'Kong Classic Dog Toy Red Large', 12.99, 'Pet Supplies', 'https://example.com/kongclassic.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440066', 'Furbo Dog Camera', 'Furbo 360° Dog Camera with Treat Dispenser', 249.99, 'Pet Supplies', 'https://example.com/furbodogcamera.jpg', true, NOW(), NOW()),

-- Garden 카테고리 상품들
('650e8400-e29b-41d4-a716-446655440067', 'Miracle-Gro Potting Mix', 'Miracle-Gro Potting Mix 8qt', 8.99, 'Garden', 'https://example.com/miraclegropotting.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440068', 'Fiskars Garden Tools Set', 'Fiskars Garden Tools Set 3-Piece', 29.99, 'Garden', 'https://example.com/fiskarsgardentools.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440069', 'Scotts Turf Builder', 'Scotts Turf Builder Lawn Food 15lb', 19.99, 'Garden', 'https://example.com/scottsturfbuilder.jpg', true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440070', 'AeroGarden Harvest', 'AeroGarden Harvest 360 Indoor Garden', 199.99, 'Garden', 'https://example.com/aerogardenharvest.jpg', true, NOW(), NOW());
