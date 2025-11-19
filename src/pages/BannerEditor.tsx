import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";

type BannerConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  phone_display: string;
  phone_raw: string;
  bgGradient: string[];
  images: { url: string; alt?: string }[];
};

const defaultCfg: BannerConfig = {
  enabled: true,
  title: "Возникли вопросы?",
  subtitle: "Мы поможем вам!",
  phone_display: "418 001 010",
  phone_raw: "418001010",
  bgGradient: ["#FF6A6F", "#E33B3B", "#B10E1E"],
  images: [],
};

export default function BannerEditor() {
  const [cfg, setCfg] = useState<BannerConfig>(defaultCfg);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "config", "banner-default"));
      if (snap.exists()) setCfg(snap.data() as BannerConfig);
      setLoading(false);
    })();
  }, []);

  async function save() {
    await setDoc(doc(db, "config", "banner-default"), cfg, { merge: true });
    alert("Сохранено");
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileRef = ref(storage, `banners/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    setCfg(prev => ({ ...prev, images: [...prev.images, { url }] }));
  }

  if (loading) return <p>Загрузка…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "20px auto", padding: 16 }}>
      <h2>Баннер</h2>

      <label>
        <input
          type="checkbox"
          checked={cfg.enabled}
          onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })}
        />{" "}
        Включён
      </label>

      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <input
          placeholder="Заголовок"
          value={cfg.title}
          onChange={(e) => setCfg({ ...cfg, title: e.target.value })}
        />
        <input
          placeholder="Подзаголовок"
          value={cfg.subtitle}
          onChange={(e) => setCfg({ ...cfg, subtitle: e.target.value })}
        />
        <input
          placeholder="Phone display"
          value={cfg.phone_display}
          onChange={(e) => setCfg({ ...cfg, phone_display: e.target.value })}
        />
        <input
          placeholder="Phone raw"
          value={cfg.phone_raw}
          onChange={(e) => setCfg({ ...cfg, phone_raw: e.target.value })}
        />
        <input
          placeholder='Градиент через запятую, напр. "#FF6A6F,#E33B3B,#B10E1E"'
          value={cfg.bgGradient.join(",")}
          onChange={(e) =>
            setCfg({ ...cfg, bgGradient: e.target.value.split(",").map(s => s.trim()) })
          }
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <input type="file" accept="image/*" onChange={onUpload} />
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {cfg.images.map((im, i) => (
            <img key={i} src={im.url} alt={im.alt ?? ""} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }} />
          ))}
        </div>
      </div>

      <button onClick={save} style={{ marginTop: 12 }}>Сохранить</button>
    </div>
  );
}