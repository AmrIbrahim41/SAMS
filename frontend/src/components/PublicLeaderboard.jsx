import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { COMMITTEES } from "../lib/committees.jsx";

const cmt = (key) => COMMITTEES.find((c) => c.key === key) || {};
const rankBadge = (i) => ["🥇", "🥈", "🥉"][i] || i + 1;

// لوحة صدارة عامة — كل الأعضاء بنقاطهم، كل واحد بلون لجنته (عرض للجمهور)
export default function PublicLeaderboard({ onClose }) {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/participants/").then((r) => setList(r.data))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shown = useMemo(() => {
    let rows = [...list];
    if (filter) rows = rows.filter((p) => p.committee === filter);
    rows.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "ar"));
    return rows;
  }, [list, filter]);

  return (
    <div className="board-ov" onClick={onClose}>
      <div className="board-panel" onClick={(e) => e.stopPropagation()}>
        <div className="board-head">
          <div>
            <h2>🏆 لوحة الصدارة العامة</h2>
            <p>ترتيب كل أعضاء فريق محاكاة السادات بالنقاط.</p>
          </div>
          <button className="link-btn" onClick={onClose}>إغلاق ✕</button>
        </div>

        <div className="board-chips">
          <button className={filter === "" ? "on" : ""} onClick={() => setFilter("")}>الكل</button>
          {COMMITTEES.map((c) => (
            <button key={c.key} className={filter === c.key ? "on" : ""} style={{ "--c": c.color }}
              onClick={() => setFilter(c.key)}>{c.name}</button>
          ))}
        </div>

        {loading && <p className="muted board-empty">جارٍ التحميل…</p>}
        {!loading && shown.length === 0 && <p className="muted board-empty">لا يوجد نقاط بعد.</p>}

        <ol className="board-list">
          {shown.map((p, i) => {
            const c = cmt(p.committee);
            return (
              <li key={p.id} className={`board-row rank-${i + 1}`} style={{ "--c": c.color }}>
                <span className="board-rank">{rankBadge(i)}</span>
                <span className="board-main">
                  <span className="board-name">{p.name}</span>
                  <span className="board-sub">
                    <span className="board-cmt">{c.name}</span>
                    {[p.year_display, p.branch_display].filter(Boolean).join(" • ")}
                  </span>
                </span>
                <span className="board-pts">{p.points}<em>نقطة</em></span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
