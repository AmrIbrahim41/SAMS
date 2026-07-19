import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

// الروابط الافتراضية — تُستخدم لو الـ API لسه مافيهوش قيم محفوظة
const DEFAULTS = {
  facebook: "https://www.facebook.com/profile.php?id=61570677291064",
  instagram: "https://www.instagram.com/sams_simulation_2006",
  tiktok: "https://vt.tiktok.com/ZSCK8rwNw/",
  linkedin: "https://www.linkedin.com/company/sams-banking-simulation/",
};

const ICONS = {
  facebook: (
    <svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0022 12z" /></svg>
  ),
  instagram: (
    <svg viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" /></svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24"><path d="M16.6 5.8c-1-.7-1.7-1.7-1.9-3H12v11.4c0 1.4-1.1 2.5-2.5 2.5S7 15.6 7 14.2s1.1-2.5 2.5-2.5c.3 0 .6 0 .8.1V9.2c-.3 0-.5-.1-.8-.1-3 0-5.4 2.4-5.4 5.4S6.5 20 9.5 20s5.4-2.4 5.4-5.4V9c1.1.8 2.5 1.3 4 1.3V7.6c-.8 0-1.6-.3-2.3-.8z" /></svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24"><path d="M20.4 3H3.6C3.3 3 3 3.3 3 3.6v16.8c0 .3.3.6.6.6h16.8c.3 0 .6-.3.6-.6V3.6c0-.3-.3-.6-.6-.6zM8.3 18.3H5.4V9.6h2.9v8.7zM6.9 8.4A1.7 1.7 0 116.9 5a1.7 1.7 0 010 3.4zm11.4 9.9h-2.9v-4.2c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2v4.3H9.5V9.6h2.8v1.2h.1c.4-.7 1.3-1.4 2.7-1.4 2.9 0 3.4 1.9 3.4 4.4v4.5z" /></svg>
  ),
};

// ترتيب العرض + العناوين الفرعية
const CARDS = [
  { key: "facebook",  cls: "fb", label: "Facebook",  sub: "تابعنا على فيسبوك" },
  { key: "instagram", cls: "ig", label: "Instagram", sub: "@sams_simulation_2006" },
  { key: "tiktok",    cls: "tt", label: "TikTok",    sub: "شاهدنا على تيك توك" },
  { key: "linkedin",  cls: "li", label: "LinkedIn",  sub: "sams-banking-simulation" },
];

const FIELDS = [
  { key: "facebook",  label: "رابط فيسبوك",   placeholder: "https://facebook.com/..." },
  { key: "instagram", label: "رابط إنستجرام", placeholder: "https://instagram.com/..." },
  { key: "tiktok",    label: "رابط تيك توك",  placeholder: "https://tiktok.com/@..." },
  { key: "linkedin",  label: "رابط لينكدإن",  placeholder: "https://linkedin.com/company/..." },
];

export default function SocialConnect({ admin = false }) {
  const [links, setLinks] = useState(DEFAULTS);
  const [editing, setEditing] = useState(false);

  const load = () =>
    api.get("/social-links/")
      .then((r) => {
        // استخدم القيمة المحفوظة لو موجودة، وإلا ارجع للافتراضي
        const merged = { ...DEFAULTS };
        for (const k of Object.keys(DEFAULTS)) if (r.data?.[k]) merged[k] = r.data[k];
        setLinks(merged);
      })
      .catch(() => {}); // لو فشل، نكمل بالافتراضي

  useEffect(() => { load(); }, []);

  return (
    <section className="connect">
      <div className="wrap">
        <h2>تابعنا على منصّاتنا</h2>
        <p className="sub">Follow the journey · انضم إلى مجتمعنا وكن جزءًا من التجربة</p>

        {admin && (
          <button className="edit-links-btn" onClick={() => setEditing(true)}>
            ✎ تعديل الروابط
          </button>
        )}

        <div className="socials">
          {CARDS.map((c) => (
            <a key={c.key} className={`social ${c.cls}`} href={links[c.key] || DEFAULTS[c.key]}
               target="_blank" rel="noopener">
              <span className="si">{ICONS[c.key]}</span>
              <span className="s-txt">{c.label}<small>{c.sub}</small></span>
              <span className="s-go" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>

      {editing && (
        <LinksEditor links={links} onClose={() => setEditing(false)}
          onSaved={(next) => { setLinks(next); setEditing(false); }} />
      )}
    </section>
  );
}

/* ---------------- Editor: URLs only ---------------- */
function LinksEditor({ links, onClose, onSaved }) {
  const [f, setF] = useState({ ...links });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function save(e) {
    e.preventDefault(); setError("");
    setBusy(true);
    try {
      const { data } = await api.patch("/social-links/", f);
      const merged = { ...f };
      for (const k of Object.keys(f)) if (data?.[k]) merged[k] = data[k];
      onSaved(merged);
    } catch (err) {
      const msg = err?.response?.data;
      setError(
        msg && typeof msg === "object"
          ? "رابط غير صالح — تأكد إنه يبدأ بـ https://"
          : "فشل الحفظ. تأكد أنك مسجّل دخول كأدمن."
      );
    } finally { setBusy(false); }
  }

  return (
    <div className="modal-ov" onClick={onClose}>
      <form className="modal panel" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h3>تعديل روابط السوشيال ميديا</h3>
        <p className="sec-sub" style={{ marginTop: -6, marginBottom: 4 }}>
          عدّل الروابط فقط — الكروت وتصميمها ثابتة.
        </p>
        {FIELDS.map((fl) => (
          <div className="field" key={fl.key}>
            <label>{fl.label}</label>
            <input type="url" dir="ltr" value={f[fl.key] || ""}
              placeholder={fl.placeholder}
              onChange={(e) => set(fl.key, e.target.value)} />
          </div>
        ))}
        <div className="row">
          <button className="btn" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ"}</button>
          <button type="button" className="btn ghost" onClick={onClose}>إلغاء</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
