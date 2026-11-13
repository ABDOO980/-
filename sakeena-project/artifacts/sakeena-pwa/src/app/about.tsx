import { Header } from '@/app/layout';

export function About() {
  return <div className="rise-in max-w-2xl"><Header eyebrow="سَكينة" title="عن التطبيق" /><section className="rounded-[2rem] bg-primary p-8 text-primary-foreground"><span className="grid size-14 place-items-center rounded-2xl bg-accent text-3xl text-accent-foreground"><span className="font-arabic">س</span></span><h2 className="mt-8 font-arabic text-4xl">مساحة هادئة<br />بينك وبين ربك</h2><p className="mt-5 max-w-md text-sm leading-7 opacity-75">سَكينة تطبيق شخصي مفتوح، يجمع ما تحتاجه في يومك من مواقيت الصلاة والقرآن والأذكار والقبلة، بدون حسابات أو ضجيج.</p></section><div className="mt-5 rounded-2xl border border-border p-5 text-xs leading-6 text-muted-foreground">المحتوى القرآني والصوتي مقدم عبر مصادر مفتوحة وموثوقة. مواقيت الصلاة من خدمة AlAdhan وتُحفظ آخر نتيجة للقراءة دون اتصال.</div></div>;
}
