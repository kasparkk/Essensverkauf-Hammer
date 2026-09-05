/**
 * Erzeugt die Netlify-Serverless-Artefakte für diese Next.js-App.
 *
 * Hintergrund: Wird @netlify/plugin-nextjs von Netlifys Plugin-System selbst
 * ausgeführt, bricht der Deploy mit einem generischen "Build script returned
 * non-zero exit code: 2" ab (ohne verwertbare Fehlermeldung). Ruft man dieselben
 * Build-Hooks des Plugins direkt auf, laufen sie in genau derselben
 * Build-Umgebung fehlerfrei durch und erzeugen die erwarteten Artefakte:
 *
 *   .netlify/functions-internal/___netlify-server-handler  (SSR/API-Handler)
 *   .netlify/edge-functions/                               (Edge-Handler)
 *   .next/                                                 (statische Assets)
 *
 * Deshalb wird das Plugin per NETLIFY_NEXT_PLUGIN_SKIP deaktiviert und dieses
 * Skript nach `next build` ausgeführt. Der erzeugte Handler bringt sein Routing
 * selbst mit (`export const config = { path: '/*' }`), Netlify nimmt die
 * Verzeichnisse anschließend automatisch auf.
 */
const pluginEntry = new URL(
  "../node_modules/@netlify/plugin-nextjs/dist/index.js",
  import.meta.url
).href;

// Das Plugin prüft diese Variable beim Import - hier soll es gerade laufen.
delete process.env.NETLIFY_NEXT_PLUGIN_SKIP;

const { onBuild, onPostBuild } = await import(pluginEntry);

const failBuild = (message, options) => {
  const error = options?.error;
  throw error instanceof Error ? error : new Error(message);
};

const options = {
  constants: {
    IS_LOCAL: false,
    PACKAGE_PATH: "",
    PUBLISH_DIR: ".next",
    NETLIFY_BUILD_VERSION: process.env.NETLIFY_BUILD_VERSION || "29.50.0",
    FUNCTIONS_SRC: ".netlify/functions-internal",
    EDGE_FUNCTIONS_SRC: ".netlify/edge-functions",
  },
  utils: {
    build: { failBuild, failPlugin: failBuild, cancelBuild: failBuild },
    status: { show: () => {} },
    cache: {
      has: async () => false,
      save: async () => true,
      restore: async () => false,
      list: async () => [],
      remove: async () => true,
    },
    functions: { add: async () => {} },
    run: async () => {},
  },
  netlifyConfig: { build: { publish: ".next" }, redirects: [], headers: [], functions: {} },
  packageJson: {},
  featureFlags: {},
  pluginName: "@netlify/plugin-nextjs",
  pluginVersion: "manual",
};

// onBuild: Server- und Edge-Handler bauen, statische Inhalte nach
// .netlify/static kopieren. onPostBuild: .next gegen .netlify/static tauschen,
// damit das Publish-Verzeichnis nur die statischen Assets enthält.
await onBuild(options);
await onPostBuild(options);

console.log("Netlify-Artefakte für Next.js erzeugt.");
