import { useState } from "react";
import { isLoggedIn } from "../lib/api.js";
import Login from "../components/AdminLogin.jsx";
import Landing from "./Landing.jsx";

// بوابة /admin: لو مش مسجّل دخول تظهر شاشة الدخول،
// وبعد الدخول تظهر نفس الصفحة الرئيسية في وضع التعديل (أزرار إضافة/تعديل).
export default function Admin() {
  const [authed, setAuthed] = useState(isLoggedIn());

  if (!authed) {
    return (
      <>
        <div className="bg"></div>
        <div className="grid-lines"></div>
        <div className="container" style={{ maxWidth: 440 }}>
          <Login onSuccess={() => setAuthed(true)} />
        </div>
      </>
    );
  }

  return <Landing admin onLogout={() => setAuthed(false)} />;
}
