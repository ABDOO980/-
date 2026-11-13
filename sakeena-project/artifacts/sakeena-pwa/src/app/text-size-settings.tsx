import { useState } from 'react';
import { getTextScale, setTextScale, textScaleSteps } from '@/lib/text-size';

export function TextSizeSettings() {
  const [scale, setScale] = useState(getTextScale);
  const choose = (value: number) => { setScale(value); setTextScale(value); };
  return (
    <section className="mt-5 rounded-[2rem] border border-card-border bg-card p-6 md:p-8" data-testid="section-text-size">
      <h2 className="mb-1 text-lg font-semibold">حجم الخط</h2>
      <p className="mb-4 text-xs leading-6 text-muted-foreground">يضاف إلى حجم الخط الذي ضبطته في هاتفك، ويكبّر التطبيق كله بانسجام.</p>
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="حجم الخط">
        {textScaleSteps.map((step) => (
          <button key={step.value} type="button" role="radio" aria-checked={scale === step.value} onClick={() => choose(step.value)}
            className={`rounded-xl px-1 py-2.5 text-center text-xs font-semibold leading-tight transition ${scale === step.value ? 'bg-primary text-primary-foreground' : 'border border-card-border bg-background'}`} data-testid={`button-text-size-${step.value}`}>{step.label}</button>
        ))}
      </div>
      <p className="mt-4 rounded-xl bg-secondary/50 p-4 font-arabic text-lg leading-loose" aria-live="polite">أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ</p>
    </section>
  );
}
