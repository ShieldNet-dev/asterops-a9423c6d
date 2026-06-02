// Vercel Node serverless entry. Bridges Node req/res <-> Web Fetch API
// and delegates to the TanStack Start SSR handler built by Vite.
import { createRequire } from "node:module";
import { Readable } from "node:stream";

const require = createRequire(import.meta.url);
// Vite emits the SSR bundle here when building with @tanstack/react-start.
// Path is relative to the deployed function (api/index.mjs).
const serverEntryPath = "../dist/server/server.js";

let handlerPromise;
async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = import(serverEntryPath).then((mod) => mod.default ?? mod);
  }
  return handlerPromise;
}

function toWebRequest(req) {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  const url = `${proto}://${host}${req.url}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
    else if (v != null) headers.set(k, String(v));
  }
  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = Readable.toWeb(req);
    init.duplex = "half";
  }
  return new Request(url, init);
}

async function sendWebResponse(webRes, res) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => res.setHeader(key, value));
  if (!webRes.body) return res.end();
  const reader = webRes.body.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}

export default async function handler(req, res) {
  try {
    const entry = await getHandler();
    const webReq = toWebRequest(req);
    const webRes = await entry.fetch(webReq, process.env, {});
    await sendWebResponse(webRes, res);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end("<h1>This page didn't load</h1><p>Something went wrong on our end.</p>");
  }
}