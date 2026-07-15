import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";

/* ---------- helpers ---------- */
function ytId(url = "") {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}
function driveId(url = "") {
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
  return m ? m[1] : null;
}
function vimeoId(url = "") {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}
function isDirectVideo(url = "") {
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url);
}
// يحدد كيفية تشغيل الرابط داخل الـ lightbox
function embedInfo(url = "") {
  const yt = ytId(url);
  if (yt) return { type: "iframe", src: `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0` };
  const dr = driveId(url);
  if (dr) return { type: "iframe", src: `https://drive.google.com/file/d/${dr}/preview` };
  const vm = vimeoId(url);
  if (vm) return { type: "iframe", src: `https://player.vimeo.com/video/${vm}?autoplay=1` };
  if (isDirectVideo(url)) return { type: "video", src: url };
  return { type: "external", src: url };
}
function itemKind(it) {
  if (it.video) return "upload";
  if (it.url) return "videolink";
  return "image";
}
function poster(it) {
  if (it.image) return it.image;
  const id = ytId(it.url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/* ---------- uploaded video that autoplays muted while on screen ---------- */
function AutoVideo({ src, poster }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { v.play().catch(() => {}); }
        else { v.pause(); }
      },
      { threshold: 0.5 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={src} poster={poster || undefined} muted loop playsInline preload="metadata" />;
}

/* ---------- one card ---------- */
function SeminarCard({ it, admin, onOpen, onEdit, onDelete }) {
  const kind = itemKind(it);
  const pg = poster(it);
  return (
    <div className="mitem">
      <div className="mmedia" onClick={() => onOpen(it)}>
        {kind === "upload" && <AutoVideo src={it.video} poster={it.image} />}
        {kind === "videolink" && (
          <>
            {pg ? <img src={pg} alt={it.title || ""} loading="lazy" />
              : <div className="mfallback">فيديو</div>}
            <span className="play-badge"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></span>
          </>
        )}
        {kind === "image" && (it.image
          ? <img src={it.image} alt={it.title || ""} loading="lazy" />
          : <div className="mfallback">صورة</div>)}
        {kind === "upload" && <span className="play-badge sm"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></span>}

        {admin && (
          <div className="mitem-actions" onClick={(e) => e.stopPropagation()}>
            <button className="link-btn" onClick={() => onEdit(it)}>تعديل</button>
            <button className="link-btn" onClick={() => onDelete(it)}>حذف</button>
          </div>
        )}
      </div>
      {it.title && <div className="mcap">{it.title}</div>}
    </div>
  );
}

/* ---------- lightbox ---------- */
function Lightbox({ it, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const kind = itemKind(it);
  const embed = kind === "videolink" ? embedInfo(it.url) : null;
  return (
    <div className="lb-ov" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="إغلاق">×</button>
      <div className="lb-content" onClick={(e) => e.stopPropagation()}>
        {kind === "upload" && <video src={it.video} controls autoPlay playsInline />}
        {kind === "image" && <img src={it.image} alt={it.title || ""} />}
        {embed && embed.type === "iframe" && (
          <iframe src={embed.src} title={it.title || "video"}
            allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
        )}
        {embed && embed.type === "video" && <video src={embed.src} controls autoPlay playsInline />}
        {embed && embed.type === "external" && (
          <div className="lb-external">
            <p>هذا الرابط لا يدعم العرض المباشر داخل الموقع.</p>
            <a className="btn" href={embed.src} target="_blank" rel="noopener">افتح الفيديو في تبويب جديد ↗</a>
          </div>
        )}
        {it.title && <div className="lb-cap">{it.title}</div>}
      </div>
    </div>
  );
}

/* ---------- section ---------- */
export default function SeminarSection({ admin = false }) {
  const [items, setItems] = useState([]);
  const [light, setLight] = useState(null);
  const [editor, setEditor] = useState(null);

  const load = () => api.get("/seminar/").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  async function remove(it) {
    if (!confirm("حذف هذا العنصر؟")) return;
    await api.delete(`/seminar/${it.id}/`);
    load();
  }

  if (!admin && items.length === 0) return null;

  return (
    <section className="seminar" id="seminar">
      <div className="wrap">
        <div className="sec-head">
          <h2>نبذة عن <span className="hl">تفاصيل رحلتنا</span></h2>
          <p className="sec-sub">لقطات وفيديوهات من رحلتنا في محاكاة السادات.</p>
        </div>

        <div className="mgrid">
          {items.map((it) => (
            <SeminarCard key={it.id} it={it} admin={admin}
              onOpen={setLight} onEdit={setEditor} onDelete={remove} />
          ))}
        </div>

        {admin && (
          <div style={{ textAlign: "center", marginTop: 22 }}>
            <button className="btn" onClick={() => setEditor({})}>＋ إضافة صورة / فيديو</button>
          </div>
        )}
      </div>

      {light && <Lightbox it={light} onClose={() => setLight(null)} />}
      {editor && (
        <SeminarEditor item={editor.id ? editor : null}
          onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />
      )}
    </section>
  );
}

/* ---------- editor ---------- */
function SeminarEditor({ item, onClose, onSaved }) {
  const [kind, setKind] = useState(item?.kind || "image");
  const [source, setSource] = useState(item?.video ? "upload" : item?.url ? "link" : "upload");
  const [title, setTitle] = useState(item?.title || "");
  const [url, setUrl] = useState(item?.url || "");
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(e) {
    e.preventDefault(); setError("");
    if (kind === "image" && !image && !item?.image) { setError("اختر صورة."); return; }
    if (kind === "video" && source === "upload" && !video && !item?.video) { setError("اختر ملف الفيديو."); return; }
    if (kind === "video" && source === "link" && !url.trim()) { setError("أدخل رابط الفيديو."); return; }

    const fd = new FormData();
    fd.append("kind", kind);
    fd.append("title", title);
    fd.append("is_published", "true");
    if (kind === "video" && source === "link") fd.append("url", url);
    if (video) fd.append("video", video);
    if (image) fd.append("image", image);
    setBusy(true);
    try {
      if (item) await api.patch(`/seminar/${item.id}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      else await api.post("/seminar/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onSaved();
    } catch { setError("فشل الحفظ. تأكد أنك مسجّل دخول كأدمن."); }
    finally { setBusy(false); }
  }

  return (
    <div className="modal-ov" onClick={onClose}>
      <form className="modal panel" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h3>{item ? "تعديل عنصر" : "إضافة صورة / فيديو"}</h3>

        <div className="field"><label>النوع</label>
          <div className="row">
            <label className="row" style={{ gap: 6 }}>
              <input type="radio" checked={kind === "image"} onChange={() => setKind("image")} /> صورة
            </label>
            <label className="row" style={{ gap: 6 }}>
              <input type="radio" checked={kind === "video"} onChange={() => setKind("video")} /> فيديو
            </label>
          </div>
        </div>

        <div className="field"><label>عنوان (اختياري)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} /></div>

        {kind === "image" && (
          <div className="field"><label>الصورة</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} /></div>
        )}

        {kind === "video" && (
          <>
            <div className="field"><label>مصدر الفيديو</label>
              <div className="row">
                <label className="row" style={{ gap: 6 }}>
                  <input type="radio" checked={source === "upload"} onChange={() => setSource("upload")} /> رفع ملف
                </label>
                <label className="row" style={{ gap: 6 }}>
                  <input type="radio" checked={source === "link"} onChange={() => setSource("link")} /> رابط
                </label>
              </div>
            </div>
            {source === "upload"
              ? <div className="field"><label>ملف الفيديو</label>
                  <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files[0])} /></div>
              : <div className="field"><label>رابط الفيديو (يوتيوب / درايف / Vimeo / mp4)</label>
                  <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></div>}
            <div className="field"><label>صورة غلاف (اختياري)</label>
              <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} /></div>
          </>
        )}

        <div className="row">
          <button className="btn" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ"}</button>
          <button type="button" className="btn ghost" onClick={onClose}>إلغاء</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
