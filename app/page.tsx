import Link from "next/link";
import styles from "./page.module.css";

const points = [
  {
    h: "We load the same source",
    p: "The app opens the exact AGOL item the original uses — same feature layer, same data, same server.",
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

const demos = [
  {
    href: "/rapt",
    eyebrow: "Public · No login",
    title: "FEMA RAPT",
    body: "The FEMA Community Resilience Challenges Index — every U.S. county. A nationally known public layer, re-styled live. No credentials required.",
    cta: "Open the public demo",
    accent: "public" as const,
  },
  {
    href: "/biomed",
    eyebrow: "Red Cross · Sign-in",
    title: "Red Cross Counties",
    body: "Red Cross county geography — 3,162 counties. Sign in with a Red Cross account, then watch the same org layer take on a completely new look, read-only.",
    cta: "Open (Red Cross sign-in)",
    accent: "rc" as const,
  },
  {
    href: "/biomed-rc",
    eyebrow: "Red Cross · Sign-in",
    title: "Red Cross Chapters",
    body: "The same technique on a different layer — 226 chapter boundaries with a different palette and filter. Proof it generalizes to any layer a team uses.",
    cta: "Open (Red Cross sign-in)",
    accent: "rc" as const,
  },
];

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
          Any existing ArcGIS Online map can be completely transformed in the
          browser — new colors, new icons, new filters — without touching,
          editing, or endangering the original item. Every change below is a
          client-side render override. The source is never modified.
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
        <h2 className={styles.demosHead}>Three live demonstrations</h2>
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
