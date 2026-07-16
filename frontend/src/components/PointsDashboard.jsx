import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { COMMITTEES } from "../lib/committees.jsx";

const BRANCHES = [
  ["cairo", "القاهرة"], ["alex", "الإسكندرية"], ["portsaid", "بورسعيد"],
  ["minya", "المنيا"], ["assiut", "أسيوط"], ["gharbia", "الغربية (طنطا)"],
  ["dakahlia", "الدقهلية"],
];
const YEARS = [
  ["1", "الفرقة الأولى"], ["2", "الفرقة الثانية"],
  ["3", "الفرقة الثالثة"], ["4", "الفرقة الرابعة"],
];
const EMPTY = { name: "", committee: COMMITTEES[0].key, branch: "cairo", year: "1", points: 0 };

const cmt = (key) => COMMITTEES.find((c) => c.key === key) || {};
const label = (pairs, v) => (pairs.find((p) => p[0] === v) || [, ""])[1];

export default function PointsDashboard({ onClose }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pointsModal, setPointsModal] = useState(null); // participant being awarded points
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const editingRow = editId ? list.find((p) => p.id === editId) : null;

  const load = () => api.get("/participants/").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // رتبة كل شخص داخل لجنته (تنازليًا بالنقاط) — للمعاينة المباشرة
  const rankOf = useMemo(() => {
    const map = {};
    const byC = {};
    for (const p of list) (byC[p.committee] = byC[p.committee] || []).push(p);
    for (const key in byC) {
      byC[key].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "ar"));
      byC[key].forEach((p, i) => { map[p.id] = i + 1; });
    }
    return map;
  }, [list]);

  const shown = useMemo(() => {
    let rows = [...list];
    if (filter) rows = rows.filter((p) => p.committee === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((p) => p.name.toLowerCase().includes(q));
    }
    rows.sort((a, b) =>
      a.committee.localeCompare(b.committee) || b.points - a.points || a.name.localeCompare(b.name, "ar"));
    return rows;
  }, [list, search, filter]);

  async function save(e) {
    e.preventDefault(); setError("");
    if (!form.name.trim()) { setError("الاسم مطلوب."); return; }
    const payload = { ...form, points: Number(form.points) || 0, is_published: true };
    setBusy(true);
    try {
      if (editId) await api.patch(`/participants/${editId}/`, payload);
      else await api.post("/participants/", payload);
      setForm(EMPTY); setEditId(null); load();
    } catch { setError("فشل الحفظ. تأكد أنك مسجّل دخول كأدمن."); }
    finally { setBusy(false); }
  }

  function edit(p) {
    setEditId(p.id);
    setForm({ name: p.name, committee: p.committee, branch: p.branch || "boys", year: p.year || "1", points: p.points });
    document.querySelector(".pd-panel")?.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelEdit() { setForm(EMPTY); setEditId(null); }
  async function togglePublish(p) {
    await api.patch(`/participants/${p.id}/`, { is_published: !p.is_published }); load();
  }
  async function remove(p) {
    if (!confirm(`حذف ${p.name}؟`)) return;
    await api.delete(`/participants/${p.id}/`); load();
  }

  function exportCSV() {
    const head = ["اللجنة", "الاسم", "الفرقة", "الفرع", "النقاط", "الترتيب", "منشور"];
    const lines = shown.map((p) => [
      cmt(p.committee).name || p.committee, p.name, label(YEARS, p.year),
      label(BRANCHES, p.branch), p.points, rankOf[p.id], p.is_published ? "نعم" : "لا",
    ].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","));
    const csv = "﻿" + [head.join(","), ...lines].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "sams-points.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="pd-ov" onClick={onClose}>
      <div className="pd-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pd-head">
          <h2>لوحة النقاط</h2>
          <div className="row">
            <button className="btn ghost" onClick={exportCSV}>تصدير CSV</button>
            <button className="link-btn" onClick={onClose}>إغلاق ✕</button>
          </div>
        </div>

        <form className="pd-form panel" onSubmit={save}>
          <h3>{editId ? "تعديل شخص" : "إضافة شخص"}</h3>
          <div className="pd-grid">
            <div className="field"><label>الاسم</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
            <div className="field"><label>اللجنة</label>
              <select className="pd-committee" value={form.committee}
                onChange={(e) => set("committee", e.target.value)}
                style={{ "--cc": cmt(form.committee).color }}>
                {COMMITTEES.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
              </select></div>
            <div className="field"><label>الفرع</label>
              <select value={form.branch} onChange={(e) => set("branch", e.target.value)}>
                {BRANCHES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div className="field"><label>الفرقة</label>
              <select value={form.year} onChange={(e) => set("year", e.target.value)}>
                {YEARS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div className="field" style={{ maxWidth: 120 }}><label>النقاط</label>
              <input type="number" value={form.points} onChange={(e) => set("points", e.target.value)} /></div>
          </div>
          <div className="row pd-form-actions">
            <button className="btn" disabled={busy}>{busy ? "جارٍ الحفظ…" : editId ? "حفظ التعديل" : "إضافة"}</button>
            {editId && <button type="button" className="btn ghost" onClick={cancelEdit}>إلغاء</button>}
            {editId && editingRow && (
              <button type="button" className={`btn ghost pd-toggle ${editingRow.is_published ? "warn" : "ok"}`}
                onClick={() => togglePublish(editingRow)}>
                {editingRow.is_published ? "إخفاء" : "إظهار"}
              </button>
            )}
          </div>
          {error && <div className="error">{error}</div>}
        </form>

        <div className="pd-controls">
          <input className="pd-search" placeholder="بحث بالاسم…" value={search}
            onChange={(e) => setSearch(e.target.value)} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">كل اللجان</option>
            {COMMITTEES.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
          </select>
          <span className="pd-count">{shown.length} شخص</span>
        </div>

        <div className="pd-table-wrap">
        <table className="table pd-table">
          <thead><tr>
            <th>#</th><th>الاسم</th><th>اللجنة</th><th>الفرقة</th><th>الفرع</th>
            <th>النقاط</th><th>الحالة</th><th></th>
          </tr></thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className={p.is_published ? "" : "dim"}>
                <td><b className={rankOf[p.id] <= 5 ? "top5" : ""}>{rankOf[p.id]}</b></td>
                <td>{p.name}</td>
                <td><span className="cdot" style={{ background: cmt(p.committee).color }} />{cmt(p.committee).name}</td>
                <td>{label(YEARS, p.year)}</td>
                <td>{label(BRANCHES, p.branch)}</td>
                <td><b className="pts-pill">{p.points}</b></td>
                <td><span className={`tag ${p.is_published ? "ok" : "no"}`}>{p.is_published ? "ظاهر" : "مخفي"}</span></td>
                <td className="row pd-actions">
                  <button className="link-btn add-pts" onClick={() => setPointsModal(p)}>＋ نقاط</button>
                  <button className="link-btn" onClick={() => edit(p)}>تعديل</button>
                  <button className="link-btn danger" onClick={() => remove(p)}>حذف</button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan="8" className="muted" style={{ textAlign: "center", padding: 24 }}>
                لا يوجد أشخاص بعد — أضف أول شخص من الأعلى.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {pointsModal && (
        <AddPointsModal p={pointsModal}
          onClose={() => setPointsModal(null)}
          onDone={() => { setPointsModal(null); load(); }} />
      )}
    </div>
  );
}

/* ---------- popup: منح نقاط (إضافة/خصم كدلتا) ---------- */
function AddPointsModal({ p, onClose, onDone }) {
  const [delta, setDelta] = useState("");
  const [busy, setBusy] = useState(false);
  const d = Number(delta) || 0;
  const result = p.points + d;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function confirm() {
    if (d === 0) return;
    setBusy(true);
    try { await api.patch(`/participants/${p.id}/`, { points: result }); onDone(); }
    catch { setBusy(false); }
  }

  return (
    <div className="ap-ov" onClick={onClose}>
      <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-title">إضافة نقاط</div>
        <div className="ap-name">{p.name}</div>

        <div className="ap-current"><span>النقاط الحالية</span><b>{p.points}</b></div>

        <div className="ap-quick">
          {[1, 5, 10, -1, -5].map((n) => (
            <button key={n} type="button" onClick={() => setDelta(String(d + n))}>
              {n > 0 ? `+${n}` : n}
            </button>
          ))}
        </div>

        <input className="ap-input" type="number" value={delta} autoFocus
          onChange={(e) => setDelta(e.target.value)} placeholder="اكتب رقم — موجب للإضافة، سالب للخصم" />

        <div className="ap-result">
          <span>النتيجة بعد التطبيق</span>
          <b className={result < 0 ? "neg" : ""}>{result}</b>
        </div>

        <div className="row" style={{ justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <button className="btn ghost" onClick={onClose}>إلغاء</button>
          <button className="btn" disabled={busy || d === 0} onClick={confirm}>
            {busy ? "جارٍ…" : "تأكيد"}
          </button>
        </div>
      </div>
    </div>
  );
}
