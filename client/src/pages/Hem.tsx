import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Golfare, Tavling, Reportage, Tavlingsresultat } from "@shared/schema";
import { capitalize } from "@/lib/utils";

type OomRow = {
  golfare: Golfare;
  nettoPoang: number;
  bruttoPoang: number;
  antalTavlingar: number;
};

type Klattrare = {
  namn: string;
  from: number;
  to: number;
  delta: number;
};

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

function KpiNarrativ() {
  const { data: oom } = useQuery<OomRow[]>({ queryKey: ["/api/order-of-merit"] });
  const { data: tavlingar } = useQuery<Tavling[]>({ queryKey: ["/api/tavlingar"] });

  const avslutadeWcs = useMemo(
    () => (tavlingar ?? []).filter((t) => t.arOrderOfMerit && t.avslutad).sort((a, b) => a.datum.localeCompare(b.datum)),
    [tavlingar],
  );

  const senasteTavling = avslutadeWcs.length > 0 ? avslutadeWcs[avslutadeWcs.length - 1] : null;

  const { data: senasteResultat } = useQuery<Tavlingsresultat[]>({
    queryKey: ["/api/tavlingar", senasteTavling?.id, "resultat"],
    enabled: Boolean(senasteTavling?.id),
  });

  const top3Brutto = useMemo(
    () => [...(oom ?? [])].sort((a, b) => b.bruttoPoang - a.bruttoPoang).slice(0, 3),
    [oom],
  );

  const top3Netto = useMemo(
    () => [...(oom ?? [])].sort((a, b) => b.nettoPoang - a.nettoPoang).slice(0, 3),
    [oom],
  );

  const nettoVinnare = useMemo(() => {
    if (!senasteResultat) return null;
    return [...senasteResultat]
      .filter((r) => r.placering != null && r.nettoscore != null)
      .sort((a, b) => (a.placering ?? 999) - (b.placering ?? 999))[0] ?? null;
  }, [senasteResultat]);

  const bruttoVinnare = useMemo(() => {
    if (!senasteResultat) return null;
    return [...senasteResultat]
      .filter((r) => r.bruttoPlacering != null && r.bruttoscore != null)
      .sort((a, b) => (a.bruttoPlacering ?? 999) - (b.bruttoPlacering ?? 999))[0] ?? null;
  }, [senasteResultat]);

  const rankChanges = useMemo(() => {
    if (!oom || !senasteResultat || senasteResultat.length === 0) {
      return {
        brutto: [] as Klattrare[],
        netto: [] as Klattrare[],
      };
    }

    const buildClimbers = (typ: "brutto" | "netto"): Klattrare[] => {
      const deltaMap = new Map<number, number>();
      for (const r of senasteResultat) {
        deltaMap.set(
          r.golfareId,
          typ === "brutto" ? (r.bruttoOmPoang ?? 0) : (r.orderOfMeritPoang ?? 0),
        );
      }

      const nowRows = oom.map((row) => ({
        id: row.golfare.id,
        namn: capitalize(row.golfare.namn),
        poang: typ === "brutto" ? row.bruttoPoang : row.nettoPoang,
      }));

      const prevRows = nowRows.map((row) => ({
        ...row,
        poang: row.poang - (deltaMap.get(row.id) ?? 0),
      }));

      const nowRank = new Map<number, number>();
      [...nowRows]
        .sort((a, b) => b.poang - a.poang)
        .forEach((row, idx) => nowRank.set(row.id, idx + 1));

      const prevRank = new Map<number, number>();
      [...prevRows]
        .sort((a, b) => b.poang - a.poang)
        .forEach((row, idx) => prevRank.set(row.id, idx + 1));

      return nowRows
        .map((row) => {
          const to = nowRank.get(row.id) ?? 999;
          const from = prevRank.get(row.id) ?? 999;
          return {
            namn: row.namn,
            from,
            to,
            delta: from - to,
          };
        })
        .filter((row) => row.delta > 0)
        .sort((a, b) => b.delta - a.delta || a.to - b.to)
        .slice(0, 3);
    };

    return {
      brutto: buildClimbers("brutto"),
      netto: buildClimbers("netto"),
    };
  }, [oom, senasteResultat]);

  const golfareNamn = useMemo(() => {
    const map = new Map<number, string>();
    for (const row of oom ?? []) {
      map.set(row.golfare.id, capitalize(row.golfare.namn));
    }
    return map;
  }, [oom]);

  const totaltWcs = (tavlingar ?? []).filter((t) => t.arOrderOfMerit).length;
  const speladeWcs = avslutadeWcs.length;

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="card-vintage p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="heading-display text-xl">Säsongen i siffror</h2>
          <Link href="/order-of-merit">
            <span className="text-sm cursor-pointer" style={{ color: "var(--color-gold)" }}>
              Se hela Order of Merit →
            </span>
          </Link>
        </div>

        <div className="space-y-3 text-sm md:text-base" style={{ color: "var(--color-cream-muted)" }}>
          <p>
            Hittills har vi spelat <strong style={{ color: "var(--color-cream)" }}>{speladeWcs}</strong> av totalt <strong style={{ color: "var(--color-cream)" }}>{totaltWcs}</strong> planerade WCS-tävlingar.
          </p>

          <p>
            {senasteTavling && bruttoVinnare && nettoVinnare ? (
              <>
                Senast på <strong style={{ color: "var(--color-cream)" }}>{senasteTavling.namn}</strong> vann <strong style={{ color: "var(--color-cream)" }}>{golfareNamn.get(bruttoVinnare.golfareId) ?? `Golfare ${bruttoVinnare.golfareId}`}</strong> brutto, och nettosegern gick till <strong style={{ color: "var(--color-cream)" }}>{golfareNamn.get(nettoVinnare.golfareId) ?? `Golfare ${nettoVinnare.golfareId}`}</strong>.
              </>
            ) : (
              <>När nästa tävling är färdigspelad visar vi här senaste brutto- och nettovinnare.</>
            )}
          </p>

          <p>
            {top3Brutto.length >= 3 ? (
              <>
                Topp 3 i OoM brutto är just nu <strong style={{ color: "var(--color-cream)" }}>{capitalize(top3Brutto[0].golfare.namn)}</strong>, <strong style={{ color: "var(--color-cream)" }}>{capitalize(top3Brutto[1].golfare.namn)}</strong> och <strong style={{ color: "var(--color-cream)" }}>{capitalize(top3Brutto[2].golfare.namn)}</strong>.
              </>
            ) : (
              <>OoM brutto uppdateras löpande när fler resultat kommer in.</>
            )}
          </p>

          <p>
            {top3Netto.length >= 3 ? (
              <>
                Topp 3 i OoM netto är just nu <strong style={{ color: "var(--color-cream)" }}>{capitalize(top3Netto[0].golfare.namn)}</strong>, <strong style={{ color: "var(--color-cream)" }}>{capitalize(top3Netto[1].golfare.namn)}</strong> och <strong style={{ color: "var(--color-cream)" }}>{capitalize(top3Netto[2].golfare.namn)}</strong>.
              </>
            ) : (
              <>OoM netto uppdateras löpande när fler resultat kommer in.</>
            )}
          </p>

          <p>
            {rankChanges.brutto.length > 0 ? (
              <>
                Största klättringarna i brutto sedan senaste tävlingen: {rankChanges.brutto.map((row) => `${row.namn} (från plats ${row.from} till ${row.to})`).join(", ")}.
              </>
            ) : (
              <>Efter senaste tävlingen skedde inga större klättringar i brutto-tabellen.</>
            )}
          </p>

          <p>
            {rankChanges.netto.length > 0 ? (
              <>
                Största klättringarna i netto sedan senaste tävlingen: {rankChanges.netto.map((row) => `${row.namn} (från plats ${row.from} till ${row.to})`).join(", ")}.
              </>
            ) : (
              <>Efter senaste tävlingen skedde inga större klättringar i netto-tabellen.</>
            )}
          </p>
        </div>
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
      <KpiNarrativ />
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
