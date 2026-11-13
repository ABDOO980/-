import { Target, CalendarDays, BookOpen, BookMarked, Wand2, Download, Heart, Compass, Headphones, Moon, Info, MapPin, Search, Library, RotateCcw, Volume2, Check, Award, Sunrise, ClipboardList, Gift, TimerReset, Sparkles, Leaf, Share2, Sprout, MessageCircle, Landmark, Users, Trophy, Settings, BarChart3, Play, ChevronLeft, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { type SakeenaSettings, STORAGE_KEYS, DEFAULT_SETTINGS } from '@/lib/sakeena';
import { useStoredState } from '@/app/common';
import { Header } from '@/app/layout';

export const moreSections = [
  {
    title: 'مساحتك اليومية',
    icon: Target,
    items: [
      ['متتبع العبادات', '/tracker', Target], ['التقويم الهجري', '/calendar', CalendarDays], ['التدبر والإلهام', '/articles', BookOpen], ['الأحاديث النبوية', '/hadith', BookMarked],
      ['صانع البطاقات', '/share-card', Wand2], ['نسخة احتياطية', '/backup', Download], ['سكينة الروح', '/spiritual-peace', Heart],
      ['دليل الوضوء والصلاة', '/learning', Compass], ['جدار الدعاء', '/dua-wall', Heart], ['إذاعة القرآن', '/radio', Headphones],
      ['إمساكية رمضان', '/ramadan', Moon], ['أسئلة وأحكام', '/fatwas', Info], ['المساجد القريبة', '/mosques', MapPin],
    ],
  },
  {
    title: 'القرآن الكريم',
    icon: BookOpen,
    items: [
      ['المصحف', '/quran', BookOpen], ['التحميلات', '/more', Download], ['بحث الآيات', '/quran', Search], ['المفضلة', '/quran', Heart],
      ['تفسير وتدبر', '/more', BookMarked], ['دروس التجويد', '/more', Library],
    ],
  },
  {
    title: 'حفظ ومتابعة',
    icon: Target,
    items: [
      ['المحفظ', '/more', Target], ['أكمل الآية', '/quran/1', BookOpen], ['مراجعة الحفظ', '/more', RotateCcw], ['تسميع (رتل بصوتك)', '/more', Volume2],
      ['الورد والختمة', '/more', BookMarked], ['فهرس المواضيع', '/more', Search], ['تدبراتي', '/more', Heart], ['عباداتي', '/more', Check], ['الإنجازات', '/quiz', Award],
    ],
  },
  {
    title: 'عبادتك اليوم',
    icon: Sunrise,
    items: [
      ['خطتي اليومية', '/more', CalendarDays], ['المواقيت', '/', Sunrise], ['سجل الصلاة', '/more', ClipboardList], ['سنن اليوم', '/more', Sunrise],
      ['القبلة', '/qibla', Compass], ['زاد اليوم', '/more', Gift], ['السبحة', '/adhkar', TimerReset],
    ],
  },
  {
    title: 'الدعاء والذكر',
    icon: Sparkles,
    items: [
      ['الأذكار', '/adhkar', Sparkles], ['أدعية المواقف', '/more', Heart], ['الرقية الشرعية', '/more', Leaf], ['أسماء الله', '/more', BookMarked],
      ['دعاء لمن تحب', '/adhkar', Heart], ['بطاقات للمشاركة', '/more', Share2],
    ],
  },
  {
    title: 'العلم والمعرفة',
    icon: Library,
    items: [
      ['مسلم جديد - ابدأ هنا', '/more', Sprout], ['تعلم دينك', '/more', BookOpen], ['اسأل عن دينك', '/more', MessageCircle], ['الأحاديث', '/more', BookMarked],
      ['كتب الحديث', '/more', Library], ['قصص الأنبياء', '/more', Landmark], ['الصحابة', '/more', Users], ['السيرة النبوية', '/more', BookMarked], ['المسابقة', '/quiz', Trophy],
    ],
  },
  {
    title: 'العائلة والمشاركة',
    icon: Users,
    items: [
      ['ركن الأطفال (سور ونجوم)', '/more', Sparkles], ['ختمة جماعية (ختمة لعيلتك)', '/more', Users], ['متابعة الأسرة', '/more', Users], ['بطاقات تهنئة', '/more', Gift],
      ['حالة اليوم (بطاقة 9:16)', '/more', Share2], ['سفراء سَكينة (رابط دعوتك...)', '/ambassadors', Users],
    ],
  },
  {
    title: 'أدوات التطبيق',
    icon: Settings,
    items: [['نسخ احتياطي', '/backup', Download], ['التنبيهات', '/notifications', Sunrise]],
  },
  {
    title: 'الفقه والمواسم',
    icon: CalendarDays,
    items: [
      ['رمضان', '/more', Moon], ['التقويم', '/more', CalendarDays], ['حاسبة الزكاة', '/more', Target], ['فتاوى ابن باز', '/binbaz', BookMarked], ['دليل الخير', '/more', Gift],
      ['الموارث', '/more', Library], ['متتبع الصيام', '/more', Check], ['صفة الصلاة', '/more', Sunrise],
    ],
  },
  {
    title: 'الحج والعمرة',
    icon: Landmark,
    items: [
      ['دليل العمرة', '/more', Landmark], ['مناسك الحج', '/more', Landmark], ['عداد الأشواط', '/more', TimerReset], ['وضع الحرم (مواقيت مكة)', '/more', Compass],
      ['حالة الزحام (كثافة المطاف)', '/more', BarChart3], ['موقع سكني', '/more', MapPin], ['شنطة الحاج', '/more', Gift], ['أدعية النسك', '/more', Sparkles], ['البث المباشر', '/more', Play],
    ],
  },
] as const;

export const toolHrefByLabel: Record<string, string> = {
  'بحث الآيات': '/quran',
  'تفسير وتدبر': '/articles',
  'التحميلات': '/tools/downloads',
  'دروس التجويد': '/tools/tajweed',
  'المحفظ': '/tools/memorization',
  'مراجعة الحفظ': '/tools/review',
  'تدبراتي': '/tools/reflections',
  'الورد والختمة': '/worship/khatmah',
  'فهرس المواضيع': '/quran',
  'متتبع العبادات': '/worship',
  'عباداتي': '/worship',
  'خطتي اليومية': '/worship/plan',
  'سجل الصلاة': '/worship',
  'زاد اليوم': '/daily-provision',
  'الرقية الشرعية': '/ruqyah',
  'أسماء الله': '/names-of-allah',
  'أدعية المواقف': '/adhkar/situations',
  'دعاء لمن تحب': '/dua-wall',
  'بطاقات للمشاركة': '/share-card',
  'مسلم جديد - ابدأ هنا': '/new-muslim',
  'تعلم دينك': '/learning',
  'اسأل عن دينك': '/fatwas',
  'الأحاديث': '/hadith',
  'كتب الحديث': '/hadith',
  'السيرة النبوية': '/seerah',
  'ختمة جماعية (ختمة لعيلتك)': '/group-khatmah',
  'متابعة الأسرة': '/worship',
  'بطاقات تهنئة': '/share-card',
  'حالة اليوم (بطاقة 9:16)': '/share-card',
  'رمضان': '/ramadan',
  'التقويم': '/calendar',
  'متتبع الصيام': '/worship/fasting',
  'صفة الصلاة': '/learning',
  'تسميع (رتل بصوتك)': '/recitation',
  'ركن الأطفال (سور ونجوم)': '/kids',
  'حاسبة الزكاة': '/zakat',
  'عداد الأشواط': '/hajj/tawaf',
  'شنطة الحاج': '/hajj/bag',
  'أدعية النسك': '/adhkar/hajj',
  'سنن اليوم': '/sunan',
  'قصص الأنبياء': '/prophets',
  'الصحابة': '/companions',
  'دليل الخير': '/good-deeds',
  'الموارث': '/inheritance',
  'دليل العمرة': '/umrah',
  'مناسك الحج': '/hajj',
  'وضع الحرم (مواقيت مكة)': '/haram',
  'حالة الزحام (كثافة المطاف)': '/haram',
  'موقع سكني': '/lodging',
  'البث المباشر': '/live',
};

export function More() {
  const [, setLocation] = useLocation();
  const [settings, setSettings] = useStoredState<SakeenaSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt?: () => Promise<void> } | null>(null);
  const [toolQuery, setToolQuery] = useState('');
  useEffect(() => { const handler = (event: Event) => { event.preventDefault(); setInstallPrompt(event as Event & { prompt?: () => Promise<void> }); }; window.addEventListener('beforeinstallprompt', handler); return () => window.removeEventListener('beforeinstallprompt', handler); }, []);
  const update = (patch: Partial<SakeenaSettings>) => setSettings((current) => ({ ...current, ...patch }));
  const openTool = (label: string, href: string) => {
    setLocation(toolHrefByLabel[label] ?? (href === '/more' ? `/tool/${encodeURIComponent(label)}` : href));
  };
  const normalizedQuery = toolQuery.trim().toLowerCase();
  const filteredSections = moreSections.map((section) => ({
    ...section,
    items: section.items.filter(([label]) => !normalizedQuery || label.toLowerCase().includes(normalizedQuery)),
  })).filter((section) => section.items.length > 0);
  return (
    <div className="rise-in">
      <Header title="المزيد" />
      <Link href="/settings" className="mb-4 flex items-center justify-between rounded-[1.25rem] border border-card-border bg-card px-5 py-4" data-testid="button-more-settings">
        <span className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-secondary text-accent"><Settings size={20} /></span><span><strong className="block text-base">الإعدادات</strong><small className="mt-1 block text-xs text-muted-foreground">خصّص سَكينة على ذوقك</small></span></span>
        <ChevronLeft size={19} className="text-muted-foreground" />
      </Link>
      <div className="mb-5 flex items-center gap-3 rounded-[1.25rem] border border-card-border bg-card px-4 py-3">
        <Search size={18} className="shrink-0 text-accent" />
        <input value={toolQuery} onChange={(event) => setToolQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="ابحث في الأدوات..." aria-label="ابحث في الأدوات" data-testid="input-more-search" />
        {toolQuery && <button onClick={() => setToolQuery('')} className="rounded-lg p-1 text-muted-foreground hover:text-accent" aria-label="مسح البحث"><X size={15} /></button>}
      </div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-accent">{normalizedQuery ? 'نتائج الأدوات' : 'كل سَكينة'}</h2>
        <span className="text-[0.6875rem] text-muted-foreground">{filteredSections.length} أقسام</span>
      </div>
      <div className="space-y-8">
        {filteredSections.map(({ title, items }) => <section key={title} aria-labelledby={`more-section-${title}`}>
          <h2 id={`more-section-${title}`} className="more-section-rule mb-3 text-base">{title}</h2>
          <div className="grid grid-cols-4 gap-2">
            {items.map(([label, href, Icon]) => <button key={label} onClick={() => openTool(label, href)} className="more-tile group flex flex-col items-center justify-start rounded-[1.15rem] px-1.5 py-3 text-center transition hover:border-accent hover:bg-secondary" data-testid={`button-more-tool-${label}`}>
              <span className="mb-2 grid size-10 place-items-center rounded-full bg-secondary text-primary group-hover:text-accent"><Icon size={18} /></span>
              <span className="line-clamp-2 text-[0.6875rem] font-semibold leading-5">{label}</span>
            </button>)}
          </div>
        </section>)}
      </div>
      {!filteredSections.length && <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">لا توجد أداة بهذا الاسم. جرّب كلمة بحث أخرى.</div>}
      <div className="mt-8 space-y-3">
        <button onClick={() => installPrompt?.prompt?.()} disabled={!installPrompt} className="flex w-full items-center gap-3 rounded-[1.15rem] border border-card-border bg-card p-4 text-right disabled:opacity-50" data-testid="button-install-app"><span className="grid size-10 place-items-center rounded-full bg-secondary text-accent"><Download size={18} /></span><span><strong className="block text-sm">ثبّت سَكينة على جهازك</strong><small className="mt-1 block text-xs text-muted-foreground">{installPrompt ? 'وصول أسرع وقراءة بلا اتصال' : 'التثبيت متاح من قائمة المتصفح'}</small></span></button>
        <Link href="/about" className="flex w-full items-center gap-3 rounded-[1.15rem] border border-card-border bg-card p-4 text-right" data-testid="button-about"><span className="grid size-10 place-items-center rounded-full bg-secondary text-accent"><Info size={18} /></span><span><strong className="block text-sm">عن سَكينة</strong><small className="mt-1 block text-xs text-muted-foreground">بُنيت لتكون قريبة حين تحتاجها</small></span></Link>
      </div>
      <p className="mt-6 pb-4 text-center text-[0.6875rem] text-muted-foreground">تطبيق سَكينة · بدون إعلانات · بدون اشتراكات</p>
    </div>
  );
}
