import { ArrowRight, Play, Check, ChevronLeft, Share2, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { shareOrCopy } from '@/lib/sakeena';
import NotFound from '@/pages/not-found';
import { NamedToolPage } from '@/features/tools/NamedToolsPage';
import { MemorizationPage, ReflectionsPage, ReviewPage, TajweedLessonsPage } from '@/features/tools/WorkingTools';
import { moreSections } from '@/app/more';
import { ProgressRing } from '@/app/home';

export const toolRecords = moreSections.flatMap((section) => section.items.map(([label, href, icon]) => ({
  label,
  href,
  icon,
  section: section.title,
})));

export const toolGuides: Record<string, { description: string; rows: string[] }> = {
  'التحميلات': { description: 'راجع ما حفظته على جهازك للوصول إليه عندما لا يتوفر اتصال.', rows: ['افتح القرآن المحفوظ', 'راجع الملفات الصوتية المتاحة', 'احذف ما لم تعد تحتاجه لتوفير المساحة'] },
  'المفضلة': { description: 'اجمع الآيات والمواد التي تريد الرجوع إليها في مكان واحد.', rows: ['أضف آية إلى المفضلة', 'راجع محفوظاتك بهدوء', 'احذف ما انتهيت منه'] },
  'المحفظ': { description: 'خطة بسيطة لحفظ الجديد ومراجعة ما سبق أن حفظته.', rows: ['اختر مقدار الحفظ اليومي', 'سجّل المقطع الذي أتممته', 'راجع محفوظك قبل إضافة جديد'] },
  'مراجعة الحفظ': { description: 'اختبر ذاكرتك قبل أن تفتح الآيات، ثم صحح قراءتك بهدوء.', rows: ['اختر السورة التي تريد مراجعتها', 'اقرأ من الذاكرة', 'افتح المصحف للتأكد من المواضع'] },
  'تدبراتي': { description: 'دوّن ما لامس قلبك من آية أو معنى حتى يبقى أثره معك.', rows: ['اكتب الآية أو الفكرة', 'أضف ما ستعمل به اليوم', 'ارجع إلى تدبراتك السابقة'] },
  'سنن اليوم': { description: 'تذكير عملي بسنن صغيرة يمكنك إحياؤها بلا مشقة.', rows: ['ابدأ بالبسملة وحسن النية', 'أحْيِ سنة واحدة اليوم', 'سجّل ما واظبت عليه'] },
  'أدعية المواقف': { description: 'اختر الدعاء الذي يناسب حالتك واقرأه بحضور قلب.', rows: ['حدّد الموقف الذي تمر به', 'اقرأ الدعاء بتمهل', 'كرره حتى يطمئن قلبك'] },
  'مسلم جديد - ابدأ هنا': { description: 'مسار تمهيدي مرتب يقرّب لك أساسيات العبادة والمعرفة.', rows: ['تعلم أركان الإسلام', 'ابدأ بسورة قصيرة وأذكار سهلة', 'اسأل عن أي أمر غير واضح'] },
  'قصص الأنبياء': { description: 'رحلة قصيرة مع مواقف الأنبياء وما فيها من صبر وتوكل.', rows: ['اختر قصة واحدة', 'اقرأ الموقف بتدبر', 'استخرج درسًا تطبقه اليوم'] },
  'الصحابة': { description: 'تعرف على سير أصحاب النبي ومواقفهم في الإيمان والعمل.', rows: ['اختر شخصية للتعرف إليها', 'اقرأ موقفًا من سيرتها', 'اكتب خلقًا تريد الاقتداء به'] },
  'ركن الأطفال (سور ونجوم)': { description: 'خطوات لطيفة تشجع الطفل على القرآن باللعب والإنجاز.', rows: ['اختر سورة قصيرة', 'اقرأ معه آية واحدة', 'امنحه نجمة عند إتمام ورد اليوم'] },
  'ختمة جماعية (ختمة لعيلتك)': { description: 'نظّم قراءة العائلة بحيث يشارك كل فرد بمقدار واضح.', rows: ['اتفقوا على السور أو الأجزاء', 'سجّل ما قرأه كل فرد', 'احتفلوا بإتمام الختمة بالدعاء'] },
  'متابعة الأسرة': { description: 'تابع العادات الإيمانية في البيت بتشجيع لا بضغط.', rows: ['اختر عادة أسرية واحدة', 'شجّع المشاركة اليومية', 'راجع التقدم نهاية الأسبوع'] },
  'بطاقات تهنئة': { description: 'أنشئ بطاقة دعاء أو تهنئة وشاركها مع من تحب.', rows: ['اختر المناسبة', 'عدّل النص قبل المشاركة', 'احفظ البطاقة في جهازك'] },
  'حالة اليوم (بطاقة 9:16)': { description: 'حوّل وردك أو دعاءك إلى بطاقة مناسبة للمشاركة.', rows: ['اختر العبارة المناسبة', 'راجع شكل البطاقة', 'شاركها باحترام وبدون مبالغة'] },
  'نسخ احتياطي': { description: 'احفظ تقدمك وإعداداتك أو استعد نسخة سابقة على هذا الجهاز.', rows: ['صدّر بياناتك', 'احتفظ بالملف في مكان آمن', 'استورد النسخة عند تغيير الجهاز'] },
  'حاسبة الزكاة': { description: 'رتّب أموالك التي تريد حساب زكاتها قبل سؤال أهل العلم في التفاصيل.', rows: ['اكتب أنواع المال الخاضعة للحساب', 'راجع النصاب والحول', 'اعرض الناتج على جهة موثوقة عند الحاجة'] },
  'دليل الخير': { description: 'أفكار صغيرة للصدقة وصلة الرحم ومساعدة من حولك.', rows: ['اختر عمل خير ممكنًا اليوم', 'نفّذه دون انتظار مدح', 'اكتب أثره لتستمر'] },
  'الموارث': { description: 'معلومات تمهيدية عن أهمية رد الحقوق، وليست حاسبة للأنصبة.', rows: ['اجمع بيانات المسألة', 'لا توزع التركة بالتخمين', 'ارجع إلى مختص موثوق'] },
  'دليل العمرة': { description: 'قائمة تمهيدية تساعدك على ترتيب خطوات العمرة والاستعداد لها.', rows: ['راجع الإحرام والمواقيت', 'تعلّم ترتيب المناسك', 'اسأل الجهة الرسمية عن التفاصيل'] },
  'مناسك الحج': { description: 'ملخص مرتب للمناسك مع تذكير بأن الفتوى الخاصة تُسأل من أهلها.', rows: ['راجع أيام الحج', 'تعلّم أركان كل نسك', 'احتفظ بأسئلة السفر للمختص'] },
  'عداد الأشواط': { description: 'سجّل عدد الأشواط يدويًا أثناء الطواف أو السعي لتقليل النسيان.', rows: ['ابدأ العداد عند الشوط الأول', 'ثبّت العدد بعد كل شوط', 'اسأل المشرف عند الشك'] },
  'وضع الحرم (مواقيت مكة)': { description: 'عرض تمهيدي لمواقيت مكة، وتحقق من الجهة الرسمية قبل السفر.', rows: ['راجع الوقت المحلي', 'تحقق من المواقيت الرسمية', 'خطط للصلاة والراحة'] },
  'حالة الزحام (كثافة المطاف)': { description: 'تذكير بالتخطيط والرفق أثناء الزحام، وليس قياسًا مباشرًا للكثافة.', rows: ['اختر وقتًا أهدأ إن أمكن', 'اتبع تعليمات المنظمين', 'قدّم السلامة والرفق'] },
  'موقع سكني': { description: 'احفظ وصف مكان الإقامة ليسهل الرجوع إليه أثناء السفر.', rows: ['اكتب اسم الفندق أو السكن', 'احفظ أقرب معلم', 'شارك الموقع مع مرافق موثوق'] },
  'شنطة الحاج': { description: 'قائمة تجهيز مختصرة تساعدك على تذكر الضروريات قبل السفر.', rows: ['جهّز وثائقك وأدويتك', 'راجع ملابس الإحرام', 'اترك مساحة للماء والاحتياجات'] },
  'أدعية النسك': { description: 'أدعية مختارة للنسك مع ترك التكلف والالتزام بما تيسر.', rows: ['اقرأ الدعاء بفهم', 'لا تنشغل عن النسك بالتصوير', 'ادعُ لنفسك ولمن تحب'] },
  'البث المباشر': { description: 'شاهد البث المباشر من الحرم المكي الشريف على مدار الساعة، مباشرة من داخل التطبيق.', rows: [] },
};

export function ToolScreen() {
  const params = useParams<{ slug: string }>();
  const title = decodeURIComponent(params.slug ?? '');
  const tool = toolRecords.find((item) => item.label === title);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);
  const [, setLocation] = useLocation();
  if (!tool) return <NotFound />;
  const ToolIcon = tool.icon;
  const isLive = tool.label === 'البث المباشر';
  const guide = toolGuides[tool.label];
  const isLearning = ['تفسير وتدبر', 'دروس التجويد', 'تعلم دينك', 'الأحاديث', 'كتب الحديث', 'قصص الأنبياء', 'الصحابة', 'السيرة النبوية'].includes(tool.label);
  const isWorship = ['خطتي اليومية', 'سنن اليوم', 'الرقية الشرعية', 'أسماء الله', 'رمضان', 'التقويم', 'متتبع الصيام', 'صفة الصلاة'].includes(tool.label);
  const description = guide?.description ?? (isLearning
    ? 'محتوى موثوق ومختصر يساعدك على الفهم والتدبر خطوة بخطوة.'
    : isWorship
      ? 'أداة عملية تساعدك على تنظيم عبادتك ومتابعة أثرها في يومك.'
      : 'مساحة داخل سَكينة تساعدك على البدء بهدوء وحفظ أثر ما أنجزته.');
  const rows = guide?.rows ?? (isLearning
    ? ['ابدأ بالمحتوى المقترح', 'احفظ ما تريد الرجوع إليه', 'سجّل ملاحظتك أو تدبرك']
    : ['ابدأ خطوتك الأولى', 'أكمل ما بدأته', 'احفظ تقدمك على جهازك']);
  return (
    <div className="rise-in mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button onClick={() => setLocation('/more')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent" data-testid="button-tool-back"><ArrowRight size={17} />كل الأدوات</button>
        <span className="rounded-full border border-accent/35 px-3 py-1.5 text-[0.625rem] text-accent">{tool.section}</span>
      </div>
      <section className="featured-card relative overflow-hidden rounded-[2rem] border bg-card p-7 md:p-10">
        <div className="absolute -left-12 -top-16 size-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative z-10">
          <span className="mb-6 grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground"><ToolIcon size={25} /></span>
          <p className="mb-2 text-xs font-semibold tracking-[.16em] text-accent">سَكينة · {tool.section}</p>
          <h1 className="font-arabic text-4xl">{tool.label}</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
          {isLive ? (
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="https://makkahlive.net/en/live/makkah" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground" data-testid="link-live-open"><Play size={15} />شاهد البث المباشر الآن</a>
            </div>
          ) : (
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => setCompletedSteps((current) => current.includes(0) ? current : [...current, 0])} className="rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground" data-testid="button-tool-start">{completedSteps.includes(0) ? 'تم إنجاز الخطوة' : 'ابدأ الآن'}</button>
              <button onClick={() => setSaved(!saved)} className={`rounded-xl border px-5 py-3 text-xs font-semibold ${saved ? 'border-accent text-accent' : 'border-border text-muted-foreground'}`} data-testid="button-tool-save">{saved ? 'تم الحفظ في وردي' : 'احفظ في وردي'}</button>
            </div>
          )}
        </div>
      </section>
      {isLive ? (
        <section className="mt-6 overflow-hidden rounded-[2rem] border border-card-border bg-card">
          <iframe
            src="https://makkahlive.net/en/live/makkah"
            title="البث المباشر من الحرم المكي"
            className="aspect-video w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            loading="lazy"
            data-testid="iframe-live-stream"
          />
          <p className="p-4 text-center text-xs text-muted-foreground">لو الفيديو ما ظهرش هنا، اضغط "شاهد البث المباشر الآن" فوق عشان يفتح في صفحة جديدة.</p>
        </section>
      ) : (
        <section className="mt-6 rounded-[2rem] border border-card-border bg-card p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between"><div><p className="text-xs text-accent">خطتك داخل الأداة</p><h2 className="mt-1 text-xl font-semibold">خطوة هادئة كل يوم</h2></div><ProgressRing value={completedSteps.length / rows.length} label={`${completedSteps.length}/${rows.length}`} /></div>
          <div className="space-y-3">{rows.map((row, index) => <button key={row} onClick={() => setCompletedSteps((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])} className={`flex w-full items-center gap-3 rounded-xl p-4 text-right transition ${completedSteps.includes(index) ? 'bg-secondary' : 'bg-secondary/45 hover:bg-secondary'}`}><span className={`grid size-7 place-items-center rounded-full border ${completedSteps.includes(index) ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground'}`}>{completedSteps.includes(index) ? <Check size={13} /> : index + 1}</span><span className={`flex-1 text-sm ${completedSteps.includes(index) ? 'text-muted-foreground line-through' : ''}`}>{row}</span><ChevronLeft size={15} className="text-muted-foreground" /></button>)}</div>
        </section>
      )}
       <div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => void shareOrCopy({ title: `سَكينة - ${tool.label}`, text: `اكتشف ${tool.label} داخل تطبيق سَكينة` })} className="flex items-center justify-center gap-2 rounded-xl border border-accent/35 bg-card px-4 py-3 text-xs font-semibold text-accent"><Share2 size={15} />شارك الأداة</button><button onClick={() => setLocation('/more')} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-semibold text-muted-foreground"><MoreHorizontal size={15} />اكتشف أدوات أخرى</button></div>
    </div>
  );
}

export function DownloadsToolPage() {
  return <NamedToolPage kind="downloads" />;
}

export function TajweedToolPage() {
  return <TajweedLessonsPage />;
}

export function MemorizationToolPage() {
  return <MemorizationPage />;
}

export function ReviewToolPage() {
  return <ReviewPage />;
}

export function ReflectionsToolPage() {
  return <ReflectionsPage />;
}
