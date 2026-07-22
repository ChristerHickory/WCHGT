import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Tavling, Tavlingsresultat, Golfare } from "@shared/schema";

const månader = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];

function formatDatum(datum: string) {
  const [, mm, dd] = datum.split("-");
  return { dag: dd, mån: månader[parseInt(mm) - 1] };
}

export default function Tavlingar() {
  const { data: tavlingar, isLoading } = useQuery<Tavling[]>({ queryKey: ["/api/tavlingar"] });
  const [valdTavling, setValdTavling] = useState<Tavling | null>(null);

  const kommande = tavlingar?.filter(t => !t.avslutad).sort((a, b) => a.datum.localeCompare(b.datum)) ?? [];
  const avslutade = tavlingar?.filter(t => t.avslutad).sort((a, b) => b.datum.localeCompare(a.datum)) ?? [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center" style={{ color: "var(--color-cream-muted)" }}>
        Laddar...
      </div>
    );
  }

  // Detaljvy för vald tävling
  if (valdTavling) {
    return (
      <TavlingDetalj tavling={valdTavling} onBack={() => setValdTavling(null)} />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--color-gold)" }}>Säsong 2026</div>
        <h1 className="heading-display" style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}>Tävlingsprogram</h1>
        <p className="text-sm mt-2" style={{ color: "var(--color-cream-muted)" }}>Klicka på en genomförd tävling för att se resultat</p>
      </div>

      <div className="card-vintage p-2 mb-6 text-xs flex flex-wrap gap-4 px-4 py-3" style={{ borderColor: "rgba(201,162,39,0.3)" }}>
        <span className="badge-gold">OoM</span>
        <span style={{ color: "var(--color-cream-muted)" }}>= Räknas i Order of Merit</span>
        <span className="ml-4 px-2 py-0.5 rounded text-xs font-semibold" style={{ background: "rgba(201,162,39,0.15)", color: "var(--color-cream-muted)" }}>Ej WCS</span>
        <span style={{ color: "var(--color-cream-muted)" }}>= Räknas ej i WCS</span>
      </div>

      {/* Genomförda — klickbara */}
      {avslutade.length > 0 && (
        <>
          <h2 className="heading-display text-lg mb-4">Genomförda tävlingar</h2>
          <div className="flex flex-col gap-3 mb-10">
            {avslutade.map(t => (
              <button
                key={t.id}
                data-testid={`button-tavling-${t.id}`}
                className="w-full text-left card-vintage p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setValdTavling(t)}
              >
                <DatumBadge datum={t.datum} />
                <div className="w-px self-stretch" style={{ background: "rgba(201,162,39,0.2)" }} />
                <div className="flex-1">
                  <div className="font-semibold text-sm" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>{t.namn}</div>
                  {t.beskrivning && <div className="text-xs mt-0.5" style={{ color: "var(--color-cream-muted)" }}>{t.beskrivning}</div>}
                </div>
                <div className="flex gap-2 items-center">
                  {t.arOrderOfMerit && <span className="badge-gold">OoM</span>}
                  <span className="text-xs font-semibold px-3 py-1 rounded" style={{ background: "rgba(201,162,39,0.15)", color: "var(--color-gold)" }}>
                    Visa resultat →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <hr className="gold-divider" />

      {/* Kommande */}
      <h2 className="heading-display text-lg mb-4 mt-6">Kommande tävlingar</h2>
      <div className="flex flex-col gap-3 mb-10">
        {kommande.length === 0 ? (
          <p style={{ color: "var(--color-cream-muted)" }}>Inga kommande tävlingar inlagda.</p>
        ) : kommande.map(t => (
          <div key={t.id} className="card-vintage p-4 flex items-center gap-4">
            <DatumBadge datum={t.datum} />
            <div className="w-px self-stretch" style={{ background: "rgba(201,162,39,0.2)" }} />
            <div className="flex-1">
              <div className="font-semibold text-sm" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>{t.namn}</div>
              {t.beskrivning && <div className="text-xs mt-0.5" style={{ color: "var(--color-cream-muted)" }}>{t.beskrivning}</div>}
            </div>
            <div className="flex gap-2 items-center">
              {t.arOrderOfMerit && <span className="badge-gold">OoM</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-5 rounded-lg text-center" style={{ background: "var(--color-green-mid)", border: "1px solid rgba(201,162,39,0.2)" }}>
        <div className="heading-display text-base mb-2">Vill din klubb vara med?</div>
        <p className="text-sm" style={{ color: "var(--color-cream-muted)" }}>Kontakta tourledaren Klas Johansson för att anordna en tävling.</p>
        <a href="/#/kontakt" className="inline-block mt-3 text-sm font-semibold" style={{ color: "var(--color-gold)" }}>Kontakta oss →</a>
      </div>
    </div>
  );
}

function DatumBadge({ datum }: { datum: string }) {
  const { dag, mån } = formatDatum(datum);
  return (
    <div className="text-center min-w-[52px]">
      <div className="text-lg font-bold font-mono" style={{ color: "var(--color-gold)" }}>{dag}</div>
      <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>{mån}</div>
    </div>
  );
}

function TavlingDetalj({ tavling, onBack }: { tavling: Tavling; onBack: () => void }) {
  const [visaTyp, setVisaTyp] = useState<"brutto" | "netto">("brutto");

  const { data: alleGolfare } = useQuery<Golfare[]>({ queryKey: ["/api/golfare/alla"] });
  const { data: resultat, isLoading } = useQuery<Tavlingsresultat[]>({
    queryKey: ["/api/tavlingar", tavling.id, "resultat"],
  });

  const golfareMap = new Map((alleGolfare ?? []).map(g => [g.id, g]));

  const nettorankad = resultat
    ? [...resultat]
        .filter(r => r.placering != null && r.nettoscore != null)
        .sort((a, b) => (a.placering ?? 999) - (b.placering ?? 999))
    : [];

  const bruttorankad = resultat
    ? [...resultat]
        .filter(r => r.bruttoPlacering != null && r.bruttoscore != null)
        .sort((a, b) => (a.bruttoPlacering ?? 999) - (b.bruttoPlacering ?? 999))
    : [];

  const visaLista = visaTyp === "brutto" ? bruttorankad : nettorankad;
  const harBrutto = bruttorankad.length > 0;
  const { dag, mån } = formatDatum(tavling.datum);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Tillbaka-knapp */}
      <button
        onClick={onBack}
        data-testid="button-back-tavlingar"
        className="flex items-center gap-2 text-sm mb-8 hover:opacity-70 transition-opacity"
        style={{ color: "var(--color-gold)" }}
      >
        ← Tillbaka till tävlingar
      </button>

      {/* Tävlingshuvud */}
      <div className="card-vintage p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="text-center min-w-[64px]">
            <div className="text-3xl font-bold font-mono" style={{ color: "var(--color-gold)" }}>{dag}</div>
            <div className="text-sm uppercase tracking-widest" style={{ color: "var(--color-cream-muted)" }}>{mån}</div>
            <div className="text-xs mt-1" style={{ color: "var(--color-cream-muted)" }}>2026</div>
          </div>
          <div className="w-px self-stretch" style={{ background: "rgba(201,162,39,0.3)" }} />
          <div className="flex-1">
            <h1 className="heading-display" style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)" }}>{tavling.namn}</h1>
            {tavling.beskrivning && (
              <p className="text-sm mt-2" style={{ color: "var(--color-cream-muted)" }}>{tavling.beskrivning}</p>
            )}
            <div className="flex gap-2 mt-3 flex-wrap">
              {tavling.arOrderOfMerit && <span className="badge-gold">OoM</span>}
              <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: "rgba(255,255,255,0.08)", color: "var(--color-cream-muted)" }}>
                {visaLista.length > 0 ? `${resultat?.length ?? 0} startande` : "Genomförd"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Brutto / Netto-flikar */}
      {harBrutto && (
        <div className="flex mb-4 rounded overflow-hidden border w-fit" style={{ borderColor: "rgba(201,162,39,0.4)" }}>
          {(["brutto", "netto"] as const).map(typ => (
            <button
              key={typ}
              onClick={() => setVisaTyp(typ)}
              data-testid={`tab-${typ}`}
              className="px-6 py-2 text-sm font-semibold transition-colors"
              style={{
                background: visaTyp === typ ? "var(--color-gold)" : "transparent",
                color: visaTyp === typ ? "var(--color-green-dark)" : "var(--color-gold)",
              }}
            >
              {typ === "brutto" ? "Brutto" : "Netto"}
            </button>
          ))}
        </div>
      )}

      {/* Resultattabell */}
      {isLoading ? (
        <div className="card-vintage p-10 text-center" style={{ color: "var(--color-cream-muted)" }}>Laddar resultat...</div>
      ) : visaLista.length === 0 ? (
        <div className="card-vintage p-10 text-center" style={{ color: "var(--color-cream-muted)" }}>Inga resultat registrerade.</div>
      ) : (
        <div className="card-vintage overflow-hidden">
          <table className="w-full text-sm" data-testid="table-resultat">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.2)", background: "rgba(0,0,0,0.2)" }}>
                <th className="text-left px-4 py-3 font-semibold text-xs w-14" style={{ color: "var(--color-gold)" }}>Plac.</th>
                <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "var(--color-gold)" }}>Golfare</th>
                <th className="text-right px-4 py-3 font-semibold text-xs hidden sm:table-cell" style={{ color: "var(--color-gold)" }}>H-HCP</th>
                {visaTyp === "netto" && (
                  <th className="text-right px-4 py-3 font-semibold text-xs hidden sm:table-cell" style={{ color: "var(--color-gold)" }}>Brutto</th>
                )}
                <th className="text-right px-4 py-3 font-semibold text-xs" style={{ color: "var(--color-gold)" }}>
                  {visaTyp === "netto" ? "Netto" : "Brutto"}
                </th>
                <th className="text-right px-4 py-3 font-semibold text-xs hidden md:table-cell" style={{ color: "var(--color-gold)" }}>OoM-p</th>
              </tr>
            </thead>
            <tbody>
              {visaLista.map((r, i) => {
                const g = golfareMap.get(r.golfareId);
                const plac = visaTyp === "brutto" ? r.bruttoPlacering : r.placering;
                const prevPlac = i > 0 ? (visaTyp === "brutto" ? visaLista[i-1].bruttoPlacering : visaLista[i-1].placering) : null;
                const visaPlacText = plac === prevPlac ? "" : `${plac}.`;
                const oomPoang = visaTyp === "brutto" ? r.bruttoOmPoang : r.orderOfMeritPoang;
                const top3 = i < 3 && (i === 0 || plac !== prevPlac);
                const medalj = plac === 1 ? "🥇" : plac === 2 ? "🥈" : plac === 3 ? "🥉" : null;

                return (
                  <tr
                    key={r.id}
                    data-testid={`row-resultat-${r.id}`}
                    style={{
                      borderBottom: "1px solid rgba(201,162,39,0.06)",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                    }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-sm w-14" style={{ color: top3 ? "var(--color-gold)" : "var(--color-cream-muted)" }}>
                      {medalj ?? visaPlacText}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--color-cream)" }}>
                      {g?.namn ?? `Golfare #${r.golfareId}`}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs hidden sm:table-cell" style={{ color: "var(--color-cream-muted)" }}>
                      {r.hickoryHandicapVid != null ? Number(r.hickoryHandicapVid).toFixed(0) : "–"}
                    </td>
                    {visaTyp === "netto" && (
                      <td className="px-4 py-3 text-right font-mono text-sm hidden sm:table-cell" style={{ color: "var(--color-cream-muted)" }}>
                        {r.bruttoscore ?? "–"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right font-bold font-mono text-sm" style={{ color: top3 ? "var(--color-gold)" : "var(--color-cream)" }}>
                      {visaTyp === "brutto" ? r.bruttoscore : r.nettoscore}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs hidden md:table-cell" style={{ color: "var(--color-cream-muted)" }}>
                      {oomPoang ?? "–"}p
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs flex justify-between" style={{ color: "var(--color-cream-muted)", borderTop: "1px solid rgba(201,162,39,0.1)" }}>
            <span>{resultat?.length ?? 0} startande</span>
            {visaTyp === "netto" && <span>Netto = Bruttoscore − Hickory-handicap</span>}
          </div>
        </div>
      )}
    </div>
  );
}
