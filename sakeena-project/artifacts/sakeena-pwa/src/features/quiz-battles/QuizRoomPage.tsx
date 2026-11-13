import { getSavedName, saveName } from '@/lib/display-name';
import { ArrowRight, Copy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { getDeviceId, shareOrCopy } from '@/lib/sakeena';
import { useCreateQuizRoom, useJoinQuizRoom } from '@/lib/sakeena-api';
import { quizCategories } from '@/features/quiz/quiz-data';
import { getSocket } from './socket-client';

type LiveQuestion = { index: number; total: number; question: string; choices: string[]; endsAt: number };
type ScoreRow = { nickname: string; score: number };

function Header({ title }: { title: string }) {
  return <h1 className="mb-6 text-center font-arabic text-3xl font-bold">{title}</h1>;
}

export default function QuizRoomPage() {
  const [nickname, setNickname] = useState(getSavedName());
  const [joinCode, setJoinCode] = useState('');
  const [category, setCategory] = useState('fiqh');
  const [room, setRoom] = useState<{ code: string; isHost: boolean } | null>(null);
  const [participants, setParticipants] = useState<ScoreRow[]>([]);
  const [question, setQuestion] = useState<LiveQuestion | null>(null);
  const [answered, setAnswered] = useState(false);
  const [revealed, setRevealed] = useState<{ correctIndex: number } | null>(null);
  const [finished, setFinished] = useState<ScoreRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCreateQuizRoom();
  const joinRoom = useJoinQuizRoom();

  useEffect(() => {
    const socket = getSocket();
    socket.on('participants-updated', setParticipants);
    socket.on('question', (q: LiveQuestion) => { setQuestion(q); setAnswered(false); setRevealed(null); });
    socket.on('question-result', (r: { correctIndex: number; scoreboard: ScoreRow[] }) => { setRevealed({ correctIndex: r.correctIndex }); setParticipants(r.scoreboard); });
    socket.on('room-finished', (r: { scoreboard: ScoreRow[] }) => { setFinished(r.scoreboard); setQuestion(null); });
    socket.on('room-error', (e: { message: string }) => setError(e.message));
    return () => {
      socket.off('participants-updated');
      socket.off('question');
      socket.off('question-result');
      socket.off('room-finished');
      socket.off('room-error');
    };
  }, []);

  const joinSocketRoom = (code: string) => {
    getSocket().emit('join-room', { code, deviceId: getDeviceId(), nickname });
  };

  const handleCreate = async () => {
    if (!nickname.trim()) { setError('اكتب اسمك الأول.'); return; }
    saveName(nickname);
    const result = await createRoom.mutateAsync({ nickname: nickname.trim(), category });
    setRoom({ code: result.room.code, isHost: true });
    joinSocketRoom(result.room.code);
  };

  const handleJoin = async () => {
    if (!nickname.trim() || joinCode.trim().length < 4) { setError('اكتب اسمك ورمز الغرفة.'); return; }
    saveName(nickname);
    await joinRoom.mutateAsync({ code: joinCode.trim(), nickname: nickname.trim() });
    setRoom({ code: joinCode.trim(), isHost: false });
    joinSocketRoom(joinCode.trim());
  };

  const startRound = () => { if (room) getSocket().emit('start-round', { code: room.code }); };
  const answer = (choiceIndex: number) => {
    if (!room || answered) return;
    setAnswered(true);
    getSocket().emit('submit-answer', { code: room.code, choiceIndex });
  };

  if (finished) {
    return (
      <div className="rise-in mx-auto max-w-md text-center">
        <Header title="نتيجة الغرفة" />
        <div className="space-y-2">
          {finished.map((row, index) => (
            <div key={row.nickname} className="flex items-center gap-3 rounded-2xl border border-card-border bg-card p-3">
              <span className="grid size-8 place-items-center rounded-full bg-secondary font-mono-app text-xs text-accent">{index + 1}</span>
              <span className="flex-1 text-sm font-semibold">{row.nickname}</span>
              <span className="font-mono-app text-sm text-accent">{row.score}</span>
            </div>
          ))}
        </div>
        <Link href="/quiz" className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة للمسابقة</Link>
      </div>
    );
  }

  if (room && question) {
    return (
      <div className="rise-in mx-auto max-w-xl">
        <p className="mb-4 text-center text-xs text-muted-foreground">سؤال {question.index + 1} من {question.total}</p>
        <section className="featured-card mb-5 rounded-[1.5rem] border bg-card p-5">
          <h2 className="mb-5 text-xl font-bold">{question.question}</h2>
          <div className="grid gap-2">
            {question.choices.map((choice, index) => (
              <button key={choice} onClick={() => answer(index)} disabled={answered} className={`rounded-xl border p-3.5 text-right text-sm ${revealed && index === revealed.correctIndex ? 'border-accent bg-accent/20 text-accent' : 'border-card-border bg-secondary/50'}`} data-testid={`button-room-choice-${index}`}>{choice}</button>
            ))}
          </div>
        </section>
        <div className="space-y-1.5">{participants.map((p) => <div key={p.nickname} className="flex justify-between text-xs text-muted-foreground"><span>{p.nickname}</span><span className="text-accent">{p.score}</span></div>)}</div>
      </div>
    );
  }

  if (room) {
    return (
      <div className="rise-in mx-auto max-w-md text-center">
        <Header title="غرفة المنافسة" />
        <p className="mb-2 text-xs text-muted-foreground">شارك الرمز مع عيلتك على واتساب</p>
        <button onClick={() => void shareOrCopy({ title: 'انضم لغرفتي في سَكينة', text: `رمز الغرفة: ${room.code}` })} className="mx-auto mb-6 flex items-center gap-2 rounded-xl border border-accent px-5 py-3 font-mono-app text-2xl tracking-widest text-accent" data-testid="button-copy-room-code">{room.code}<Copy size={16} /></button>
        <div className="mb-6 space-y-1.5">{participants.map((p) => <div key={p.nickname} className="flex items-center justify-center gap-2 text-sm"><Users size={14} className="text-accent" />{p.nickname}</div>)}</div>
        {room.isHost && <button onClick={startRound} className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground" data-testid="button-start-round">ابدأ المنافسة</button>}
        {!room.isHost && <p className="text-xs text-muted-foreground">في انتظار منشئ الغرفة ليبدأ...</p>}
      </div>
    );
  }

  return (
    <div className="rise-in mx-auto max-w-md">
      <Header title="منافسة عائلية" />
      {error && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-center text-xs text-destructive">{error}</p>}
      <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="اسمك" className="mb-4 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" data-testid="input-room-nickname" />
      <section className="mb-6 rounded-2xl border border-card-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold">إنشاء غرفة جديدة</p>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="mb-3 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs">
          {quizCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button onClick={() => void handleCreate()} className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground" data-testid="button-create-room">إنشاء غرفة عائلية</button>
      </section>
      <section className="rounded-2xl border border-card-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold">الانضمام إلى غرفة</p>
        <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="رمز الغرفة" className="mb-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-center font-mono-app text-lg tracking-widest" data-testid="input-room-code" />
        <button onClick={() => void handleJoin()} className="w-full rounded-xl border border-accent px-4 py-3 text-sm font-bold text-accent" data-testid="button-join-room">انضمام</button>
      </section>
      <Link href="/quiz" className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة للمسابقة</Link>
    </div>
  );
}
