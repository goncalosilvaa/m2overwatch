"use client";
import { useState } from "react";
import Link from "next/link";
import Logo, { LogoMark } from "@/components/Logo";
import { I18N, type Lang } from "@/lib/landing-i18n";

const ICONS: Record<string, JSX.Element> = {
  f1: <path d="M12 3l7 3v6c0 4.4-3 7.4-7 9-4-1.6-7-4.6-7-9V6l7-3z" />,
  f2: <path d="M4 19h16M7 16v-4M12 16V8M17 16v-6" />,
  f3: <><path d="M5 18a8 8 0 0 1 14 0" /><path d="M12 18l3.5-3.5" /></>,
  f5: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  f6: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 20h4" /></>,
  f9: <><path d="M12 3l7 3v6c0 4.4-3 7.4-7 9-4-1.6-7-4.6-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></>,
};
const FEATURES = ["f1", "f2", "f3", "f5", "f6", "f9"];
const STEPS = ["st1", "st2", "st3", "st4"];
const FAQS = ["q1", "q2", "q3", "q4", "q5"];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-mono uppercase tracking-[0.22em] text-primary mb-3">{children}</div>
  );
}

function Icon({ k }: { k: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      {ICONS[k]}
    </svg>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("pt");
  const t = (k: string) => I18N[lang][k] ?? k;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-[#0a0f18]/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">
          <Link href="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted ml-2">
            <a href="#features" className="hover:text-white transition-colors">{t("nav_features")}</a>
            <a href="#how" className="hover:text-white transition-colors">{t("nav_how")}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t("nav_pricing")}</a>
            <a href="#faq" className="hover:text-white transition-colors">{t("nav_faq")}</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex rounded-lg border border-border overflow-hidden text-xs font-mono">
              <button onClick={() => setLang("pt")} className={lang === "pt" ? "px-2.5 py-1 bg-primary text-black font-bold" : "px-2.5 py-1 text-muted hover:text-white"}>PT</button>
              <button onClick={() => setLang("en")} className={lang === "en" ? "px-2.5 py-1 bg-primary text-black font-bold" : "px-2.5 py-1 text-muted hover:text-white"}>EN</button>
            </div>
            <Link href="/login" className="hidden sm:block text-sm text-muted hover:text-white transition-colors">{t("nav_panel")}</Link>
            <a href="#pricing" className="text-sm font-bold bg-primary text-black px-4 py-2 rounded-lg">{t("nav_get")}</a>
          </div>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-muted border border-border rounded-full px-3 py-1.5 mb-7">
          <LogoMark size={15} /> {t("hero_tag")}
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.04]">{t("hero_h")}</h1>
        <p className="mt-6 text-lg text-muted max-w-2xl mx-auto">{t("hero_sub")}</p>
        <div className="mt-9 flex flex-wrap gap-3 justify-center">
          <a href="#pricing" className="bg-primary text-black font-bold px-5 py-3 rounded-xl">{t("hero_cta1")}</a>
          <a href="#features" className="border border-border text-white font-bold px-5 py-3 rounded-xl hover:border-primary transition-colors">{t("hero_cta2")}</a>
        </div>
        <div className="mt-10 flex flex-wrap gap-2 justify-center text-xs text-muted">
          {["pill1", "pill2", "pill3", "pill4"].map((k) => (
            <span key={k} className="border border-border rounded-full px-3 py-1 font-mono">{t(k)}</span>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 border border-border rounded-2xl divide-x divide-border overflow-hidden">
          {[["7", "s1"], ["<60s", "s2"], ["2-em-1", "s3"], ["0", "s4"]].map(([n, k], i) => (
            <div key={i} className="bg-card p-6 text-center">
              <div className="text-2xl font-extrabold font-mono text-primary">{n === "<60s" ? "<60s" : n}</div>
              <div className="text-muted text-xs mt-1">{t(k)}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-border/60">
        <div className="text-center max-w-2xl mx-auto">
          <Eyebrow>{t("feat_eye")}</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("feat_h")}</h2>
          <p className="mt-4 text-muted">{t("feat_lead")}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {FEATURES.map((k) => (
            <div key={k} className="bg-card border border-border rounded-2xl p-6 hover:border-border/100 hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center ring-1 ring-primary/20 mb-4">
                <Icon k={k} />
              </div>
              <h3 className="font-bold mb-1.5">{t(k + "t")}</h3>
              <p className="text-muted text-sm leading-relaxed">{t(k + "d")}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="max-w-6xl mx-auto px-6 py-20 border-t border-border/60">
        <div className="text-center max-w-2xl mx-auto">
          <Eyebrow>{t("how_eye")}</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("how_h")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {STEPS.map((k, i) => (
            <div key={k} className="bg-card border border-border rounded-2xl p-6">
              <div className="text-primary font-mono font-extrabold text-lg">0{i + 1}</div>
              <h3 className="font-bold mt-3 mb-1.5">{t(k + "t")}</h3>
              <p className="text-muted text-sm leading-relaxed">{t(k + "d")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-border/60">
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <Eyebrow>{t("why_eye")}</Eyebrow>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{t("why_h")}</h2>
          <p className="mt-4 text-muted max-w-2xl mx-auto leading-relaxed">{t("why_d")}</p>
        </div>
      </section>

      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 border-t border-border/60">
        <div className="text-center max-w-2xl mx-auto">
          <Eyebrow>{t("pr_eye")}</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("pr_h")}</h2>
          <p className="mt-4 text-muted">{t("pr_lead")}</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-4 mt-12 max-w-4xl mx-auto">
          {[
            { nm: "Starter", amt: "pr1_amt", per: "pr1_per", items: ["pr1_1", "pr1_2", "pr1_3", "pr1_4"], cta: "pr_buy", pop: false },
            { nm: "Pro", amt: "pr2_amt", per: "pr2_per", items: ["pr2_1", "pr2_2", "pr2_3", "pr2_4"], cta: "pr_buy2", pop: true },
            { nm: "Lifetime", amt: "pr3_amt", per: "pr3_per", items: ["pr3_1", "pr3_2", "pr3_3", "pr3_4"], cta: "pr_buy", pop: false },
          ].map((p) => (
            <div key={p.nm} className={p.pop ? "relative bg-card border border-primary rounded-2xl p-7 ring-1 ring-primary/30" : "bg-card border border-border rounded-2xl p-7"}>
              {p.pop && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold bg-primary text-black px-3 py-1 rounded-full tracking-wider">{t("pr_popular")}</div>
              )}
              <div className="text-xs font-mono uppercase tracking-widest text-accent">{p.nm}</div>
              <div className="mt-3 text-4xl font-extrabold">€{t(p.amt)}<span className="text-base text-muted font-medium">{t(p.per)}</span></div>
              <ul className="mt-6 mb-7 space-y-3">
                {p.items.map((it) => (
                  <li key={it} className="flex items-start gap-2.5 text-sm text-muted">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#37e08a" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
                    {t(it)}
                  </li>
                ))}
              </ul>
              <a href="#contact" className={p.pop ? "block text-center bg-primary text-black font-bold px-4 py-2.5 rounded-xl" : "block text-center border border-border text-white font-bold px-4 py-2.5 rounded-xl hover:border-primary transition-colors"}>{t(p.cta)}</a>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="max-w-3xl mx-auto px-6 py-20 border-t border-border/60">
        <div className="text-center mb-10">
          <Eyebrow>{t("faq_eye")}</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("faq_h")}</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((k, i) => (
            <details key={k} className="group bg-card border border-border rounded-xl overflow-hidden">
              <summary className="cursor-pointer list-none px-5 py-4 font-semibold flex items-center justify-between">
                {t(k)}
                <span className="text-primary text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-5 text-muted text-sm leading-relaxed">{t("a" + (i + 1))}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="contact" className="max-w-3xl mx-auto px-6 py-24 text-center border-t border-border/60">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("cta_h")}</h2>
        <p className="mt-4 text-muted max-w-xl mx-auto">{t("cta_d")}</p>
        <a href="#" className="inline-block mt-8 bg-primary text-black font-bold px-6 py-3 rounded-xl">{t("cta_btn")}</a>
      </section>

      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <Logo />
          <p className="text-muted text-xs text-center sm:text-right max-w-md">{t("foot")}</p>
        </div>
      </footer>
    </div>
  );
}
