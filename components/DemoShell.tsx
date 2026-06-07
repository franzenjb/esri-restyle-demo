import Link from "next/link";
import type { DemoConfig } from "@/lib/demos";
import RestyleDemo from "./RestyleDemoClient";
import styles from "./DemoShell.module.css";

export default function DemoShell({ config }: { config: DemoConfig }) {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← Same Data, Your Design
        </Link>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{config.title}</h1>
          <p className={styles.tagline}>{config.tagline}</p>
        </div>
        <span
          className={
            config.audience === "public" ? styles.tagPublic : styles.tagRC
          }
        >
          {config.audience === "public"
            ? "Public · No login"
            : "Red Cross · Internal"}
        </span>
      </header>
      <RestyleDemo config={config} />
    </main>
  );
}
