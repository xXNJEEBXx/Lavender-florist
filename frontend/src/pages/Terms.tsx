import { motion } from 'framer-motion';

export default function Terms() {
  return (
    <div className="min-h-screen bg-primary-50/30 py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-primary-950 mb-4">الشروط والأحكام</h1>
          <p className="text-primary-600">مرحباً بك في Lavender Florist</p>
        </motion.div>

        <div className="space-y-8 text-primary-800 leading-relaxed text-right">
          <section>
            <h2 className="text-xl font-bold text-primary-900 mb-3 border-b border-primary-100 pb-2">1. مقدمة</h2>
            <p className="text-primary-700">
              أهلاً بك في متجر Lavender Florist. باستخدامك لموقعنا أو طلبك لخدماتنا، فإنك توافق على الشروط والأحكام التالية. يرجى قراءتها بعناية.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-900 mb-3 border-b border-primary-100 pb-2">2. الطلبات وتوفر المنتجات</h2>
            <ul className="list-disc list-inside space-y-2 pr-4 text-primary-700">
              <li>نظراً لطبيعة المنتجات (الزهور الطبيعية)، قد تختلف بعض درجات الألوان أو أنواع الورود حسب التوفر الموسمي. نلتزم دائماً بتقديم بدائل بنفس الجودة والمظهر الجمالي أو أفضل.</li>
              <li>الطلبات المخصصة والتغليف تخضع لتأكيد المتجر، وقد تتطلب وقتاً إضافياً للتجهيز.</li>
              <li>يمكنك إرفاق صورة لباب المنزل عند تحديد العنوان للحصول على خصم خاص (2 ريال) كميزة مقدمة من المتجر لتسهيل عملية التوصيل.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-900 mb-3 border-b border-primary-100 pb-2">3. الأسعار والدفع</h2>
            <ul className="list-disc list-inside space-y-2 pr-4 text-primary-700">
              <li>الأسعار المعروضة قابلة للتغيير، ولكن الطلبات المؤكدة لن تتأثر بأي تغييرات لاحقة.</li>
              <li>وسيلة الدفع المعتمدة هي التحويل البنكي.</li>
              <li>لن يتم البدء بتجهيز الطلب حتى يتم إرفاق إيصال التحويل البنكي أو كتابة مبرر التحويل للتحقق منه.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-900 mb-3 border-b border-primary-100 pb-2">4. التوصيل والاستلام</h2>
            <ul className="list-disc list-inside space-y-2 pr-4 text-primary-700">
              <li>نوفر خدمة التوصيل لمنطقة الأحساء حالياً، كما يمكنك اختيار "استلام من الفرع" (Pickup).</li>
              <li>سيتم عرض موعد التوصيل المتوقع (سواء مجدول أو في أسرع وقت) أثناء الدفع، وسنقوم بتحديث حالة الطلب وإرسال المندوب في الوقت المحدد.</li>
              <li>في حال عدم تجاوب المستلم أو كون العنوان خاطئاً، سيتم التواصل مع صاحب الطلب. في حال تعذر التسليم لأسباب خارجة عن إرادتنا، قد يتم إرجاع الطلب للمتجر وتُطبق رسوم توصيل إضافية لإعادة الإرسال.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-900 mb-3 border-b border-primary-100 pb-2">5. التعديل والإلغاء</h2>
            <ul className="list-disc list-inside space-y-2 pr-4 text-primary-700">
              <li>بما أن المنتجات حساسة وقابلة للتلف، لا يمكن إلغاء الطلب بعد أن تتغير حالته إلى "قيد التجهيز" أو "تم التجهيز".</li>
              <li>يمكنك إلغاء أو تعديل الطلب فقط إذا كان في حالة "قيد الانتظار" (Pending). حيث يمكنك إلغاءه بنقرة واحدة لتعود المنتجات لسلتك لتعديلها.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-900 mb-3 border-b border-primary-100 pb-2">6. سياسة الاسترجاع</h2>
            <p className="text-primary-700">
              حرصاً منا على تقديم أعلى جودة، ونظراً لكون الورود منتجات سريعة التلف، لا يمكن استرجاع المبالغ أو استبدال المنتجات بعد استلامها بحالة جيدة. إذا كان هناك عيب واضح في التنسيق أو تلف أثناء التوصيل (من قبل مندوبنا)، يرجى التواصل معنا فور الاستلام لمعالجة الأمر.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-900 mb-3 border-b border-primary-100 pb-2">7. الخصوصية</h2>
            <p className="text-primary-700">
              نحن نحترم خصوصيتك. المعلومات المقدمة (مثل تفاصيل المستلم، رقم الجوال، والعنوان) تُستخدم فقط لغرض توصيل الطلب ولا تتم مشاركتها مع أطراف ثالثة لأغراض تسويقية دون موافقتك.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
