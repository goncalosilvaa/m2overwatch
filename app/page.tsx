"use client";
import { useState } from "react";
import Link from "next/link";
import { I18N, type Lang } from "@/lib/landing-i18n";

const CSS = `
:root{
  --bg:#080b11; --bg2:#0e131c; --card:#111824; --card2:#0c121b;
  --border:#1d2734; --border2:#2a3747;
  --text:#e8eef6; --muted:#8b97a7; --dim:#5b6675;
  --primary:#ff7a18; --primary2:#ff9d4d; --accent:#22d3ee; --good:#37e08a;
  --glow:0 0 40px rgba(255,122,24,.25);
  --mono:ui-monospace,"Cascadia Code","Consolas",monospace;
  --sans:"Segoe UI",system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif;
}
.lp *{box-sizing:border-box;margin:0;padding:0}
.lp{background:var(--bg);color:var(--text);font-family:var(--sans);line-height:1.6;overflow-x:hidden}
.lp a{color:inherit;text-decoration:none}
.lp .wrap{max-width:1140px;margin:0 auto;padding:0 22px}
.lp section{padding:84px 0;position:relative}
.lp h1,.lp h2,.lp h3{line-height:1.15;font-weight:800;letter-spacing:-.02em}
.lp h2{font-size:clamp(26px,3.4vw,40px);text-align:center}
.lp .lead{color:var(--muted);text-align:center;max-width:640px;margin:14px auto 0;font-size:17px}
.lp .eyebrow{font-family:var(--mono);color:var(--primary);font-size:13px;letter-spacing:.18em;text-transform:uppercase;text-align:center;display:block;margin-bottom:10px}

.lp .bgfx{position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:
    radial-gradient(900px 500px at 80% -10%,rgba(255,122,24,.10),transparent 60%),
    radial-gradient(700px 500px at 0% 10%,rgba(34,211,238,.08),transparent 55%);}
.lp .bgfx::after{content:"";position:absolute;inset:0;opacity:.5;
  background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
  background-size:46px 46px;mask-image:radial-gradient(circle at 50% 0%,#000,transparent 75%)}

.lp header{position:sticky;top:0;z-index:50;backdrop-filter:blur(10px);
  background:rgba(8,11,17,.72);border-bottom:1px solid var(--border)}
.lp nav{display:flex;align-items:center;gap:22px;height:64px}
.lp .brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:19px;letter-spacing:-.02em}
.lp .brand b{color:var(--primary)}
.lp .navlinks{display:flex;gap:24px;margin-left:auto;font-size:15px;color:var(--muted)}
.lp .navlinks a:hover{color:var(--text)}
.lp .navlinks a{transition:color .15s}
.lp .nav-cta{display:flex;align-items:center;gap:12px}
.lp .lang{display:flex;border:1px solid var(--border2);border-radius:8px;overflow:hidden;font-family:var(--mono);font-size:12px}
.lp .lang button{background:transparent;color:var(--muted);border:0;padding:6px 9px;cursor:pointer}
.lp .lang button.on{background:var(--primary);color:#0a0a0a;font-weight:700}
.lp .btn{display:inline-flex;align-items:center;gap:8px;border-radius:10px;padding:11px 18px;font-weight:700;font-size:15px;cursor:pointer;border:1px solid transparent;transition:transform .12s,box-shadow .2s,background .2s;white-space:nowrap}
.lp .btn-primary{background:linear-gradient(135deg,var(--primary),var(--primary2));color:#120a02;box-shadow:var(--glow)}
.lp .btn-primary:hover{transform:translateY(-2px)}
.lp .btn-ghost{background:transparent;border-color:var(--border2);color:var(--text)}
.lp .btn-ghost:hover{border-color:var(--primary);color:var(--primary)}
@media(max-width:860px){.lp .navlinks{display:none}}

.lp .hero{padding-top:70px;text-align:center}
.lp .hero h1{font-size:clamp(40px,7vw,76px);background:linear-gradient(180deg,#fff,#9fb0c3);-webkit-background-clip:text;background-clip:text;color:transparent}
.lp .hero .tag{font-family:var(--mono);color:var(--accent);margin-top:6px;font-size:clamp(15px,2vw,19px)}
.lp .hero p.sub{color:var(--muted);max-width:680px;margin:20px auto 0;font-size:18px}
.lp .hero-cta{display:flex;gap:14px;justify-content:center;margin-top:30px;flex-wrap:wrap}
.lp .pills{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:34px}
.lp .pill{font-family:var(--mono);font-size:12.5px;color:var(--muted);border:1px solid var(--border2);border-radius:30px;padding:7px 14px;background:var(--card2)}
.lp .pill b{color:var(--good)}

.lp .strip{border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--bg2)}
.lp .strip .wrap{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;padding:26px 22px;text-align:center}
.lp .strip .n{font-size:26px;font-weight:800;color:var(--primary);font-family:var(--mono)}
.lp .strip .l{color:var(--muted);font-size:13.5px;margin-top:2px}
@media(max-width:680px){.lp .strip .wrap{grid-template-columns:repeat(2,1fr);gap:24px}}

.lp .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:46px}
@media(max-width:920px){.lp .grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.lp .grid{grid-template-columns:1fr}}
.lp .card{background:linear-gradient(180deg,var(--card),var(--card2));border:1px solid var(--border);border-radius:16px;padding:24px;transition:border-color .2s,transform .2s}
.lp .card:hover{border-color:var(--border2);transform:translateY(-3px)}
.lp .ic{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;background:rgba(255,122,24,.12);border:1px solid rgba(255,122,24,.3);margin-bottom:14px}
.lp .ic svg{width:22px;height:22px;stroke:var(--primary);fill:none;stroke-width:1.8}
.lp .card h3{font-size:18px;margin-bottom:7px}
.lp .card p{color:var(--muted);font-size:14.5px}

.lp .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:46px;counter-reset:s}
@media(max-width:820px){.lp .steps{grid-template-columns:repeat(2,1fr)}}
@media(max-width:480px){.lp .steps{grid-template-columns:1fr}}
.lp .step{background:var(--card2);border:1px solid var(--border);border-radius:14px;padding:22px;position:relative}
.lp .step::before{counter-increment:s;content:"0" counter(s);font-family:var(--mono);font-size:30px;font-weight:800;color:var(--primary);opacity:.85}
.lp .step h3{font-size:16px;margin:8px 0 6px}
.lp .step p{color:var(--muted);font-size:14px}

.lp .band{background:linear-gradient(120deg,rgba(255,122,24,.10),rgba(34,211,238,.07));border:1px solid var(--border2);border-radius:20px;padding:42px;text-align:center;margin-top:10px}
.lp .band h2{text-align:center}.lp .band p{margin:14px auto 0}

.lp .prices{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:46px;align-items:stretch}
@media(max-width:820px){.lp .prices{grid-template-columns:1fr;max-width:420px;margin-inline:auto}}
.lp .price{background:linear-gradient(180deg,var(--card),var(--card2));border:1px solid var(--border);border-radius:16px;padding:28px;display:flex;flex-direction:column;position:relative}
.lp .price.pop{border-color:var(--primary);box-shadow:var(--glow)}
.lp .price .nm{font-family:var(--mono);color:var(--accent);font-size:13px;letter-spacing:.12em;text-transform:uppercase}
.lp .price .amt{font-size:38px;font-weight:800;margin:10px 0 2px}
.lp .price .amt span{font-size:15px;color:var(--muted);font-weight:500}
.lp .price ul{list-style:none;margin:18px 0;display:flex;flex-direction:column;gap:10px}
.lp .price li{color:var(--muted);font-size:14.5px;display:flex;gap:9px;align-items:flex-start}
.lp .price li::before{content:"";width:16px;height:16px;flex:0 0 16px;margin-top:3px;border-radius:50%;background:rgba(55,224,138,.15);
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2337e08a' stroke-width='3'><path d='M20 6L9 17l-5-5'/></svg>");background-size:11px;background-repeat:no-repeat;background-position:center}
.lp .price .btn{margin-top:auto;justify-content:center}
.lp .badge-pop{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--primary);color:#120a02;font-size:11px;font-weight:800;font-family:var(--mono);padding:3px 12px;border-radius:20px;letter-spacing:.1em}

.lp .faq{max-width:760px;margin:42px auto 0}
.lp .q{border:1px solid var(--border);border-radius:12px;margin-bottom:12px;background:var(--card2);overflow:hidden}
.lp .q summary{padding:18px 20px;cursor:pointer;font-weight:700;font-size:16px;list-style:none;display:flex;justify-content:space-between;align-items:center}
.lp .q summary::-webkit-details-marker{display:none}
.lp .q summary::after{content:"+";color:var(--primary);font-size:22px;font-weight:800}
.lp .q[open] summary::after{content:"−"}
.lp .q p{padding:0 20px 18px;color:var(--muted);font-size:14.5px}

.lp .final{text-align:center}
.lp .final .btn{margin-top:24px}

.lp footer{border-top:1px solid var(--border);padding:34px 0;color:var(--dim);font-size:13px}
.lp footer .wrap{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center}
.lp footer .disc{max-width:560px}
`;

const FEATURE_ICONS = [
  <svg key="1" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 9h18M8 18v3M16 18v3" /></svg>,
  <svg key="2" viewBox="0 0 24 24"><path d="M3 12h4l2 6 4-14 2 8h6" /></svg>,
  <svg key="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  <svg key="4" viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>,
  <svg key="5" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>,
  <svg key="6" viewBox="0 0 24 24"><path d="M4 5h16v11H7l-3 3V5z" /></svg>,
  <svg key="7" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18" /></svg>,
  <svg key="8" viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /></svg>,
  <svg key="9" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>,
];

export default function Home() {
  const [lang, setLang] = useState<Lang>("pt");
  const t = (k: string) => I18N[lang][k] ?? k;

  const features = FEATURE_ICONS.map((icon, i) => ({
    icon,
    t: `f${i + 1}t`,
    d: `f${i + 1}d`,
  }));
  const steps = [1, 2, 3, 4].map((i) => ({ t: `st${i}t`, d: `st${i}d` }));
  const faqs = [1, 2, 3, 4, 5].map((i) => ({ q: `q${i}`, a: `a${i}` }));

  return (
    <div className="lp" lang={lang}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bgfx" />

      <header>
        <div className="wrap">
          <nav>
            <a className="brand" href="#top">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" stroke="#ff7a18" strokeWidth="1.6" />
                <circle cx="12" cy="11" r="3.1" stroke="#22d3ee" strokeWidth="1.6" />
                <circle cx="12" cy="11" r="1" fill="#ff7a18" />
              </svg>
              M2<b>Overwatch</b>
            </a>
            <div className="navlinks">
              <a href="#features">{t("nav_features")}</a>
              <a href="#how">{t("nav_how")}</a>
              <a href="#pricing">{t("nav_pricing")}</a>
              <a href="#faq">{t("nav_faq")}</a>
              <Link href="/dashboard">{t("nav_panel")}</Link>
            </div>
            <div className="nav-cta">
              <div className="lang">
                <button className={lang === "pt" ? "on" : ""} onClick={() => setLang("pt")}>PT</button>
                <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
              </div>
              <a href="#pricing" className="btn btn-primary">{t("nav_get")}</a>
            </div>
          </nav>
        </div>
      </header>

      <a id="top" />
      <section className="hero">
        <div className="wrap">
          <h1>M2Overwatch</h1>
          <div className="tag">{t("hero_tag")}</div>
          <p className="sub">{t("hero_sub")}</p>
          <div className="hero-cta">
            <a href="#pricing" className="btn btn-primary">{t("hero_cta1")}</a>
            <a href="#features" className="btn btn-ghost">{t("hero_cta2")}</a>
          </div>
          <div className="pills">
            <span className="pill"><b>100%</b> <span>{t("pill1")}</span></span>
            <span className="pill">{t("pill2")}</span>
            <span className="pill">{t("pill3")}</span>
            <span className="pill">{t("pill4")}</span>
          </div>
        </div>
      </section>

      <div className="strip">
        <div className="wrap">
          <div><div className="n">7</div><div className="l">{t("s1")}</div></div>
          <div><div className="n">{"<60s"}</div><div className="l">{t("s2")}</div></div>
          <div><div className="n">2-em-1</div><div className="l">{t("s3")}</div></div>
          <div><div className="n">0</div><div className="l">{t("s4")}</div></div>
        </div>
      </div>

      <section id="features">
        <div className="wrap">
          <span className="eyebrow">{t("feat_eye")}</span>
          <h2>{t("feat_h")}</h2>
          <p className="lead">{t("feat_lead")}</p>
          <div className="grid">
            {features.map((f, i) => (
              <div className="card" key={i}>
                <div className="ic">{f.icon}</div>
                <h3>{t(f.t)}</h3>
                <p>{t(f.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how">
        <div className="wrap">
          <span className="eyebrow">{t("how_eye")}</span>
          <h2>{t("how_h")}</h2>
          <div className="steps">
            {steps.map((s, i) => (
              <div className="step" key={i}>
                <h3>{t(s.t)}</h3>
                <p>{t(s.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="band">
            <span className="eyebrow">{t("why_eye")}</span>
            <h2>{t("why_h")}</h2>
            <p className="lead">{t("why_d")}</p>
          </div>
        </div>
      </section>

      <section id="pricing">
        <div className="wrap">
          <span className="eyebrow">{t("pr_eye")}</span>
          <h2>{t("pr_h")}</h2>
          <p className="lead">{t("pr_lead")}</p>
          <div className="prices">
            <div className="price">
              <div className="nm">Starter</div>
              <div className="amt">€<span>{t("pr1_amt")}</span><span>{t("pr1_per")}</span></div>
              <ul>
                <li>{t("pr1_1")}</li><li>{t("pr1_2")}</li><li>{t("pr1_3")}</li><li>{t("pr1_4")}</li>
              </ul>
              <a href="#contact" className="btn btn-ghost">{t("pr_buy")}</a>
            </div>
            <div className="price pop">
              <div className="badge-pop">{t("pr_popular")}</div>
              <div className="nm">Pro</div>
              <div className="amt">€<span>{t("pr2_amt")}</span><span>{t("pr2_per")}</span></div>
              <ul>
                <li>{t("pr2_1")}</li><li>{t("pr2_2")}</li><li>{t("pr2_3")}</li><li>{t("pr2_4")}</li>
              </ul>
              <a href="#contact" className="btn btn-primary">{t("pr_buy2")}</a>
            </div>
            <div className="price">
              <div className="nm">Lifetime</div>
              <div className="amt">€<span>{t("pr3_amt")}</span><span>{t("pr3_per")}</span></div>
              <ul>
                <li>{t("pr3_1")}</li><li>{t("pr3_2")}</li><li>{t("pr3_3")}</li><li>{t("pr3_4")}</li>
              </ul>
              <a href="#contact" className="btn btn-ghost">{t("pr_buy")}</a>
            </div>
          </div>
        </div>
      </section>

      <section id="faq">
        <div className="wrap">
          <span className="eyebrow">{t("faq_eye")}</span>
          <h2>{t("faq_h")}</h2>
          <div className="faq">
            {faqs.map((f, i) => (
              <details className="q" key={i}>
                <summary>{t(f.q)}</summary>
                <p>{t(f.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="final">
        <div className="wrap">
          <h2>{t("cta_h")}</h2>
          <p className="lead">{t("cta_d")}</p>
          <a href="#" className="btn btn-primary">{t("cta_btn")}</a>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="brand">M2<b>Overwatch</b></div>
          <div className="disc">{t("foot")}</div>
        </div>
      </footer>
    </div>
  );
}
