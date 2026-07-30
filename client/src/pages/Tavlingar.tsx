import { Fragment, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, ScatterChart, Scatter, CartesianGrid, XAxis, YAxis, Tooltip, ComposedChart, Area, Line } from "recharts";
import type { Tavling, Tavlingsresultat, Golfare } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const månader = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];

function formatDatum(datum: string) {
  const [, mm, dd] = datum.split("-");
  return { dag: dd, mån: månader[parseInt(mm) - 1] };
}

type TrendPoint = { hhcp: number; trend: number; lower: number; upper: number; band: number };
const INTERVAL_MULTIPLIER = 1.96;

function buildTrendBand(points: Array<{ hhcp: number; score: number }>, multiplier: number): { trendData: TrendPoint[]; sigma: number; k: number; m: number } | null {
  if (points.length < 2) return null;

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.hhcp, 0);
  const sumY = points.reduce((s, p) => s + p.score, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  const covXY = points.reduce((s, p) => s + (p.hhcp - meanX) * (p.score - meanY), 0);
  const varX = points.reduce((s, p) => s + (p.hhcp - meanX) * (p.hhcp - meanX), 0);

  const slope = varX === 0 ? 0 : covXY / varX;
  const intercept = meanY - slope * meanX;

  const residualSumSq = points.reduce((s, p) => {
    const yHat = slope * p.hhcp + intercept;
    const residual = p.score - yHat;
    return s + residual * residual;
  }, 0);

  const dof = Math.max(1, n - 2);
  const sigma = Math.sqrt(residualSumSq / dof);

  const xMin = Math.min(...points.map((p) => p.hhcp));
  const xMax = Math.max(...points.map((p) => p.hhcp));
  const steps = xMax === xMin ? 1 : 24;

  const trendData: TrendPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = steps === 1 ? 0 : i / steps;
    const x = xMin + (xMax - xMin) * ratio;
    const trend = slope * x + intercept;
    const lower = trend - sigma * multiplier;
    const upper = trend + sigma * multiplier;
    trendData.push({ hhcp: x, trend, lower, upper, band: upper - lower });
  }

  return { trendData, sigma, k: slope, m: intercept };
}

export default function Tavlingar() {
  const { data: tavlingar, isLoading } = useQuery<Tavling[]>({ queryKey: ["/api/tavlingar"] });
  const [valdTavling, setValdTavling] = useState<Tavling | null>(null);
  const [aktivSektion, setAktivSektion] = useState<"kommande" | "genomförda">("kommande");

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

      {/* Tabbar för att välja sektion */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setAktivSektion("kommande")}
          className="px-4 py-2 rounded font-semibold text-sm transition-all"
          style={{
            background: aktivSektion === "kommande" ? "rgba(201,162,39,0.3)" : "rgba(201,162,39,0.1)",
            color: aktivSektion === "kommande" ? "var(--color-gold)" : "var(--color-cream-muted)",
            border: `1px solid rgba(201,162,39,${aktivSektion === "kommande" ? 0.5 : 0.2})`,
          }}
        >
          Kommande
        </button>
        <button
          onClick={() => setAktivSektion("genomförda")}
          className="px-4 py-2 rounded font-semibold text-sm transition-all"
          style={{
            background: aktivSektion === "genomförda" ? "rgba(201,162,39,0.3)" : "rgba(201,162,39,0.1)",
            color: aktivSektion === "genomförda" ? "var(--color-gold)" : "var(--color-cream-muted)",
            border: `1px solid rgba(201,162,39,${aktivSektion === "genomförda" ? 0.5 : 0.2})`,
          }}
        >
          Genomförda
        </button>
      </div>

      {/* Kommande */}
      {aktivSektion === "kommande" && (
        <>
          <h2 className="heading-display text-lg mb-4">Kommande tävlingar</h2>
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
              {t.anmalningsLank && (
                <a 
                  href={t.anmalningsLank} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-3 py-1 rounded hover:opacity-80 transition-opacity"
                  style={{ background: "rgba(201,162,39,0.15)", color: "var(--color-gold)" }}
                >
                  Anmäl dig →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
        </>
      )}

      {/* Divider mellan sektioner */}
      {aktivSektion === "kommande" && avslutade.length > 0 && (
        <hr className="gold-divider" />
      )}

      {/* Genomförda */}
      {aktivSektion === "genomförda" && (
        <>
          <h2 className="heading-display text-lg mb-4">Genomförda tävlingar</h2>
          <div className="flex flex-col gap-3 mb-10">
            {avslutade.length === 0 ? (
              <p style={{ color: "var(--color-cream-muted)" }}>Inga genomförda tävlingar inlagda.</p>
            ) : avslutade.map(t => (
              <button
                key={t.id}
                data-testid={`button-tavling-${t.id}`}
                className={`w-full text-left card-vintage p-4 flex items-center gap-4 ${t.arOrderOfMerit ? "hover:bg-white/5 transition-colors cursor-pointer" : "opacity-60 cursor-default"}`}
                onClick={() => t.arOrderOfMerit && setValdTavling(t)}
              >
                <DatumBadge datum={t.datum} />
                <div className="w-px self-stretch" style={{ background: "rgba(201,162,39,0.2)" }} />
                <div className="flex-1">
                  <div className="font-semibold text-sm" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>{t.namn}</div>
                  {t.beskrivning && <div className="text-xs mt-0.5" style={{ color: "var(--color-cream-muted)" }}>{t.beskrivning}</div>}
                </div>
                <div className="flex gap-2 items-center">
                  {t.arOrderOfMerit && <span className="badge-gold">OoM</span>}
                  {t.arOrderOfMerit && <span className="text-xs font-semibold px-3 py-1 rounded" style={{ background: "rgba(201,162,39,0.15)", color: "var(--color-gold)" }}>
                    Visa resultat →
                  </span>}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 p-5 rounded-lg text-center" style={{ background: "var(--color-green-mid)", border: "1px solid rgba(201,162,39,0.2)" }}>
        <div className="heading-display text-base mb-2">Vill din klubb vara med?</div>
        <p className="text-sm" style={{ color: "var(--color-cream-muted)" }}>Kontakta tourledaren Klas Johansson för att anordna en tävling.</p>
        <a href="/#/kontakt" className="inline-block mt-3 text-sm font-semibold" style={{ color: "var(--color-gold)" }}>Kontakta oss →</a>
      </div>

      <TavlingsSpridningFooter tavlingar={avslutade} />
    </div>
  );
}

function TavlingsSpridningFooter({ tavlingar }: { tavlingar: Tavling[] }) {
  const [valdaTavlingIds, setValdaTavlingIds] = useState<number[]>([]);
  const [visaTyp, setVisaTyp] = useState<"brutto" | "netto">("brutto");
  const farger = ["#facc15", "#111111", "#dc2626", "#2563eb", "#fb923c", "#f472b6", "#0ea5e9", "#9ca3af"];

  const { data: alleGolfare } = useQuery<Golfare[]>({ queryKey: ["/api/golfare/alla"] });
  const { data: tavlingarMedData, isLoading } = useQuery<{ tavling: Tavling; resultat: Tavlingsresultat[] }[]>({
    queryKey: ["/api/tavlingar/spridning", tavlingar.map((t) => t.id)],
    enabled: tavlingar.length > 0,
    queryFn: async () => {
      const rows = await Promise.all(
        tavlingar.map(async (t) => {
          const resultat = await apiRequest("GET", `/api/tavlingar/${t.id}/resultat`).then((r) => r.json() as Promise<Tavlingsresultat[]>);
          return { tavling: t, resultat };
        }),
      );
      return rows.filter((row) => row.resultat.length > 0);
    },
  });

  useEffect(() => {
    if (!tavlingarMedData || tavlingarMedData.length === 0) {
      setValdaTavlingIds([]);
      return;
    }

    const giltiga = new Set(tavlingarMedData.map((row) => row.tavling.id));
    const kvar = valdaTavlingIds.filter((id) => giltiga.has(id));
    if (kvar.length > 0) {
      if (kvar.length !== valdaTavlingIds.length) setValdaTavlingIds(kvar);
      return;
    }

    // Default: senaste tävlingen med data
    setValdaTavlingIds([tavlingarMedData[0].tavling.id]);
  }, [tavlingarMedData, valdaTavlingIds]);

  const golfareMap = new Map((alleGolfare ?? []).map((g) => [g.id, g] as const));
  const valdaTavlingar = (tavlingarMedData ?? []).filter((row) => valdaTavlingIds.includes(row.tavling.id));

  const serier = valdaTavlingar.map((row, index) => ({
    tavling: row.tavling,
    farg: farger[index % farger.length],
    data: row.resultat
      .filter((r) => r.hickoryHandicapVid != null && (visaTyp === "brutto" ? r.bruttoscore != null : r.nettoscore != null))
      .map((r) => {
        const g = golfareMap.get(r.golfareId);
        return {
          namn: g?.namn ?? r.golfareNamnVid ?? `Golfare #${r.golfareId}`,
          hhcp: Number(r.hickoryHandicapVid),
          score: Number(visaTyp === "brutto" ? r.bruttoscore : r.nettoscore),
          placering: visaTyp === "brutto" ? r.bruttoPlacering : r.placering,
          tavlingNamn: row.tavling.namn,
          tavlingDatum: row.tavling.datum,
        };
      }),
    trend: null as { trendData: TrendPoint[]; sigma: number; k: number; m: number } | null,
  }));

  for (const serie of serier) {
    serie.trend = buildTrendBand(
      serie.data.map((p) => ({ hhcp: p.hhcp, score: p.score })),
      INTERVAL_MULTIPLIER,
    );
  }

  const antalPunkter = serier.reduce((sum, s) => sum + s.data.length, 0);
  const trendByTavlingNamn = new Map(
    serier
      .filter((s) => s.trend)
      .map((s) => [s.tavling.namn, s.trend!] as const),
  );

  return (
    <div className="card-vintage p-5 mt-8">
      <div className="flex flex-wrap gap-3 items-start justify-between mb-4">
        <div>
          <h2 className="heading-display text-base mb-1">Spridningsgraf per tävling</h2>
          <p className="text-xs" style={{ color: "var(--color-cream-muted)" }}>
            Default: senaste tävlingen med resultat. Du kan välja flera tävlingar samtidigt.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex rounded overflow-hidden border" style={{ borderColor: "rgba(201,162,39,0.35)" }}>
            <button
              onClick={() => setVisaTyp("brutto")}
              className="px-3 py-1.5 text-xs font-semibold"
              style={{
                background: visaTyp === "brutto" ? "var(--color-gold)" : "transparent",
                color: visaTyp === "brutto" ? "var(--color-green-dark)" : "var(--color-gold)",
              }}
            >
              Brutto
            </button>
            <button
              onClick={() => setVisaTyp("netto")}
              className="px-3 py-1.5 text-xs font-semibold"
              style={{
                background: visaTyp === "netto" ? "var(--color-gold)" : "transparent",
                color: visaTyp === "netto" ? "var(--color-green-dark)" : "var(--color-gold)",
              }}
            >
              Netto
            </button>
          </div>
          <select
            multiple
            value={valdaTavlingIds.map(String)}
            onChange={(e) => {
              const ids = Array.from(e.target.selectedOptions).map((opt) => Number(opt.value));
              setValdaTavlingIds(ids);
            }}
            className="rounded px-2 py-1.5 text-xs min-w-[280px] h-28"
            style={{ background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.3)", color: "var(--color-cream)" }}
            disabled={isLoading || !tavlingarMedData || tavlingarMedData.length === 0}
          >
            {(tavlingarMedData ?? []).map((row) => (
              <option key={row.tavling.id} value={row.tavling.id}>
                {row.tavling.datum} · {row.tavling.namn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {serier.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {serier.map((serie) => (
            <span
              key={serie.tavling.id}
              className="text-xs px-2 py-1 rounded font-semibold"
              style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-cream)" }}
            >
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "9999px", background: serie.farg, marginRight: "6px" }} />
              {serie.tavling.namn}
            </span>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>Laddar tävlingsdata...</div>
      ) : !tavlingarMedData || tavlingarMedData.length === 0 ? (
        <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>Inga avslutade tävlingar med resultat ännu.</div>
      ) : serier.length === 0 ? (
        <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>Välj minst en tävling i listan.</div>
      ) : antalPunkter < 2 ? (
        <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>För få datapunkter för spridningsgraf.</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart margin={{ top: 8, right: 14, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="rgba(201,162,39,0.14)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="hhcp"
              name="H-HCP"
              tick={{ fill: "var(--color-cream-muted)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(201,162,39,0.3)" }}
              tickLine={{ stroke: "rgba(201,162,39,0.3)" }}
            />
            <YAxis
              type="number"
              dataKey="score"
              name={visaTyp === "brutto" ? "Brutto" : "Netto"}
              tick={{ fill: "var(--color-cream-muted)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(201,162,39,0.3)" }}
              tickLine={{ stroke: "rgba(201,162,39,0.3)" }}
            />
            <Tooltip
              cursor={{ stroke: "rgba(201,162,39,0.35)", strokeDasharray: "4 4" }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;

                const point = payload
                  .map((item) => item.payload)
                  .find((p) => p && typeof p === "object" && "namn" in p) as
                  | {
                      namn?: string;
                      placering?: number | null;
                      hhcp?: number;
                      score?: number;
                      tavlingNamn?: string;
                      tavlingDatum?: string;
                    }
                  | undefined;

                const pointItem = payload.find((item) => {
                  const p = item.payload as { tavlingNamn?: string; namn?: string } | undefined;
                  return p?.tavlingNamn && p?.namn;
                });
                const pointFromItem = pointItem?.payload as
                  | {
                      namn?: string;
                      placering?: number | null;
                      hhcp?: number;
                      score?: number;
                      tavlingNamn?: string;
                      tavlingDatum?: string;
                    }
                  | undefined;

                if (pointFromItem ?? point) {
                  const p = pointFromItem ?? point;
                  return (
                    <div
                      style={{
                        background: "rgba(21,48,43,0.96)",
                        border: "1px solid rgba(201,162,39,0.35)",
                        borderRadius: "8px",
                        color: "var(--color-cream)",
                        padding: "8px 10px",
                        fontSize: "12px",
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: "4px", color: "var(--color-gold)" }}>
                        {p?.namn ?? "Spelare"}
                      </div>
                      <div style={{ color: "var(--color-cream-muted)", marginBottom: "2px" }}>{p?.tavlingDatum} · {p?.tavlingNamn}</div>
                      <div>Placering: {p?.placering ?? "-"}</div>
                      <div>H-HCP: {p?.hhcp != null ? Number(p.hhcp).toFixed(1) : "-"}</div>
                      <div>{visaTyp === "brutto" ? "Brutto" : "Netto"}: {p?.score != null ? Number(p.score).toFixed(1) : "-"}</div>
                    </div>
                  );
                }

                const trendPoint = payload[0]?.payload as {
                  hhcp?: number;
                  trend?: number;
                  lower?: number;
                  upper?: number;
                  tavlingNamn?: string;
                };

                const serieNamn = payload.find((item) => typeof item.name === "string" && item.name.startsWith("Trend "))?.name;
                const tavlingsNamn = typeof serieNamn === "string" ? serieNamn.replace(/^Trend\s+/, "") : undefined;
                const t = tavlingsNamn ? trendByTavlingNamn.get(tavlingsNamn) : undefined;

                return (
                  <div
                    style={{
                      background: "rgba(21,48,43,0.96)",
                      border: "1px solid rgba(201,162,39,0.35)",
                      borderRadius: "8px",
                      color: "var(--color-cream)",
                      padding: "8px 10px",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: "4px", color: "var(--color-gold)" }}>
                      {serieNamn ?? "Trend"}
                    </div>
                    <div>H-HCP: {trendPoint?.hhcp != null ? Number(trendPoint.hhcp).toFixed(1) : "-"}</div>
                    <div>{visaTyp === "brutto" ? "Brutto" : "Netto"} (trend): {trendPoint?.trend != null ? Number(trendPoint.trend).toFixed(1) : "-"}</div>
                    <div style={{ color: "var(--color-cream-muted)" }}>Intervall: {trendPoint?.lower != null ? Number(trendPoint.lower).toFixed(1) : "-"} till {trendPoint?.upper != null ? Number(trendPoint.upper).toFixed(1) : "-"}</div>
                    {t && (
                      <div style={{ color: "var(--color-cream-muted)" }}>
                        y = {t.k.toFixed(3)}x {t.m >= 0 ? "+" : "-"} {Math.abs(t.m).toFixed(3)}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            {serier.map((serie) => {
              if (!serie.trend) return null;
              const bandFill = `${serie.farg}33`;
              const stackId = `band-${serie.tavling.id}`;
              return (
                <Fragment key={`trend-${serie.tavling.id}`}>
                  <Area
                    data={serie.trend.trendData}
                    type="monotone"
                    dataKey="lower"
                    stackId={stackId}
                    stroke="none"
                    fill="rgba(0,0,0,0)"
                    isAnimationActive={false}
                    connectNulls
                  />
                  <Area
                    data={serie.trend.trendData}
                    type="monotone"
                    dataKey="band"
                    stackId={stackId}
                    stroke="none"
                    fill={bandFill}
                    isAnimationActive={false}
                    connectNulls
                  />
                  <Line
                    data={serie.trend.trendData}
                    type="monotone"
                    dataKey="trend"
                    name={`Trend ${serie.tavling.namn}`}
                    stroke={serie.farg}
                    strokeWidth={2.4}
                    dot={false}
                    strokeDasharray="6 4"
                    isAnimationActive={false}
                    connectNulls
                  />
                </Fragment>
              );
            })}
            {serier.map((serie) => (
              <Scatter
                key={serie.tavling.id}
                name={serie.tavling.namn}
                data={serie.data}
                dataKey="score"
                fill={serie.farg}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={0.9}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
      {serier.some((s) => s.trend) && (
        <div className="text-xs mt-2" style={{ color: "var(--color-cream-muted)" }}>
          Separat trendlinje per tävling med intervall ±{INTERVAL_MULTIPLIER}σ.
        </div>
      )}
      {serier.some((s) => s.trend) && (
        <div className="text-xs mt-2 flex flex-wrap gap-3" style={{ color: "var(--color-cream-muted)" }}>
          {serier.filter((s) => s.trend).map((serie) => (
            <span key={`eq-${serie.tavling.id}`}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "9999px", background: serie.farg, marginRight: "6px" }} />
              {serie.tavling.namn}: y = {serie.trend!.k.toFixed(3)}x {serie.trend!.m >= 0 ? "+" : "-"} {Math.abs(serie.trend!.m).toFixed(3)}
            </span>
          ))}
        </div>
      )}
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

  const spridningsData = visaLista
    .filter(r => r.hickoryHandicapVid != null && (visaTyp === "brutto" ? r.bruttoscore != null : r.nettoscore != null))
    .map((r) => {
      const g = golfareMap.get(r.golfareId);
      const score = visaTyp === "brutto" ? Number(r.bruttoscore) : Number(r.nettoscore);
      const placering = visaTyp === "brutto" ? r.bruttoPlacering : r.placering;
      return {
        namn: g?.namn ?? r.golfareNamnVid ?? `Golfare #${r.golfareId}`,
        hhcp: Number(r.hickoryHandicapVid),
        score,
        placering,
      };
    });

  const harSpridningsGraf = spridningsData.length >= 2;

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
        <>
          <div className="card-vintage p-5 mb-4">
            <h2 className="heading-display text-base mb-1">Spridningsgraf</h2>
            <p className="text-xs mb-4" style={{ color: "var(--color-cream-muted)" }}>
              Varje punkt är en spelare: X = H-HCP, Y = {visaTyp === "brutto" ? "Brutto" : "Netto"}. Lägre Y är bättre.
            </p>

            {!harSpridningsGraf ? (
              <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>
                För få resultat för att visa spridningsgraf.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 8, right: 14, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke="rgba(201,162,39,0.14)" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="hhcp"
                    name="H-HCP"
                    tick={{ fill: "var(--color-cream-muted)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(201,162,39,0.3)" }}
                    tickLine={{ stroke: "rgba(201,162,39,0.3)" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="score"
                    name={visaTyp === "brutto" ? "Brutto" : "Netto"}
                    tick={{ fill: "var(--color-cream-muted)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(201,162,39,0.3)" }}
                    tickLine={{ stroke: "rgba(201,162,39,0.3)" }}
                  />
                  <Tooltip
                    cursor={{ stroke: "rgba(201,162,39,0.35)", strokeDasharray: "4 4" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const point = payload[0]?.payload as {
                        namn?: string;
                        placering?: number | null;
                        hhcp?: number;
                        score?: number;
                      };

                      return (
                        <div
                          style={{
                            background: "rgba(21,48,43,0.96)",
                            border: "1px solid rgba(201,162,39,0.35)",
                            borderRadius: "8px",
                            color: "var(--color-cream)",
                            padding: "8px 10px",
                            fontSize: "12px",
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: "4px", color: "var(--color-gold)" }}>
                            {point?.namn ?? "Spelare"}
                          </div>
                          <div>Placering: {point?.placering ?? "-"}</div>
                          <div>H-HCP: {point?.hhcp != null ? Number(point.hhcp).toFixed(1) : "-"}</div>
                          <div>{visaTyp === "brutto" ? "Brutto" : "Netto"}: {point?.score != null ? Number(point.score).toFixed(1) : "-"}</div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={spridningsData} dataKey="score" fill="var(--color-gold)" />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>

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
                        {g?.namn ?? r.golfareNamnVid ?? `Golfare #${r.golfareId}`}
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
        </>
      )}
    </div>
  );
}
