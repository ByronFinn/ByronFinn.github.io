/**
 * Cloudflare Pages "Markdown for Agents" content negotiation (_worker.js)
 * ----------------------------------------------------------------------
 * Runs in Cloudflare Pages Advanced mode (a single _worker.js in the output
 * directory serves ALL requests). For requests that include
 * "Accept: text/markdown" we return a Markdown representation of the page;
 * all other requests fall through unchanged to the static HTML assets.
 *
 * Behaviour mirrors Cloudflare's native "Markdown for Agents":
 *   - Content-Type: text/markdown; charset=utf-8
 *   - Vary: Accept so caches keep markdown/HTML as separate variants
 *   - x-markdown-tokens / x-original-tokens header estimates
 *   - HTML stays the default for browsers / non-agent clients
 */

// True when the Accept header explicitly requests markdown with a positive q
// value. We ONLY trigger on an explicit "text/markdown" (or "text/x-markdown")
// media range -- never on the generic "*/*" or "text/*" wildcards. Browsers and
// plain curl send "*/*" by default, and those must keep receiving HTML. The
// goal's contract is "requests with Accept: text/markdown return markdown";
// everything else stays HTML.
function acceptsMarkdown(accept) {
  if (!accept || typeof accept !== "string") return false;
  const ranges = accept.split(",");
  for (const raw of ranges) {
    const [type, ...paramParts] = raw.trim().split(";");
    const media = type.trim().toLowerCase();
    // Default q = 1 unless a q=... parameter overrides it.
    let q = 1;
    for (const p of paramParts) {
      const m = p.trim().toLowerCase().match(/^q\s*=\s*([0-9.]+)$/);
      if (m) q = parseFloat(m[1]);
    }
    if (q <= 0) continue;
    // Explicit markdown request only (align with Cloudflare's native support:
    // text/markdown plus the legacy text/x-markdown and application/markdown aliases).
    if (
      media === "text/markdown" ||
      media === "application/markdown" ||
      media === "text/x-markdown"
    ) {
      return true;
    }
  }
  return false;
}

// Path -> ordered list of candidate Markdown asset paths (relative, no query).
function markdownCandidates(pathname) {
  let p = pathname;
  if (p.endsWith("/")) p = p.slice(0, -1);
  if (!p) p = "/index";

  // A direct .md request is already markdown.
  if (/\.md$/i.test(p)) return [p, "/llms-full.txt"];

  // Any page-like path ("/<slug>/") lives at "<slug>/index.md", so we try that
  // first; if it doesn't exist (list/index paths, /), we fall back to the
  // site-wide Markdown index (llms-full.txt).
  const candidates = [p + "/index.md"];
  candidates.push("/llms-full.txt");
  return candidates;
}

// Cheap deterministic token estimate: CJK chars count as 1 token, each ~4
// chars of contiguous non-CJK text counts as 1 token. Good enough to give
// agents a sense of document size (spirit of x-markdown-tokens).
function estimateTokens(str) {
  if (!str) return 0;
  let tokens = 0;
  let asciiRun = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const isCJK =
      (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified
      (code >= 0x3400 && code <= 0x4dbf) || // CJK Ext A
      (code >= 0x3040 && code <= 0x30ff) || // Hiragana / Katakana
      (code >= 0xac00 && code <= 0xd7af) || // Hangul
      (code >= 0xff00 && code <= 0xffef); // Fullwidth forms
    if (isCJK) {
      if (asciiRun > 0) {
        tokens += Math.ceil(asciiRun / 4);
        asciiRun = 0;
      }
      tokens += 1;
    } else if (code > 0x20) {
      asciiRun += 1;
    } else if (asciiRun > 0) {
      tokens += Math.ceil(asciiRun / 4);
      asciiRun = 0;
    }
  }
  if (asciiRun > 0) tokens += Math.ceil(asciiRun / 4);
  return tokens;
}

// Security/cache-relevant headers to preserve on the converted response.
const KEEP_HEADERS = [
  "cache-control",
  "content-security-policy",
  "strict-transport-security",
  "x-frame-options",
  "access-control-allow-origin",
  "x-content-type-options",
  "content-signal",
  "referrer-policy",
  "set-cookie",
];

// When the origin response does not already set a Content-Signal header,
// Cloudflare's Markdown for Agents adds this default so AI systems know the
// content may be used for training, search results, and agentic input.
// Our static origin (Hugo output) never sets one, so we apply the default.
const DEFAULT_CONTENT_SIGNAL = "ai-train=yes, search=yes, ai-input=yes";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const wantsMarkdown = acceptsMarkdown(request.headers.get("accept"));

    // Default path: serve the original static assets (HTML, images, css...).
    // Always advertise Vary: Accept so caches keep the HTML variant separate
    // from the markdown variant even for browsers.
    if (!wantsMarkdown) {
      const resp = await env.ASSETS.fetch(request);
      const headers = new Headers(resp.headers);
      const existing = headers.get("vary") ? [headers.get("vary")] : [];
      if (!existing.some((v) => /accept/i.test(v))) {
        existing.push("Accept");
      }
      headers.set("vary", existing.join(", "));
      return new Response(resp.body, {
        status: resp.status,
        statusText: resp.statusText,
        headers,
      });
    }

    // Content negotiation: try each candidate markdown asset in turn.
    const candidates = markdownCandidates(url.pathname);
    for (const cand of candidates) {
      const assetResp = await env.ASSETS.fetch(new Request(new URL(cand, url), request));
      if (!assetResp.ok) continue;

      const contentType = assetResp.headers.get("content-type") || "";
      // Only treat real markdown/text bodies as negotiable (skip images, etc.).
      if (
        !contentType.startsWith("text/markdown") &&
        !contentType.startsWith("text/plain")
      ) {
        continue;
      }

      const markdown = await assetResp.text();
      const mdTokens = estimateTokens(markdown);

      // Estimate the original HTML token count for x-original-tokens.
      let htmlTokens = 0;
      const htmlResp = await env.ASSETS.fetch(new Request(url, request));
      if (htmlResp.ok) {
        htmlTokens = estimateTokens(await htmlResp.text());
      }
      if (htmlTokens === 0) htmlTokens = mdTokens;

      const headers = new Headers();
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("vary", "Accept");
      headers.set("cache-control", "public, max-age=3600");
      headers.set("x-markdown-tokens", String(mdTokens));
      headers.set("x-original-tokens", String(htmlTokens));
      for (const h of KEEP_HEADERS) {
        if (assetResp.headers.has(h)) headers.set(h, assetResp.headers.get(h));
      }
      // Default Content-Signal unless the origin already declared a policy.
      if (!headers.has("content-signal")) {
        headers.set("content-signal", DEFAULT_CONTENT_SIGNAL);
      }

      return new Response(markdown, { status: 200, headers });
    }

    // No markdown asset found: fall back to the origin (normally the HTML, so
    // agents still receive *something* rather than an empty negotiation).
    return env.ASSETS.fetch(request);
  },
};
