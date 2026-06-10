import { Link } from 'react-router-dom';
import { Phone, MapPin, Heart, MessageCircle } from 'lucide-react';
import Container from '../ui/Container';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const quickLinks = [
  { path: '/', label: 'الرئيسية' },
  { path: '/terms', label: 'الشروط والأحكام' },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-primary-900 to-primary-950 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-400/50 to-transparent" />
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary-800/20 blur-3xl" />
      <div className="absolute bottom-10 left-20 w-48 h-48 rounded-full bg-rose-800/10 blur-3xl" />

      <Container>
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <img src="/logo.png" alt="Lavender Florist" className="h-14 w-auto brightness-110" />
                <div>
                  <h3 className="font-display text-xl font-bold text-white">Lavender Florist</h3>
                  <p className="text-primary-300 text-xs">تنسيق أزهار و تغليف هدايا</p>
                </div>
              </Link>
              <p className="text-primary-300 text-sm leading-relaxed mb-6">
                نقدم لكم أجمل التنسيقات الزهرية والهدايا المميزة لكل المناسبات. نسعى لإضافة لمسة من الجمال والأناقة إلى لحظاتكم الخاصة.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/lavender_florist/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <InstagramIcon className="w-5 h-5" />
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
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 hover:scale-110"
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
                      className="text-primary-300 hover:text-white transition-colors text-sm hover:translate-x-1 inline-block"
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
                <li className="flex items-start gap-3 text-sm text-primary-300">
                  <Phone className="w-4 h-4 mt-1 flex-shrink-0 text-primary-400" />
                  <div>
                    <p>اتصل بنا</p>
                    <a href="tel:+966543282345" className="hover:text-white transition-colors" dir="ltr">
                      +966 543282345
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm text-primary-300">
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
                <li className="flex items-start gap-3 text-sm text-primary-300">
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
            <p className="text-sm text-primary-400">
              © {new Date().getFullYear()} Lavender Florist. جميع الحقوق محفوظة.
            </p>
            <p className="text-sm text-primary-400 flex items-center gap-1">
              صنع بكل <Heart className="w-4 h-4 text-rose-400 fill-current" /> في الأحساء
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
