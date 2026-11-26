import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import CardLab from "@/features/card/CardLab";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { t } = await searchParams;

  if (t) return <CardLab id={t} />;

  const entries = await fs
    .readdir(path.join(process.cwd(), "public", "cards"), { withFileTypes: true })
    .catch(() => []);
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  return (
    <main className="min-h-screen bg-neutral-900 p-6 text-white">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Card lab</h1>
        <p className="text-sm text-white/60">
          Put your PNG files in <code>public/cards/&lt;template-id&gt;/</code> (name the background file starting with
          &quot;bg&quot;), then pick the folder.
        </p>
        {folders.length === 0 && <p className="text-amber-300">No folders in public/cards yet.</p>}
        {folders.map((f) => (
          <Link key={f} href={`/dev/card-lab?t=${f}`} className="block rounded-lg bg-white/10 p-3">
            {f}
          </Link>
        ))}
      </div>
    </main>
  );
}
