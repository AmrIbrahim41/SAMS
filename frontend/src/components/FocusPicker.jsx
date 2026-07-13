import { useEffect, useMemo, useState } from "react";

// يعرض الصورة كاملة، وتدوس على الجزء المهم لتحديد نقطة التركيز (object-position)
// value مثل "50% 30%"
export default function FocusPicker({ file, existingUrl, value, onChange }) {
  // preview من الملف الجديد لو موجود، وإلا الصورة الحالية
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, [objectUrl]);
  const src = objectUrl || existingUrl || null;

  const [x, y] = parsePos(value);

  function pick(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = clamp(Math.round(((e.clientX - r.left) / r.width) * 100));
    const py = clamp(Math.round(((e.clientY - r.top) / r.height) * 100));
    onChange(`${px}% ${py}%`);
  }

  if (!src) return null;

  return (
    <div className="field">
      <label>حدّد الجزء اللي يظهر (اضغط على الوش مثلاً)</label>
      <div className="focus-pick" onClick={pick}>
        <img src={src} alt="" draggable={false} />
        <span className="focus-dot" style={{ left: `${x}%`, top: `${y}%` }} />
      </div>
      <div className="focus-hint">نقطة التركيز: {x}% {y}%</div>
    </div>
  );
}

function parsePos(v) {
  const m = String(v || "50% 30%").match(/(\d+)%\s+(\d+)%/);
  return m ? [Number(m[1]), Number(m[2])] : [50, 30];
}
function clamp(n) { return Math.max(0, Math.min(100, n)); }
