export function getEdgeConfigCredentials() {
/* `vercal env pull` creates env var EDGE_CONFIG. Extract edge config ID and token from this value
    example) EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xxx/items?token=verc_xxx */
  const edgeConfigUrl = process.env.EDGE_CONFIG;

  if (!edgeConfigUrl) {
    throw new Error("Missing EDGE_CONFIG environment variable");
  }

  const url = new URL(edgeConfigUrl);
  const edgeConfigId = url.pathname.split("/")[1]; // e.g., "ecfg_xxx"
  const token = url.searchParams.get("token");

  if (!edgeConfigId || !token) {
    throw new Error("Failed to extract Edge Config ID or token");
  }

  return { edgeConfigId, token };
}
