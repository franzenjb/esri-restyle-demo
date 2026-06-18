import Link from "next/link";
import { DEMOS } from "@/lib/demos";
import styles from "./page.module.css";

const points = [
  {
    h: "We load the same source",
    p: "The app opens the same feature layer or staged source view, then changes only the browser-side presentation.",
  },
  {
    h: "We re-style it in memory",
    p: "Renderer, symbols, popups, filters and definition queries are overridden in the browser only.",
  },
  {
    h: "Nothing is written back",
    p: "No edits, no save-as, no item updates. Read-only access. The owner's map stays exactly as authored.",
  },
  {
    h: "Security is preserved",
    p: "Org-private content still requires a named-user OAuth login through Esri's own IdentityManager.",
  },
];

// Cards are generated from the demo registry, so adding a config in lib/demos.ts
// automatically adds a card here and a working route under /demo/<key>.
const demos = Object.values(DEMOS).map((d) => ({
  href: d.audience === "public" ? `/${d.key}` : `/demo/${d.key}`,
  eyebrow: d.audience === "public" ? "Public · No login" : "Red Cross · Sign-in",
  title: d.title,
  body: d.tagline,
  cta: d.audience === "public" ? "Open the public demo" : "Open (Red Cross sign-in)",
  accent: (d.audience === "public" ? "public" : "rc") as "public" | "rc",
}));

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>ArcGIS Maps SDK for JavaScript</p>
        <h1 className={styles.title}>
          Same data, <em>your</em> design,
          <br />
          zero risk to the source.
        </h1>
        <p className={styles.lede}>
          ArcGIS Online content can be transformed in the browser — new colors,
          new icons, new filters — without touching, editing, or endangering
          the original item. The public RAPT demo uses a staged before-view plus
          real public FEMA indicator layers to show the technique. Every change
          below is a client-side render override.
        </p>
      </section>

      <section className={styles.points}>
        {points.map((pt, i) => (
          <div key={pt.h} className={styles.point}>
            <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
            <h3>{pt.h}</h3>
            <p>{pt.p}</p>
          </div>
        ))}
      </section>

      <section className={styles.demosWrap}>
        <h2 className={styles.demosHead}>Live demonstrations</h2>
        <div className={styles.demos}>
          {demos.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className={`${styles.card} ${
                d.accent === "public" ? styles.cardPublic : styles.cardRC
              }`}
            >
              <span className={styles.eyebrow}>{d.eyebrow}</span>
              <h3 className={styles.cardTitle}>{d.title}</h3>
              <p className={styles.cardBody}>{d.body}</p>
              <span className={styles.cardCta}>{d.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          Read-only demonstration. No <span className="font-mono">applyEdits</span>,
          no <span className="font-mono">saveAs</span>, no item updates — ever.
          Verify it yourself: the source item&rsquo;s last-modified date does not
          change, and the network tab shows no edit calls.
        </p>
      </footer>
    </main>
  );
}
