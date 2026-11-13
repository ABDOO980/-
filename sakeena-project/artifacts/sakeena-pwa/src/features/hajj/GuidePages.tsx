import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStoredState } from '@/app/common';
import { Accordion, PageFrame, type Item } from '@/features/knowledge/PageFrame';

const umrah: Item[] = [
  { title: '١. الإحرام', body: 'يغتسل المعتمر ويلبس ثياب الإحرام (الرجل إزار ورداء أبيضان، والمرأة لباسها الساتر)، وينوي العمرة من الميقات أو ما يحاذيه، ثم يلبّي: لبيك اللهم عمرة. ويكثر من التلبية حتى يبدأ الطواف.' },
  { title: '٢. الطواف', body: 'يطوف بالكعبة سبعة أشواط تبدأ من الحجر الأسود وتنتهي عنده، والكعبة عن يساره. ويضطبع الرجل في طواف القدوم ويرمل في الأشواط الثلاثة الأولى إن استطاع.' },
  { title: '٣. ركعتا الطواف', body: 'بعد الطواف يصلي ركعتين خلف مقام إبراهيم إن تيسّر، وإلا ففي أي مكان من المسجد الحرام، ثم يشرب من ماء زمزم.' },
  { title: '٤. السعي', body: 'يسعى بين الصفا والمروة سبعة أشواط، يبدأ بالصفا وينتهي بالمروة. الذهاب من الصفا إلى المروة شوط، والعودة شوط آخر.' },
  { title: '٥. الحلق أو التقصير', body: 'يحلق الرجل رأسه أو يقصّره، والحلق أفضل، وتقصّر المرأة قدر أنملة من أطراف شعرها. وبذلك تتم العمرة ويحلّ من إحرامه.' },
];

const hajj: Item[] = [
  { title: 'يوم التروية (٨ ذو الحجة)', body: 'يُحرم الحاج بالحج من مكانه إن كان في مكة، ويتوجه إلى منى ويصلي فيها الظهر والعصر والمغرب والعشاء والفجر قصرًا بلا جمع.' },
  { title: 'يوم عرفة (٩ ذو الحجة)', body: 'بعد طلوع الشمس يتوجه إلى عرفة، ويجمع الظهر والعصر جمع تقديم مع القصر، ثم يتفرغ للدعاء والذكر حتى الغروب. والوقوف بعرفة هو ركن الحج الأعظم.' },
  { title: 'مزدلفة', body: 'بعد غروب الشمس يدفع الحاج إلى مزدلفة ويجمع المغرب والعشاء فيها، ويبيت بها، ويصلي الفجر ويذكر الله عند المشعر الحرام حتى يُسفر.' },
  { title: 'يوم النحر (١٠ ذو الحجة)', body: 'يرمي جمرة العقبة بسبع حصيات، ثم ينحر الهدي، ثم يحلق أو يقصّر، ثم يتحلل التحلل الأول. ثم يطوف طواف الإفاضة ويسعى بين الصفا والمروة إن كان متمتعًا.' },
  { title: 'أيام التشريق (١١ - ١٣)', body: 'يبيت بمنى ليالي أيام التشريق، ويرمي الجمرات الثلاث كل يوم بعد الزوال، يبدأ بالصغرى ثم الوسطى ثم جمرة العقبة، كل واحدة بسبع حصيات. ومن تعجّل في يومين فلا إثم عليه.' },
  { title: 'طواف الوداع', body: 'إذا أراد الحاج مغادرة مكة طاف بالبيت طواف الوداع ليكون آخر عهده بالبيت. ويُعفى منه الحائض والنفساء.' },
];

export function UmrahGuidePage() {
  return <PageFrame title="دليل العمرة" intro="خطوات العمرة مرتبة. وللتفاصيل والحالات الخاصة اسأل أهل العلم أو مرشد حملتك."><Accordion items={umrah} testId="button-umrah" /></PageFrame>;
}

export function HajjGuidePage() {
  return <PageFrame title="مناسك الحج" intro="ملخص أيام الحج وأعماله. وللتفاصيل والحالات الخاصة اسأل أهل العلم أو مرشد حملتك."><Accordion items={hajj} testId="button-hajj" /></PageFrame>;
}

type Timings = Record<string, string>;
const names: [string, string][] = [['Fajr', 'الفجر'], ['Sunrise', 'الشروق'], ['Dhuhr', 'الظهر'], ['Asr', 'العصر'], ['Maghrib', 'المغرب'], ['Isha', 'العشاء']];

export function HaramPage() {
  const [times, setTimes] = useState<Timings | null>(() => {
    try { return JSON.parse(localStorage.getItem('sakeena.makkah.times') ?? 'null') as Timings | null; } catch { return null; }
  });
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const date = new Date();
    const stamp = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    fetch(`https://api.aladhan.com/v1/timings/${stamp}?latitude=21.4225&longitude=39.8262&method=4`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !json?.data?.timings) return;
        setTimes(json.data.timings as Timings);
        setError(false);
        try { localStorage.setItem('sakeena.makkah.times', JSON.stringify(json.data.timings)); } catch { /* ignore */ }
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);
  return (
    <PageFrame title="مواقيت مكة" intro="مواقيت الصلاة في مكة المكرمة بحسب تقويم أم القرى.">
      {times ? (
        <div className="grid grid-cols-2 gap-3" data-testid="grid-makkah-times">
          {names.map(([key, label]) => (
            <div key={key} className="rounded-[1.1rem] border border-card-border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground">{label}</p>
              <strong className="font-mono-app text-xl">{times[key]?.slice(0, 5) ?? '—'}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-secondary p-4 text-center text-sm">{error ? 'تعذر تحميل المواقيت، تأكد من اتصالك بالإنترنت.' : 'جارٍ تحميل المواقيت...'}</p>
      )}
      <p className="mt-5 rounded-xl border border-card-border bg-card p-4 text-sm leading-7 text-muted-foreground">
        عن الزحام: لا يوفّر التطبيق بيانات لحظية لكثافة الطواف، فهي تحتاج مصدرًا رسميًا. للمعلومات المحدّثة عن الزحام والخدمات راجع تطبيق نسك الرسمي أو إرشادات الجهات المنظمة.
      </p>
    </PageFrame>
  );
}

type Lodging = { name: string; area: string; phone: string; notes: string; lat?: number; lng?: number };
const emptyLodging: Lodging = { name: '', area: '', phone: '', notes: '' };

export function LodgingPage() {
  const [data, setData] = useStoredState<Lodging>('sakeena.lodging', emptyLodging);
  const [locError, setLocError] = useState('');
  const set = (patch: Partial<Lodging>) => setData((current) => ({ ...current, ...patch }));
  const saveHere = () => {
    setLocError('');
    if (!('geolocation' in navigator)) { setLocError('جهازك لا يدعم تحديد الموقع.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => set({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocError('تعذر الحصول على موقعك، فعّل صلاحية الموقع وحاول مجددًا.'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };
  const mapUrl = data.lat != null && data.lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`
    : data.name || data.area ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.name} ${data.area}`.trim())}` : '';
  const fields: [keyof Lodging, string, string][] = [['name', 'اسم الفندق أو السكن', 'مثال: فندق ...'], ['area', 'الحي أو العنوان', 'مثال: العزيزية'], ['phone', 'رقم الهاتف', 'للاتصال عند التوهان'], ['notes', 'ملاحظات', 'رقم الغرفة، أقرب معلم...']];
  return (
    <PageFrame title="موقع سكني" intro="احفظ بيانات سكنك لتعود إليه بسهولة وسط الزحام. تُحفظ البيانات على جهازك فقط.">
      <div className="space-y-3">
        {fields.map(([key, title, placeholder]) => (
          <label key={key} className="block rounded-[1.25rem] border border-card-border bg-card p-4">
            <strong className="mb-2 block">{title}</strong>
            <input value={String(data[key] ?? '')} onChange={(e) => set({ [key]: e.target.value } as Partial<Lodging>)} className="w-full rounded-xl border border-card-border bg-background px-3 py-3" placeholder={placeholder} />
          </label>
        ))}
      </div>
      <button type="button" onClick={saveHere} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-bold text-primary-foreground" data-testid="button-lodging-save-location"><MapPin size={18} />احفظ موقعي الحالي كموقع للسكن</button>
      {data.lat != null && <p className="mt-2 text-center text-xs text-muted-foreground">تم حفظ الموقع على الخريطة.</p>}
      {locError && <p className="mt-2 text-center text-sm text-destructive">{locError}</p>}
      {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-3 block rounded-full border border-accent py-3 text-center font-bold text-accent" data-testid="link-lodging-map">افتح في الخرائط</a>}
      {data.phone && <a href={`tel:${data.phone}`} className="mt-3 block rounded-full border border-card-border py-3 text-center">اتصل بالسكن</a>}
    </PageFrame>
  );
}
