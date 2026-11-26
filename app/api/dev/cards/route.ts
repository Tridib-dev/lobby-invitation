import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(process.cwd(), "public", "cards");
const ID = /^[a-z0-9][a-z0-9-]{1,39}$/;
const IMG = /\.(png|webp|jpe?g|svg|gif)$/i;

async function rebuildIndex() {
  const entries = await fs.
}

const off = () => NextResponse.json({ error: "Not available" }, { status: 404 });

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return off();
  const t = new URL(req.url).searchParams.get("t");

  if (!t) {
    const entries = await fs.readdir(ROOT, { withFileTypes: true }).catch(() => []);
    return NextResponse.json({ templates: entries.filter((e) => e.isDirectory()).map((e) => e.name) });
  }
  if (!ID.test(t)) return NextResponse.json({ error: "Bad template id" }, { status: 400 });

  const dir = path.join(ROOT, t);
  const names = await fs.readdir(dir).catch(() => null);
  if (!names) return NextResponse.json({ error: `Folder public/cards/${t} not found` }, { status: 404 });

  const files = names.filter((n) => IMG.test(n)).sort((a, b) => a.localeCompare(b));
  let spec: unknown = null;
  try {
    spec = JSON.parse(await fs.readFile(path.join(dir, "spec.json"), "utf8"));
  } catch {}
  return NextResponse.json({ spec, files });
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return off();
  const t = new URL(req.url).searchParams.get("t");
  if (!t || !ID.test(t)) return NextResponse.json({ error: "Bad template id" }, { status: 400 });

  const text = await req.text();
  if (text.length > 300_000) return NextResponse.json({ error: "Too large" }, { status: 413 });

  let spec: { v?: number; id?: string; layers?: { src?: string }[] };
  try {
    spec = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (spec.v !== 1 || spec.id !== t || !Array.isArray(spec.layers)) {
    return NextResponse.json({ error: "Invalid spec" }, { status: 400 });
  }
  if (spec.layers.some((l) => typeof l.src !== "string" || !l.src.startsWith(`/cards/${t}/`))) {
    return NextResponse.json({ error: "Layer outside the template folder" }, { status: 400 });
  }

  await fs.writeFile(path.join(ROOT, t, "spec.json"), JSON.stringify(spec, null, 2), "utf8");
  return NextResponse.json({ ok: true });
}
