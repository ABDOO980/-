import { Check } from 'lucide-react';
import { useStoredState } from '@/app/common';
import { Accordion, PageFrame, type Item } from './PageFrame';
import { companions, prophets } from './stories-data';

export function ProphetsStoriesPage() {
  return <PageFrame title="قصص الأنبياء" intro="ملخصات مبسّطة لقصص الأنبياء كما وردت في القرآن الكريم، مع آيات ذات صلة بكل نبي."><Accordion items={prophets} testId="button-prophet" /></PageFrame>;
}

export function CompanionsPage() {
  return <PageFrame title="الصحابة" intro="نبذ قصيرة عن بعض الصحابة الكرام رضي الله عنهم، مع آية ذات صلة بفضلهم أو بصفة من صفاتهم."><Accordion items={companions} testId="button-companion" /></PageFrame>;
}

const dailySunan = [
  'السواك عند الوضوء وقبل الصلاة', 'أذكار الصباح والمساء', 'ركعتا سنة الفجر قبل الصلاة',
  'السنن الرواتب مع الفرائض', 'صلاة الضحى ولو ركعتين', 'إفشاء السلام على من تعرف ومن لا تعرف',
  'الابتسامة في وجه أخيك', 'أذكار النوم والوضوء قبله', 'الوتر قبل النوم', 'الدعاء بين الأذان والإقامة',
];
const weekdaySunan: Record<number, string> = {
  0: '', 1: 'صيام يوم الاثنين', 2: '', 3: '', 4: 'صيام يوم الخميس',
  5: 'يوم الجمعة: الغسل والتطيّب والتبكير للمسجد، وقراءة سورة الكهف، والإكثار من الصلاة على النبي ﷺ',
  6: '',
};

const todayKey = () => new Date().toISOString().slice(0, 10);

export function SunanTodayPage() {
  const key = todayKey();
  const [done, setDone] = useStoredState<Record<string, string[]>>('sakeena.sunan', {});
  const list = [weekdaySunan[new Date().getDay()], ...dailySunan].filter(Boolean);
  const today = done[key] ?? [];
  const toggle = (item: string) => setDone((current) => {
    const set = new Set(current[key] ?? []);
    if (set.has(item)) set.delete(item); else set.add(item);
    return { [key]: [...set] };
  });
  return (
    <PageFrame title="سنن اليوم" intro="اختر سنة أو أكثر تحييها اليوم، وسجّل ما واظبت عليه.">
      <div className="mb-4 rounded-[1.25rem] bg-primary p-4 text-primary-foreground"><div className="flex justify-between text-sm"><span>أحييت اليوم</span><strong>{today.length} / {list.length}</strong></div></div>
      <div className="space-y-2">
        {list.map((item) => {
          const on = today.includes(item);
          return (
            <button key={item} type="button" onClick={() => toggle(item)} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-right ${on ? 'border-accent bg-accent/15' : 'border-card-border bg-card'}`}>
              <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${on ? 'border-accent bg-accent text-accent-foreground' : 'border-card-border'}`}>{on && <Check size={14} />}</span>
              <span className="leading-7">{item}</span>
            </button>
          );
        })}
      </div>
    </PageFrame>
  );
}

const goodDeeds = [
  'صدقة ولو قليلة', 'صلة رحم بمكالمة أو زيارة', 'برّ الوالدين والدعاء لهما', 'إماطة الأذى عن الطريق',
  'كلمة طيبة لمن حولك', 'الإصلاح بين متخاصمين', 'إطعام جائع أو إفطار صائم', 'زيارة مريض أو الاتصال به',
  'تعليم علم نافع لغيرك', 'مساعدة محتاج بجهدك', 'الدعاء لأخيك بظهر الغيب', 'التبسّم والتهلل في وجه الناس',
  'سقيا الماء أو المساهمة في سقيا', 'ستر عيب أخيك وعدم إفشائه',
];

export function GoodDeedsPage() {
  const key = todayKey();
  const [done, setDone] = useStoredState<Record<string, string[]>>('sakeena.goodDeeds', {});
  const [total, setTotal] = useStoredState<number>('sakeena.goodDeeds.total', 0);
  const today = done[key] ?? [];
  const toggle = (item: string) => {
    const has = today.includes(item);
    setDone((current) => ({ [key]: has ? today.filter((x) => x !== item) : [...today, item] }));
    setTotal((count) => Math.max(0, count + (has ? -1 : 1)));
  };
  return (
    <PageFrame title="دليل الخير" intro="أفكار بسيطة لأعمال الخير اليومية. اختر ما فعلته اليوم.">
      <div className="mb-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-[1.1rem] bg-primary p-3 text-primary-foreground"><p className="text-xs opacity-80">اليوم</p><strong className="text-2xl">{today.length}</strong></div>
        <div className="rounded-[1.1rem] border border-accent bg-card p-3"><p className="text-xs text-muted-foreground">إجمالي أعمالك</p><strong className="text-2xl text-accent">{total}</strong></div>
      </div>
      <div className="space-y-2">
        {goodDeeds.map((item) => {
          const on = today.includes(item);
          return (
            <button key={item} type="button" onClick={() => toggle(item)} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-right ${on ? 'border-accent bg-accent/15' : 'border-card-border bg-card'}`}>
              <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${on ? 'border-accent bg-accent text-accent-foreground' : 'border-card-border'}`}>{on && <Check size={14} />}</span>
              <span className="leading-7">{item}</span>
            </button>
          );
        })}
      </div>
    </PageFrame>
  );
}

const inheritance: Item[] = [
  { title: 'قبل تقسيم التركة', body: 'يُبدأ أولًا بتجهيز الميت ودفنه، ثم سداد ديونه، ثم تنفيذ وصيته في حدود الثلث لغير الوارث، وما بقي يُقسّم على الورثة.' },
  { title: 'الزوج', body: 'له النصف إذا لم يكن للمتوفاة ولد، ويكون له الربع إذا كان لها ولد.' },
  { title: 'الزوجة', body: 'لها الربع إذا لم يكن للمتوفى ولد، ويكون لها الثمن إذا كان له ولد. وإن تعددت الزوجات اشتركن في هذا النصيب.' },
  { title: 'الأم', body: 'لها السدس إذا كان للمتوفى ولد أو جمع من الإخوة، وفي غير ذلك لها الثلث.' },
  { title: 'الأب', body: 'له السدس إذا كان للمتوفى ولد ذكر، وإذا لم يكن له ولد ورث الأب الباقي بالتعصيب.' },
  { title: 'البنت', body: 'للواحدة المنفردة النصف، وللبنتين فأكثر الثلثان. وإذا كان معها ابن فللذكر مثل حظ الأنثيين.' },
  { title: 'الابن', body: 'يرث بالتعصيب، أي يأخذ ما بقي بعد أصحاب الفروض، وإذا اجتمع مع البنات فللذكر مثل حظ الأنثيين.' },
];

export function InheritancePage() {
  return (
    <PageFrame title="المواريث" intro="تعريف مختصر بأنصبة أشهر الورثة في الشريعة. وللتقسيم الفعلي لا بد من الرجوع إلى المحكمة الشرعية أو أهل العلم، فالحالات تتغير بحسب الورثة الموجودين.">
      <Accordion items={inheritance} testId="button-inheritance" />
    </PageFrame>
  );
}
