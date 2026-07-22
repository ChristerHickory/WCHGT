import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Golfare } from "@shared/schema";
import { capitalize } from "@/lib/utils";

type OomRow = {
  golfare: Golfare;
  nettoPoang: number;
  bruttoPoang: number;
  antalTavlingar: number;
};

export default function OrderOfMerit() {
  const { data: oom, isLoading } = useQuery<OomRow[]>({
    queryKey: ["/api/order-of-merit"],
  });
  const [aktiv, setAktiv] = useState<"brutto" | "netto">("brutto");

  const sorterad = oom
    ? [...oom].sort((a, b) =>
        aktiv === "brutto" ? b.bruttoPoang - a.bruttoPoang : b.nettoPoang - a.nettoPoang,
      )
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--color-gold)" }}>
          Säsong 2026
        </div>
        <h1 className="heading-display" style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}>
          Order of Merit
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--color-cream-muted)" }}>
          Samlad ställning för WCS. Brutto visas först som standard.
        </p>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-0 rounded overflow-hidden border" style={{ borderColor: "rgba(201,162,39,0.3)", display: "inline-flex" }}>
          {(["brutto", "netto"] as const).map((typ) => (
            <button
              key={typ}
              onClick={() => setAktiv(typ)}
              data-testid={`tab-oom-${typ}`}
              className="px-5 py-2 text-sm font-semibold transition-colors"
              style={{
                background: aktiv === typ ? "var(--color-gold)" : "transparent",
                color: aktiv === typ ? "var(--color-green-dark)" : "var(--color-gold)",
              }}
            >
              {typ === "brutto" ? "Brutto" : "Netto"}
            </button>
          ))}
        </div>

        <Link href="/tavlingar">
          <span className="text-sm cursor-pointer" style={{ color: "var(--color-gold)" }}>
            Tävlingsresultat →
          </span>
        </Link>
      </div>

      <div className="card-vintage overflow-hidden">
        <table className="w-full text-sm" data-testid="table-order-of-merit-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.2)" }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
                #
              </th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
                Golfare
              </th>
              <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
                Klubb
              </th>
              <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
                Tävlingar
              </th>
              <th className="text-right px-4 py-3 font-semibold" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
                Poäng
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8" style={{ color: "var(--color-cream-muted)" }}>
                  Laddar...
                </td>
              </tr>
            ) : (
              sorterad.map((row, i) => (
                <tr key={row.golfare.id} style={{ borderBottom: "1px solid rgba(201,162,39,0.08)" }} className="transition-colors hover:bg-white/5">
                  <td className="px-4 py-3 font-bold" style={{ color: i === 0 ? "var(--color-gold)" : "var(--color-cream-muted)" }}>
                    {i === 0 ? "🏆" : i + 1}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-cream)" }}>
                    <Link href={`/golfare/${row.golfare.id}`}>
                      <span className="cursor-pointer hover:underline" style={{ color: "var(--color-cream)" }}>
                        {capitalize(row.golfare.namn)}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm hidden sm:table-cell" style={{ color: "var(--color-cream-muted)" }}>
                    {row.golfare.klubb ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ color: "var(--color-cream-muted)" }}>
                    {row.antalTavlingar}
                  </td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--color-gold)" }}>
                    {aktiv === "brutto" ? row.bruttoPoang : row.nettoPoang}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
