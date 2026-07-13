import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import FocusPicker from "./FocusPicker.jsx";

function initials(name) {
  return (name || "؟").trim().charAt(0);
}

function SupCard({ s, admin, onEdit, onDelete }) {
  return (
    <article className="scard">
      {s.photo
        ? <img className="sc-photo" src={s.photo} alt={s.name} loading="lazy"
            style={{ objectPosition: s.focus || "50% 30%" }} />
        : <div className="sc-photo sc-ph">{initials(s.name)}</div>}
      <div className="sc-body">
        {s.title && <div className="sc-title">{s.title}</div>}
        <h3 className="sc-name">{s.name}</h3>
        {s.bio && <p className="sc-bio">{s.bio}</p>}
        <div className="sc-foot">
          {s.link && (
            <a className="sc-link" href={s.link} target="_blank" rel="noopener">الملف التعريفي ↗</a>
          )}
          {admin && (
            <span className="pf-actions" style={{ border: "none", padding: 0, marginTop: 0 }}>
              <button className="link-btn" onClick={() => onEdit(s)}>تعديل</button>
              <button className="link-btn" onClick={() => onDelete(s)}>حذف</button>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function SupervisorsSection({ admin = false }) {
  const [list, setList] = useState([]);
  const [editor, setEditor] = useState(null); // supervisor | {} for new

  const load = () => api.get("/supervisors/").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  async function remove(s) {
    if (!confirm(`حذف ${s.name}؟`)) return;
    await api.delete(`/supervisors/${s.id}/`);
    load();
  }

  if (!admin && list.length === 0) return null;

  return (
    <section className="supervisors" id="supervisors">
      <div className="wrap">
        <div className="sec-head">
          <h2>المشرفون <span className="hl">والدكاترة</span></h2>
          <p className="sec-sub">القيادات الأكاديمية المشرفة على المشروع</p>
        </div>

        <div className="sgrid">
          {list.map((s) => (
            <SupCard key={s.id} s={s} admin={admin} onEdit={(x) => setEditor(x)} onDelete={remove} />
          ))}
          {admin && (
            <button className="add-slot sadd" style={{ "--c": "#ffd15c" }} onClick={() => setEditor({})}>
              <span className="plus">＋</span>إضافة مشرف / دكتور
            </button>
          )}
        </div>
      </div>

      {editor && (
        <SupervisorEditor sup={editor.id ? editor : null} onClose={() => setEditor(null)}
          onSaved={() => { setEditor(null); load(); }} />
      )}
    </section>
  );
}

/* ---------------- Editor ---------------- */
function SupervisorEditor({ sup, onClose, onSaved }) {
  const [f, setF] = useState({
    name: sup?.name || "", title: sup?.title || "", bio: sup?.bio || "", link: sup?.link || "",
  });
  const [photo, setPhoto] = useState(null);
  const [focus, setFocus] = useState(sup?.focus || "50% 30%");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function save(e) {
    e.preventDefault(); setError("");
    if (!f.name.trim()) { setError("الاسم مطلوب."); return; }
    const fd = new FormData();
    fd.append("name", f.name);
    fd.append("title", f.title);
    fd.append("bio", f.bio);
    fd.append("link", f.link);
    fd.append("is_published", "true");
    fd.append("focus", focus);
    if (photo) fd.append("photo", photo);
    setBusy(true);
    try {
      if (sup) await api.patch(`/supervisors/${sup.id}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      else await api.post("/supervisors/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onSaved();
    } catch { setError("فشل الحفظ. تأكد أنك مسجّل دخول كأدمن."); }
    finally { setBusy(false); }
  }

  return (
    <div className="modal-ov" onClick={onClose}>
      <form className="modal panel" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h3>{sup ? "تعديل مشرف" : "إضافة مشرف / دكتور"}</h3>
        <div className="field"><label>الاسم</label>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} required /></div>
        <div className="field"><label>الصفة العلمية / المنصب</label>
          <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="أستاذ دكتور — المشرف العام" /></div>
        <div className="field"><label>نبذة</label>
          <textarea value={f.bio} onChange={(e) => set("bio", e.target.value)} /></div>
        <div className="field"><label>رابط تعريفي (اختياري)</label>
          <input value={f.link} onChange={(e) => set("link", e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
        <div className="field"><label>الصورة {sup?.photo ? "(اتركها فارغة للإبقاء على الحالية)" : ""}</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} /></div>
        <FocusPicker file={photo} existingUrl={sup?.photo} value={focus} onChange={setFocus} />
        <div className="row">
          <button className="btn" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ"}</button>
          <button type="button" className="btn ghost" onClick={onClose}>إلغاء</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
