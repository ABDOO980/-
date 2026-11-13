import { lazy, Suspense, type ComponentType, useEffect } from 'react';
import { Switch, Route } from 'wouter';
import { PageSkeleton } from '@/components/skeleton';
import { registerSakeenaServiceWorker } from '@/lib/sakeena';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, sakeenaPersister } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider, Toaster } from '@workspace/ui';
import NotFound from '@/pages/not-found';
import { Shell } from '@/app/layout';
import { Home, SpiritualPeace } from '@/app/home';

 // Each page is downloaded only when it is opened, which keeps the first load small.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyPage(load: () => Promise<{ default: ComponentType<any> }>) {
  const Lazy = lazy(load);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function LazyPage(props: any) { return <Suspense fallback={<PageSkeleton />}><Lazy {...props} /></Suspense>; };
}

const WeeklyChallengePage = lazyPage(() => import('@/features/quiz-battles/WeeklyChallengePage'));
const QuizRoomPage = lazyPage(() => import('@/features/quiz-battles/QuizRoomPage'));
const AdminPage = lazyPage(() => import('@/features/admin/AdminPage'));
const GroupKhatmahPage = lazyPage(() => import('@/features/khatmah/GroupKhatmahPage'));
const QuranReaderPage = lazyPage(() => import('@/features/quran/QuranFeaturePage').then((m) => ({ default: m.QuranReaderPage })));
const QuranHub = lazyPage(() => import('@/features/quran/QuranFeaturePage').then((m) => ({ default: m.QuranHub })));
const ArticlesPage = lazyPage(() => import('@/features/articles/ArticlesPage'));
const HadithPage = lazyPage(() => import('@/features/hadith/HadithPage'));
const CalendarPage = lazyPage(() => import('@/features/calendar/CalendarPage'));
const BackupPage = lazyPage(() => import('@/features/backup/BackupPage'));
const ShareCardPage = lazyPage(() => import('@/features/share/ShareCardPage'));
const LearningPage = lazyPage(() => import('@/features/learning/LearningPage'));
const DuaWallPage = lazyPage(() => import('@/features/duas/DuaWallPage'));
const RadioPage = lazyPage(() => import('@/features/radio/RadioPage'));
const LivePage = lazyPage(() => import('@/features/live/LivePage'));
const NotificationSettingsPage = lazyPage(() => import('@/features/notifications/NotificationSettingsPage'));
const SeerahPage = lazyPage(() => import('@/features/seerah/SeerahPage'));
const RamadanPage = lazyPage(() => import('@/features/ramadan/RamadanPage'));
const FatwaPage = lazyPage(() => import('@/features/fatwas/FatwaPage'));
const MosquesPage = lazyPage(() => import('@/features/mosques/MosquesPage'));
const DailyProvisionPage = lazyPage(() => import('@/features/daily/DailyProvisionPage'));
const NamesOfAllahPage = lazyPage(() => import('@/features/names/NamesOfAllahPage'));
const RuqyahPage = lazyPage(() => import('@/features/ruqyah/RuqyahPage'));
const KidsCornerPage = lazyPage(() => import('@/features/family/KidsCornerPage'));
const BinBazPage = lazyPage(() => import('@/features/binbaz/BinBazPage'));
const FastingTrackerPage = lazyPage(() => import('@/features/worship/WorshipPages').then((m) => ({ default: m.FastingTrackerPage })));
const DailyPlanPage = lazyPage(() => import('@/features/worship/WorshipPages').then((m) => ({ default: m.DailyPlanPage })));
const KhatmahPlanPage = lazyPage(() => import('@/features/worship/WorshipPages').then((m) => ({ default: m.KhatmahPlanPage })));
const WorshipTodayPage = lazyPage(() => import('@/features/worship/WorshipPages').then((m) => ({ default: m.WorshipTodayPage })));
const FiqhHubPage = lazyPage(() => import('@/features/hubs/HubPages').then((m) => ({ default: m.FiqhHubPage })));
const KnowledgeHubPage = lazyPage(() => import('@/features/hubs/HubPages').then((m) => ({ default: m.KnowledgeHubPage })));
const NewMuslimPage = lazyPage(() => import('@/features/learning/NewMuslimPage').then((m) => ({ default: m.NewMuslimPage })));
const ZakatPage = lazyPage(() => import('@/features/fiqh/ZakatPage'));
const HajjBagPage = lazyPage(() => import('@/features/hajj/HajjPages').then((m) => ({ default: m.HajjBagPage })));
const TawafCounterPage = lazyPage(() => import('@/features/hajj/HajjPages').then((m) => ({ default: m.TawafCounterPage })));
const HajjGuidePage = lazyPage(() => import('@/features/hajj/GuidePages').then((m) => ({ default: m.HajjGuidePage })));
const HaramPage = lazyPage(() => import('@/features/hajj/GuidePages').then((m) => ({ default: m.HaramPage })));
const LodgingPage = lazyPage(() => import('@/features/hajj/GuidePages').then((m) => ({ default: m.LodgingPage })));
const UmrahGuidePage = lazyPage(() => import('@/features/hajj/GuidePages').then((m) => ({ default: m.UmrahGuidePage })));
const CompanionsPage = lazyPage(() => import('@/features/knowledge/KnowledgePages').then((m) => ({ default: m.CompanionsPage })));
const GoodDeedsPage = lazyPage(() => import('@/features/knowledge/KnowledgePages').then((m) => ({ default: m.GoodDeedsPage })));
const InheritancePage = lazyPage(() => import('@/features/knowledge/KnowledgePages').then((m) => ({ default: m.InheritancePage })));
const ProphetsStoriesPage = lazyPage(() => import('@/features/knowledge/KnowledgePages').then((m) => ({ default: m.ProphetsStoriesPage })));
const SunanTodayPage = lazyPage(() => import('@/features/knowledge/KnowledgePages').then((m) => ({ default: m.SunanTodayPage })));
const Adhkar = lazyPage(() => import('@/app/adhkar').then((m) => ({ default: m.Adhkar })));
const DhikrReader = lazyPage(() => import('@/app/adhkar').then((m) => ({ default: m.DhikrReader })));
const RecitationPage = lazyPage(() => import('@/app/recitation').then((m) => ({ default: m.RecitationPage })));
const DownloadsToolPage = lazyPage(() => import('@/app/tools').then((m) => ({ default: m.DownloadsToolPage })));
const MemorizationToolPage = lazyPage(() => import('@/app/tools').then((m) => ({ default: m.MemorizationToolPage })));
const ReflectionsToolPage = lazyPage(() => import('@/app/tools').then((m) => ({ default: m.ReflectionsToolPage })));
const ReviewToolPage = lazyPage(() => import('@/app/tools').then((m) => ({ default: m.ReviewToolPage })));
const TajweedToolPage = lazyPage(() => import('@/app/tools').then((m) => ({ default: m.TajweedToolPage })));
const ToolScreen = lazyPage(() => import('@/app/tools').then((m) => ({ default: m.ToolScreen })));
const Quiz = lazyPage(() => import('@/app/quiz').then((m) => ({ default: m.Quiz })));
const Ambassadors = lazyPage(() => import('@/app/ambassadors').then((m) => ({ default: m.Ambassadors })));
const Qibla = lazyPage(() => import('@/app/qibla').then((m) => ({ default: m.Qibla })));
const More = lazyPage(() => import('@/app/more').then((m) => ({ default: m.More })));
const SettingsPage = lazyPage(() => import('@/app/settings').then((m) => ({ default: m.SettingsPage })));
const About = lazyPage(() => import('@/app/about').then((m) => ({ default: m.About })));

function Router() {
  return <Shell><ErrorBoundary><Switch><Route path="/" component={Home} /><Route path="/quran/:id" component={QuranReaderPage} /><Route path="/quran" component={QuranHub} /><Route path="/adhkar/:groupId" component={DhikrReader} /><Route path="/adhkar" component={Adhkar} /><Route path="/spiritual-peace" component={SpiritualPeace} /><Route path="/tracker" component={WorshipTodayPage} /><Route path="/worship" component={WorshipTodayPage} /><Route path="/worship/fasting" component={FastingTrackerPage} /><Route path="/worship/khatmah" component={KhatmahPlanPage} /><Route path="/worship/plan" component={DailyPlanPage} /><Route path="/knowledge" component={KnowledgeHubPage} /><Route path="/fiqh" component={FiqhHubPage} /><Route path="/new-muslim" component={NewMuslimPage} /><Route path="/articles" component={ArticlesPage} /><Route path="/hadith" component={HadithPage} /><Route path="/calendar" component={CalendarPage} /><Route path="/backup" component={BackupPage} /><Route path="/share-card" component={ShareCardPage} /><Route path="/learning" component={LearningPage} /><Route path="/recitation" component={RecitationPage} /><Route path="/daily-provision" component={DailyProvisionPage} /><Route path="/names-of-allah" component={NamesOfAllahPage} /><Route path="/ruqyah" component={RuqyahPage} /><Route path="/kids" component={KidsCornerPage} /><Route path="/zakat" component={ZakatPage} /><Route path="/binbaz" component={BinBazPage} /><Route path="/hajj/tawaf" component={TawafCounterPage} /><Route path="/hajj/bag" component={HajjBagPage} /><Route path="/hajj" component={HajjGuidePage} /><Route path="/umrah" component={UmrahGuidePage} /><Route path="/haram" component={HaramPage} /><Route path="/lodging" component={LodgingPage} /><Route path="/sunan" component={SunanTodayPage} /><Route path="/prophets" component={ProphetsStoriesPage} /><Route path="/companions" component={CompanionsPage} /><Route path="/good-deeds" component={GoodDeedsPage} /><Route path="/inheritance" component={InheritancePage} /><Route path="/tools/downloads" component={DownloadsToolPage} /><Route path="/tools/tajweed" component={TajweedToolPage} /><Route path="/tools/memorization" component={MemorizationToolPage} /><Route path="/tools/review" component={ReviewToolPage} /><Route path="/tools/reflections" component={ReflectionsToolPage} /><Route path="/dua-wall" component={DuaWallPage} /><Route path="/radio" component={RadioPage} /><Route path="/live" component={LivePage} /><Route path="/notifications" component={NotificationSettingsPage} /><Route path="/seerah" component={SeerahPage} /><Route path="/ramadan" component={RamadanPage} /><Route path="/fatwas" component={FatwaPage} /><Route path="/mosques" component={MosquesPage} /><Route path="/quiz" component={Quiz} /><Route path="/weekly-challenge" component={WeeklyChallengePage} /><Route path="/quiz-room" component={QuizRoomPage} /><Route path="/group-khatmah" component={GroupKhatmahPage} /><Route path="/ambassadors" component={Ambassadors} /><Route path="/qibla" component={Qibla} /><Route path="/tool/:slug" component={ToolScreen} /><Route path="/more" component={More} /><Route path="/settings" component={SettingsPage} /><Route path="/about" component={About} /><Route path="/admin" component={AdminPage} /><Route component={NotFound} /></Switch></ErrorBoundary></Shell>;
}

function App() {
  useEffect(() => { registerSakeenaServiceWorker(); }, []);
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: sakeenaPersister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
      onSuccess={() => queryClient.resumePausedMutations()}
    >
      <TooltipProvider><Router /><Toaster /></TooltipProvider>
    </PersistQueryClientProvider>
  );
}

export default App;
