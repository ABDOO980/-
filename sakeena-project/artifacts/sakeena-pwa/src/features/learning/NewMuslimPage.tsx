import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { useStoredState } from '@/app/common';

type Step = { id: string; title: string; summary: string; points: string[]; link?: [string, string] };

const steps: Step[] = [
  { id: 'shahada', title: 'الشهادتان: بداية الطريق', summary: 'كلمتان تدخل بهما الإسلام', points: [
    'الدخول في الإسلام يكون بالنطق بالشهادتين عن علم واقتناع: «أشهد أن لا إله إلا الله، وأشهد أن محمدًا رسول الله».',
    'معنى الأولى: لا معبود بحق إلا الله وحده لا شريك له. ومعنى الثانية: الإيمان بأن محمدًا ﷺ عبد الله ورسوله، وتصديقه فيما أخبر، وطاعته فيما أمر.',
    'يُستحب الاغتسال بعد الإسلام، ولا يشترط حضور أحد ولا مكان معين، ويمكنك النطق بها وحدك، وإن أشهدتَ مسلمًا فحسن للتوثيق.',
    'والإسلام يمحو ما قبله من الذنوب، فتبدأ صفحة جديدة نقية بإذن الله.',
  ] },
  { id: 'pillars', title: 'أركان الإسلام وأركان الإيمان', summary: 'الأساس الذي يقوم عليه دينك', points: [
    'أركان الإسلام خمسة: الشهادتان، وإقام الصلاة، وإيتاء الزكاة، وصوم رمضان، وحج البيت لمن استطاع.',
    'أركان الإيمان ستة: الإيمان بالله، وملائكته، وكتبه، ورسله، واليوم الآخر، والقدر خيره وشره.',
    'الإسلام عمل الجوارح، والإيمان تصديق القلب، والإحسان أن تعبد الله كأنك تراه، فإن لم تكن تراه فإنه يراك.',
  ], link: ['/names-of-allah', 'تعرّف على أسماء الله الحسنى'] },
  { id: 'purity', title: 'الطهارة: الوضوء والغسل', summary: 'مفتاح الصلاة', points: [
    'خطوات الوضوء: النية في القلب، ثم «بسم الله»، ثم غسل الكفين ثلاثًا، والمضمضة والاستنشاق، وغسل الوجه ثلاثًا، وغسل اليدين إلى المرفقين ثلاثًا، ومسح الرأس والأذنين مرة، وغسل الرجلين إلى الكعبين ثلاثًا.',
    'ينقض الوضوء: خروج البول أو الغائط أو الريح، والنوم المستغرق، وزوال العقل. وبعد الوضوء تقول: «أشهد أن لا إله إلا الله وحده لا شريك له، وأشهد أن محمدًا عبده ورسوله».',
    'يجب الغسل بعد الجنابة، وعند انقطاع الحيض والنفاس، ويكون بتعميم البدن بالماء مع النية.',
  ] },
  { id: 'prayer', title: 'الصلاة: عمود الدين', summary: 'خمس صلوات في اليوم والليلة', points: [
    'الصلوات الخمس: الفجر ركعتان، والظهر أربع، والعصر أربع، والمغرب ثلاث، والعشاء أربع.',
    'شروطها: الطهارة، وستر العورة، واستقبال القبلة، ودخول الوقت.',
    'خطواتها: تكبيرة الإحرام «الله أكبر»، ثم قراءة الفاتحة وسورة، ثم الركوع «سبحان ربي العظيم»، ثم الرفع «سمع الله لمن حمده»، ثم السجود «سبحان ربي الأعلى»، ثم الجلوس بين السجدتين، ثم السجدة الثانية. وفي آخر الصلاة التشهد والصلاة على النبي ﷺ ثم التسليم.',
    'لا تقلق إن كنت لا تحفظ كل شيء: ابدأ بما تحفظ، وتعلّم الفاتحة وقصار السور تدريجيًا. ومن لا يحسن القرآن بعد يقول: «سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر، ولا حول ولا قوة إلا بالله».',
    'ابدأ بالمحافظة على الفرائض في أوقاتها، ثم أضف النوافل شيئًا فشيئًا.',
  ], link: ['/worship', 'سجّل صلواتك اليومية'] },
  { id: 'fasting', title: 'الصيام والزكاة والحج', summary: 'بقية الأركان', points: [
    'الصيام: يصوم المسلم شهر رمضان من طلوع الفجر إلى غروب الشمس، ممتنعًا عن الأكل والشرب والجماع. ومن لم يستطع لمرض أو سفر أفطر وقضى بعد ذلك.',
    'الزكاة: يخرج المسلم 2.5% من ماله إذا بلغ النصاب ومضى عليه عام هجري، وتُعطى للفقراء وسائر مستحقيها.',
    'الحج: فريضة العمر مرة واحدة على من استطاع بدنيًا وماليًا. لا يلزمك شيء منها الآن إلا إذا تحققت شروطها.',
  ], link: ['/worship/fasting', 'تتبّع صيامك'] },
  { id: 'rulings', title: 'الحلال والحرام الأساسي', summary: 'ما تتجنبه وما يباح لك', points: [
    'أعظم الذنوب الشرك بالله، والواجب إفراده سبحانه بالعبادة.',
    'من المحرمات: الربا، والزنا، وشرب الخمر وكل مسكر، وأكل لحم الخنزير والميتة وما ذُبح لغير الله، والسرقة، والكذب، والغيبة، وعقوق الوالدين، والظلم.',
    'الأصل في الأطعمة والأشربة والمعاملات الإباحة ما لم يرد دليل بالتحريم. والتحريم رحمة وحماية للإنسان.',
    'إن وقعت في خطأ فتُب إلى الله فهو يقبل التوبة، ولا تيأس من رحمته.',
  ] },
  { id: 'character', title: 'الأخلاق والعلاقات', summary: 'الإسلام معاملة', points: [
    'أحسن إلى والديك وأهلك ولو كانوا على غير الإسلام، وأطعهما بالمعروف في غير معصية الله، وتلطّف معهم في الحديث عن إسلامك.',
    'الصدق والأمانة والرفق وحسن الجوار من صميم الدين، ويُحسن المسلم إلى جميع الناس.',
    'لا يلزمك إخبار الجميع فورًا بإسلامك. تدرّج بحكمة وراعِ الظروف المحيطة بك.',
  ] },
  { id: 'quran', title: 'القرآن والذكر', summary: 'اجعل لك وردًا يوميًا', points: [
    'ابدأ بقراءة ترجمة معاني القرآن لتفهم رسالته، واحفظ الفاتحة وسورة الإخلاص والمعوذتين.',
    'استمع إلى التلاوة بصوت قارئ تحبه، وداوم على أذكار الصباح والمساء ولو بالقليل.',
    'من الأدعية الجامعة: «رب زدني علمًا»، و«اللهم ثبّت قلبي على دينك».',
  ], link: ['/adhkar', 'أذكار الصباح والمساء'] },
  { id: 'journey', title: 'نصائح لرحلتك', summary: 'خطوة بخطوة', points: [
    'لا تحمّل نفسك فوق طاقتك. الثبات على القليل خير من الحماس ثم الانقطاع.',
    'ابحث عن مسجد قريب وأخ أو أخت من المسلمين يرافقك، فالصحبة الصالحة تعين على الثبات.',
    'اسأل أهل العلم الثقات عما يُشكل عليك، ولا تأخذ دينك من مصادر مجهولة.',
    'تذكّر أن الله رحيم بك، وأن كل خطوة تخطوها نحوه مكتوبة لك.',
  ], link: ['/knowledge', 'تابع التعلّم'] },
];

const faq: [string, string][] = [
  ['هل يجب أن أغيّر اسمي؟', 'لا يلزم تغيير الاسم إلا إذا كان معناه سيئًا أو يتضمن عبودية لغير الله، فحينها يُستحب تغييره إلى اسم حسن.'],
  ['هل أحتاج شهودًا أو إجراءً رسميًا لأصبح مسلمًا؟', 'لا. الإسلام يصح بالنطق بالشهادتين عن اقتناع. والتوثيق الرسمي أو إشهاد المسلمين لأجل الإجراءات فقط.'],
  ['هل أصلّي جميع الصلوات من أول يوم؟', 'نعم هي فريضة، فابدأ بما تحفظ وتعلّم الباقي تدريجيًا. وإن عجزت عن شيء فاسأل أهل العلم، والله لا يكلّف نفسًا إلا وسعها.'],
  ['هل الختان شرط لصحة الإسلام؟', 'ليس شرطًا لصحة الإسلام. وهو من خصال الفطرة عند عامة العلماء، فإن كان فيه مشقة أو خطر صحي فاستشر طبيبًا وعالمًا.'],
  ['ماذا عن ذنوبي قبل الإسلام؟', 'الإسلام يمحو ما قبله. وبعده إن أذنبت فبابُ التوبة مفتوح دائمًا.'],
];

export function NewMuslimPage() {
  const [done, setDone] = useStoredState<string[]>('sakeena.newmuslim.v1', []);
  const [open, setOpen] = useState<string | null>('shahada');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const toggle = (id: string) => setDone((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);

  return (
    <div className="rise-in pb-6" dir="rtl">
      <header className="relative mb-5 flex min-h-14 items-center justify-center border-b border-border/50 pb-4">
        <Link href="/more" className="absolute right-0 grid size-9 place-items-center text-accent" aria-label="رجوع"><ArrowRight size={22} /></Link>
        <div className="text-center"><p className="mb-1 text-[0.6875rem] text-muted-foreground">أهلًا بك في أسرة الإسلام</p><h1 className="font-arabic text-[1.75rem] font-bold leading-tight">مسلم جديد</h1></div>
      </header>

      <section className="mb-4 rounded-[1.5rem] bg-primary p-6 text-center text-primary-foreground" data-testid="card-shahada">
        <p className="mb-3 text-xs font-semibold tracking-[.16em] text-accent">كلمة التوحيد</p>
        <p className="font-arabic text-[1.375rem] leading-[2.1]">أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ<br />وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ</p>
        <p className="mt-3 text-xs leading-6 opacity-80">رحلتك تبدأ بكلمة، وتُكمَل بخطوات صغيرة ثابتة.</p>
      </section>

      <div className="mb-4 rounded-2xl border border-card-border bg-card p-4">
        <div className="mb-2 flex justify-between text-sm"><span>رحلتك</span><strong>{done.length} من {steps.length}</strong></div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(done.length / steps.length) * 100}%` }} /></div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const isOpen = open === step.id; const isDone = done.includes(step.id);
          return (
            <section key={step.id} className={`rounded-[1.25rem] border p-4 ${isDone ? 'border-accent/50 bg-accent/10' : 'border-card-border bg-card'}`}>
              <button type="button" onClick={() => setOpen(isOpen ? null : step.id)} className="flex w-full items-center gap-3 text-right" data-testid={`button-newmuslim-${step.id}`}>
                <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${isDone ? 'bg-accent text-accent-foreground' : 'bg-secondary text-accent'}`}>{isDone ? <Check size={16} /> : index + 1}</span>
                <span className="min-w-0 flex-1"><strong className="block">{step.title}</strong><small className="text-xs text-muted-foreground">{step.summary}</small></span>
                <ChevronDown size={18} className={`shrink-0 text-accent transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="mt-3 border-t border-border/50 pt-3">
                  <ul className="space-y-3">{step.points.map((point) => <li key={point} className="flex gap-2 text-sm leading-8"><span className="mt-3 size-1.5 shrink-0 rounded-full bg-accent" /><span>{point}</span></li>)}</ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => toggle(step.id)} className={`rounded-full px-4 py-2 text-xs font-bold ${isDone ? 'border border-border' : 'bg-primary text-primary-foreground'}`} data-testid={`button-newmuslim-done-${step.id}`}>{isDone ? 'إلغاء الإتمام' : 'أتممت هذه الخطوة'}</button>
                    {step.link && <Link href={step.link[0]} className="rounded-full border border-accent px-4 py-2 text-xs font-semibold text-accent">{step.link[1]}</Link>}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <h2 className="mb-3 mt-6 text-base font-bold">أسئلة يسألها كل مسلم جديد</h2>
      <div className="space-y-2">
        {faq.map(([q, a], i) => (
          <div key={q} className="rounded-xl border border-card-border bg-card p-4">
            <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-3 text-right text-sm font-semibold" data-testid={`button-newmuslim-faq-${i}`}>{q}<ChevronDown size={16} className={`shrink-0 text-accent transition-transform ${openFaq === i ? 'rotate-180' : ''}`} /></button>
            {openFaq === i && <p className="mt-3 border-t border-border/50 pt-3 text-sm leading-8">{a}</p>}
          </div>
        ))}
      </div>
      <p className="mt-5 rounded-xl border border-card-border bg-card p-4 text-xs leading-6 text-muted-foreground">هذا الدليل تعريف مختصر بأساسيات الإسلام، وليس بديلًا عن التعلّم على يد أهل العلم. ولأي مسألة خاصة اسأل عالمًا أو إمام مسجد موثوقًا.</p>
    </div>
  );
}
