# ESRI SDK Live Re-Styling Demo

**Same data, your design, zero risk to the source.**

A standalone Next.js app proving that the ArcGIS Maps SDK for JavaScript can
completely transform how any existing AGOL map looks and behaves — new colors,
icons, filters — **in the browser only, read-only, never written back**.

## How it works

Each demo loads the **same source item** the original uses, then builds two
side-by-side `MapView`s with linked extents:

- **Left** — the source rendered with its AGOL-authored default (no renderer set).
- **Right** — the same source, with `FeatureLayer.renderer`, symbols,
  `PopupTemplate`, `definitionExpression`, and `FeatureFilter` overridden in
  memory.

Nothing is ever written back: no `applyEdits`, no `saveAs`, no item updates.
Verify it — the source item's last-modified date never changes and the network
tab shows no edit calls.

## Routes

| Route        | Source                                                 | Auth            |
| ------------ | ------------------------------------------------------ | --------------- |
| `/`          | Landing page explaining the concept                    | —               |
| `/rapt`      | FEMA CRCI Counties `ff17676850114091b28cb4c502e9fb4e` (layer 54), public | **None**        |
| `/biomed`    | BioMed source `1cf18f94f20b4f65b651a0d329121d89`       | Red Cross OAuth |
| `/biomed-rc` | Same source, different styling preset                  | Red Cross OAuth |

The RAPT view loads for anyone, no login. The Red Cross views gate on Esri
named-user OAuth.

## Auth notes (Red Cross views)

- OAuth via `IdentityManager` + `OAuthInfo`, portal `https://www.arcgis.com`,
  popup flow with callback `/oauth-callback.html`.
- Red Cross is SAML SSO — only the OAuth redirect flow works.
- Client id comes from `NEXT_PUBLIC_ARCGIS_OAUTH_CLIENT_ID` (see `.env.example`),
  falling back to the shared `*.jbf.com` wildcard app.
- That app's registered redirect URI is `https://*.jbf.com/oauth-callback.html`,
  so **sign-in succeeds only on a `*.jbf.com` host** — not `localhost` or
  `*.vercel.app`. Deploy to a `*.jbf.com` subdomain to demo the RC views live.
- The deployment origin must also be in the org's **Allowed Origins**
  (Organization → Settings → Security) or CORS blocks the SDK.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000  (RAPT works; RC sign-in does not on localhost)
npm run build    # production build
```

## SDK version

Uses `@arcgis/core` 5.x (current latest). The APIs used — `FeatureLayer`,
`MapView`, renderers, `OAuthInfo`, `IdentityManager`, `reactiveUtils` — are
unchanged from 4.x.

## Open item

`/biomed-rc` reuses the BioMed source pending the dedicated RC-owned item id.
Swap `source.itemId` for that route in `lib/demos.ts` when available.
