# ESRI SDK RAPT Restyle Case Study

**Ugly ArcGIS map → beautiful decision product.**

A standalone Next.js app proving that the ArcGIS Maps SDK for JavaScript can
load a public ArcGIS map/layer, then transform the presentation into an
audience-ready decision product **in the browser only, read-only, never written
back**.

## Accuracy note

This is **not** a real before/after of an official FEMA-authored RAPT WebMap.
The BEFORE side is Jeff's deliberately staged `SDK Restyle Test Map`, used as a
plain/default ArcGIS source view. The AFTER side uses real public FEMA RAPT
county indicator services and restyles them client-side. The point is to prove
the ArcGIS Maps SDK presentation pattern, not to claim FEMA shipped the ugly
starting map.

## How it works

The public `/rapt` route builds a rescue/redesign case study:

- **Before** — Jeff's staged ArcGIS WebMap `SDK Restyle Test Map`
  (`1b4169e0fe874b1686489111896e17a7`) loaded untouched as a `WebMap`.
- **After** — the public FEMA RAPT county indicator layer
  `All_Indicators_County_Boundaries/FeatureServer/23`, styled client-side with
  `ClassBreaksRenderer`, `definitionExpression`, app-owned details, and
  `GraphicsLayer` overlays using SVG `PictureMarkerSymbol` icons.

Nothing is ever written back: no `applyEdits`, no `saveAs`, no item updates.
The source WebMap and public FEMA layers stay exactly as authored.

## Routes

| Route        | Source                                                 | Auth            |
| ------------ | ------------------------------------------------------ | --------------- |
| `/`          | Landing page explaining the concept                    | —               |
| `/rapt`      | Staged WebMap `1b4169e0fe874b1686489111896e17a7` + FEMA RAPT county layer 23 | **None**        |
| `/sdk-lightning-talk.html` | Standalone "The Client Does the Work" SDK lightning talk with pink teddy-bear SVG `PictureMarkerSymbol` demo | **None** |
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
npm test         # read-only SDK contract check
npm run build    # production build
```

## SDK version

Uses `@arcgis/core` 5.x (current latest). The APIs used — `FeatureLayer`,
`MapView`, renderers, `OAuthInfo`, `IdentityManager`, `reactiveUtils` — are
unchanged from 4.x.

## Open item

`/biomed-rc` reuses the BioMed source pending the dedicated RC-owned item id.
Swap `source.itemId` for that route in `lib/demos.ts` when available.
