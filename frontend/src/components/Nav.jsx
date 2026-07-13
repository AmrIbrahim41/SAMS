import { Link } from "react-router-dom";

export default function Nav() {
  return (
    <nav className="nav">
      <Link to="/" className="brand">SAMS · محاكاة البنوك</Link>
      <div className="links">
        <Link to="/">الرئيسية</Link>
        <Link to="/videos">الفيديوهات</Link>
      </div>
    </nav>
  );
}
