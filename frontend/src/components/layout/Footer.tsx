import { Link } from 'react-router-dom';
import { Instagram, Phone, MapPin, Heart, MessageCircle } from 'lucide-react';
import Container from '../ui/Container';

const quickLinks = [
  { path: '/', label: 'الرئيسية' },
  { path: '/products', label: 'المنتجات' },
  { path: '/about', label: 'من نحن' },
  { path: '/contact', label: 'تواصل معنا' },
];

const categories = [
  { path: '/products?category=bouquets', label: 'باقات' },
  { path: '/products?category=boxes', label: 'صناديق' },
  { path: '/products?category=arrangements', label: 'تنسيقات' },
  { path: '/products?category=singles', label: 'أزهار مفردة' },
  { path: '/products?category=gifts', label: 'هدايا' },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-lavender-900 to-lavender-950 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-lavender-400/50 to-transparent" />
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-lavender-800/20 blur-3xl" />
      <div className="absolute bottom-10 left-20 w-48 h-48 rounded-full bg-rose-800/10 blur-3xl" />

      <Container>
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <img src="/logo.png" alt="لافندر فلوريست" className="h-14 w-auto brightness-110" />
                <div>
                  <h3 className="font-display text-xl font-bold text-white">Lavender Florist</h3>
                  <p className="text-lavender-300 text-xs">تنسيق أزهار و تغليف هدايا</p>
                </div>
              </Link>
              <p className="text-lavender-300 text-sm leading-relaxed mb-6">
                نقدم لكم أجمل التنسيقات الزهرية والهدايا المميزة لكل المناسبات. نسعى لإضافة لمسة من الجمال والأناقة إلى لحظاتكم الخاصة.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/lavender_florist/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://wa.me/message/2UZD32P2LOLCM1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-green-500 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a
                  href="tel:+966543282345"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-lavender-500 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold mb-6 text-white">روابط سريعة</h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-lavender-300 hover:text-white transition-colors text-sm hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-lg font-bold mb-6 text-white">التصنيفات</h4>
              <ul className="space-y-3">
                {categories.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-lavender-300 hover:text-white transition-colors text-sm hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-bold mb-6 text-white">تواصل معنا</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-lavender-300">
                  <Phone className="w-4 h-4 mt-1 flex-shrink-0 text-lavender-400" />
                  <div>
                    <p>اتصل بنا</p>
                    <a href="tel:+966543282345" className="hover:text-white transition-colors" dir="ltr">
                      +966 543282345
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm text-lavender-300">
                  <MessageCircle className="w-4 h-4 mt-1 flex-shrink-0 text-leaf-400" />
                  <div>
                    <p>واتساب</p>
                    <a
                      href="https://wa.me/message/2UZD32P2LOLCM1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      تواصل معنا عبر واتساب
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm text-lavender-300">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-rose-400" />
                  <div>
                    <p>العنوان</p>
                    <p>الأحساء، المملكة العربية السعودية</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-lavender-400">
              © {new Date().getFullYear()} لافندر فلوريست. جميع الحقوق محفوظة.
            </p>
            <p className="text-sm text-lavender-400 flex items-center gap-1">
              صنع بكل <Heart className="w-4 h-4 text-rose-400 fill-current" /> في الأحساء
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
