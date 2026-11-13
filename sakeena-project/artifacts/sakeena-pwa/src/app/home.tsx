import { MapPin, RotateCcw, Leaf, Cloud, Sprout, Heart, Compass, Users, Sunrise, Check, Sparkles, BookOpen, CalendarDays, ClipboardList, Library, Target, Landmark, ChevronLeft, ArrowLeft, BookMarked, X, Crown, Medal, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { type PrayerTimes, getNextPrayer, getPrayerNameArabic, formatTime, STORAGE_KEYS, isFridayWindow, writeStorage, surahs } from '@/lib/sakeena';
import { useContentHadiths, useFavoriteHadiths, useAddFavoriteHadith, useRemoveFavoriteHadith, useActiveAnnouncement } from '@/lib/sakeena-api';
import { hadithOfTheDay, hadiths } from '@/features/hadith/hadith-data';
import { getSocket } from '@/features/quiz-battles/socket-client';
import { usePrayerTimes, useStoredState } from '@/app/common';
import { Header } from '@/app/layout';

export function PrayerCard({ prayer, loading, reload, usingLocation }: {
  prayer: PrayerTimes;
  loading: boolean;
  reload: (coords?: GeolocationCoordinates) => Promise<void>;
  usingLocation: boolean;
}) {
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const next = getNextPrayer(prayer.timings, new Date(clock));
  const cairoClock = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(clock));
  return (
    <section className="prayer-card quiet-grid relative overflow-hidden rounded-[1.35rem] border border-[#85834b]/55 p-5 text-[#f5f0d5] shadow-[0_14px_30px_rgb(0_0_0_/_0.2)] md:p-7" data-testid="card-prayer-times">
      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-[#d9d5a8]"><MapPin size={14} />{prayer.city}</div>
            <p className="text-sm text-[#c5c294]">{prayer.date}</p>
             <p className="mt-1 text-[0.6875rem] text-[#b9d2bf]">الآن بتوقيت القاهرة · {cairoClock}</p>
          </div>
          <button onClick={() => void reload()} className="rounded-xl p-2 text-[#b9d2bf] transition hover:bg-[#6aa87f]/20 hover:text-white" aria-label="تحديث مواقيت الصلاة" data-testid="button-refresh-prayer"><RotateCcw size={16} /></button>
        </div>
        <div>
          <p className="mb-1 text-sm text-[#c5c294]">الصلاة القادمة</p>
          <div className="flex items-end gap-3">
            <h2 className="font-arabic text-5xl leading-tight">{getPrayerNameArabic(next.name)}</h2>
            <span className="mb-1 text-sm text-[#c5c294]">بعد {Math.floor(next.minutes / 60) ? `${Math.floor(next.minutes / 60)} س ` : ''}{next.minutes % 60} د</span>
          </div>
        </div>
        <div className={`grid grid-cols-3 gap-2 border-t border-[#d9d5a8]/20 pt-4 sm:grid-cols-6${loading ? ' animate-pulse motion-reduce:animate-none' : ''}`}>
          {(Object.entries(prayer.timings) as [string, string][]).map(([name, time]) => (
            <div key={name} className={`rounded-xl px-1 py-2 text-center ${name === next.name ? 'bg-[#6aa87f]/25' : ''}`}>
              <p className="mb-1 text-[0.625rem] text-[#b9d2bf]">{getPrayerNameArabic(name as keyof PrayerTimes['timings'])}</p>
              <p className="font-mono-app text-[0.6875rem]">{formatTime(time)}</p>
            </div>
          ))}
        </div>
      </div>
      {(loading || prayer.source !== 'live' || usingLocation) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {(loading || prayer.source !== 'live') && <span className="rounded-full bg-[#6aa87f]/20 px-2 py-1 text-[0.625rem] text-[#d7eadb]">{loading ? 'جاري تحديث المواقيت…' : prayer.source === 'cached' ? 'آخر تحديث محفوظ' : 'وضع عدم الاتصال'}</span>}
          {usingLocation && <span className="text-[0.625rem] text-[#b9d2bf]">حسب موقعك الحالي</span>}
        </div>
      )}
    </section>
  );
}

export function ProgressRing({ value, label }: { value: number; label: string }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative grid size-[68px] place-items-center">
      <svg className="-rotate-90" width="68" height="68" aria-hidden="true">
        <circle cx="34" cy="34" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
        <circle cx="34" cy="34" r={radius} fill="none" stroke="hsl(var(--accent))" strokeWidth="5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value)} />
      </svg>
      <span className="absolute font-mono-app text-[0.6875rem]">{label}</span>
    </div>
  );
}

export const spiritualStates = [
  {
    key: 'anxious',
    label: 'شديد القلق',
    description: 'آية للطمأنينة',
    icon: Leaf,
    text: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    source: 'الرعد · ٢٨',
  },
  {
    key: 'tired',
    label: 'متعب',
    description: 'رحمة لا تُحمّل فوق طاقتك',
    icon: Cloud,
    text: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    source: 'البقرة · ٢٨٦',
  },
  {
    key: 'provision',
    label: 'أبحث عن رزق',
    description: 'دعاء مع الأخذ بالأسباب',
    icon: Sprout,
    text: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
    source: 'الطلاق · ٢–٣',
  },
  {
    key: 'sad',
    label: 'حزين',
    description: 'قربٌ يبدّد الوحشة',
    icon: Heart,
    text: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
    source: 'التوبة · ٤٠',
  },
  {
    key: 'distracted',
    label: 'مشتت',
    description: 'ذكر يعيد قلبك للحضور',
    icon: Compass,
    text: 'فَاذْكُرُونِي أَذْكُرْكُمْ',
    source: 'البقرة · ١٥٢',
  },
  {
    key: 'angry',
    label: 'غاضب',
    description: 'هدوء قبل الرد',
    icon: Cloud,
    text: 'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ',
    source: 'آل عمران · ١٣٤',
  },
  {
    key: 'lonely',
    label: 'وحيد',
    description: 'قرب الله لا يغيب',
    icon: Users,
    text: 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ',
    source: 'ق · ١٦',
  },
  {
    key: 'grateful',
    label: 'ممتن',
    description: 'شكر يزيد النعم',
    icon: Sprout,
    text: 'لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    source: 'إبراهيم · ٧',
  },
  {
    key: 'hopeful',
    label: 'أرجو رحمة الله',
    description: 'رجاء يفتح باب العمل',
    icon: Sunrise,
    text: 'وَلَا تَيْأَسُوا مِنْ رَوْحِ اللَّهِ',
    source: 'يوسف · ٨٧',
  },
  {
    key: 'repentant',
    label: 'أحتاج توبة',
    description: 'ارجع إلى الله بلا يأس',
    icon: RotateCcw,
    text: 'لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ',
    source: 'الزمر · ٥٣',
  },
  {
    key: 'fearful',
    label: 'خائف',
    description: 'توكل يملأ القلب أمانًا',
    icon: Sparkles,
    text: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    source: 'آل عمران · ١٧٣',
  },
  {
    key: 'sick',
    label: 'مريض أو متألم',
    description: 'دعاء أيوب عليه السلام',
    icon: Heart,
    text: 'أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ',
    source: 'الأنبياء · ٨٣',
  },
  {
    key: 'guilty',
    label: 'أشعر بالذنب',
    description: 'دعاء آدم وحواء عليهما السلام',
    icon: RotateCcw,
    text: 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
    source: 'الأعراف · ٢٣',
  },
  {
    key: 'seeking-knowledge',
    label: 'أطلب علمًا',
    description: 'دعاء يزيد الفهم والبركة',
    icon: BookOpen,
    text: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    source: 'طه · ١١٤',
  },
  {
    key: 'patience',
    label: 'أحتاج صبرًا',
    description: 'عون من الله على الثبات',
    icon: Sprout,
    text: 'وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ',
    source: 'النحل · ١٢٧',
  },
  {
    key: 'deciding',
    label: 'محتار في قرار',
    description: 'افتقار إلى الله يفتح الطريق',
    icon: Compass,
    text: 'رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ',
    source: 'القصص · ٢٤',
  },
  {
    key: 'tight-chest',
    label: 'ضيق في الصدر',
    description: 'دعاء موسى عليه السلام',
    icon: Cloud,
    text: 'رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي',
    source: 'طه · ٢٥–٢٦',
  },
  {
    key: 'worried-for-loved',
    label: 'قلق على من أحب',
    description: 'استودعهم أرحم الراحمين',
    icon: Users,
    text: 'فَاللَّهُ خَيْرٌ حَافِظًا ۖ وَهُوَ أَرْحَمُ الرَّاحِمِينَ',
    source: 'يوسف · ٦٤',
  },
  {
    key: 'family',
    label: 'أدعو لأهلي وذريتي',
    description: 'دعاء عباد الرحمن',
    icon: Users,
    text: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    source: 'الفرقان · ٧٤',
  },
  {
    key: 'good-ending',
    label: 'أريد حسن الخاتمة',
    description: 'أجمع دعاء للدنيا والآخرة',
    icon: Sunrise,
    text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    source: 'البقرة · ٢٠١',
  },
];

export function SpiritualPeace() {
  const [selectedState, setSelectedState] = useState(spiritualStates[0].key);
  const [savedWirds, setSavedWirds] = useStoredState<string[]>(STORAGE_KEYS.wird, []);
  const selectedSpiritualState = spiritualStates.find((state) => state.key === selectedState) ?? spiritualStates[0];
  const StateIcon = selectedSpiritualState.icon;
  const addToWird = () => {
    setSavedWirds((current) => current.includes(selectedSpiritualState.key) ? current : [...current, selectedSpiritualState.key]);
  };
  return (
    <div className="rise-in">
      <Header eyebrow="ورد يناسب حالتك" title="سكينة الروح" />
      <p className="-mt-3 mb-6 text-center text-sm text-muted-foreground">اختر حالتك لنقترح لك وردًا مناسبًا بهدوء</p>
      <div className="grid grid-cols-2 gap-3">
        {spiritualStates.map((state) => {
          const Icon = state.icon;
          const active = state.key === selectedState;
          return (
            <button
              key={state.key}
              onClick={() => setSelectedState(state.key)}
              className={`min-h-[112px] rounded-[1.35rem] border p-4 text-right transition ${active ? 'border-accent/70 bg-secondary' : 'border-[#2a5a42] bg-card hover:border-accent/60'}`}
              aria-pressed={active}
              data-testid={`button-spiritual-state-${state.key}`}
            >
              <span className={`mb-3 grid size-9 place-items-center rounded-xl ${active ? 'bg-accent text-accent-foreground' : 'bg-secondary text-accent'}`}><Icon size={18} /></span>
              <strong className="block text-sm">{state.label}</strong>
              <small className="mt-1 block text-[0.625rem] leading-5 text-muted-foreground">{state.description}</small>
            </button>
          );
        })}
      </div>
      <section className="mt-5 rounded-[1.5rem] border border-[#2a5a42] bg-card p-5" aria-live="polite" data-testid="panel-spiritual-recommendation">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><StateIcon size={19} /></span>
          <div>
            <p className="text-[0.625rem] font-semibold tracking-[.14em] text-accent">ورد مناسب لحالتك</p>
            <p className="mt-1 text-sm font-semibold">{selectedSpiritualState.label}</p>
          </div>
        </div>
        <p className="font-arabic text-2xl leading-[1.9]">{selectedSpiritualState.text}</p>
        <p className="mt-1 text-xs text-muted-foreground">{selectedSpiritualState.source}</p>
        <button onClick={addToWird} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs font-bold text-accent-foreground transition hover:brightness-105" data-testid="button-add-spiritual-wird">
          <Check size={15} />
          {savedWirds.includes(selectedSpiritualState.key) ? 'تمت الإضافة إلى وردك' : 'أضف لوردي اليومي'}
        </button>
      </section>
    </div>
  );
}

export function HawqalaCounter() {
  const [count, setCount] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    const socket = getSocket();
    socket.emit('counter:join', { key: 'hawqala' });
    const onUpdate = (payload: { key: string; count: number }) => { if (payload.key === 'hawqala') setCount(payload.count); };
    socket.on('counter:updated', onUpdate);
    return () => { socket.off('counter:updated', onUpdate); socket.emit('counter:leave', { key: 'hawqala' }); };
  }, []);
  const progress = Math.min(100, (count / 1000000) * 100);
  const tap = () => {
    setCount((c) => c + 1); // optimistic: feels instant, corrected by the next server broadcast
    setPulseKey((k) => k + 1);
    if ('vibrate' in navigator) navigator.vibrate(10);
    getSocket().emit('counter:increment', { key: 'hawqala' });
  };
  return (
    <section className="mt-6 overflow-hidden rounded-[1.35rem] border border-accent/45 bg-card p-5 text-foreground shadow-[0_14px_30px_rgb(0_0_0_/_0.18)] md:p-7" data-testid="card-hawqala">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="mb-2 text-xs font-semibold tracking-[.16em] text-accent">عداد الحوقلة الجماعي</p><h2 className="font-arabic text-3xl text-accent">لا حول ولا قوة إلا بالله</h2><p className="mt-2 text-sm text-muted-foreground">كل ضغطة تُضاف لعداد كل المستخدمين لحظيًا.</p></div>
        <div className="text-right lg:text-left"><p className="font-mono-app text-3xl text-accent">{new Intl.NumberFormat('ar-EG').format(count)} <span className="text-sm">ذكر</span></p><div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary lg:w-72"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} /></div></div>
      </div>
      <button onClick={tap} className="relative mt-7 flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-accent/50 bg-accent px-5 py-5 text-base font-bold text-accent-foreground transition hover:brightness-110 active:scale-[.98]" data-testid="button-hawqala-increment">
        <span key={pulseKey} className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle,#f4dfa4_0%,transparent_70%)]" style={{ animation: 'glow-pulse .5s ease-out' }} />
        <Sparkles size={20} className="relative" /><span className="relative">لا حول ولا قوة إلا بالله</span>
      </button>
    </section>
  );
}

export function FridayCard({ prayer }: { prayer: PrayerTimes }) {
  const [count, setCount] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const [online, setOnline] = useState(() => getSocket().connected);
  useEffect(() => {
    const socket = getSocket();
    const markOnline = () => setOnline(true);
    const markOffline = () => setOnline(false);
    socket.on('connect', markOnline); socket.on('disconnect', markOffline); socket.on('connect_error', markOffline);
    setOnline(socket.connected);
    socket.emit('counter:join', { key: 'salawat-friday' });
    const onUpdate = (payload: { key: string; count: number }) => { if (payload.key === 'salawat-friday') setCount(payload.count); };
    socket.on('counter:updated', onUpdate);
    return () => { socket.off('counter:updated', onUpdate); socket.off('connect', markOnline); socket.off('disconnect', markOffline); socket.off('connect_error', markOffline); socket.emit('counter:leave', { key: 'salawat-friday' }); };
  }, []);
  if (!isFridayWindow(prayer.timings.Maghrib)) return null;
  const tap = () => {
    if (!online) return;
    setCount((c) => c + 1);
    setPulseKey((k) => k + 1);
    if ('vibrate' in navigator) navigator.vibrate(10);
    getSocket().emit('counter:increment', { key: 'salawat-friday' });
  };
  return (
    <section className="mt-4 overflow-hidden rounded-[1.35rem] border border-accent/55 bg-card p-5 text-center" data-testid="card-friday-salawat">
      <p className="text-xs font-semibold tracking-[.16em] text-accent">ليلة الجمعة ويومها</p>
      <h2 className="mt-3 font-arabic text-2xl text-accent">اللهم صلِّ وسلم على نبينا محمد</h2>
      <p className="mt-2 text-xs text-muted-foreground">أكثروا من الصلاة على النبي ﷺ · عداد جماعي لكل المستخدمين</p>
      <div className="mt-4 flex items-center justify-center gap-3 text-sm">
        <span className="font-mono-app text-accent">{new Intl.NumberFormat('ar-EG').format(count)}</span>
        <span className="text-muted-foreground">مرة هذه الجمعة</span>
      </div>
      {!online && <p className="mt-3 rounded-xl bg-secondary p-2 text-[0.6875rem] text-muted-foreground" role="status">العداد الجماعي غير متصل الآن، فلن تصل صلاتك للآخرين. حاول مرة أخرى بعد قليل.</p>}
      <button onClick={tap} disabled={!online} className="relative mt-4 w-full overflow-hidden rounded-xl bg-accent px-4 py-4 text-base font-bold text-accent-foreground transition active:scale-[.98] disabled:opacity-50" data-testid="button-friday-salawat">
        <span key={pulseKey} className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle,#f4dfa4_0%,transparent_70%)]" style={{ animation: 'glow-pulse .5s ease-out' }} />
        <span className="relative">صلِّ على النبي ﷺ</span>
      </button>
    </section>
  );
}

const dailyAyat = [
  { text: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', ref: 'الرعد ٢٨' },
  { text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', ref: 'الشرح ٥' },
  { text: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', ref: 'الطلاق ٣' },
  { text: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ', ref: 'البقرة ١٥٢' },
  { text: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', ref: 'طه ١١٤' },
  { text: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', ref: 'البقرة ١٥٣' },
  { text: 'وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ', ref: 'النحل ١٢٧' },
  { text: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ', ref: 'البقرة ١٨٦' },
  { text: 'وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ', ref: 'غافر ٦٠' },
  { text: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', ref: 'البقرة ٢٨٦' },
  { text: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ', ref: 'آل عمران ١٣٩' },
  { text: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ', ref: 'الزمر ٥٣' },
  { text: 'إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ', ref: 'الحجر ٩' },
  { text: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا ۚ وَإِنَّ اللَّهَ لَمَعَ الْمُحْسِنِينَ', ref: 'العنكبوت ٦٩' },
  { text: 'فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ ۚ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ', ref: 'آل عمران ١٥٩' },
  { text: 'هَلْ جَزَاءُ الْإِحْسَانِ إِلَّا الْإِحْسَانُ', ref: 'الرحمن ٦٠' },
  { text: 'فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ ۝ وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُ', ref: 'الزلزلة ٧–٨' },
  { text: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ', ref: 'البقرة ٤٥' },
  { text: 'وَابْتَغِ فِيمَا آتَاكَ اللَّهُ الدَّارَ الْآخِرَةَ ۖ وَلَا تَنسَ نَصِيبَكَ مِنَ الدُّنْيَا', ref: 'القصص ٧٧' },
  { text: 'إِنَّ رَحْمَتَ اللَّهِ قَرِيبٌ مِّنَ الْمُحْسِنِينَ', ref: 'الأعراف ٥٦' },
  { text: 'وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِّنَ اللَّيْلِ ۚ إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ', ref: 'هود ١١٤' },
  { text: 'الْمَالُ وَالْبَنُونَ زِينَةُ الْحَيَاةِ الدُّنْيَا ۖ وَالْبَاقِيَاتُ الصَّالِحَاتُ خَيْرٌ عِندَ رَبِّكَ ثَوَابًا وَخَيْرٌ أَمَلًا', ref: 'الكهف ٤٦' },
  { text: 'إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ', ref: 'الحجرات ١٣' },
  { text: 'إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ فَأَصْلِحُوا بَيْنَ أَخَوَيْكُمْ ۚ وَاتَّقُوا اللَّهَ لَعَلَّكُمْ تُرْحَمُونَ', ref: 'الحجرات ١٠' },
  { text: 'وَقُل رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', ref: 'الإسراء ٢٤' },
  { text: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ', ref: 'الطلاق ٢–٣' },
  { text: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', ref: 'إبراهيم ٧' },
  { text: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ', ref: 'الضحى ٥' },
  { text: 'وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ ۖ إِنَّهُ لَا يَيْأَسُ مِن رَّوْحِ اللَّهِ إِلَّا الْقَوْمُ الْكَافِرُونَ', ref: 'يوسف ٨٧' },
  { text: 'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ ۖ وَلَا تَعَاوَنُوا عَلَى الْإِثْمِ وَالْعُدْوَانِ', ref: 'المائدة ٢' },
  { text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا وَاتَّقُوا اللَّهَ لَعَلَّكُمْ تُفْلِحُونَ', ref: 'آل عمران ٢٠٠' },
  { text: 'وَلَمَن صَبَرَ وَغَفَرَ إِنَّ ذَٰلِكَ لَمِنْ عَزْمِ الْأُمُورِ', ref: 'الشورى ٤٣' },
  { text: 'ادْفَعْ بِالَّتِي هِيَ أَحْسَنُ فَإِذَا الَّذِي بَيْنَكَ وَبَيْنَهُ عَدَاوَةٌ كَأَنَّهُ وَلِيٌّ حَمِيمٌ', ref: 'فصلت ٣٤' },
  { text: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ ۝ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ', ref: 'المؤمنون ١–٢' },
  { text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا', ref: 'الأحزاب ٤١' },
  { text: 'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا', ref: 'الملك ٢' },
  { text: 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ', ref: 'العصر ٣' },
  { text: 'وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا', ref: 'آل عمران ١٠٣' },
  { text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', ref: 'البقرة ٢٠١' },
  { text: 'وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ', ref: 'الذاريات ٥٦' },
  { text: 'فَاسْتَقِمْ كَمَا أُمِرْتَ', ref: 'هود ١١٢' },
];

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'صباح الخير';
  if (hour >= 12 && hour < 18) return 'طاب يومك';
  return 'مساء الخير';
}

function todayLabel(date: Date) {
  try {
    const weekday = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);
    const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    return `${weekday}، ${hijri}`;
  } catch {
    return date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}

export function Home() {
  const [, setLocation] = useLocation();
  const now = new Date();
  const prayerState = usePrayerTimes();
  const [tasbeeh] = useStoredState(STORAGE_KEYS.tasbeeh, { count: 0, target: 33 });
  const [reading] = useStoredState(STORAGE_KEYS.reading, { surahId: 1, verse: 1 });
  const [dismissedHadith, setDismissedHadith] = useState(false);
  const { data: announcement } = useActiveAnnouncement();
  const [seenAnnouncement, setSeenAnnouncement] = useStoredState<number>('sakeena.announcement.seen.v1', 0);
  const [copied, setCopied] = useState(false);
  const { data: remoteHadiths } = useContentHadiths();
  const pool = [...hadiths, ...(remoteHadiths ?? []).filter((r) => !hadiths.some((h) => h.text === r.text))];
  const hadith = hadithOfTheDay(now, pool);
  const { data: favoriteHadiths } = useFavoriteHadiths();
  const addFavoriteHadith = useAddFavoriteHadith();
  const removeFavoriteHadith = useRemoveFavoriteHadith();
  const hadithFavoriteEntry = favoriteHadiths?.find((item) => item.hadithId === String(hadith.id));

  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const ayah = dailyAyat[dayOfYear % dailyAyat.length];
  const ayahText = `﴿${ayah.text}﴾ [${ayah.ref}]`;
  const copyAyah = async () => {
    try { await navigator.clipboard.writeText(ayahText); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };
  const shareAyah = async () => {
    if (navigator.share) { try { await navigator.share({ text: ayahText }); return; } catch { /* cancelled */ } }
    void copyAyah();
  };

  const surah = surahs.find((item) => item.id === reading.surahId) ?? surahs[0];
  const readingPercent = Math.min(100, Math.round((reading.verse / surah.verses) * 100));
  const tasbeehPercent = Math.min(100, Math.round((tasbeeh.count / Math.max(tasbeeh.target, 1)) * 100));

  const shortcuts = [
    { label: 'القرآن', href: '/quran', icon: BookOpen },
    { label: 'الأذكار', href: '/adhkar', icon: Sparkles },
    { label: 'القبلة', href: '/qibla', icon: Compass },
    { label: 'سجل الصلاة', href: '/worship', icon: ClipboardList },
    { label: 'الأسماء الحسنى', href: '/names-of-allah', icon: Library },
    { label: 'الرقية', href: '/ruqyah', icon: Leaf },
    { label: 'ركن الأطفال', href: '/kids', icon: Users },
    { label: 'حاسبة الزكاة', href: '/zakat', icon: Target },
  ];
  const homeCategories = [
    { label: 'عبادتك اليوم', detail: 'صلواتك وصيامك وختمتك', href: '/worship', icon: Sunrise },
    { label: 'الدعاء والذكر', detail: 'أذكار وأدعية مأثورة', href: '/adhkar', icon: Sparkles },
    { label: 'القرآن الكريم', detail: 'اقرأ واستمع واحفظ', href: '/quran', icon: BookOpen },
    { label: 'العلم والمعرفة', detail: 'مسلم جديد وأسماء الله', href: '/knowledge', icon: Library },
    { label: 'الفقه والمواسم', detail: 'رمضان والزكاة والحج', href: '/fiqh', icon: CalendarDays },
    { label: 'حفظ ومراجعة', detail: 'خطة الحفظ والمراجعة', href: '/tools/memorization', icon: Target },
    { label: 'ختمة جماعية', detail: 'شارك الخير مع من تحب', href: '/group-khatmah', icon: Users },
    { label: 'الحج والعمرة', detail: 'دليل المناسك والأدعية', href: '/umrah', icon: Landmark },
  ];

  return (
    <div className="rise-in space-y-5 pb-4">
      <Header eyebrow={todayLabel(now)} title={`${greetingFor(now)} يا صديق القرآن`} action={<button onClick={() => setLocation('/settings')} className="hidden rounded-xl border border-border px-4 py-2 text-xs md:block" data-testid="button-open-settings">الإعدادات</button>} />

      {announcement && announcement.id !== seenAnnouncement && (
        <section className="relative rounded-[1.5rem] border border-accent bg-card p-5 pr-5" role="status" data-testid="card-announcement">
          <button type="button" onClick={() => setSeenAnnouncement(announcement.id)} className="absolute left-3 top-3 rounded-lg border border-border p-1.5 text-muted-foreground" aria-label="إخفاء الرسالة" data-testid="button-dismiss-announcement"><X size={14} /></button>
          <p className="mb-1 text-[0.6875rem] font-semibold tracking-[.16em] text-accent">رسالة من سَكينة</p>
          <strong className="mb-1 block text-base">{announcement.title}</strong>
          <p className="text-sm leading-7 text-muted-foreground">{announcement.body}</p>
        </section>
      )}

      <PrayerCard {...prayerState} />
      <FridayCard prayer={prayerState.prayer} />

      <section aria-label="اختصارات">
        <div className="grid grid-cols-4 gap-2.5">
          {shortcuts.map(({ label, href, icon: Icon }) => (
            <Link href={href} key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-card-border bg-card px-1 py-3.5 text-center transition active:scale-95 hover:border-accent/60" data-testid={`link-shortcut-${href.slice(1)}`}>
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-accent"><Icon size={20} /></span>
              <span className="text-[0.6875rem] font-semibold leading-4">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-card-border bg-card p-5" data-testid="card-daily-progress" aria-label="يومك">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold">يومك</h2><Link href="/worship" className="text-xs font-semibold text-accent">عبادتك اليوم</Link></div>
        <Link href={`/quran/${surah.id}`} className="mb-4 block" data-testid="link-resume-reading">
          <div className="mb-1.5 flex items-center justify-between text-sm"><span>تابع القراءة · سورة {surah.name}</span><span className="text-xs text-muted-foreground">الآية {reading.verse} من {surah.verses}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${readingPercent}%` }} /></div>
        </Link>
        <Link href="/adhkar" className="block" data-testid="link-progress-tasbeeh">
          <div className="mb-1.5 flex items-center justify-between text-sm"><span>التسبيح</span><span className="text-xs text-muted-foreground">{tasbeeh.count} من {tasbeeh.target}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${tasbeehPercent}%` }} /></div>
        </Link>
      </section>

      <section className="relative overflow-hidden rounded-[1.5rem] bg-primary p-6 text-center text-primary-foreground" data-testid="card-quote">
        <p className="mb-3 text-xs font-semibold tracking-[.16em] opacity-75">آية اليوم</p>
        <p className="font-arabic text-[1.625rem] leading-[2]">﴿{ayah.text}﴾</p>
        <p className="mt-1 text-xs opacity-75">{ayah.ref}</p>
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" onClick={copyAyah} className="rounded-full bg-primary-foreground/15 px-4 py-2 text-xs font-semibold" data-testid="button-copy-ayah">{copied ? 'تم النسخ ✓' : 'نسخ'}</button>
          <button type="button" onClick={shareAyah} className="flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-4 py-2 text-xs font-semibold" data-testid="button-share-ayah"><Share2 size={14} />مشاركة</button>
        </div>
      </section>

      {!dismissedHadith && <section className="featured-card rounded-[1.5rem] border bg-card p-5" data-testid="card-hadith-discovery">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[.16em] text-accent"><BookMarked size={16} />حديث اليوم</p>
          <button onClick={() => setDismissedHadith(true)} className="rounded-lg border border-border p-1.5 text-muted-foreground" aria-label="إخفاء البطاقة" data-testid="button-dismiss-hadith"><X size={14} /></button>
        </div>
        <p className="font-arabic text-xl leading-[1.9]">«{hadith.text}»</p>
        <p className="mt-2 text-xs text-muted-foreground">{hadith.source}</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => hadithFavoriteEntry ? removeFavoriteHadith.mutate(hadithFavoriteEntry.id) : addFavoriteHadith.mutate({ hadithId: String(hadith.id), hadithText: hadith.text, source: hadith.source })} className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${hadithFavoriteEntry ? 'bg-accent text-accent-foreground' : 'border border-border text-muted-foreground'}`} data-testid="button-favorite-daily-hadith">{hadithFavoriteEntry ? 'في المفضلة' : 'أضف للمفضلة'}</button>
          <button onClick={() => { writeStorage('sakeena.share-card.prefill', { text: hadith.text, source: hadith.source }); setLocation('/share-card'); }} className="rounded-xl border border-border px-4 py-2.5 text-xs text-muted-foreground" data-testid="button-share-daily-hadith">بطاقة اقتباس</button>
        </div>
      </section>}

      <section className="grid grid-cols-2 gap-3" aria-label="المسابقات">
        <Link href="/quiz" className="rounded-[1.25rem] border border-card-border bg-card p-4 transition active:scale-95" data-testid="link-home-quiz"><Medal size={22} className="mb-3 text-accent" /><strong className="block text-sm">المسابقات</strong><small className="text-xs text-muted-foreground">اختبر معلوماتك</small></Link>
        <Link href="/weekly-challenge" className="rounded-[1.25rem] border border-card-border bg-card p-4 transition active:scale-95" data-testid="link-home-challenge"><Crown size={22} className="mb-3 text-accent" /><strong className="block text-sm">التحدي الأسبوعي</strong><small className="text-xs text-muted-foreground">نافس غيرك</small></Link>
      </section>

      <section className="flex items-center gap-3 rounded-[1.25rem] border border-card-border bg-card p-4" data-testid="card-collective-dua">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-accent"><Heart size={18} fill="currentColor" /></span>
        <div className="min-w-0 flex-1"><strong className="block text-sm">جدار الدعاء الجماعي</strong><small className="text-xs leading-5 text-muted-foreground">اكتب دعاءً وأمّن على دعاء غيرك</small></div>
        <Link href="/dua-wall" className="shrink-0 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-accent-foreground" data-testid="link-open-collective-dua">افتح</Link>
      </section>

      <HawqalaCounter />
      <Link href="/spiritual-peace" className="flex items-center gap-3 rounded-[1.25rem] border border-card-border bg-card p-4 transition hover:border-accent/70" aria-label="فتح سكينة الروح" data-testid="link-spiritual-peace">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-accent"><Leaf size={20} /></span>
        <span className="min-w-0 flex-1"><strong className="block text-sm">سكينة الروح</strong><small className="mt-1 block text-xs text-muted-foreground">ورد يناسب حالتك النفسية</small></span>
        <ChevronLeft size={19} className="text-accent" />
      </Link>

      <section aria-labelledby="all-sakeena-title">
        <div className="mb-3 flex items-end justify-between"><h2 id="all-sakeena-title" className="text-base font-bold">كل سَكينة</h2><Link href="/more" className="flex items-center gap-1 text-xs font-semibold text-accent" data-testid="link-home-more">كل الأقسام <ArrowLeft size={14} /></Link></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {homeCategories.map(({ label, detail, href, icon: Icon }) => (
            <Link href={href} key={label} className="rounded-2xl border border-card-border bg-card p-4 transition active:scale-95 hover:border-accent/60" data-testid={`link-category-${href.slice(1).replace(/\//g, '-')}`}>
              <Icon size={22} className="mb-3 text-accent" /><strong className="block text-sm">{label}</strong><small className="mt-1 block text-xs leading-5 text-muted-foreground">{detail}</small>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
