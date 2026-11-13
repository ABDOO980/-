import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api-client';

export type Bookmark = { id: number; userId: number; surahNumber: number; ayahNumber: number; note: string | null; createdAt: string };
export type Khatmah = { id: number; userId: number; title: string; lastSurahNumber: number; lastAyahNumber: number; completedJuzCount: number; startedAt: string; completedAt: string | null; updatedAt: string };
export type Preferences = { userId: number; preferredReciter: string; theme: 'light' | 'dark'; prayerCity: string | null; prayerCountry: string | null; prayerLat: string | null; prayerLng: string | null; notificationsEnabled: boolean; updatedAt: string };
export type FavoriteHadith = { id: number; userId: number; hadithId: string; hadithText: string; source: string | null; createdAt: string };
export type QuizProgress = { id: number; userId: number; category: string; totalScore: number; questionsAnswered: number; correctAnswers: number; bestStreak: number; lastPlayedAt: string };
export type CompletedAdhkar = { id: number; userId: number; groupId: string; completedAt: string };

// --- Bookmarks ---------------------------------------------------------
export function useBookmarks() {
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => apiFetch<{ bookmarks: Bookmark[] }>('/bookmarks').then((r) => r.bookmarks),
  });
}

export function useAddBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { surahNumber: number; ayahNumber: number; note?: string }) =>
      apiFetch<{ bookmark: Bookmark }>('/bookmarks', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/bookmarks/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });
}

// --- Khatmah -------------------------------------------------------------
export function useKhatmahList() {
  return useQuery({
    queryKey: ['khatmah'],
    queryFn: () => apiFetch<{ khatmah: Khatmah[] }>('/khatmah').then((r) => r.khatmah),
  });
}

export function useCreateKhatmah() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => apiFetch<{ khatmah: Khatmah }>('/khatmah', { method: 'POST', body: JSON.stringify({ title }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['khatmah'] }),
  });
}

export function useUpdateKhatmah() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: number; lastSurahNumber?: number; lastAyahNumber?: number; completedJuzCount?: number; completed?: boolean }) =>
      apiFetch<{ khatmah: Khatmah }>(`/khatmah/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['khatmah'] }),
  });
}

// --- Preferences -----------------------------------------------------------
export function usePreferences() {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: () => apiFetch<{ preferences: Preferences | null }>('/preferences').then((r) => r.preferences),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Omit<Preferences, 'userId' | 'updatedAt'>>) =>
      apiFetch<{ preferences: Preferences }>('/preferences', { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: (data) => queryClient.setQueryData(['preferences'], data.preferences),
  });
}

// --- Favorite hadiths --------------------------------------------------------
export function useFavoriteHadiths() {
  return useQuery({
    queryKey: ['favorite-hadiths'],
    queryFn: () => apiFetch<{ favorites: FavoriteHadith[] }>('/favorite-hadiths').then((r) => r.favorites),
  });
}

export function useAddFavoriteHadith() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { hadithId: string; hadithText: string; source?: string }) =>
      apiFetch<{ favorite: FavoriteHadith }>('/favorite-hadiths', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorite-hadiths'] }),
  });
}

export function useRemoveFavoriteHadith() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/favorite-hadiths/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorite-hadiths'] }),
  });
}

// --- Quiz progress -------------------------------------------------------------
export function useQuizProgress() {
  return useQuery({
    queryKey: ['quiz-progress'],
    queryFn: () => apiFetch<{ progress: QuizProgress[] }>('/quiz-progress').then((r) => r.progress),
  });
}

export function useSubmitQuizResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { category: string; questionsAnswered: number; correctAnswers: number; streak?: number }) =>
      apiFetch<{ progress: QuizProgress }>('/quiz-progress/submit', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quiz-progress'] }),
  });
}

// --- Weekly (Friday) challenge -----------------------------------------------
export type WeeklyQuestionPublic = { question: string; choices: string[]; correct?: number };
export type WeeklyResult = { id: number; weekKey: string; score: number; correctAnswers: number; totalQuestions: number };
export type LeaderboardEntry = { rank: number; displayName: string; score: number; correctAnswers: number; isMe: boolean };

export function useWeeklyChallenge() {
  return useQuery({
    queryKey: ['weekly-challenge'],
    queryFn: () => apiFetch<{ weekKey: string; questions: WeeklyQuestionPublic[]; alreadyPlayed: boolean; myResult: WeeklyResult | null }>('/weekly-challenge'),
  });
}

export function useSubmitWeeklyChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: number[]) => apiFetch<{ result: WeeklyResult }>('/weekly-challenge/submit', { method: 'POST', body: JSON.stringify({ answers }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-challenge'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-leaderboard'] });
    },
  });
}

export function useWeeklyLeaderboard() {
  return useQuery({
    queryKey: ['weekly-leaderboard'],
    queryFn: () => apiFetch<{ weekKey: string; leaderboard: LeaderboardEntry[] }>('/weekly-challenge/leaderboard').then((r) => r.leaderboard),
  });
}

export function useUpdateDisplayName() {
  return useMutation({
    mutationFn: (displayName: string) => apiFetch<{ user: { id: number; displayName: string } }>('/me', { method: 'PATCH', body: JSON.stringify({ displayName }) }),
  });
}

// --- Family / group quiz rooms ------------------------------------------------
export type QuizRoom = { id: number; code: string; hostUserId: number; category: string; status: string };
export type QuizRoomParticipant = { userId: number; nickname: string; score: number };

export function useCreateQuizRoom() {
  return useMutation({
    mutationFn: (input: { nickname: string; category: string }) => apiFetch<{ room: QuizRoom }>('/quiz-rooms', { method: 'POST', body: JSON.stringify(input) }),
  });
}

export function useJoinQuizRoom() {
  return useMutation({
    mutationFn: ({ code, nickname }: { code: string; nickname: string }) =>
      apiFetch<{ room: QuizRoom; participants: QuizRoomParticipant[] }>(`/quiz-rooms/${code}/join`, { method: 'POST', body: JSON.stringify({ nickname }) }),
  });
}
export function useAdhkarProgressToday() {
  return useQuery({
    queryKey: ['adhkar-progress'],
    queryFn: () => apiFetch<{ completedToday: CompletedAdhkar[] }>('/adhkar-progress').then((r) => r.completedToday),
  });
}

export function useMarkAdhkarComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => apiFetch<{ completed: CompletedAdhkar }>('/adhkar-progress', { method: 'POST', body: JSON.stringify({ groupId }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adhkar-progress'] }),
  });
}

// --- Admin-managed content (hadiths, quiz questions) --------------------------
export type ApiHadith = { id: number; title: string; text: string; source: string; explanation: string };
export type ApiQuizQuestion = { id: number; category: string; difficulty: string; question: string; choices: string[]; correct: number };

export function useContentHadiths() {
  return useQuery({
    queryKey: ['content-hadiths'],
    queryFn: () => apiFetch<{ hadiths: ApiHadith[] }>('/content/hadiths').then((r) => r.hadiths),
    staleTime: 10 * 60_000,
  });
}

export function useContentQuizQuestions() {
  return useQuery({
    queryKey: ['content-quiz-questions'],
    queryFn: () => apiFetch<{ questions: ApiQuizQuestion[] }>('/content/quiz-questions').then((r) => r.questions),
    staleTime: 10 * 60_000,
  });
}

export type ApiFatwa = { id: number; category: string; question: string; answer: string; source: string };
export function useContentFatwas() {
  return useQuery({
    queryKey: ['content-fatwas'],
    queryFn: () => apiFetch<{ fatwas: ApiFatwa[] }>('/content/fatwas').then((r) => r.fatwas),
    staleTime: 10 * 60_000,
  });
}

// --- Announcements (set by the admin) -------------------------------------------
export type Announcement = { id: number; title: string; body: string; createdAt: string };
export function useActiveAnnouncement() {
  return useQuery({
    queryKey: ['announcement-active'],
    queryFn: () => apiFetch<{ announcement: Announcement | null }>('/announcements/active').then((r) => r.announcement),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

// --- Live streams of the Haramain (links set by the admin) ---------------------
export type LiveStreams = { makkah: string | null; madinah: string | null };
export function useLiveStreams() {
  return useQuery({
    queryKey: ['live-streams'],
    queryFn: () => apiFetch<{ streams: LiveStreams }>('/live-streams').then((r) => r.streams),
    staleTime: 60_000,
    retry: false,
  });
}
