import { X, CalendarDays, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { useQuizProgress, useSubmitQuizResult, useContentQuizQuestions } from '@/lib/sakeena-api';
import { type QuizCategory, type QuizDifficulty, questionsFor, quizCategories, quizDifficulties } from '@/features/quiz/quiz-data';
import { Header } from '@/app/layout';

export function Quiz() {
  const [category, setCategory] = useState<QuizCategory | null>(null);
  const [difficulty, setDifficulty] = useState<QuizDifficulty | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreakThisRound, setBestStreakThisRound] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const { data: progress } = useQuizProgress();
  const submitResult = useSubmitQuizResult();
  const { data: remoteQuestions } = useContentQuizQuestions();

  const questions = category && difficulty
    ? (remoteQuestions && remoteQuestions.length > 0
        ? remoteQuestions.filter((q) => q.category === category && q.difficulty === difficulty)
        : questionsFor(category, difficulty))
    : [];
  const question = questions[questionIndex];
  const totalScore = (progress ?? []).reduce((sum, item) => sum + item.totalScore, 0);

  const startRound = (nextCategory: QuizCategory, nextDifficulty: QuizDifficulty) => {
    setCategory(nextCategory);
    setDifficulty(nextDifficulty);
    setQuestionIndex(0);
    setCorrectCount(0);
    setStreak(0);
    setBestStreakThisRound(0);
    setAnswered(null);
    setFinished(false);
  };

  const answer = (choiceIndex: number) => {
    if (answered !== null || !question) return;
    setAnswered(choiceIndex);
    const isCorrect = choiceIndex === question.correct;
    if (isCorrect) {
      setCorrectCount((current) => current + 1);
      setStreak((current) => { const next = current + 1; setBestStreakThisRound((best) => Math.max(best, next)); return next; });
    } else {
      setStreak(0);
    }
    window.setTimeout(() => {
      setAnswered(null);
      if (questionIndex + 1 >= questions.length) {
        setFinished(true);
        if (category) {
          submitResult.mutate({ category, questionsAnswered: questions.length, correctAnswers: correctCount + (isCorrect ? 1 : 0), streak: bestStreakThisRound });
        }
      } else {
        setQuestionIndex((current) => current + 1);
      }
    }, 700);
  };

  const exitToSelection = () => { setCategory(null); setDifficulty(null); setFinished(false); };

  if (category && difficulty && !finished && question) {
    return (
      <div className="rise-in">
        <Header title={quizCategories.find((item) => item.id === category)?.label ?? 'اختبر معلوماتك'} />
        <p className="-mt-4 mb-5 text-center text-xs text-muted-foreground">{quizDifficulties.find((item) => item.id === difficulty)?.label} · سؤال {questionIndex + 1} من {questions.length}</p>
        <section className="featured-card mb-3 rounded-[1.5rem] border bg-card p-5" data-testid="card-quiz-question">
          <div className="mb-5 flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold">{question.question}</h2>
            <button onClick={exitToSelection} className="text-muted-foreground" aria-label="إنهاء الاختبار"><X size={18} /></button>
          </div>
          <div className="grid gap-2">{question.choices.map((choice, index) => <button key={choice} onClick={() => answer(index)} className={`rounded-xl border p-3.5 text-right text-sm transition ${answered === index ? (index === question.correct ? 'border-accent bg-accent/20 text-accent' : 'border-destructive bg-destructive/10') : answered !== null && index === question.correct ? 'border-accent bg-accent/20' : 'border-card-border bg-secondary/50 hover:border-accent'}`} data-testid={`button-quiz-choice-${index}`}>{choice}<span className="float-left font-mono-app text-xs text-muted-foreground">{String.fromCharCode(1571 + index)}</span></button>)}</div>
        </section>
        {streak >= 2 && <p className="text-center text-xs text-accent">🔥 متتالية {streak} إجابات صحيحة</p>}
      </div>
    );
  }

  if (category && difficulty && finished) {
    return (
      <div className="rise-in text-center">
        <Header title="نتيجتك" />
        <section className="featured-card mx-auto max-w-sm rounded-[1.75rem] border bg-card p-7">
          <p className="text-xs text-muted-foreground">{quizCategories.find((item) => item.id === category)?.label} · {quizDifficulties.find((item) => item.id === difficulty)?.label}</p>
          <strong className="mt-3 block font-mono-app text-4xl text-accent">{correctCount}/{questions.length}</strong>
          <p className="mt-2 text-sm text-muted-foreground">أفضل متتالية في الجولة: {bestStreakThisRound}</p>
          <div className="mt-6 grid gap-2">
            <button onClick={() => startRound(category, difficulty)} className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground" data-testid="button-quiz-retry">جولة تانية</button>
            <button onClick={exitToSelection} className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground" data-testid="button-quiz-exit">رجوع للأقسام</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="rise-in">
      <Header title="اختبر معلوماتك" />
      <section className="mb-6 rounded-[1.35rem] border border-accent/40 bg-secondary/60 p-5 text-center">
        <p className="text-xs text-muted-foreground">مجموع نقاطك في كل الأقسام</p>
        <strong className="mt-1 block font-mono-app text-3xl text-accent">{totalScore}</strong>
      </section>
      <div className="mb-7 grid grid-cols-2 gap-3">
        <Link href="/weekly-challenge" className="rounded-[1.25rem] border border-accent/40 bg-card p-4 text-center" data-testid="link-weekly-challenge"><CalendarDays size={20} className="mx-auto mb-2 text-accent" /><strong className="block text-sm">منافسة الجمعة</strong><span className="mt-1 block text-[0.6875rem] text-muted-foreground">الكهف والسيرة والصلاة على النبي</span></Link>
        <Link href="/quiz-room" className="rounded-[1.25rem] border border-accent/40 bg-card p-4 text-center" data-testid="link-quiz-room"><Users size={20} className="mx-auto mb-2 text-accent" /><strong className="block text-sm">منافسة عائلية</strong><span className="mt-1 block text-[0.6875rem] text-muted-foreground">أنشئ غرفة وشارك الرمز</span></Link>
      </div>
      <h2 className="more-section-rule mb-3 text-base">اختر القسم</h2>
      <div className="mb-7 grid grid-cols-2 gap-3">
        {quizCategories.map((item) => {
          const stats = (progress ?? []).find((p) => p.category === item.id);
          return (
            <div key={item.id} className="rounded-[1.25rem] border border-card-border bg-card p-4">
              <strong className="block text-sm">{item.label}</strong>
              <span className="mt-1 block text-xs text-muted-foreground">{item.description}</span>
              {stats && <span className="mt-2 block text-[0.6875rem] text-accent">نقاطك: {stats.totalScore} · أفضل متتالية: {stats.bestStreak}</span>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {quizDifficulties.map((diff) => (
                  <button key={diff.id} onClick={() => startRound(item.id, diff.id)} className="rounded-lg border border-border px-2.5 py-1.5 text-[0.6875rem] font-semibold hover:border-accent hover:text-accent" data-testid={`button-quiz-start-${item.id}-${diff.id}`}>{diff.label}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
