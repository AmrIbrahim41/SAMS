import { useState } from "react";
import { login } from "../lib/api.js";

export default function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await login(username, password);
      onSuccess();
    } catch {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة.");
    } finally { setBusy(false); }
  }

  return (
    <div className="panel">
      <h2>لوحة تحكم SAMS</h2>
      <p className="muted" style={{ marginTop: -6 }}>تسجيل دخول المشرفين</p>
      <form onSubmit={submit}>
        <div className="field"><label>اسم المستخدم</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus /></div>
        <div className="field"><label>كلمة المرور</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="btn" disabled={busy}>{busy ? "..." : "دخول"}</button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
