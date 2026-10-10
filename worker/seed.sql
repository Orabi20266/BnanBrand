-- بيانات BnanBrand الأولية (تُنشئ حساب الأدمن + الأقسام + المنتجات + الإعدادات)
-- مولّد آلياً بواسطة worker/tools/gen.js

-- تنظيف آمن يسمح بإعادة التشغيل دون تكرار البيانات
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM images;

DELETE FROM users WHERE username = 'Bnan1';
INSERT INTO users (username, password_hash, full_name, role) VALUES ('Bnan1', 'pbkdf2$100000$kOXSv_QJ155nSPO9cr5dDg$KlZKLz-b5P-bWVO8PbEtbMeKHkWqxlKCVbq3d9rFH88', 'مدير المتجر', 'admin');

INSERT INTO categories (id, name, slug, description, image, sort_order, is_active) VALUES (1, 'إكسسوارات', 'إكسسوارات', 'تشكيلة إكسسوارات الفاخرة من BnanBrand.', '/uploads/seed-إكسسوارات.svg', 0, 1);
INSERT INTO categories (id, name, slug, description, image, sort_order, is_active) VALUES (2, 'صناديق هدايا', 'صناديق-هدايا', 'تشكيلة صناديق هدايا الفاخرة من BnanBrand.', '/uploads/seed-صناديق-هدايا.svg', 1, 1);
INSERT INTO categories (id, name, slug, description, image, sort_order, is_active) VALUES (3, 'عطور', 'عطور', 'تشكيلة عطور الفاخرة من BnanBrand.', '/uploads/seed-عطور.svg', 2, 1);
INSERT INTO categories (id, name, slug, description, image, sort_order, is_active) VALUES (4, 'عناية بالبشرة', 'عناية-بالبشرة', 'تشكيلة عناية بالبشرة الفاخرة من BnanBrand.', '/uploads/seed-عناية-بالبشرة.svg', 3, 1);
INSERT INTO categories (id, name, slug, description, image, sort_order, is_active) VALUES (5, 'مجوهرات', 'مجوهرات', 'تشكيلة مجوهرات الفاخرة من BnanBrand.', '/uploads/seed-مجوهرات.svg', 4, 1);

INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('طقم إكسسوارات ذهبي وردي', 'طقم-إكسسوارات-ذهبي-وردي', 'طقم أنيق من الإكسسوارات بلمسة ذهبية وردية، مثالي للمناسبات والهدايا. يشمل قلادة وأسورة وحلقاً بتصميم متناسق.', 1, 320, 259, '/uploads/seed-طقم-إكسسوارات-ذهبي-وردي.svg', '["/uploads/seed-طقم-إكسسوارات-ذهبي-وردي.svg"]', '[{"name":"اللون","options":["ذهبي وردي","فضي","ذهبي"]}]', 24, 1, 1);
INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('صندوق هدايا فاخر بخاتم', 'صندوق-هدايا-فاخر-بخاتم', 'صندوق هدايا مخملي فاخر بلون وردي، يحتوي على خاتم مزخرف وبطاقة إهداء. تغليف راقٍ جاهز للإهداء.', 2, 280, NULL, '/uploads/seed-صندوق-هدايا-فاخر-بخاتم.svg', '["/uploads/seed-صندوق-هدايا-فاخر-بخاتم.svg"]', '[{"name":"الحجم","options":["صغير","متوسط","كبير"]}]', 18, 1, 1);
INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('عطر زهري نسائي', 'عطر-زهري-نسائي', 'عطر نسائي برائحة زهرية ناعمة تدوم طويلاً، بمزيج من الياسمين والورد. مناسب للاستخدام اليومي والمناسبات.', 3, 420, 349, '/uploads/seed-عطر-زهري-نسائي.svg', '["/uploads/seed-عطر-زهري-نسائي.svg"]', '[{"name":"الحجم","options":["30 مل","50 مل","100 مل"]}]', 30, 1, 1);
INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('طقم عناية بالبشرة فاخر', 'طقم-عناية-بالبشرة-فاخر', 'مجموعة عناية متكاملة بالبشرة تحتوي على غسول، سيروم، وكريم مرطب بخلاصات طبيعية لطيفة على البشرة.', 4, 260, NULL, '/uploads/seed-طقم-عناية-بالبشرة-فاخر.svg', '["/uploads/seed-طقم-عناية-بالبشرة-فاخر.svg"]', '[]', 40, 1, 1);
INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('قلادة قلب وردية', 'قلادة-قلب-وردية', 'قلادة بتصميم قلب بلون وردي وتفاصيل لامعة، تعبير رومانسي أنيق. سلسلة قابلة للتعديل.', 5, 210, 179, '/uploads/seed-قلادة-قلب-وردية.svg', '["/uploads/seed-قلادة-قلب-وردية.svg"]', '[{"name":"اللون","options":["وردي","ذهبي","فضي"]},{"name":"الطول","options":["40 سم","45 سم"]}]', 15, 0, 1);
INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('علبة إكسسوارات منظمة', 'علبة-إكسسوارات-منظمة', 'علبة أنيقة لحفظ الإكسسوارات بسطح مخملي وتقسيمات متعددة، تحمي قطعك الثمينة وتبقيها منظمة.', 1, 150, 120, '/uploads/seed-علبة-إكسسوارات-منظمة.svg', '["/uploads/seed-علبة-إكسسوارات-منظمة.svg"]', '[{"name":"اللون","options":["وردي","بيج","أسود"]}]', 35, 0, 1);
INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('صندوق هدايا للمناسبات الصغيرة', 'صندوق-هدايا-للمناسبات-الصغيرة', 'صندوق هدايا أنيق يحتوي على مستلزمات صغيرة ومتنوعة، مناسب لأعياد الميلاد وشكر الضيوف.', 2, 190, NULL, '/uploads/seed-صندوق-هدايا-للمناسبات-الصغيرة.svg', '["/uploads/seed-صندوق-هدايا-للمناسبات-الصغيرة.svg"]', '[{"name":"الحجم","options":["صغير","متوسط"]}]', 22, 0, 1);
INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('مجموعة عطور مصغرة', 'مجموعة-عطور-مصغرة', 'مجموعة من ثلاثة عطور مصغرة بروائح زهرية متنوعة، مثالية للتجربة أو كهدية.', 3, 230, 189, '/uploads/seed-مجموعة-عطور-مصغرة.svg', '["/uploads/seed-مجموعة-عطور-مصغرة.svg"]', '[]', 26, 0, 1);
INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('كريم مرطب بماء الورد', 'كريم-مرطب-بماء-الورد', 'كريم مرطب غني بماء الورد يمنح البشرة نعومة وانتعاشاً طوال اليوم، مناسب لجميع أنواع البشرة.', 4, 110, NULL, '/uploads/seed-كريم-مرطب-بماء-الورد.svg', '["/uploads/seed-كريم-مرطب-بماء-الورد.svg"]', '[{"name":"الحجم","options":["50 مل","100 مل"]}]', 50, 0, 1);
INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('خاتم زفاف مزيّن', 'خاتم-زفاف-مزين', 'خاتم أنيق بتصميم مزخرف وحجر لامع، قطعة مميزة للمناسبات الخاصة والخطوبة.', 5, 480, 399, '/uploads/seed-خاتم-زفاف-مزين.svg', '["/uploads/seed-خاتم-زفاف-مزين.svg"]', '[{"name":"المقاس","options":["5","6","7","8","9"]}]', 12, 1, 1);
INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('سوار مطعّم بحجر وردي', 'سوار-مطعم-بحجر-وردي', 'سوار أنيق بحجر وردي في المنتصف، خفيف ومريح للاستخدام اليومي.', 1, 175, NULL, '/uploads/seed-سوار-مطعم-بحجر-وردي.svg', '["/uploads/seed-سوار-مطعم-بحجر-وردي.svg"]', '[{"name":"اللون","options":["وردي","بنفسجي"]}]', 28, 0, 1);
INSERT INTO products (name, slug, description, category_id, price, discount_price, image, images, variants, stock, is_featured, is_active) VALUES ('صندوق مفاجأة لهدية مميزة', 'صندوق-مفاجأة-لهدية-مميزة', 'صندوق هدايا متكامل بكشف مفاجآت تدريجي، تجربة إهداء لا تُنسى بلمسة أنثوية راقية.', 2, 350, 299, '/uploads/seed-صندوق-مفاجأة-لهدية-مميزة.svg', '["/uploads/seed-صندوق-مفاجأة-لهدية-مميزة.svg"]', '[{"name":"اللون","options":["وردي","أبيض"]}]', 16, 1, 1);

INSERT INTO settings (key, value) VALUES ('company_name', 'BnanBrand') ON CONFLICT(key) DO UPDATE SET value = excluded.value;
INSERT INTO settings (key, value) VALUES ('company_email', 'info@bnanbrand.com') ON CONFLICT(key) DO UPDATE SET value = excluded.value;
INSERT INTO settings (key, value) VALUES ('phone', '0590000000') ON CONFLICT(key) DO UPDATE SET value = excluded.value;
INSERT INTO settings (key, value) VALUES ('whatsapp', '970590000000') ON CONFLICT(key) DO UPDATE SET value = excluded.value;
INSERT INTO settings (key, value) VALUES ('address', 'فلسطين') ON CONFLICT(key) DO UPDATE SET value = excluded.value;
INSERT INTO settings (key, value) VALUES ('currency', 'شيكل') ON CONFLICT(key) DO UPDATE SET value = excluded.value;
INSERT INTO settings (key, value) VALUES ('shipping_fee', '15') ON CONFLICT(key) DO UPDATE SET value = excluded.value;
INSERT INTO settings (key, value) VALUES ('free_shipping_threshold', '300') ON CONFLICT(key) DO UPDATE SET value = excluded.value;
INSERT INTO settings (key, value) VALUES ('about_text', 'BnanBrand منصة متخصصة في عرض وتسويق منتجات نسائية فاخرة تشمل الإكسسوارات وصناديق الهدايا والمزيد، بتصميم أنثوي راقٍ وتجربة تسوق سلسة وآمنة.') ON CONFLICT(key) DO UPDATE SET value = excluded.value;

-- تم.