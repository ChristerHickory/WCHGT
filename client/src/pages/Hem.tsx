import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Golfare, Tavling, Reportage } from "@shared/schema";
import { capitalize } from "@/lib/utils";

function HeroSection() {
  return (
    <section
      className="relative flex items-center justify-center text-center overflow-hidden"
      style={{
        minHeight: "420px",
        background: "linear-gradient(160deg, #0D1F14 0%, #1A3322 50%, #0D1F14 100%)",
        borderBottom: "1px solid rgba(201,162,39,0.3)",
      }}
    >
      {/* Dekorativa cirklar */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "400px", height: "400px", borderRadius: "50%", border: "1px solid rgba(201,162,39,0.08)" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "300px", height: "300px", borderRadius: "50%", border: "1px solid rgba(201,162,39,0.06)" }} />
      </div>

      <div className="relative z-10 px-6 py-16 max-w-2xl mx-auto">
        {/* Logotyp stor */}
        <svg width="64" height="64" viewBox="0 0 36 36" fill="none" className="mx-auto mb-6" aria-label="WCHGT">
          <circle cx="18" cy="18" r="17" stroke="#C9A227" strokeWidth="1.5"/>
          <circle cx="18" cy="18" r="12" fill="#224433"/>
          <path d="M10 18 Q14 12 18 18 Q22 24 26 18" stroke="#C9A227" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          <circle cx="18" cy="18" r="2" fill="#C9A227"/>
          <path d="M26 22 L28 28 L30 22" stroke="#C9A227" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
          Hickorygolf i Västsverige
        </div>
        <h1 className="heading-display mb-4" style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", lineHeight: 1.2 }}>
          West Coast Hickory Golf Tour
        </h1>
        <p className="mb-8 text-base" style={{ color: "var(--color-cream-muted)", maxWidth: "500px", margin: "0 auto 2rem" }}>
          Vi träffas för att ha trevligt – och spela golf med historiska hickory-klubbor från en svunnen era.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/tavlingar">
            <button className="px-6 py-2.5 rounded font-semibold text-sm transition-all" style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}
              data-testid="button-tavlingar">
              Tävlingsprogram 2026
            </button>
          </Link>
          <Link href="/app">
            <button className="px-6 py-2.5 rounded font-semibold text-sm transition-all" style={{ border: "1px solid var(--color-gold)", color: "var(--color-gold)", background: "transparent" }}
              data-testid="button-app">
              Golf-appen
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function OrderOfMeritSection() {
  const { data: oom, isLoading } = useQuery<{ golfare: Golfare; nettoPoang: number; bruttoPoang: number; antalTavlingar: number }[]>({
    queryKey: ["/api/order-of-merit"],
  });
  const [aktiv, setAktiv] = useState<"netto" | "brutto">("netto");

  const sorterad = oom ? [...oom].sort((a, b) =>
    aktiv === "netto" ? b.nettoPoang - a.nettoPoang : b.bruttoPoang - a.bruttoPoang
  ) : [];

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="heading-display text-xl">Order of Merit 2026</h2>
        <Link href="/app">
          <span className="text-sm cursor-pointer" style={{ color: "var(--color-gold)" }}>Alla resultat →</span>
        </Link>
      </div>

      {/* Brutto/Netto-flikar */}
      <div className="flex gap-0 mb-4 rounded overflow-hidden border" style={{ borderColor: "rgba(201,162,39,0.3)", display: "inline-flex" }}>
        {(["netto", "brutto"] as const).map(typ => (
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
            {typ === "netto" ? "Netto" : "Brutto"}
          </button>
        ))}
      </div>

      <div className="card-vintage overflow-hidden">
        <table className="w-full text-sm" data-testid="table-order-of-merit">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.2)" }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>#</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Golfare</th>
              <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Klubb</th>
              <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Tävlingar</th>
              <th className="text-right px-4 py-3 font-semibold" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Poäng</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8" style={{ color: "var(--color-cream-muted)" }}>Laddar...</td></tr>
            ) : sorterad.map((row, i) => (
              <tr key={row.golfare.id} style={{ borderBottom: "1px solid rgba(201,162,39,0.08)" }} className="transition-colors hover:bg-white/5">
                <td className="px-4 py-3 font-bold" style={{ color: i === 0 ? "var(--color-gold)" : "var(--color-cream-muted)" }}>
                  {i === 0 ? "🏆" : i + 1}
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: "var(--color-cream)" }}>
                  <Link href={`/golfare/${row.golfare.id}`}>
                    <span className="cursor-pointer hover:underline" style={{ color: "var(--color-cream)" }}>{capitalize(row.golfare.namn)}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm hidden sm:table-cell" style={{ color: "var(--color-cream-muted)" }}>{row.golfare.klubb ?? "–"}</td>
                <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ color: "var(--color-cream-muted)" }}>{row.antalTavlingar}</td>
                <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--color-gold)" }}>
                  {aktiv === "netto" ? row.nettoPoang : row.bruttoPoang}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SenasteNyheter() {
  const { data: rapporter, isLoading } = useQuery<Reportage[]>({ queryKey: ["/api/reportage"] });
  const senaste = rapporter?.slice(0, 2);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-display text-xl">Senaste Reportage</h2>
        <Link href="/reportage">
          <span className="text-sm cursor-pointer" style={{ color: "var(--color-gold)" }}>Alla reportage →</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          [0, 1].map(i => <div key={i} className="card-vintage p-6 h-40 animate-pulse" />)
        ) : senaste?.map(r => (
          <Link key={r.id} href={`/reportage/${r.id}`}>
            <div className="card-vintage p-6 cursor-pointer h-full">
              <div className="text-xs mb-2 tracking-widest uppercase" style={{ color: "var(--color-gold)" }}>{r.datum}</div>
              <h3 className="heading-display text-base mb-2">{r.rubrik}</h3>
              <p className="text-sm line-clamp-3" style={{ color: "var(--color-cream-muted)" }}>{r.ingress}</p>
              <div className="mt-4 text-xs font-semibold" style={{ color: "var(--color-gold)" }}>Läs mer →</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function KommandeTavlingar() {
  const { data: tavlingar, isLoading } = useQuery<Tavling[]>({ queryKey: ["/api/tavlingar"] });
  const kommande = tavlingar?.filter(t => !t.avslutad).slice(0, 3);

  return (
    <section style={{ background: "var(--color-green-mid)", borderTop: "1px solid rgba(201,162,39,0.15)", borderBottom: "1px solid rgba(201,162,39,0.15)" }} className="py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-display text-xl">Kommande Tävlingar</h2>
          <Link href="/tavlingar">
            <span className="text-sm cursor-pointer" style={{ color: "var(--color-gold)" }}>Hela programmet →</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoading ? (
            [0, 1, 2].map(i => <div key={i} className="card-vintage p-5 h-28 animate-pulse" />)
          ) : kommande?.map(t => (
            <div key={t.id} className="card-vintage p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="text-xs tracking-widest uppercase" style={{ color: "var(--color-gold)" }}>{t.datum}</div>
                {t.arOrderOfMerit && <span className="badge-gold">OoM</span>}
              </div>
              <div className="font-semibold text-sm" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>{t.namn}</div>
              {t.beskrivning && <p className="text-xs mt-1" style={{ color: "var(--color-cream-muted)" }}>{t.beskrivning}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Hem() {
  return (
    <div>
      <HeroSection />
      <OrderOfMeritSection />
      <KommandeTavlingar />
      <SenasteNyheter />

      {/* Om WCS */}
      <section className="max-w-3xl mx-auto px-4 py-12 text-center">
        <hr className="gold-divider" />
        <h2 className="heading-display text-xl mt-8 mb-4">Om West Coast Hickory Golf Tour</h2>
        <p className="text-base mb-4" style={{ color: "var(--color-cream-muted)" }}>
          West Coast Hickory Golf Tour är ett samarbete mellan hickorysällskap och klubbar i västra Sverige med mål att skapa välbesökta tävlingar och främja golfens ursprungliga värderingar.
        </p>
        <p className="text-base" style={{ color: "var(--color-cream-muted)" }}>
          Vi spelar med historiska klubbor tillverkade före 1935, enligt regler fastställda av Sveriges Golfhistoriska Sällskap (SGS). Vi träffas för att ha trevligt – i samma anda som när golfen spelades för första gången.
        </p>
        <div className="mt-8">
          <Link href="/om-oss">
            <button className="px-6 py-2.5 rounded font-semibold text-sm" style={{ border: "1px solid var(--color-gold)", color: "var(--color-gold)", background: "transparent" }}>
              Läs mer om oss
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
