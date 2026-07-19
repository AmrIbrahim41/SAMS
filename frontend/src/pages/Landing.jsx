import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { logout } from "../lib/api.js";
import { COMMITTEES } from "../lib/committees.jsx";
import CommitteeSections from "../components/CommitteeSections.jsx";
import SupervisorsSection from "../components/SupervisorsSection.jsx";
import SeminarSection from "../components/SeminarSection.jsx";
import PointsDashboard from "../components/PointsDashboard.jsx";
import PublicLeaderboard from "../components/PublicLeaderboard.jsx";
import SocialConnect from "../components/SocialConnect.jsx";

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
      <SocialConnect admin={admin} />

      <footer className="foot">
        © 2026 محاكاة البنوك — أكاديمية السادات للعلوم الإدارية
        <div className="en">SAMS Banking Simulation · Sadat Academy for Management Sciences</div>
      </footer>
    </>
  );
}
