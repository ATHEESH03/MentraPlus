import Link from 'next/link';

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-sage/40">
      {/* Top Header */}
      <header className="mx-auto max-w-6xl px-4 sm:px-6 h-20 flex items-center justify-between">
        <span className="font-display text-2xl font-semibold tracking-tight text-ink">
          Mentra<span className="text-coral">+</span>
        </span>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link className="hover:text-teal-deep transition" href="#how">
            How it works
          </Link>
          <Link className="hover:text-teal-deep transition" href="#privacy">
            Privacy
          </Link>
          <Link href="/sign-in" className="text-ink-soft hover:text-ink transition">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="bg-ink text-paper px-4 py-2 rounded-xl hover:bg-ink-soft transition shadow-soft"
          >
            Start free
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-teal-deep">
            For college students · Personal wellbeing
          </p>
          <h1 className="font-display text-5xl sm:text-6xl leading-[1.08] mt-4 text-ink">
            Discover what you’ve learned about <span className="text-coral">yourself.</span>
          </h1>
          <p className="text-lg text-ink-soft mt-6 max-w-md leading-relaxed">
            Mentra+ doesn’t tell you who you are. It helps you notice your patterns — situations, feelings, what you tried, what seemed to help — from your own records, over time.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              href="/sign-up"
              className="bg-coral text-white px-7 py-3.5 rounded-xl font-medium shadow-soft hover:bg-coral-deep transition"
            >
              Begin exploring
            </Link>
            <Link
              href="/app/map"
              className="px-6 py-3.5 rounded-xl border border-line text-ink-soft hover:bg-paper-deep transition"
            >
              See the Response Map
            </Link>
          </div>
          <p className="text-xs text-ink-mute mt-4">
            Not a diagnosis. Not a replacement for professional clinical care. Your records stay private to you.
          </p>
        </div>
        <HeroArt />
      </section>

      {/* 7-Step Learning Loop */}
      <section id="how" className="bg-teal-deep text-paper py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl text-white">The learning loop</h2>
            <p className="text-paper/80 text-sm mt-3 leading-relaxed">
              Wellbeing isn't a fixed score. It's an ongoing, cyclical practice of observing what happens and testing what supports you.
            </p>
          </div>
          <LoopDiagram />
          <div className="grid sm:grid-cols-3 gap-8 mt-16 text-sm">
            <Feature
              t="1. Check-in"
              d="A light, human 60-second moment: how you feel, what is happening, what you tried, how it went."
            />
            <Feature
              t="2. Discover"
              d="Your Personal Response Map turns records into patterns and possibilities — never into verdicts."
            />
            <Feature
              t="3. Experiment"
              d="Small, safe personal trials with structured attempts that you evaluate in your own words."
            />
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl text-ink">Private by design</h2>
          <ul className="mt-6 space-y-4 text-ink-soft text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-teal font-bold">•</span>
              <span>
                <strong>Owner-only storage:</strong> Your journal, check-ins, assessments, and AI chats are protected by strict database security rules.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal font-bold">•</span>
              <span>
                <strong>Pseudonymous Circles:</strong> Community posting uses a chosen pseudonym (@handle). Real names, emails, and private data are never linked publicly.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal font-bold">•</span>
              <span>
                <strong>Opt-in minimal AI:</strong> Mentora only accesses the context you explicitly allow in Profile settings. No ads, no trackers, no surveillance.
              </span>
            </li>
          </ul>
        </div>
        <div className="rounded-xl2 bg-paper-deep p-8 border border-line shadow-soft">
          <h3 className="font-display text-xl text-ink">A note on support & AI</h3>
          <p className="text-sm text-ink-soft mt-3 leading-relaxed">
            Mentra+ is a personal educational tool for reflection, not a healthcare provider. Mentora is an AI companion, not a licensed therapist, and does not diagnose conditions. If you are experiencing distress or a mental health crisis, please reach out to local emergency services or campus counseling immediately.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-paper-soft">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-mute">
          <span className="font-display text-lg text-ink">
            Mentra<span className="text-coral">+</span>
          </span>
          <p className="text-xs">A personal wellbeing learning platform for students. Not medical advice.</p>
          <div className="flex gap-4">
            <Link href="/sign-in" className="hover:text-ink">
              Sign in
            </Link>
            <Link href="/sign-up" className="hover:text-ink font-medium">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ t, d }: { t: string; d: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
      <h3 className="font-display text-lg mb-2 text-white">{t}</h3>
      <p className="text-paper/80 leading-relaxed">{d}</p>
    </div>
  );
}

function HeroArt() {
  return (
    <div className="relative aspect-square rounded-xl3 overflow-hidden bg-gradient-to-br from-paper-soft to-paper-deep shadow-lift border border-line flex items-center justify-center p-8">
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
        <circle cx="120" cy="120" r="46" fill="#E86A55" />
        <circle cx="290" cy="150" r="32" fill="#D98A2B" />
        <circle cx="210" cy="270" r="42" fill="#2F6F6A" />
        <circle cx="90" cy="300" r="28" fill="#8FA88A" />
        <path
          d="M120 120 L210 270 L290 150 L210 270"
          stroke="#C9BEA6"
          strokeWidth="3"
          strokeDasharray="4 4"
          fill="none"
          opacity="0.8"
        />
        <ellipse cx="330" cy="330" rx="70" ry="46" fill="#2F6F6A" opacity="0.15" />
      </svg>
      <div className="absolute bottom-6 left-6 right-6 bg-card/90 backdrop-blur rounded-xl2 p-4 text-xs text-ink-soft shadow-lift border border-line">
        <div className="font-semibold text-ink text-sm mb-1">Response Map Insight</div>
        <div>
          <span className="text-coral font-medium">Academic pressure</span> →{' '}
          <span className="text-amber font-medium">Overwhelmed</span> →{' '}
          <span className="text-teal font-medium">Short walk</span> →{' '}
          <span className="text-sage font-medium">Felt calmer</span>
        </div>
      </div>
    </div>
  );
}

function LoopDiagram() {
  const steps = [
    'Experience',
    'Reflect',
    'Discover',
    'Experiment',
    'Measure',
    'Learn',
    'Personalize',
  ];

  return (
    <div className="relative mt-12 mx-auto max-w-sm aspect-square">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
      </svg>
      {steps.map((s, i) => {
        const a = (i / steps.length) * Math.PI * 2 - Math.PI / 2;
        const x = 100 + 80 * Math.cos(a);
        const y = 100 + 80 * Math.sin(a);
        return (
          <div
            key={s}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none select-none"
            style={{ left: `${(x / 200) * 100}%`, top: `${(y / 200) * 100}%` }}
          >
            <span className="w-8 h-8 rounded-full bg-paper text-ink text-xs font-bold flex items-center justify-center shadow-soft">
              {i + 1}
            </span>
            <span className="text-[11px] font-medium mt-1 text-paper/90 whitespace-nowrap">
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}
