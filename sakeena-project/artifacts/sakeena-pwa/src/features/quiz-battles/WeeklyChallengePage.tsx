import { ListSkeleton } from '@/components/skeleton';
import { ArrowRight, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useSubmitWeeklyChallenge, useUpdateDisplayName, useWeeklyChallenge, useWeeklyLeaderboard } from '@/lib/sakeena-api';
import { NameCard } from '@/features/identity/NameCard';
import { getSavedName } from '@/lib/display-name';

export default function WeeklyChallengePage() {
  const { data, isLoading } = useWeeklyChallenge();
  const { data: leaderboard } = useWeeklyLeaderboard();
  const submit = useSubmitWeeklyChallenge();
  const [name, setName] = useState(getSavedName());
  const syncName = useUpdateDisplayName();
  useEffect(() => { if (name) syncName.mutate(name); }, [name]); // eslint-disable-line react-hooks/exhaustive-deps
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);

  const questions = data?.questions ?? [];
  const done = data?.alreadyPlayed || (questions.length > 0 && answers.length >= questions.length);

  const choose = (choiceIndex: number) => {
    const next = [...answers, choiceIndex];
    setAnswers(next);
    if (next.length >= questions.length) submit.mutate(next);
    else setCurrent((c) => c + 1);
  };

  return (
    <div className="rise-in mx-auto max-w-xl">
      <header className="mb-6 text-center"><p className="mb-1 text-xs text-muted-foreground">سورة الكهف · السيرة · الصلاة على النبي</p><h1 className="font-arabic text-3xl font-bold">منافسة الجمعة</h1></header>

      {!name && <NameCard title="اكتب اسمك لتشارك" hint="يظهر اسمك في لوحة المتصدرين. لن تظهر في اللوحة بدون اسم." onSaved={setName} />}

      {isLoading && <ListSkeleton count={2} />}

      {!!name && !isLoading && !done && questions[current] && (
        <section className="featured-card mb-6 rounded-[1.5rem] border bg-card p-5" data-testid="card-weekly-question">
          <p className="mb-4 text-xs text-accent">سؤال {current + 1} من {questions.length}</p>
          <h2 className="mb-5 text-xl font-bold">{questions[current].question}</h2>
          <div className="grid gap-2">
            {questions[current].choices.map((choice, index) => (
              <button key={choice} onClick={() => choose(index)} className="rounded-xl border border-card-border bg-secondary/50 p-3.5 text-right text-sm hover:border-accent" data-testid={`button-weekly-choice-${index}`}>{choice}</button>
            ))}
          </div>
        </section>
      )}

      {submit.isError && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-center text-xs text-destructive" role="alert">{(submit.error as Error)?.message ?? 'تعذّر إرسال إجابتك.'}</p>}

      {!isLoading && done && (
        <section className="featured-card mb-6 rounded-[1.5rem] border bg-card p-6 text-center">
          <Trophy size={28} className="mx-auto mb-3 text-accent" />
          <p className="text-sm text-muted-foreground">شاركت في منافسة هذا الأسبوع</p>
          {data?.myResult && <strong className="mt-2 block font-mono-app text-3xl text-accent">{data.myResult.correctAnswers}/{data.myResult.totalQuestions}</strong>}
        </section>
      )}

      <h2 className="more-section-rule mb-3 text-base">لوحة متصدري هذا الأسبوع</h2>
      <div className="space-y-2">
        {(leaderboard ?? []).map((entry) => (
          <div key={entry.rank} className={`flex items-center gap-3 rounded-2xl border p-3 ${entry.isMe ? 'border-accent bg-secondary/60' : 'border-card-border bg-card'}`} data-testid={`row-leaderboard-${entry.rank}`}>
            <span className="grid size-8 place-items-center rounded-full bg-secondary font-mono-app text-xs text-accent">{entry.rank}</span>
            <span className="flex-1 text-sm font-semibold">{entry.displayName}</span>
            <span className="font-mono-app text-sm text-accent">{entry.score}</span>
          </div>
        ))}
        {(leaderboard ?? []).length === 0 && <p className="text-center text-xs text-muted-foreground">كن أول من يشارك هذا الأسبوع!</p>}
      </div>

      <Link href="/quiz" className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة للمسابقة</Link>
    </div>
  );
}
