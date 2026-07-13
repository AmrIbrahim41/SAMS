import { useEffect, useState } from "react";
import { api, logout } from "../lib/api.js";

export default function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState("videos");
  function doLogout() { logout(); onLogout(); }

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 className="section-title">لوحة التحكم</h2>
        <button className="link-btn" onClick={doLogout}>تسجيل خروج</button>
      </div>
      <div className="row" style={{ margin: "14px 0" }}>
        <button className={`btn ${tab === "videos" ? "" : "ghost"}`} onClick={() => setTab("videos")}>الفيديوهات</button>
        <button className={`btn ${tab === "sections" ? "" : "ghost"}`} onClick={() => setTab("sections")}>المحتوى والكروت</button>
      </div>
      {tab === "videos" ? <VideosManager /> : <SectionsManager />}
    </div>
  );
}

/* ---------------- Videos ---------------- */
function VideosManager() {
  const [videos, setVideos] = useState([]);
  const [f, setF] = useState({ title: "", description: "" });
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.get("/videos/").then((r) => setVideos(r.data));
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault(); setError("");
    if (!file) { setError("اختر ملف الفيديو أولاً."); return; }
    const fd = new FormData();
    fd.append("title", f.title); fd.append("description", f.description);
    fd.append("file", file);
    if (thumbnail) fd.append("thumbnail", thumbnail);
    setBusy(true);
    try {
      await api.post("/videos/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setF({ title: "", description: "" }); setFile(null); setThumbnail(null); e.target.reset(); load();
    } catch { setError("فشل الرفع. تأكد من صلاحياتك وحجم الملف."); }
    finally { setBusy(false); }
  }

  async function togglePublish(v) {
    await api.patch(`/videos/${v.id}/`, { is_published: !v.is_published }); load();
  }
  async function remove(id) {
    if (!confirm("حذف الفيديو؟")) return;
    await api.delete(`/videos/${id}/`); load();
  }

  return (
    <div>
      <form onSubmit={add} className="panel" style={{ margin: "0 0 20px", maxWidth: "100%" }}>
        <h3>إضافة فيديو</h3>
        <div className="field"><label>العنوان</label>
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></div>
        <div className="field"><label>الوصف</label>
          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="field"><label>ملف الفيديو</label>
          <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0])} required /></div>
        <div className="field"><label>صورة مصغّرة (اختياري)</label>
          <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files[0])} /></div>
        <button className="btn" disabled={busy}>{busy ? "جارٍ الرفع…" : "رفع"}</button>
        {error && <div className="error">{error}</div>}
      </form>

      <table className="table">
        <thead><tr><th>العنوان</th><th>الحالة</th><th></th></tr></thead>
        <tbody>
          {videos.map((v) => (
            <tr key={v.id}>
              <td>{v.title}</td>
              <td><span className="tag">{v.is_published ? "منشور" : "مخفي"}</span></td>
              <td className="row">
                <button className="link-btn" onClick={() => togglePublish(v)}>{v.is_published ? "إخفاء" : "نشر"}</button>
                <button className="link-btn" onClick={() => remove(v.id)}>حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Sections (flexible cards) ---------------- */
const EMPTY = { key: "", title_ar: "", body_ar: "", icon: "", link_url: "", link_label: "", order: 0 };

function SectionsManager() {
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.get("/sections/").then((r) => setSections(r.data));
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e) {
    e.preventDefault(); setError("");
    try {
      if (editId) await api.patch(`/sections/${editId}/`, form);
      else await api.post("/sections/", form);
      setForm(EMPTY); setEditId(null); load();
    } catch { setError("فشل الحفظ. تأكد أن المعرّف (key) فريد وأنك أدمن."); }
  }
  function edit(s) {
    setEditId(s.id);
    setForm({ key: s.key, title_ar: s.title_ar, body_ar: s.body_ar, icon: s.icon || "",
      link_url: s.link_url || "", link_label: s.link_label || "", order: s.order });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function togglePublish(s) {
    await api.patch(`/sections/${s.id}/`, { is_published: !s.is_published }); load();
  }
  async function remove(id) {
    if (!confirm("حذف القسم؟")) return;
    await api.delete(`/sections/${id}/`); load();
  }

  return (
    <div>
      <form onSubmit={save} className="panel" style={{ margin: "0 0 20px", maxWidth: "100%" }}>
        <h3>{editId ? "تعديل قسم" : "إضافة قسم / كارت"}</h3>
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>المعرّف (key)</label>
            <input value={form.key} onChange={(e) => set("key", e.target.value)} required
              placeholder="hero, about, contact..." /></div>
          <div className="field" style={{ width: 90 }}><label>الأيقونة</label>
            <input value={form.icon} onChange={(e) => set("icon", e.target.value)} placeholder="🏦" /></div>
          <div className="field" style={{ width: 90 }}><label>الترتيب</label>
            <input type="number" value={form.order} onChange={(e) => set("order", e.target.value)} /></div>
        </div>
        <div className="field"><label>العنوان</label>
          <input value={form.title_ar} onChange={(e) => set("title_ar", e.target.value)} /></div>
        <div className="field"><label>النص</label>
          <textarea value={form.body_ar} onChange={(e) => set("body_ar", e.target.value)} /></div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>رابط زر (اختياري)</label>
            <input value={form.link_url} onChange={(e) => set("link_url", e.target.value)} placeholder="https://..." /></div>
          <div className="field" style={{ flex: 1 }}><label>نص الزر</label>
            <input value={form.link_label} onChange={(e) => set("link_label", e.target.value)} placeholder="اعرف أكتر" /></div>
        </div>
        <div className="row">
          <button className="btn">{editId ? "حفظ التعديل" : "إضافة"}</button>
          {editId && <button type="button" className="btn ghost" onClick={() => { setForm(EMPTY); setEditId(null); }}>إلغاء</button>}
        </div>
        {error && <div className="error">{error}</div>}
      </form>

      <table className="table">
        <thead><tr><th>#</th><th>المعرّف</th><th>العنوان</th><th>الحالة</th><th></th></tr></thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s.id}>
              <td>{s.order}</td>
              <td>{s.icon} {s.key}</td>
              <td>{s.title_ar}</td>
              <td><span className="tag">{s.is_published ? "منشور" : "مخفي"}</span></td>
              <td className="row">
                <button className="link-btn" onClick={() => edit(s)}>تعديل</button>
                <button className="link-btn" onClick={() => togglePublish(s)}>{s.is_published ? "إخفاء" : "نشر"}</button>
                <button className="link-btn" onClick={() => remove(s.id)}>حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
