/* ==========================================================
   Bnan Brand — بيانات المنتجات والتصنيفات
   يمكن تعديل الأسعار والمقاسات من هنا مباشرة
   ========================================================== */

const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: 'grid' },
  { id: 'accessories', name: 'إكسسوارات', icon: 'box' },
  { id: 'kitchen', name: 'أدوات المطبخ', icon: 'food' },
  { id: 'cosmetics', name: 'كوزماتكس', icon: 'mail' },
  { id: 'decor', name: 'نثريات', icon: 'move' },
  { id: 'gifts', name: 'هدايا', icon: 'star' },
  { id: 'sets', name: 'مجموعات خاصة', icon: 'star' }
];

let PRODUCTS_BASE = [
  {
    id: 'bn-1',
    sku: 'BN-001',
    name: 'حلقان فضية أنيقة',
    category: 'accessories',
    price: 25,
    oldPrice: null,
    unit: 'زوج',
    rating: 4.8,
    reviews: 15,
    stock: 50,
    badge: 'جديد',
    material: 'ستانلس ستيل',
    dims: '-',
    weight: '-',
    short: 'حلقان رقيقان مناسبان للاستخدام اليومي',
    desc: 'حلقان أنيقان مصنوعان من الفضة المقاومة للصدأ',
    features: ['مقاوم للصدأ', 'خفيف الوزن', 'يليق مع كل الأزياء'],
    colors: ['#f2b5d4'],
    discount: 0,
    group: 'default'
  },
  {
    id: 'bn-2',
    sku: 'BN-002',
    name: 'فرشاة مكياج ميني',
    category: 'cosmetics',
    price: 15,
    oldPrice: null,
    unit: 'قطعة',
    rating: 4.7,
    reviews: 22,
    stock: 80,
    badge: '',
    material: 'ألياف ناعمة',
    dims: '-',
    weight: '-',
    short: 'فرشاة ناعمة لتطبيق المكياج',
    desc: 'مجموعة فرش ميني مثالية للسفر',
    features: ['ناعمة على البشرة', 'قابلة للنقل', 'متينة'],
    colors: ['#fff0f8'],
    discount: 5,
    group: 'default'
  },
  {
    id: 'bn-3',
    sku: 'BN-003',
    name: 'علبة عطور صغيرة',
    category: 'cosmetics',
    price: 30,
    oldPrice: 35,
    unit: 'قطعة',
    rating: 4.9,
    reviews: 10,
    stock: 30,
    badge: 'حصري',
    material: 'زجاج',
    dims: '-',
    weight: '-',
    short: 'علبة عطر أنيقة لحقيبتك',
    desc: 'تصميم أنيق وصغير الحجم',
    features: ['حجم مناسب للسفر', 'غطاء محكم', 'تصميم أنثوي'],
    colors: ['#f7d6e8'],
    discount: 0,
    group: 'default'
  },
  {
    id: 'bn-4',
    sku: 'BN-004',
    name: 'مفرش طاولة مزخرف',
    category: 'decor',
    price: 40,
    oldPrice: null,
    unit: 'قطعة',
    rating: 4.6,
    reviews: 8,
    stock: 25,
    badge: '',
    material: 'قطن',
    dims: '120×70 سم',
    weight: '-',
    short: 'مفرش أنيق لإضفاء لمسة رومانسية',
    desc: 'مفرش مطرز بتفاصيل رقيقة',
    features: ['قماش ناعم', 'سهل الغسيل', 'تصميم أنيق'],
    colors: ['#fff0f8'],
    discount: 0,
    group: 'default'
  },
  {
    id: 'bn-5',
    sku: 'BN-005',
    name: 'كوكيز زينة ديكورات',
    category: 'decor',
    price: 12,
    oldPrice: null,
    unit: 'طقم',
    rating: 4.5,
    reviews: 12,
    stock: 60,
    badge: '',
    material: 'راتنج',
    dims: '-',
    weight: '-',
    short: 'مجموعة زخارف صغيرة للمنزل',
    desc: 'زخارف أنيقة لتزيين الرفوف',
    features: ['خفيفة', 'متينة', 'تصميم أنثوي'],
    colors: ['#f2b5d4'],
    discount: 0,
    group: 'default'
  },
  {
    id: 'bn-6',
    sku: 'BN-006',
    name: 'سوار قلادة متناسق',
    category: 'accessories',
    price: 35,
    oldPrice: null,
    unit: 'طقم',
    rating: 5.0,
    reviews: 5,
    stock: 40,
    badge: 'الأكثر مبيعاً',
    material: 'معدن مطلي',
    dims: '-',
    weight: '-',
    short: 'طقم مجوهرات متناسق',
    desc: 'سوار وقلادة بتصميم أنيق',
    features: ['طقم كامل', 'تصميم عصري', 'هدية مثالية'],
    colors: ['#f7d6e8'],
    discount: 10,
    group: 'default'
  }
];

const PRODUCT_GROUPS = [
  { id: 'default', name: 'عام' },
  { id: 'wholesale', name: 'جملة' },
  { id: 'retail', name: 'قطاعي' },
  { id: 'promotions', name: 'عروض' },
  { id: 'seasonal', name: 'موسمي' }
];

let PRODUCTS = [...PRODUCTS_BASE];
const TESTIMONIALS = [
  {
    name: 'ريم العتيبي',
    role: 'عميلة — الرياض',
    text: 'الهدية وصلت بتغليف أنيق جداً والجودة أفضل مما توقعت. تجربة تسوّق راقية من أول نظرة للموقع حتى الاستلام.',
    rating: 5,
    initials: 'رع'
  },
  {
    name: 'سارة المطيري',
    role: 'عميلة — جدة',
    text: 'أحببت تشكيلة الإكسسوارات، الأسعار مناسبة والتوصيل كان سريعاً. طلبت أكثر من مرة وكل مرة تجربة ممتازة.',
    rating: 5,
    initials: 'سم'
  },
  {
    name: 'نورة القحطاني',
    role: 'عميلة — الدمام',
    text: 'الإكسسوارات أنيقة وراقية والخامة ممتازة. خدمة العملاء ردّت على استفساراتي بسرعة ولطف.',
    rating: 5,
    initials: 'نق'
  },
  {
    name: 'لمى الحربي',
    role: 'عميلة — مكة',
    text: 'طلبت علبة هدايا مع العطر، والتنسيق كان جميلاً جداً. سأكرّر التجربة بالتأكيد وأنصح بها صديقاتي.',
    rating: 4,
    initials: 'لح'
  }
];

/* الأسئلة الشائعة */
const FAQS = [
  {
    q: 'كيف أختار المقاس أو اللون المناسب؟',
    a: 'تجد في صفحة كل منتج الخيارات المتاحة (اللون/المقاس) مع وصف تفصيلي. وإذا احترت، تواصل معنا عبر واتساب وسنساعدك في الاختيار.'
  },
  {
    q: 'كم تستغرق مدة التوصيل؟',
    a: 'نُجهّز الطلبات خلال 24 ساعة، ويصل غالباً خلال 2-5 أيام عمل حسب المنطقة. ستصلك رسالة تأكيد بعد إتمام الطلب.'
  },
  {
    q: 'هل المنتجات أصلية ومضمونة؟',
    a: 'نعم، جميع المنتجات مختارة بعناية ومضمونة الجودة. إذا وصلك منتج غير مطابق للوصف، يمكنك الإرجاع خلال 7 أيام.'
  },
  {
    q: 'هل يمكنني تغليف الطلب كهدية؟',
    a: 'بالتأكيد! نوفّر خدمة التغليف الأنيق وصناديق الهدايا. اكتب ملاحظتك عند إتمام الطلب وسنعتنِ بالتفاصيل.'
  },
  {
    q: 'ما هي طرق الدفع المتاحة؟',
    a: 'يمكنك إتمام الطلب ثم الدفع عند التوصيل أو بالتحويل، وسيؤكد فريقنا التفاصيل معك هاتفياً أو عبر واتساب.'
  },
  {
    q: 'هل تقدمون عروضاً وخصومات؟',
    a: 'نعم، نطلق عروضاً دورية على مجموعات مختارة. تابعنا وتصفّح قسم المنتجات المميزة للاطلاع على أحدث العروض.'
  }
];

/* معلومات التواصل */
const CONTACT = {
  phone: '+970 59 000 0000',
  whatsapp: '970590000000',
  email: 'info@bnanbrand.com',
  address: 'فلسطين',
  hours: 'السبت - الخميس: 9 صباحاً - 6 مساءً'
};