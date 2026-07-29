import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";import type { Golfare, Tavling, Tavlingsresultat } from "@shared/schema";
import { capitalize } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

type ProfilResultat = { tavling: Tavling; resultat: Tavlingsresultat };

const månader = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
const OOM_BEST_COUNT = 6;

function sumBest(values: number[], count: number): number {
  return [...values]
    .sort((a, b) => b - a)
    .slice(0, count)
    .reduce((sum, value) => sum + value, 0);
}

function formatDatum(datum: string) {
  const [, mm, dd] = datum.split("-");
  return `${parseInt(dd)} ${månader[parseInt(mm) - 1]}`;
}

function placeringsLabel(p: number | null | undefined) {
  if (p == null || p >= 99) return "–";
  return `${p}.`;
}

export default function SpelareProfil() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  // Alla hooks måste anropas före early returns

  const { data: golfare, isLoading: laddGolfare } = useQuery<Golfare>({
    queryKey: ["/api/golfare", id],
    queryFn: () => apiRequest("GET", `/api/golfare/${id}`).then(r => r.json()),
  });

  const { data: resultatLista, isLoading: laddResultat } = useQuery<ProfilResultat[]>({
    queryKey: ["/api/golfare", id, "tavlingsresultat"],
    queryFn: () => apiRequest("GET", `/api/golfare/${id}/tavlingsresultat`).then(r => r.json()),
  });

  const { data: oomHistorik } = useQuery<{ tavling: { id: number; namn: string; datum: string }; nettoRang: number; bruttoRang: number; nettoPoangAck: number; bruttoPoangAck: number }[]>({
    queryKey: ["/api/golfare", id, "oom-historik"],
    queryFn: () => apiRequest("GET", `/api/golfare/${id}/oom-historik`).then(r => r.json()),
  });

  if (laddGolfare || laddResultat) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" style={{ color: "var(--color-cream-muted)" }}>
        Laddar...
      </div>
    );
  }

  if (!golfare) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" style={{ color: "var(--color-cream-muted)" }}>
        Spelaren hittades inte.
      </div>
    );
  }

  const namn = capitalize(golfare.namn);
  const antalTavlingar = resultatLista?.length ?? 0;

  // Sortera kronologiskt för graf och summering
  const kronologisk = resultatLista
    ? [...resultatLista].sort((a, b) => a.tavling.datum.localeCompare(b.tavling.datum))
    : [];

  const totalOomPoang = sumBest(kronologisk.map(r => r.resultat.orderOfMeritPoang ?? 0), OOM_BEST_COUNT);
  const totalBruttoPoang = sumBest(kronologisk.map(r => r.resultat.bruttoOmPoang ?? 0), OOM_BEST_COUNT);

  // Data till grafen
  const grafData = kronologisk.map((r, i) => {
    const kortNamn = r.tavling.namn.replace(/hickory|invitational|open|classic/gi, "").trim().split(" ")[0];
    return {
      index: i + 1,
      tavling: kortNamn,
      fullNamn: r.tavling.namn,
      datum: formatDatum(r.tavling.datum),
      nettoPlats: r.resultat.placering != null && r.resultat.placering < 99 ? r.resultat.placering : null,
      bruttoPlats: r.resultat.bruttoPlacering != null && r.resultat.bruttoPlacering < 99 ? r.resultat.bruttoPlacering : null,
      oomPoang: r.resultat.orderOfMeritPoang ?? 0,
      bruttoOmPoang: r.resultat.bruttoOmPoang ?? 0,
      brutto: r.resultat.bruttoscore,
      netto: r.resultat.nettoscore,
    };
  });


  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Tillbaka */}
      <Link href="/">
        <span className="flex items-center gap-2 text-sm mb-8 cursor-pointer hover:opacity-70 transition-opacity" style={{ color: "var(--color-gold)" }}>
          ← Tillbaka
        </span>
      </Link>

      {/* Spelarens info */}
      <div className="card-vintage p-6 mb-6">
        <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--color-gold)" }}>
          Spelarprofil
        </div>
        <h1 className="heading-display mb-1" style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)" }}>{namn}</h1>
        {golfare.klubb && (
          <div className="text-sm mb-4" style={{ color: "var(--color-cream-muted)" }}>{golfare.klubb}</div>
        )}
        <div className="flex gap-6 flex-wrap mt-4">
          <div>
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--color-gold)" }}>Hickory-hcp</div>
            <div className="font-bold font-mono text-lg" style={{ color: "var(--color-cream)" }}>
              {golfare.hickoryHandicap.toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--color-gold)" }}>Standard-hcp</div>
            <div className="font-bold font-mono text-lg" style={{ color: "var(--color-cream)" }}>
              {golfare.standardHandicap.toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--color-gold)" }}>Tävlingar 2026</div>
            <div className="font-bold font-mono text-lg" style={{ color: "var(--color-cream)" }}>
              {antalTavlingar}
            </div>
          </div>
          <div>
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--color-gold)" }}>OoM-poäng netto (bästa 6)</div>
            <div className="font-bold font-mono text-lg" style={{ color: "var(--color-gold)" }}>
              {totalOomPoang}p
            </div>
          </div>
          <div>
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--color-gold)" }}>OoM-poäng brutto (bästa 6)</div>
            <div className="font-bold font-mono text-lg" style={{ color: "var(--color-gold)" }}>
              {totalBruttoPoang}p
            </div>
          </div>
        </div>
      </div>

      {/* OoM-rang-graf */}
      {oomHistorik && oomHistorik.length > 0 && (
        <div className="card-vintage p-5 mb-6">
          <h2 className="heading-display text-base mb-1">OoM-placering per tävling</h2>
          <p className="text-xs mb-4" style={{ color: "var(--color-cream-muted)" }}>
            Ackumulerad placering i Order of Merit efter varje genomförd tävling. Y-axeln är inverterad — plats 1 är högst upp.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={oomHistorik.map(h => ({
                tavling: h.tavling.namn.replace(/hickory|invitational|open|classic/gi, "").trim().split(" ")[0],
                fullNamn: h.tavling.namn,
                datum: formatDatum(h.tavling.datum),
                nettoRang: h.nettoRang,
                bruttoRang: h.bruttoRang,
                nettoPoang: h.nettoPoangAck,
                bruttoPoang: h.bruttoPoangAck,
              }))}
              margin={{ top: 8, right: 16, left: -10, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,162,39,0.1)" />
              <XAxis
                dataKey="tavling"
                tick={{ fill: "#a89060", fontSize: 11 }}
                axisLine={{ stroke: "rgba(201,162,39,0.2)" }}
                tickLine={false}
              />
              <YAxis
                reversed
                allowDecimals={false}
                tick={{ fill: "#a89060", fontSize: 11 }}
                axisLine={{ stroke: "rgba(201,162,39,0.2)" }}
                tickLine={false}
                label={{ value: "OoM-plats", angle: -90, position: "insideLeft", fill: "#a89060", fontSize: 10, dy: 36 }}
              />
              <Tooltip
                contentStyle={{ background: "#1A3322", border: "1px solid rgba(201,162,39,0.4)", borderRadius: "6px", fontSize: 12 }}
                labelStyle={{ color: "#C9A227", fontWeight: "bold", marginBottom: 4 }}
                itemStyle={{ color: "#e8dcc8" }}
                formatter={(value: number, name: string) => [`Plats ${value}`, name]}
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload;
                  return p ? `${p.fullNamn} (${p.datum}) — Netto: ${p.nettoPoang}p  Brutto: ${p.bruttoPoang}p` : "";
                }}
              />
              <Line type="monotone" dataKey="nettoRang" name="OoM netto" stroke="#C9A227" strokeWidth={2.5} dot={{ fill: "#C9A227", r: 5, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="bruttoRang" name="OoM brutto" stroke="#7ec8a0" strokeWidth={2} dot={{ fill: "#7ec8a0", r: 4, strokeWidth: 0 }} strokeDasharray="6 3" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-3 text-xs" style={{ color: "var(--color-cream-muted)" }}>
            <span><span style={{ color: "#C9A227" }}>——</span> OoM netto (nuv. plats {oomHistorik.at(-1)?.nettoRang ?? "–"}, {oomHistorik.at(-1)?.nettoPoangAck ?? 0}p)</span>
            <span><span style={{ color: "#7ec8a0" }}>- - -</span> OoM brutto (nuv. plats {oomHistorik.at(-1)?.bruttoRang ?? "–"}, {oomHistorik.at(-1)?.bruttoPoangAck ?? 0}p)</span>
          </div>
        </div>
      )}

      {/* Placeringsboxar per tävling */}
      {kronologisk.length > 0 && (
        <div className="mb-6">
          <h2 className="heading-display text-lg mb-3">Placering per tävling</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {kronologisk.map(({ tavling, resultat }) => {
              const nettoP = resultat.placering != null && resultat.placering < 99 ? resultat.placering : null;
              const bruttoP = resultat.bruttoPlacering != null && resultat.bruttoPlacering < 99 ? resultat.bruttoPlacering : null;
              const topPlace = nettoP === 1 || bruttoP === 1;
              return (
                <div key={resultat.id} className="card-vintage p-4"
                  style={{ borderColor: topPlace ? "rgba(201,162,39,0.6)" : undefined }}>
                  <div className="text-xs mb-1" style={{ color: "var(--color-cream-muted)" }}>
                    {formatDatum(tavling.datum)}
                  </div>
                  <div className="text-xs font-semibold mb-3 leading-tight" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>
                    {tavling.namn}
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <div className="tracking-wide uppercase mb-0.5" style={{ color: "var(--color-gold)", fontSize: "0.6rem" }}>Netto</div>
                      <div className="font-bold font-mono text-xl" style={{ color: nettoP != null && nettoP <= 3 ? "var(--color-gold)" : "var(--color-cream)" }}>
                        {nettoP != null ? `${nettoP}.` : "–"}
                      </div>
                      <div className="text-xs font-mono" style={{ color: "var(--color-cream-muted)" }}>{resultat.nettoscore ?? "–"} slag</div>
                    </div>
                    <div>
                      <div className="tracking-wide uppercase mb-0.5" style={{ color: "#7ec8a0", fontSize: "0.6rem" }}>Brutto</div>
                      <div className="font-bold font-mono text-xl" style={{ color: bruttoP != null && bruttoP <= 3 ? "#7ec8a0" : "var(--color-cream)" }}>
                        {bruttoP != null ? `${bruttoP}.` : "–"}
                      </div>
                      <div className="text-xs font-mono" style={{ color: "var(--color-cream-muted)" }}>{resultat.bruttoscore ?? "–"} slag</div>
                    </div>
                  </div>
                  {tavling.arOrderOfMerit && (
                    <div className="mt-2 text-xs" style={{ color: "var(--color-cream-muted)" }}>
                      OoM: <span style={{ color: "var(--color-gold)" }}>{resultat.orderOfMeritPoang ?? 0}p</span>
                      {" / "}
                      <span style={{ color: "#7ec8a0" }}>{resultat.bruttoOmPoang ?? 0}p</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tävlingsplaceringar */}
      <h2 className="heading-display text-lg mb-4">Tävlingsresultat</h2>

      {!resultatLista || resultatLista.length === 0 ? (
        <div className="card-vintage p-6 text-sm" style={{ color: "var(--color-cream-muted)" }}>
          Inga tävlingsresultat registrerade ännu.
        </div>
      ) : (
        <div className="card-vintage overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.2)", background: "rgba(0,0,0,0.2)" }}>
                <th className="text-left px-4 py-3 text-xs" style={{ color: "var(--color-gold)" }}>Datum</th>
                <th className="text-left px-4 py-3 text-xs" style={{ color: "var(--color-gold)" }}>Tävling</th>
                <th className="text-right px-4 py-3 text-xs" style={{ color: "var(--color-gold)" }}>Brutto</th>
                <th className="text-right px-4 py-3 text-xs" style={{ color: "var(--color-gold)" }}>Netto</th>
                <th className="text-right px-4 py-3 text-xs" style={{ color: "var(--color-gold)" }}>Pl. N</th>
                <th className="text-right px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--color-gold)" }}>Pl. B</th>
              </tr>
            </thead>
            <tbody>
              {resultatLista.map(({ tavling, resultat }, i) => (
                <tr
                  key={resultat.id}
                  style={{
                    borderBottom: "1px solid rgba(201,162,39,0.06)",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--color-cream-muted)" }}>
                    {formatDatum(tavling.datum)}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--color-cream)" }}>
                    <span>{tavling.namn}</span>
                    {tavling.arOrderOfMerit && (
                      <span className="ml-2 badge-gold" style={{ fontSize: "0.6rem" }}>OoM</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--color-cream-muted)" }}>
                    {resultat.bruttoscore ?? "–"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--color-cream-muted)" }}>
                    {resultat.nettoscore ?? "–"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold font-mono" style={{ color: (resultat.placering ?? 99) <= 3 ? "var(--color-gold)" : "var(--color-cream-muted)" }}>
                    {placeringsLabel(resultat.placering)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold font-mono hidden sm:table-cell" style={{ color: (resultat.bruttoPlacering ?? 99) <= 3 ? "var(--color-gold)" : "var(--color-cream-muted)" }}>
                    {placeringsLabel(resultat.bruttoPlacering)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
