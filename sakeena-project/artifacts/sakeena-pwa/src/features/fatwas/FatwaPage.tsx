import { ArrowRight, ChevronDown, CircleHelp, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useContentFatwas } from '@/lib/sakeena-api';

const questions = [
  {
    category: 'عام',
    question: 'هل يجوز قراءة القرآن من الهاتف؟',
    answer: 'نعم، تجوز القراءة من تطبيق القرآن مع تعظيم كلام الله وحسن الأدب معه.',
    explanation: 'الهاتف لا يأخذ حكم المصحف الورقي عند كثير من أهل العلم؛ ومع ذلك يستحب الوضوء والقراءة في مكان طاهر، وتبقى النية والتدبر أهم من سرعة القراءة.',
    source: 'تنبيه: هذه إجابة توعوية عامة، والمسائل التفصيلية تُسأل فيها جهة علمية موثوقة.',
  },
  {
    category: 'عام',
    question: 'ما أفضل وقت لأذكار الصباح والمساء؟',
    answer: 'أذكار الصباح تبدأ بعد الفجر، وأذكار المساء تبدأ بعد العصر، ويمتد وقتها عند التذكر.',
    explanation: 'المقصود أن يبدأ المسلم يومه ويدخل ليله بذكر الله. إن فات الوقت المعتاد فلا تترك الذكر؛ اقرأ ما تيسر بدلًا من تركه كله.',
    source: 'قال تعالى: «وَاذْكُرْ رَبَّكَ كَثِيرًا».',
  },
  {
    category: 'عام',
    question: 'كيف أتعامل مع فوات الورد؟',
    answer: 'اقضِ ما تستطيع بلا مشقة، ثم عد إلى ورد صغير ثابت في اليوم التالي.',
    explanation: 'الاستمرار أحب من العمل الكثير المنقطع. قسّم الورد إلى دقائق قليلة، واربطه بوقت ثابت مثل بعد صلاة أو قبل النوم.',
    source: 'المعنى مستفاد من حديث: «أحب الأعمال إلى الله أدومها وإن قل».',
  },
  {
    category: 'عام',
    question: 'هل أستطيع الجمع بين نية التعلم والعبادة؟',
    answer: 'نعم، قد تجتمع النيات الصالحة في العمل الواحد.',
    explanation: 'يمكن أن تنوي رفع الجهل، ونفع نفسك، ونفع أهلك، وابتغاء مرضاة الله. اجعل العلم طريقًا للعمل لا مجرد معلومات محفوظة.',
    source: 'الأعمال بالنيات، ولكل امرئ ما نوى.',
  },
  {
    category: 'عام',
    question: 'ماذا أفعل إذا شعرت بالكسل عن الصلاة؟',
    answer: 'ابدأ بالقيام عند دخول الوقت، وتوضأ فورًا، ولا تنتظر أن تأتيك الرغبة أولًا.',
    explanation: 'المشاعر تتغير، أما الصلاة فلها وقت. سهّل البداية: جهّز ملابس الصلاة، واضبط تذكيرًا، واطلب الصحبة الصالحة، واستعن بالله.',
    source: 'قال تعالى: «وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ».',
  },
  {
    category: 'عام',
    question: 'كيف أبدأ التوبة إذا أخطأت؟',
    answer: 'اترك الذنب، اندم عليه، واعزم ألا تعود، ورد الحقوق إلى أصحابها إن وُجدت.',
    explanation: 'لا تؤجل التوبة حتى تشعر أنك أصبحت كاملًا؛ التوبة نفسها بداية الإصلاح. وإذا تكرر الخطأ فجدّد التوبة ولا تيأس من رحمة الله.',
    source: 'قال تعالى: «إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا» لمن تاب وأناب.',
  },
  {
    category: 'عام',
    question: 'متى يكون الدعاء أقرب للإجابة؟',
    answer: 'ادعُ الله في كل وقت، وتحرى أوقاتًا فاضلة كالسجود، وآخر الليل، وبين الأذان والإقامة.',
    explanation: 'ابدأ بحمد الله والصلاة على النبي ﷺ، واطلب الخير بإخلاص، ولا تستعجل النتيجة؛ فقد تكون الإجابة بعين المطلوب أو بصرف سوء أو بأجر مدخر.',
    source: 'تنبيه: لا يوجد دعاء يضمن نتيجة بعينها؛ الإجابة بقدر الله وحكمته.',
  },
  {
    category: 'عام',
    question: 'كيف أتعامل مع الوسواس في العبادة؟',
    answer: 'لا تلتفت إلى الشك المتكرر بعد اليقين، واستعذ بالله، وخذ بالأسهل الذي يرفع الحرج.',
    explanation: 'الوسواس لا يعالج بكثرة الإعادة والتحقق. إذا تحول إلى قلق شديد أو أثّر في حياتك، فاطلب مساعدة مختص موثوق مع سؤال عالم في الجانب الشرعي.',
    source: 'قاعدة فقهية عامة: اليقين لا يزول بالشك.',
  },
  {
    category: 'عام',
    question: 'هل القليل من القرآن والذكر ينفع؟',
    answer: 'نعم، القليل المستمر نافع، وكل حرف من كتاب الله له أجر.',
    explanation: 'اختر مقدارًا يمكنك الحفاظ عليه: صفحة، أو خمس دقائق، أو ذكرًا بعد كل صلاة. ثم زد تدريجيًا عندما يثبت الورد.',
    source: 'المعنى مستفاد من فضل المداومة على العمل الصالح.',
  },
  // --- أحكام الصلاة ---
  {
    category: 'الصلاة',
    question: 'ما حكم من نسي ركنًا من أركان الصلاة؟',
    answer: 'إن تذكّر قبل أن يصل إلى موضعه في الركعة التالية رجع وأتى به، وإلا سجد للسهو عند جمهور الفقهاء.',
    explanation: 'الأركان لا تسقط بالنسيان، بخلاف الواجبات التي يجبرها سجود السهو. عند الشك الكثير المتكرر، ابنِ على غالب ظنك ولا تلتفت للوسواس.',
    source: 'تنبيه: هذه إجابة توعوية عامة وليست فتوى لحالة بعينها.',
  },
  {
    category: 'الصلاة',
    question: 'هل يجوز الجمع بين الصلاتين للمسافر؟',
    answer: 'نعم، يجوز للمسافر سفرًا طويلًا الجمع بين الظهر والعصر، وبين المغرب والعشاء.',
    explanation: 'الجمع رخصة تخفيفًا على المسافر، ويجوز جمع تقديم أو تأخير حسب الأيسر له، مع قصر الرباعية إلى ركعتين.',
    source: 'من رخص السفر الثابتة في السنة.',
  },
  // --- الطهارة ---
  {
    category: 'الطهارة',
    question: 'ما نواقض الوضوء؟',
    answer: 'منها: الخارج من السبيلين، النوم المستغرق، زوال العقل، ومس الفرج بشهوة عند بعض الفقهاء.',
    explanation: 'الأصل بقاء الطهارة حتى يتيقن الناقض؛ فلا تلتفت لمجرد الشك أو الشعور بلا يقين.',
    source: 'قاعدة: اليقين لا يزول بالشك.',
  },
  {
    category: 'الطهارة',
    question: 'كيف يكون التيمم عند فقد الماء؟',
    answer: 'ضرب الأرض الطاهرة بالكفين مرة واحدة، ثم مسح الوجه واليدين إلى الرسغين.',
    explanation: 'يشرع التيمم عند فقد الماء أو خوف الضرر من استعماله كالمرض، ويقوم مقام الوضوء والغسل في رفع الحدث.',
    source: 'من أحكام الطهارة الميسّرة على المكلف.',
  },
  // --- الصيام ---
  {
    category: 'الصيام',
    question: 'ما حكم من أكل ناسيًا وهو صائم؟',
    answer: 'صيامه صحيح ولا شيء عليه، ويتم صيامه عند جمهور الفقهاء.',
    explanation: 'النسيان عذر ترفع به المؤاخذة، فمن أكل أو شرب ناسيًا فليتم صومه ولا قضاء عليه.',
    source: '«فإنما أطعمه الله وسقاه» - من الأحاديث الواردة في هذا الباب.',
  },
  {
    category: 'الصيام',
    question: 'هل يفطر الصائم بالحجامة أو التحليل الطبي؟',
    answer: 'الراجح عند كثير من أهل العلم أن سحب عينة دم صغيرة للتحليل لا يفطر.',
    explanation: 'المسائل الطبية المستجدة يُرجع فيها لأهل العلم المعاصرين لضبط الفرق بين ما يُعد إخراجًا مؤثرًا للدم وما لا يؤثر.',
    source: 'تنبيه: في المسائل الطبية الدقيقة يُستحسن سؤال جهة علمية موثوقة.',
  },
  // --- التلاوة والتجويد ---
  {
    category: 'التلاوة والتجويد',
    question: 'ما حكم تعلم أحكام التجويد؟',
    answer: 'تطبيق أحكام التجويد لتصحيح النطق واجب عند أهل العلم، وتعلم مصطلحاته ودراسته توسعًا مستحب.',
    explanation: 'الهدف الأساسي هو عدم اللحن في القرآن (الأخطاء التي تغيّر المعنى)، وما زاد على ذلك من تحسين للصوت والمخارج فهو تحسين مستحب.',
    source: 'من مقاصد علم التجويد عند العلماء.',
  },
  {
    category: 'التلاوة والتجويد',
    question: 'ما الفرق بين المد الطبيعي والمد الفرعي؟',
    answer: 'المد الطبيعي مقداره حركتان ولا يقوم بذاته إلا بهما، أما المد الفرعي فيزيد على ذلك لسبب كهمزة أو سكون.',
    explanation: 'أمثلة المد الطبيعي: الألف والواو والياء المدية بلا همز أو سكون بعدها. والمد الفرعي كالمد المتصل والمنفصل واللازم والعارض للسكون.',
    source: 'من أساسيات علم التجويد.',
  },
];

export default function FatwaPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(0);
  const { data: remoteFatwas } = useContentFatwas();
  // Real, sourced rulings (e.g. from Sheikh Ibn Baz) fetched from the server
  // are merged alongside the app's own general FAQ content below.
  const allQuestions = useMemo(() => {
    const mapped = (remoteFatwas ?? []).map((f) => ({ category: f.category, question: f.question, answer: f.answer, explanation: '', source: f.source }));
    return [...mapped, ...questions];
  }, [remoteFatwas]);
  const categories = useMemo(() => Array.from(new Set(allQuestions.map((q) => q.category))), [allQuestions]);
  const visible = allQuestions.filter((item) => (!category || item.category === category) && item.question.includes(query));
  return (
    <div className="rise-in mx-auto max-w-2xl">
      <header className="mb-6 text-center"><p className="mb-1 text-xs text-muted-foreground">معرفة موثوقة ومختصرة</p><h1 className="font-arabic text-3xl font-bold">أسئلة وأحكام</h1></header>
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-card-border bg-card px-4 py-3"><Search size={18} className="text-accent" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="ابحث في الأسئلة..." /></div>
      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setCategory(null)} className={`rounded-full border px-3 py-1.5 text-[0.6875rem] font-semibold ${!category ? 'border-accent bg-accent/15 text-accent' : 'border-border text-muted-foreground'}`}>الكل</button>
        {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-3 py-1.5 text-[0.6875rem] font-semibold ${category === item ? 'border-accent bg-accent/15 text-accent' : 'border-border text-muted-foreground'}`} data-testid={`button-faq-category-${item}`}>{item}</button>)}
      </div>
      <div className="mb-5 rounded-2xl border border-accent/30 bg-secondary/50 p-4 text-xs leading-6"><CircleHelp size={17} className="mb-2 text-accent" />هذه إجابات توعوية مختصرة وليست فتوى شخصية. عند النوازل أو اختلاف الحال ارجع إلى عالم موثوق.</div>
       <div className="space-y-3">{visible.map((item, index) => <article key={item.question} className="rounded-2xl border border-card-border bg-card p-4"><button onClick={() => setOpen(open === index ? null : index)} className="flex w-full items-center gap-3 text-right"><span className="flex-1 text-sm font-semibold">{item.question}</span><ChevronDown size={17} className={`text-accent transition ${open === index ? 'rotate-180' : ''}`} /></button>{open === index && <div className="mt-4 space-y-4 border-t border-border pt-4"><div><p className="mb-1 text-[0.6875rem] font-semibold text-accent">الإجابة</p><p className="text-sm leading-7 text-foreground">{item.answer}</p></div><div><p className="mb-1 text-[0.6875rem] font-semibold text-accent">التفسير العملي</p><p className="text-sm leading-7 text-muted-foreground">{item.explanation}</p></div><p className="rounded-xl bg-secondary/60 p-3 text-[0.6875rem] leading-6 text-muted-foreground">{item.source}</p></div>}</article>)}</div>
      <Link href="/more" className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة إلى المزيد</Link>
    </div>
  );
}