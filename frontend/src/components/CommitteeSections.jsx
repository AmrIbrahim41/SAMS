import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { COMMITTEES, LEAD_ROLES } from "../lib/committees.jsx";
import FocusPicker from "./FocusPicker.jsx";

// أول حرف من الاسم كبديل للصورة
function initials(name) {
  return (name || "؟").trim().charAt(0);
}

function Avatar({ member, color }) {
  if (member.photo) {
    return <img className="pf-photo" src={member.photo} alt={member.name} loading="lazy"
      style={{ objectPosition: member.focus || "50% 30%" }} />;
  }
  return <div className="pf-photo pf-ph" style={{ color }}>{initials(member.name)}</div>;
}

// كارت شخص من القيادة (بيانات كاملة)
function LeadCard({ member, color, admin, onEdit, onDelete }) {
  return (
    <article className="pcard lead">
      <Avatar member={member} color={color} />
      <div className="pf-role" style={{ color }}>{roleLabel(member.role)}</div>
      <h4 className="pf-name">{member.name}</h4>
      {member.branch && <div className="pf-meta">{member.branch}</div>}
      {member.major && <div className="pf-major" style={{ color }}>{member.major}</div>}
      {member.bio && <p className="pf-bio">{member.bio}</p>}
      {admin && (
        <div className="pf-actions">
          <button className="link-btn" onClick={() => onEdit(member)}>تعديل</button>
          <button className="link-btn" onClick={() => onDelete(member)}>حذف</button>
        </div>
      )}
    </article>
  );
}

// كارت عضو/منظم (صورة + اسم + تخصص)
function MiniCard({ member, color, admin, onEdit, onDelete }) {
  return (
    <article className="pcard mini">
      <Avatar member={member} color={color} />
      <h4 className="pf-name">{member.name}</h4>
      {member.major && <div className="pf-major" style={{ color }}>{member.major}</div>}
      {admin && (
        <div className="pf-actions">
          <button className="link-btn" onClick={() => onEdit(member)}>تعديل</button>
          <button className="link-btn" onClick={() => onDelete(member)}>حذف</button>
        </div>
      )}
    </article>
  );
}

function roleLabel(role) {
  const map = { head: "Head", co_head: "Co-Head", coordinator: "Coordinator", member: "Member", organizer: "Organizer" };
  return map[role] || role;
}

// ميدالية/رقم الترتيب
function rankBadge(i) {
  return ["🥇", "🥈", "🥉"][i] || i + 1;
}

// لوحة صدارة اللجنة — أعلى 5 نقاط (بيانات من /participants/top/)
function Leaderboard({ rows, color, committee }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="cd-block">
      <h3 className="cd-sub">المتصدّرون</h3>
      <ol className="lb" style={{ "--c": color }}>
        {rows.map((p, i) => (
          <li key={p.id} className={`lb-row rank-${i + 1}`}>
            <span className="lb-rank">{rankBadge(i)}</span>
            <span className="lb-name">{p.name}</span>
            <span className="lb-meta">
              <span className="lb-cmt" style={{ color }}>{committee}</span>
              {[p.year_display, p.branch_display].filter(Boolean).join(" • ")}
            </span>
            <span className="lb-pts">{p.points}<em>نقطة</em></span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// زر إضافة (أدمن)
function AddBtn({ color, label, onClick }) {
  return (
    <button className="add-slot" style={{ "--c": color }} onClick={onClick}>
      <span className="plus">＋</span>{label}
    </button>
  );
}

export default function CommitteeSections({ admin = false }) {
  const [byCommittee, setByCommittee] = useState({});
  const [top, setTop] = useState({}); // {committee_key: [top5]}
  const [editor, setEditor] = useState(null); // {committee, role, member}

  function load() {
    api.get("/committee-members/").then((r) => {
      const grouped = {};
      for (const m of r.data) {
        (grouped[m.committee] = grouped[m.committee] || []).push(m);
      }
      setByCommittee(grouped);
    });
    api.get("/participants/top/").then((r) => setTop(r.data)).catch(() => {});
  }
  useEffect(() => { load(); }, []);

  async function remove(member) {
    if (!confirm(`حذف ${member.name}؟`)) return;
    await api.delete(`/committee-members/${member.id}/`);
    load();
  }

  return (
    <>
      {COMMITTEES.map((c) => {
        const people = byCommittee[c.key] || [];
        const byRole = (role) => people.filter((p) => p.role === role);
        const organizers = byRole("organizer");

        return (
          <section key={c.key} id={`c-${c.key}`} className="committee-detail" style={{ "--c": c.color }}>
            <div className="wrap">
              <div className="cd-head">
                <div className="cd-ic">{c.icon}</div>
                <h2>{c.name}</h2>
              </div>

              {/* القيادة */}
              <div className="cd-lead">
                {LEAD_ROLES.map((lr) => {
                  const filled = byRole(lr.role);
                  return (
                    <div key={lr.role} className="lead-group">
                      {filled.map((m) => (
                        <LeadCard key={m.id} member={m} color={c.color} admin={admin}
                          onEdit={(mm) => setEditor({ committee: c.key, role: lr.role, member: mm })}
                          onDelete={remove} />
                      ))}
                      {admin && filled.length < lr.max && (
                        <AddBtn color={c.color} label={`إضافة ${lr.label}`}
                          onClick={() => setEditor({ committee: c.key, role: lr.role, member: null })} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* المنظمون */}
              {(organizers.length > 0 || admin) && (
                <div className="cd-block">
                  <h3 className="cd-sub">المنظمون</h3>
                  <div className="pgrid">
                    {organizers.map((m) => (
                      <MiniCard key={m.id} member={m} color={c.color} admin={admin}
                        onEdit={(mm) => setEditor({ committee: c.key, role: "organizer", member: mm })}
                        onDelete={remove} />
                    ))}
                    {admin && (
                      <AddBtn color={c.color} label="إضافة منظم"
                        onClick={() => setEditor({ committee: c.key, role: "organizer", member: null })} />
                    )}
                  </div>
                </div>
              )}

              {/* لوحة الصدارة — أعلى 5 نقاط (تُدار من داشبورد النقاط) */}
              <Leaderboard rows={top[c.key]} color={c.color} committee={c.name} />
            </div>
          </section>
        );
      })}

      {editor && (
        <MemberEditor ctx={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />
      )}
    </>
  );
}

/* ---------------- Editor Modal ---------------- */
function MemberEditor({ ctx, onClose, onSaved }) {
  const isLead = ["head", "co_head", "coordinator"].includes(ctx.role);
  const m = ctx.member;
  const [f, setF] = useState({
    name: m?.name || "", branch: m?.branch || "", major: m?.major || "", bio: m?.bio || "",
  });
  const [photo, setPhoto] = useState(null);
  const [focus, setFocus] = useState(m?.focus || "50% 30%");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function save(e) {
    e.preventDefault(); setError("");
    if (!f.name.trim()) { setError("الاسم مطلوب."); return; }
    const fd = new FormData();
    fd.append("committee", ctx.committee);
    fd.append("role", ctx.role);
    fd.append("name", f.name);
    fd.append("major", f.major);
    if (isLead) { fd.append("branch", f.branch); fd.append("bio", f.bio); }
    fd.append("is_published", "true");
    fd.append("focus", focus);
    if (photo) fd.append("photo", photo);
    setBusy(true);
    try {
      if (m) await api.patch(`/committee-members/${m.id}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      else await api.post("/committee-members/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onSaved();
    } catch { setError("فشل الحفظ. تأكد أنك مسجّل دخول كأدمن."); }
    finally { setBusy(false); }
  }

  return (
    <div className="modal-ov" onClick={onClose}>
      <form className="modal panel" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h3>{m ? "تعديل" : "إضافة"} — {roleLabel(ctx.role)}</h3>
        <div className="field"><label>الاسم</label>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} required /></div>
        {isLead && (
          <div className="field"><label>الفرع + الفرقة</label>
            <input value={f.branch} onChange={(e) => set("branch", e.target.value)} placeholder="مثال: بنين — الفرقة الثانية" /></div>
        )}
        <div className="field"><label>التخصص</label>
          <input value={f.major} onChange={(e) => set("major", e.target.value)} /></div>
        {isLead && (
          <div className="field"><label>نبذة</label>
            <textarea value={f.bio} onChange={(e) => set("bio", e.target.value)} /></div>
        )}
        <div className="field"><label>الصورة {m?.photo ? "(اتركها فارغة للإبقاء على الحالية)" : ""}</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} /></div>
        <FocusPicker file={photo} existingUrl={m?.photo} value={focus} onChange={setFocus} />
        <div className="row">
          <button className="btn" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ"}</button>
          <button type="button" className="btn ghost" onClick={onClose}>إلغاء</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
