````instructions
# 🛠 دليل التطوير - Lavender Florist

## 🤖 تعليمات خاصة للـ AI

### 📋 **قواعد أساسية للتطوير:**

- **اتبع ملف TODO.instructions.md**: راجع دائماً قسم "المهام المطلوبة الآن" قبل بدء أي عمل
- **React + TypeScript**: Frontend يستخدم React مع TypeScript
- **Laravel (PHP)**: Backend يستخدم Laravel مع MySQL
- **Arabic UI**: واجهة المستخدم بالعربية (RTL)
- **Tailwind CSS**: استخدم Tailwind CSS للتصميم
- **Laravel Sanctum**: المصادقة عبر SPA Authentication
- **Gemini API**: مساعد AI باستخدام Gemini

### ⚠️ **محظورات:**

- لا تضيف مكتبات جديدة دون ضرورة قصوى
- لا تعمل على مهام خارج قائمة "المطلوبة الآن"
- لا تغير بنية المشروع الأساسية دون موافقة
- لا تكشف مفاتيح API أو بيانات حساسة

---

## 🏗 هيكل المشروع

```
lavender-florist/
├── .github/instructions/        # ملفات التعليمات
├── backend/                     # Laravel Application
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/    # API Controllers
│   │   │   ├── Middleware/     # Custom Middleware
│   │   │   └── Requests/      # Form Requests (Validation)
│   │   ├── Models/             # Eloquent Models
│   │   ├── Services/           # Business Logic
│   │   ├── Events/             # Event Classes
│   │   ├── Listeners/          # Event Listeners
│   │   ├── Observers/          # Model Observers
│   │   └── Policies/           # Authorization
│   ├── database/
│   │   ├── migrations/         # Database Migrations
│   │   └── seeders/            # Database Seeders
│   ├── routes/
│   │   └── api.php             # API Routes
│   ├── config/
│   └── tests/                  # Backend Tests (PHPUnit)
├── frontend/                    # React Application (Vite)
│   ├── src/
│   │   ├── components/         # UI Components
│   │   ├── pages/              # App Pages
│   │   ├── hooks/              # Custom Hooks
│   │   ├── services/           # API Service Layer
│   │   ├── store/              # State Management
│   │   ├── types/              # TypeScript Types
│   │   └── utils/              # Utilities
│   ├── public/                 # Static Assets
│   └── tests/                  # Frontend Tests
└── README.md
```

---

## 🛠 بيئة التطوير

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Laravel (PHP) + MySQL
- **Hosting**: Railway (Laravel + MySQL)
- **Auth**: Laravel Sanctum + Socialite (Google)
- **AI**: Google Gemini API
- **Animation**: Framer Motion
- **Charts**: Recharts / Chart.js

````
