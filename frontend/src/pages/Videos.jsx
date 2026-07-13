import { useEffect, useState } from "react";
import Nav from "../components/Nav.jsx";
import { api } from "../lib/api.js";

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/videos/").then((r) => setVideos(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="bg"></div>
      <div className="grid-lines"></div>
      <Nav />
      <main className="container">
        <h2 className="section-title">الفيديوهات</h2>
        <p className="muted">كل فيديوهات الفعالية في مكان واحد.</p>

        {loading && <p className="muted">جارٍ التحميل…</p>}
        {!loading && videos.length === 0 && <p className="muted">لا توجد فيديوهات بعد.</p>}

        <div className="vgrid">
          {videos.map((v) => (
            <div className="vcard" key={v.id}>
              <video src={v.file} poster={v.thumbnail || undefined} controls preload="metadata" />
              <h3>{v.title}</h3>
              <p>{v.description}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
