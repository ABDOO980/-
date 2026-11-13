import { ArrowRight, BookOpen, Calculator, CalendarDays, GraduationCap, Heart, Landmark, Library, Moon, Scale, Sparkles, Star, Sun, Users, type LucideIcon } from 'lucide-react';
import { Link } from 'wouter';

type HubItem = { label: string; detail: string; href: string; icon: LucideIcon };

function Hub({ title, subtitle, featured, items }: { title: string; subtitle: string; featured: HubItem; items: HubItem[] }) {
  const FeaturedIcon = featured.icon;
  return (
    <div className="rise-in pb-6" dir="rtl">
      <header className="relative mb-5 flex min-h-14 items-center justify-center border-b border-border/50 pb-4">
        <Link href="/more" className="absolute right-0 grid size-9 place-items-center text-accent" aria-label="رجوع"><ArrowRight size={22} /></Link>
        <div className="text-center"><p className="mb-1 text-[0.6875rem] text-muted-foreground">{subtitle}</p><h1 className="font-arabic text-[1.75rem] font-bold leading-tight">{title}</h1></div>
      </header>
      <Link href={featured.href} className="mb-5 flex items-center gap-4 rounded-[1.5rem] bg-primary p-5 text-primary-foreground transition active:scale-[.98]" data-testid="link-hub-featured">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground"><FeaturedIcon size={26} /></span>
        <span className="min-w-0 flex-1"><strong className="block text-lg">{featured.label}</strong><small className="mt-1 block text-xs leading-5 opacity-80">{featured.detail}</small></span>
      </Link>
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ label, detail, href, icon: Icon }) => (
          <Link key={href + label} href={href} className="rounded-[1.25rem] border border-card-border bg-card p-4 transition active:scale-95 hover:border-accent/60" data-testid={`link-hub-${href.slice(1).replace(/\//g, '-')}`}>
            <span className="mb-3 grid size-10 place-items-center rounded-xl bg-secondary text-accent"><Icon size={20} /></span>
            <strong className="block text-sm">{label}</strong><small className="mt-1 block text-xs leading-5 text-muted-foreground">{detail}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function KnowledgeHubPage() {
  return (
    <Hub title="العلم والمعرفة" subtitle="تعلّم دينك خطوة بخطوة"
      featured={{ label: 'مسلم جديد؟ ابدأ هنا', detail: 'دليل شامل يأخذ بيدك من الشهادتين إلى الصلاة وأحكام الحياة', href: '/new-muslim', icon: GraduationCap }}
      items={[
        { label: 'السيرة النبوية', detail: 'حياة النبي ﷺ من المولد إلى الوفاة', href: '/seerah', icon: Star },
        { label: 'الأحاديث النبوية', detail: 'أحاديث مختارة بشرح مبسّط', href: '/hadith', icon: BookOpen },
        { label: 'أسماء الله الحسنى', detail: 'التسعة والتسعون اسمًا ومعانيها', href: '/names-of-allah', icon: Star },
        { label: 'قصص الأنبياء', detail: 'عبر وعظات من القرآن', href: '/prophets', icon: Library },
        { label: 'الصحابة', detail: 'سير الجيل الأول', href: '/companions', icon: Users },
        { label: 'دروس التجويد', detail: 'اقرأ القرآن كما أُنزل', href: '/tools/tajweed', icon: Sparkles },
        { label: 'تعلّم دينك', detail: 'الوضوء والصلاة وأحكامها', href: '/learning', icon: GraduationCap },
        { label: 'تدبر وإلهام', detail: 'مقالات وفوائد', href: '/articles', icon: Heart },
        { label: 'الأذكار والأدعية', detail: 'أذكار اليوم والليلة', href: '/adhkar', icon: Sparkles },
        { label: 'فتاوى ابن باز', detail: 'ملخصات في مسائل شائعة', href: '/binbaz', icon: Scale },
      ]} />
  );
}

export function FiqhHubPage() {
  return (
    <Hub title="الفقه والمواسم" subtitle="أحكام عملية وأيام فاضلة"
      featured={{ label: 'رمضان', detail: 'الإمساكية والأدعية وبرنامج الشهر الكريم', href: '/ramadan', icon: Moon }}
      items={[
        { label: 'متتبع الصيام', detail: 'سجّل صيامك في تقويم', href: '/worship/fasting', icon: Sun },
        { label: 'التقويم الهجري', detail: 'المناسبات والأيام البيض', href: '/calendar', icon: CalendarDays },
        { label: 'حاسبة الزكاة', detail: 'احسب نصاب زكاتك', href: '/zakat', icon: Calculator },
        { label: 'المواريث', detail: 'أنصبة الورثة باختصار', href: '/inheritance', icon: Scale },
        { label: 'سنن اليوم', detail: 'أحيِ سنة كل يوم', href: '/sunan', icon: Sparkles },
        { label: 'دليل العمرة', detail: 'الخطوات مرتبة', href: '/umrah', icon: Landmark },
        { label: 'مناسك الحج', detail: 'أيام الحج وأعماله', href: '/hajj', icon: Landmark },
        { label: 'أسئلة وأحكام', detail: 'اسأل عن دينك', href: '/fatwas', icon: Library },
      ]} />
  );
}
