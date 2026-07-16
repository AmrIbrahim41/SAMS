import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { logout } from "../lib/api.js";
import { COMMITTEES } from "../lib/committees.jsx";
import CommitteeSections from "../components/CommitteeSections.jsx";
import SupervisorsSection from "../components/SupervisorsSection.jsx";
import SeminarSection from "../components/SeminarSection.jsx";
import PointsDashboard from "../components/PointsDashboard.jsx";
import PublicLeaderboard from "../components/PublicLeaderboard.jsx";

const QUOTES = [
  { t: 'النجاح ليس نهاية المطاف، والفشل ليس قاتلاً؛ ما يهمّ حقًا هو <span class="hl">الشجاعة على الاستمرار</span>.', a: "ونستون تشرشل" },
  { t: 'أفضل طريقة للتنبؤ بالمستقبل هي أن <span class="hl">تصنعه بنفسك</span>.', a: "بيتر دراكر" },
  { t: 'لا تدّخر ما تبقّى بعد الإنفاق، بل <span class="hl">أنفق ما تبقّى بعد الادّخار</span>.', a: "وارن بافيت" },
  { t: 'الاستثمار في المعرفة يؤتي <span class="hl">أعلى فائدة</span> على الإطلاق.', a: "بنجامين فرانكلين" },
  { t: 'رأس مالك الحقيقي هو <span class="hl">ما تتعلّمه اليوم</span> قبل أن تكسبه غدًا.', a: "محاكاة السادات" },
];

export default function Landing({ admin = false, onLogout }) {
  const [qi, setQi] = useState(0);
  const [fade, setFade] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const timer = useRef(null);

  function doLogout() { logout(); if (onLogout) onLogout(); }

  function start() {
    clearInterval(timer.current);
    timer.current = setInterval(() => go((i) => (i + 1) % QUOTES.length), 5000);
  }
  function go(next) {
    setFade(true);
    setTimeout(() => {
      setQi((prev) => (typeof next === "function" ? next(prev) : next));
      setFade(false);
    }, 380);
  }
  useEffect(() => { start(); return () => clearInterval(timer.current); }, []);

  // كشف الكروت تدريجيًا عند التمرير — تحميل جزء ورا جزء بدل تحميل كله مرة واحدة
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const idx = [...e.target.parentElement.children].indexOf(e.target);
          setTimeout(() => e.target.classList.add("in"), idx * 120);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    const observe = () => document.querySelectorAll(".card, .ccard, .pcard, .scard").forEach((c) => {
      if (!c.classList.contains("in")) io.observe(c);
    });
    observe();
    // راقب أي كروت تُضاف لاحقًا (كروت الأعضاء بعد تحميلها من الـ API)
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);

  function goToCommittee(key) {
    document.getElementById(`c-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {admin && (
        <div className="admin-bar">
          <span>وضع التعديل — لوحة تحكم SAMS · اضغط زر ＋ في أي لجنة للإضافة</span>
          <div className="row" style={{ gap: 14 }}>
            <button className="btn ghost sm" onClick={() => setShowPoints(true)}>🏆 لوحة النقاط</button>
            <button className="link-btn" onClick={doLogout}>تسجيل خروج</button>
          </div>
        </div>
      )}
      {admin && showPoints && <PointsDashboard onClose={() => setShowPoints(false)} />}
      <div className="bg"></div>
      <div className="grid-lines"></div>
      <div className="blob b1"></div><div className="blob b2"></div><div className="blob b3"></div>

      {/* ===== HERO ===== */}
      <header className="hero">
        <div className="wrap">
          <div className="logo-duo">
            <img className="logo-img college" src="/college-logo.png" alt="Sadat Academy for Management Sciences"
              onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <span className="logo-link" aria-label="collaboration"><b>×</b></span>
            <img className="logo-img event" src="/event-logo.png" alt="SAMS Bank Simulation 2026"
              onError={(e) => { e.currentTarget.style.display = "none"; }} />
          </div>

          <div className="eyebrow">Sadat Academy for Management Sciences</div>
          <h1 className="title">محاكاة البنوك
            <span className="title-en">SAMS Banking Simulation</span>
          </h1>
          <p className="lead">حيث يتحوّل الطالب إلى مصرفيّ حقيقي — نُحاكي عالم البنوك بكل تفاصيله، لنصنع خبرة تبدأ من قاعة الدراسة وتمتدّ إلى سوق العمل.</p>
          <p className="lead-en">A student-run banking simulation where theory becomes practice, and ambition becomes a career.</p>
          <div className="accent-line"></div>
          <div className="scroll-cue"><span></span></div>
        </div>
      </header>

      {/* ===== QUOTES ===== */}
      <section className="quotes">
        <div className="wrap">
          <div className="quote-card">
            <div className={"q-text" + (fade ? " fade-out" : "")}
              dangerouslySetInnerHTML={{ __html: QUOTES[qi].t }} />
            <div className={"q-author" + (fade ? " fade-out" : "")}>— {QUOTES[qi].a}</div>
            <div className="q-dots">
              {QUOTES.map((_, i) => (
                <i key={i} className={i === qi ? "on" : ""} onClick={() => { go(i); start(); }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features">
        <div className="wrap">
          <div className="sec-head"><h2>لماذا <span className="hl">محاكاة السادات</span>؟</h2></div>
          <div className="cards">
            <div className="card">
              <div className="ic"><svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" /></svg></div>
              <h3>خبرة مصرفية واقعية</h3>
              <p>بيئة بنكية متكاملة تحاكي المعاملات والخدمات الحقيقية، فتتعلّم بالممارسة قبل أن تدخل سوق العمل.</p>
            </div>
            <div className="card">
              <div className="ic"><svg viewBox="0 0 24 24"><path d="M12 3l8 4v5c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V7l8-4z" /><path d="M9 12l2 2 4-4" /></svg></div>
              <h3>مهارات وثقة</h3>
              <p>تنمية مهارات القيادة والتعامل مع العملاء واتخاذ القرار المالي في بيئة آمنة تشجّع على التجربة.</p>
            </div>
            <div className="card">
              <div className="ic"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-5.5 6.5-5.5S15.5 16.4 15.5 20" /><path d="M16 5.2a3 3 0 010 5.6M18 14.6c2.4.6 3.5 2.4 3.5 5.4" /></svg></div>
              <h3>مجتمع طموح</h3>
              <p>فريق من الطلاب يشاركك الشغف نفسه، وشبكة علاقات تفتح لك أبواب الفرص المهنية.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SUPERVISORS & DOCTORS ===== */}
      <SupervisorsSection admin={admin} />

      {/* ===== SEMINAR (intro seminar gallery) ===== */}
      <SeminarSection admin={admin} />

      {/* ===== COMMITTEES GRID ===== */}
      <section className="committees">
        <div className="wrap">
          <div className="sec-head">
            <h2>لجان <span className="hl">فريق العمل</span></h2>
            <p className="sec-sub">الأقسام التي يتكوّن منها فريق محاكاة السادات — اضغط على أي لجنة لعرض فريقها.</p>
          </div>
          <div className="cgrid">
            {COMMITTEES.map((c) => (
              <article key={c.key} className="ccard" style={{ "--c": c.color }}
                role="button" tabIndex={0}
                onClick={() => goToCommittee(c.key)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToCommittee(c.key); } }}>
                <div className="cic">{c.icon}</div>
                <h3>{c.name}</h3>
                <p>{c.desc}</p>
              </article>
            ))}
          </div>
          <div className="cgrid-cta">
            <button className="board-btn" onClick={() => setShowBoard(true)}>
              🏆 لوحة الصدارة العامة
            </button>
          </div>
        </div>
      </section>

      {showBoard && <PublicLeaderboard onClose={() => setShowBoard(false)} />}

      {/* ===== COMMITTEE DETAILS (teams) ===== */}
      <CommitteeSections admin={admin} />

      {/* ===== CONNECT ===== */}
      <section className="connect">
        <div className="wrap">
          <h2>تابعنا على منصّاتنا</h2>
          <p className="sub">Follow the journey · انضم إلى مجتمعنا وكن جزءًا من التجربة</p>
          <div className="socials">
            <a className="social fb" href="https://www.facebook.com/profile.php?id=61570677291064" target="_blank" rel="noopener">
              <span className="si"><svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0022 12z" /></svg></span>
              <span>Facebook<small>تابعنا على فيسبوك</small></span>
            </a>
            <a className="social ig" href="https://www.instagram.com/sams_simulation_2006" target="_blank" rel="noopener">
              <span className="si"><svg viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" /></svg></span>
              <span>Instagram<small>@sams_simulation_2006</small></span>
            </a>
            <a className="social tt" href="https://vt.tiktok.com/ZSCK8rwNw/" target="_blank" rel="noopener">
              <span className="si"><svg viewBox="0 0 24 24"><path d="M16.6 5.8c-1-.7-1.7-1.7-1.9-3H12v11.4c0 1.4-1.1 2.5-2.5 2.5S7 15.6 7 14.2s1.1-2.5 2.5-2.5c.3 0 .6 0 .8.1V9.2c-.3 0-.5-.1-.8-.1-3 0-5.4 2.4-5.4 5.4S6.5 20 9.5 20s5.4-2.4 5.4-5.4V9c1.1.8 2.5 1.3 4 1.3V7.6c-.8 0-1.6-.3-2.3-.8z" /></svg></span>
              <span>TikTok<small>شاهدنا على تيك توك</small></span>
            </a>
            <a className="social li" href="https://www.linkedin.com/company/sams-banking-simulation/" target="_blank" rel="noopener">
              <span className="si"><svg viewBox="0 0 24 24"><path d="M20.4 3H3.6C3.3 3 3 3.3 3 3.6v16.8c0 .3.3.6.6.6h16.8c.3 0 .6-.3.6-.6V3.6c0-.3-.3-.6-.6-.6zM8.3 18.3H5.4V9.6h2.9v8.7zM6.9 8.4A1.7 1.7 0 116.9 5a1.7 1.7 0 010 3.4zm11.4 9.9h-2.9v-4.2c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2v4.3H9.5V9.6h2.8v1.2h.1c.4-.7 1.3-1.4 2.7-1.4 2.9 0 3.4 1.9 3.4 4.4v4.5z" /></svg></span>
              <span>LinkedIn<small>sams-banking-simulation</small></span>
            </a>
          </div>
        </div>
      </section>

      <footer className="foot">
        © 2026 محاكاة البنوك — أكاديمية السادات للعلوم الإدارية
        <div className="en">SAMS Banking Simulation · Sadat Academy for Management Sciences</div>
      </footer>
    </>
  );
}
