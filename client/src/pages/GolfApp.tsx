import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Golfare, Bana, Tavling } from "@shared/schema";
import { capitalize } from "@/lib/utils";

type Tab = "ledartavla" | "runda" | "historik";
type RundaTyp = "tavling" | "traning";
type RundaSteg = "typ" | "tavling" | "golfare" | "hal" | "summering";

function formatBanaNamn(b: Pick<Bana, "namn" | "klubb" | "delbana">): string {
  const klubb = (b.klubb ?? "").trim();
  const delbana = (b.delbana ?? "").trim();
  if (klubb && delbana) return `${klubb} - ${delbana}`;
  if (klubb) return klubb;
  return b.namn;
}

function PageHeader() {
  return (
    <div className="text-center py-10 px-4" style={{ borderBottom: "1px solid rgba(201,162,39,0.2)" }}>
      <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--color-gold)" }}>Hickory Golf</div>
      <h1 className="heading-display" style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}>Golf-appen</h1>
      <p className="text-sm mt-2" style={{ color: "var(--color-cream-muted)" }}>Registrera rundor, följ handicap och tävlingsresultat</p>
    </div>
  );
}

function TabBar({ active, setActive }: { active: Tab; setActive: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "ledartavla", label: "Ledartavla" },
    { key: "runda", label: "Ny runda" },
    { key: "historik", label: "Historik" },
  ];
  return (
    <div className="flex border-b" style={{ borderColor: "rgba(201,162,39,0.2)" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => setActive(t.key)}
          className="flex-1 py-3 text-sm font-semibold transition-all"
          style={{ color: active === t.key ? "var(--color-gold)" : "var(--color-cream-muted)", borderBottom: active === t.key ? "2px solid var(--color-gold)" : "2px solid transparent", background: "none", fontFamily: "var(--font-body)" }}
          data-testid={`tab-${t.key}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Ledartavla() {
  const { data: oom, isLoading } = useQuery<{ golfare: Golfare; nettoPoang: number; bruttoPoang: number; antalTavlingar: number }[]>({ queryKey: ["/api/order-of-merit"] });
  const [visaTyp, setVisaTyp] = useState<"brutto" | "netto">("brutto");
  const sorterad = oom ? [...oom].sort((a, b) => visaTyp === "brutto" ? b.bruttoPoang - a.bruttoPoang : b.nettoPoang - a.nettoPoang) : [];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="heading-display text-lg">Order of Merit 2026</h2>
        <div className="flex rounded overflow-hidden border" style={{ borderColor: "rgba(201,162,39,0.4)" }}>
          {(["brutto", "netto"] as const).map(typ => (
            <button key={typ} onClick={() => setVisaTyp(typ)}
              className="px-4 py-1.5 text-xs font-semibold transition-colors"
              style={{ background: visaTyp === typ ? "var(--color-gold)" : "transparent", color: visaTyp === typ ? "var(--color-green-dark)" : "var(--color-gold)" }}>
              {typ === "brutto" ? "Brutto" : "Netto"}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: "var(--color-cream-muted)" }}>
        Regel: Endast spelarens sex bästa OoM-resultat räknas i totalen.
      </p>
      {isLoading ? <div style={{ color: "var(--color-cream-muted)" }}>Laddar...</div> : (
        <div className="card-vintage overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.2)", background: "rgba(0,0,0,0.2)" }}>
                <th className="text-left px-3 py-2 text-xs w-10" style={{ color: "var(--color-gold)" }}>#</th>
                <th className="text-left px-3 py-2 text-xs" style={{ color: "var(--color-gold)" }}>Golfare</th>
                <th className="text-right px-3 py-2 text-xs" style={{ color: "var(--color-gold)" }}>Tävl.</th>
                <th className="text-right px-3 py-2 text-xs" style={{ color: "var(--color-gold)" }}>Poäng</th>
              </tr>
            </thead>
            <tbody>
              {sorterad.filter(r => (visaTyp === "brutto" ? r.bruttoPoang : r.nettoPoang) > 0).map((r, i) => {
                const poang = visaTyp === "brutto" ? r.bruttoPoang : r.nettoPoang;
                return (
                  <tr key={r.golfare.id} style={{ borderBottom: "1px solid rgba(201,162,39,0.06)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td className="px-3 py-2 font-bold text-sm" style={{ color: i < 3 ? "var(--color-gold)" : "var(--color-cream-muted)" }}>{i < 3 ? ["🥇","🥈","🥉"][i] : `${i+1}.`}</td>
                    <td className="px-3 py-2">
                      <Link href={`/golfare/${r.golfare.id}`}>
                        <span className="cursor-pointer hover:underline" style={{ color: "var(--color-cream)" }}>{capitalize(r.golfare.namn)}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs" style={{ color: "var(--color-cream-muted)" }}>{r.antalTavlingar}</td>
                    <td className="px-3 py-2 text-right font-bold font-mono" style={{ color: i < 3 ? "var(--color-gold)" : "var(--color-cream)" }}>{poang}p</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Ny Runda — hål-för-hål flöde ────────────────────────────────────────────

interface RundaState {
  typ: RundaTyp;
  tavlingId: number | null;
  golfareId: number | null;
  hhcp: number;
  hal: string[]; // 18 slag per hål
}

function NyRunda() {
  const { toast } = useToast();
  const { data: alleGolfare } = useQuery<Golfare[]>({ queryKey: ["/api/golfare/alla"] });
  const { data: tavlingar } = useQuery<Tavling[]>({ queryKey: ["/api/tavlingar"] });
  const { data: banor } = useQuery<Bana[]>({ queryKey: ["/api/banor"] });

  const [steg, setSteg] = useState<RundaSteg>("typ");
  const [sokTerm, setSokTerm] = useState("");
  const [runda, setRunda] = useState<RundaState>({ typ: "tavling", tavlingId: null, golfareId: null, hhcp: 0, hal: Array(18).fill("") });
  const [aktivtHal, setAktivtHal] = useState(0);

  // Hämta vald tävling och bana
  const valdTavling = tavlingar?.find(t => t.id === runda.tavlingId) ?? null;
  const valdBana = banor?.find(b => b.id === valdTavling?.banaId) ?? null;
  const valdGolfare = alleGolfare?.find(g => g.id === runda.golfareId) ?? null;

  // Par per hål — tävlingens override eller banans standard
  const parPerHal: number[] = (() => {
    if (valdTavling?.parOverride) return JSON.parse(valdTavling.parOverride);
    if (valdBana?.parPerHal) return JSON.parse(valdBana.parPerHal);
    return Array(18).fill(4);
  })();

  const totPar = parPerHal.reduce((s, v) => s + v, 0);
  const matadeHal = runda.hal.filter(v => v !== "").length;
  const totBrutto = runda.hal.reduce((s, v) => s + (Number(v) || 0), 0);
  const totNetto = totBrutto - runda.hhcp;

  // Kommande/pågående tävlingar (ej avslutade)
  const aktivaTavlingar = (tavlingar ?? []).filter(t => !t.avslutad).sort((a, b) => a.datum.localeCompare(b.datum));

  const sparaMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/rundor", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rundor"] });
      toast({ title: "Runda sparad!", description: `Brutto ${totBrutto}, netto ${Math.round(totNetto)}` });
      // Återställ
      setRunda({ typ: "tavling", tavlingId: null, golfareId: null, hhcp: 0, hal: Array(18).fill("") });
      setSteg("typ");
      setAktivtHal(0);
    },
  });

  const sparaTavResultatMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/tavlingsresultat", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tavlingsresultat"] });
    },
  });

  function spara() {
    const halJson = JSON.stringify(runda.hal.map(Number));
    const datum = valdTavling?.datum ?? new Date().toISOString().split("T")[0];
    const banaId = valdBana?.id ?? null;

    sparaMutation.mutate({
      golfareId: runda.golfareId,
      banaId,
      datum,
      bruttoscore: totBrutto,
      nettoscore: Math.round(totNetto),
      hickoryHandicapVid: runda.hhcp,
      halForHal: halJson,
      arTavling: runda.typ === "tavling",
      tavlingId: runda.typ === "tavling" ? runda.tavlingId : null,
    });

    // Om tävling, spara också i tavlingsresultat (utan placering — admin sätter det)
    if (runda.typ === "tavling" && runda.tavlingId) {
      sparaTavResultatMutation.mutate({
        tavlingId: runda.tavlingId,
        golfareId: runda.golfareId,
        bruttoscore: totBrutto,
        nettoscore: Math.round(totNetto),
        hickoryHandicapVid: runda.hhcp,
        placering: 99, // Placeholder — admin sätter placering
        orderOfMeritPoang: 0,
        bruttoPlacering: 99,
        bruttoOmPoang: 0,
      });
    }
  }

  const filtGolfare = (alleGolfare ?? []).filter(g =>
    !sokTerm || g.namn.toLowerCase().includes(sokTerm.toLowerCase())
  ).sort((a, b) => {
    if ((a.stamspelare ? 1 : 0) !== (b.stamspelare ? 1 : 0)) return (b.stamspelare ? 1 : 0) - (a.stamspelare ? 1 : 0);
    return a.namn.localeCompare(b.namn);
  });

  const inputStyle = { background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.375rem", color: "var(--color-cream)", padding: "0.5rem 0.75rem", width: "100%", fontSize: "0.875rem" };

  // ── STEG: Välj typ ──
  if (steg === "typ") return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="heading-display text-lg mb-6 text-center">Vad vill du registrera?</h2>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => { setRunda(r => ({ ...r, typ: "tavling" })); setSteg("tavling"); }}
          className="card-vintage p-6 text-center hover:bg-white/5 transition-colors"
          style={{ border: "2px solid rgba(201,162,39,0.4)" }}>
          <div className="text-3xl mb-3">🏆</div>
          <div className="font-semibold" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>Tävlingsrunda</div>
          <div className="text-xs mt-1" style={{ color: "var(--color-cream-muted)" }}>Rapportera till en pågående tävling</div>
        </button>
        <button onClick={() => { setRunda(r => ({ ...r, typ: "traning" })); setSteg("golfare"); }}
          className="card-vintage p-6 text-center hover:bg-white/5 transition-colors"
          style={{ border: "2px solid rgba(201,162,39,0.2)" }}>
          <div className="text-3xl mb-3">⛳</div>
          <div className="font-semibold" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>Träningsrunda</div>
          <div className="text-xs mt-1" style={{ color: "var(--color-cream-muted)" }}>Logga en vanlig runda</div>
        </button>
      </div>
    </div>
  );

  // ── STEG: Välj tävling ──
  if (steg === "tavling") return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => setSteg("typ")} className="text-sm mb-5 hover:opacity-70" style={{ color: "var(--color-gold)" }}>← Tillbaka</button>
      <h2 className="heading-display text-lg mb-4">Välj tävling</h2>
      {aktivaTavlingar.length === 0 ? (
        <div className="card-vintage p-6 text-center" style={{ color: "var(--color-cream-muted)" }}>Inga aktiva tävlingar just nu</div>
      ) : (
        <div className="flex flex-col gap-3">
          {aktivaTavlingar.map(t => {
            const bana = banor?.find(b => b.id === t.banaId);
            return (
              <button key={t.id} onClick={() => { setRunda(r => ({ ...r, tavlingId: t.id })); setSteg("golfare"); }}
                className="card-vintage p-4 text-left hover:bg-white/5 transition-colors"
                style={{ border: runda.tavlingId === t.id ? "2px solid var(--color-gold)" : "2px solid transparent" }}>
                <div className="font-semibold" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>{t.namn}</div>
                <div className="text-xs mt-1" style={{ color: "var(--color-cream-muted)" }}>
                  {t.datum} {bana ? `· ${formatBanaNamn(bana)}` : ""}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── STEG: Välj golfare + HCP ──
  if (steg === "golfare") return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => setSteg(runda.typ === "tavling" ? "tavling" : "typ")} className="text-sm mb-5 hover:opacity-70" style={{ color: "var(--color-gold)" }}>← Tillbaka</button>
      <h2 className="heading-display text-lg mb-2">Vem spelar?</h2>
      {valdTavling && <p className="text-xs mb-4" style={{ color: "var(--color-cream-muted)" }}>Tävling: {valdTavling.namn}</p>}
      <div className="relative mb-4">
        <input style={inputStyle} placeholder="Sök ditt namn..." value={sokTerm} onChange={e => setSokTerm(e.target.value)} autoFocus />
      </div>
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {filtGolfare.slice(0, 30).map(g => (
          <button key={g.id}
            onClick={() => { setRunda(r => ({ ...r, golfareId: g.id, hhcp: Number(g.hickoryHandicap ?? 0) })); setSokTerm(""); setSteg("hal"); }}
            className="card-vintage px-4 py-3 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
            style={{ border: runda.golfareId === g.id ? "2px solid var(--color-gold)" : "2px solid transparent" }}>
            <div>
              <div className="font-semibold text-sm" style={{ color: "var(--color-cream)" }}>{g.namn}</div>
              {g.stamspelare && <div className="text-xs" style={{ color: "var(--color-gold)" }}>Stamspelare</div>}
            </div>
            <div className="text-sm font-bold font-mono" style={{ color: "var(--color-gold)" }}>H-HCP {Number(g.hickoryHandicap ?? 0).toFixed(0)}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── STEG: Hål för hål ──
  if (steg === "hal") {
    const hal = aktivtHal; // 0-indexerat
    const parDettaHal = parPerHal[hal];
    const slagDettaHal = Number(runda.hal[hal]) || 0;
    const avvikelse = slagDettaHal ? slagDettaHal - parDettaHal : null;
    const avvikelseText = avvikelse === null ? "" : avvikelse === 0 ? "Par" : avvikelse < 0 ? `${avvikelse}` : `+${avvikelse}`;
    const avvikelseColor = avvikelse === null ? "var(--color-cream-muted)" : avvikelse < 0 ? "#4ade80" : avvikelse === 0 ? "var(--color-cream-muted)" : "#f87171";

    // Running total
    const runningBrutto = runda.hal.slice(0, hal + 1).reduce((s, v) => s + (Number(v) || 0), 0);
    const runningPar = parPerHal.slice(0, hal + 1).reduce((s, v) => s + v, 0);
    const runningAvv = runningBrutto ? runningBrutto - runningPar : null;

    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => hal > 0 ? setAktivtHal(hal - 1) : setSteg("golfare")} className="text-sm hover:opacity-70" style={{ color: "var(--color-gold)" }}>← {hal === 0 ? "Tillbaka" : `Hål ${hal}`}</button>
          <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>{valdGolfare?.namn}</div>
          <button onClick={() => setSteg("summering")} className="text-xs hover:opacity-70" style={{ color: "var(--color-cream-muted)" }}>Summera →</button>
        </div>

        {/* Aktuellt hål */}
        <div className="card-vintage p-6 text-center mb-4">
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--color-cream-muted)" }}>Hål</div>
          <div className="text-5xl font-bold font-mono mb-1" style={{ color: "var(--color-gold)" }}>{hal + 1}</div>
          <div className="text-sm" style={{ color: "var(--color-cream-muted)" }}>Par <span className="font-bold text-lg" style={{ color: "var(--color-cream)" }}>{parDettaHal}</span></div>
        </div>

        {/* Slag-inmatning */}
        <div className="card-vintage p-5 mb-4">
          <div className="text-xs uppercase tracking-widest mb-3 text-center" style={{ color: "var(--color-cream-muted)" }}>Antal slag</div>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setRunda(r => { const h = [...r.hal]; const v = Math.max(1, (Number(h[hal]) || parDettaHal) - 1); h[hal] = String(v); return { ...r, hal: h }; })}
              className="w-12 h-12 rounded-full text-2xl font-bold flex items-center justify-center"
              style={{ background: "rgba(201,162,39,0.15)", color: "var(--color-gold)", border: "1px solid rgba(201,162,39,0.4)" }}>−</button>
            <div className="text-center">
              <input type="number" min={1} max={15}
                value={runda.hal[hal]}
                onChange={e => setRunda(r => { const h = [...r.hal]; h[hal] = e.target.value; return { ...r, hal: h }; })}
                className="text-4xl font-bold font-mono text-center w-20 bg-transparent border-b-2 outline-none"
                style={{ color: "var(--color-cream)", borderColor: "rgba(201,162,39,0.4)" }} />
              {avvikelse !== null && (
                <div className="text-sm font-bold mt-1" style={{ color: avvikelseColor }}>{avvikelseText}</div>
              )}
            </div>
            <button onClick={() => setRunda(r => { const h = [...r.hal]; const v = (Number(h[hal]) || parDettaHal) + 1; h[hal] = String(v); return { ...r, hal: h }; })}
              className="w-12 h-12 rounded-full text-2xl font-bold flex items-center justify-center"
              style={{ background: "rgba(201,162,39,0.15)", color: "var(--color-gold)", border: "1px solid rgba(201,162,39,0.4)" }}>+</button>
          </div>
        </div>

        {/* Running total */}
        {runningBrutto > 0 && (
          <div className="flex justify-between text-xs px-1 mb-4" style={{ color: "var(--color-cream-muted)" }}>
            <span>Hittills: <strong style={{ color: "var(--color-cream)" }}>{runningBrutto}</strong> slag</span>
            <span>vs par: <strong style={{ color: runningAvv !== null && runningAvv < 0 ? "#4ade80" : runningAvv === 0 ? "var(--color-cream-muted)" : "#f87171" }}>{runningAvv !== null ? (runningAvv >= 0 ? `+${runningAvv}` : runningAvv) : "–"}</strong></span>
          </div>
        )}

        {/* Håöversikt mini */}
        <div className="grid grid-cols-9 gap-1 mb-4">
          {Array.from({ length: 18 }, (_, i) => {
            const slag = Number(runda.hal[i]) || 0;
            const par = parPerHal[i];
            const avv = slag ? slag - par : null;
            const bg = i === hal ? "var(--color-gold)" : slag > 0 ? avv! < 0 ? "rgba(74,222,128,0.3)" : avv === 0 ? "rgba(255,255,255,0.1)" : "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.05)";
            const color = i === hal ? "var(--color-green-dark)" : "var(--color-cream-muted)";
            return (
              <button key={i} onClick={() => setAktivtHal(i)}
                className="rounded text-xs py-1 font-mono font-bold text-center"
                style={{ background: bg, color, fontSize: "0.65rem" }}>
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Nästa-knapp */}
        <button
          onClick={() => hal < 17 ? setAktivtHal(hal + 1) : setSteg("summering")}
          disabled={!runda.hal[hal]}
          className="w-full py-3 rounded font-bold text-sm"
          style={{ background: runda.hal[hal] ? "var(--color-gold)" : "rgba(201,162,39,0.2)", color: runda.hal[hal] ? "var(--color-green-dark)" : "var(--color-cream-muted)" }}>
          {hal < 17 ? `Gå till hål ${hal + 2} →` : "Se summering →"}
        </button>
      </div>
    );
  }

  // ── STEG: Summering ──
  if (steg === "summering") {
    const avvikelse = totBrutto - totPar;
    return (
      <div className="p-4 max-w-md mx-auto">
        <button onClick={() => setSteg("hal")} className="text-sm mb-5 hover:opacity-70" style={{ color: "var(--color-gold)" }}>← Ändra</button>
        <h2 className="heading-display text-lg mb-4 text-center">Summering</h2>

        <div className="card-vintage p-5 mb-4 text-center">
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--color-cream-muted)" }}>{valdGolfare?.namn}</div>
          {valdTavling && <div className="text-xs mb-2" style={{ color: "var(--color-gold)" }}>{valdTavling.namn}</div>}
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <div className="text-2xl font-bold font-mono" style={{ color: "var(--color-cream)" }}>{totBrutto}</div>
              <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>Brutto</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono" style={{ color: "var(--color-gold)" }}>{Math.round(totNetto)}</div>
              <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>Netto</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono" style={{ color: avvikelse <= 0 ? "#4ade80" : "#f87171" }}>{avvikelse >= 0 ? `+${avvikelse}` : avvikelse}</div>
              <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>vs par</div>
            </div>
          </div>
          <div className="text-xs mt-3" style={{ color: "var(--color-cream-muted)" }}>H-HCP {runda.hhcp} · Par {totPar} · {matadeHal}/18 hål</div>
        </div>

        {/* Hål-tabell */}
        <div className="card-vintage overflow-hidden mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.2)", background: "rgba(0,0,0,0.2)" }}>
                <th className="px-2 py-1.5 text-left" style={{ color: "var(--color-gold)" }}>Hål</th>
                {Array.from({ length: 9 }, (_, i) => <th key={i} className="px-1 py-1.5 text-center font-mono" style={{ color: "var(--color-gold)" }}>{i+1}</th>)}
                <th className="px-2 py-1.5 text-right" style={{ color: "var(--color-gold)" }}>Σ</th>
              </tr>
            </thead>
            <tbody>
              {[0, 9].map(offset => {
                const slag = runda.hal.slice(offset, offset + 9);
                const pars = parPerHal.slice(offset, offset + 9);
                const tot = slag.reduce((s, v) => s + (Number(v) || 0), 0);
                return (
                  <tr key={offset} style={{ borderBottom: "1px solid rgba(201,162,39,0.06)" }}>
                    <td className="px-2 py-1.5" style={{ color: "var(--color-cream-muted)" }}>{offset === 0 ? "Ut" : "In"}</td>
                    {slag.map((v, i) => {
                      const avv = Number(v) - pars[i];
                      return (
                        <td key={i} className="px-1 py-1.5 text-center font-mono font-bold"
                          style={{ color: !v ? "var(--color-cream-muted)" : avv < 0 ? "#4ade80" : avv === 0 ? "var(--color-cream)" : "#f87171" }}>
                          {v || "–"}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1.5 text-right font-bold font-mono" style={{ color: "var(--color-cream)" }}>{tot || "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Justera HCP */}
        <div className="card-vintage px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-sm" style={{ color: "var(--color-cream-muted)" }}>Hickory-HCP denna runda</span>
          <input type="number" step="0.5" value={runda.hhcp}
            onChange={e => setRunda(r => ({ ...r, hhcp: Number(e.target.value) }))}
            className="w-16 text-center rounded px-2 py-1 text-sm font-mono font-bold"
            style={{ background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.3)", color: "var(--color-gold)" }} />
        </div>

        <button onClick={spara} disabled={sparaMutation.isPending || matadeHal === 0}
          className="w-full py-3 rounded font-bold text-sm"
          style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}>
          {sparaMutation.isPending ? "Sparar..." : "Spara runda"}
        </button>
      </div>
    );
  }

  return null;
}

// ─── Historik ─────────────────────────────────────────────────────────────────

function Historik() {
  const { data: alleGolfare } = useQuery<Golfare[]>({ queryKey: ["/api/golfare/alla"] });
  const [valdGolfareId, setValdGolfareId] = useState<number | "">("");
  const { data: rundor, isLoading } = useQuery<any[]>({
    queryKey: ["/api/rundor/golfare", valdGolfareId],
    enabled: !!valdGolfareId,
  });

  const selectStyle = { background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.375rem", color: "var(--color-cream)", padding: "0.5rem 0.75rem", width: "100%", fontSize: "0.875rem" };

  return (
    <div className="p-4">
      <h2 className="heading-display text-lg mb-4">Rundhistorik</h2>
      <select style={selectStyle} value={valdGolfareId} onChange={e => setValdGolfareId(Number(e.target.value) || "")} className="mb-4">
        <option value="">Välj golfare...</option>
        {(alleGolfare ?? []).sort((a, b) => {
          if ((a.stamspelare ? 1 : 0) !== (b.stamspelare ? 1 : 0)) return (b.stamspelare ? 1 : 0) - (a.stamspelare ? 1 : 0);
          return a.namn.localeCompare(b.namn);
        }).map(g => <option key={g.id} value={g.id}>{g.namn}{g.stamspelare ? " ★" : ""}</option>)}
      </select>
      {isLoading && <div style={{ color: "var(--color-cream-muted)" }}>Laddar...</div>}
      {rundor && rundor.length === 0 && <div style={{ color: "var(--color-cream-muted)" }}>Inga rundor registrerade.</div>}
      <div className="flex flex-col gap-2">
        {(rundor ?? []).map((r: any) => (
          <div key={r.id} className="card-vintage px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm" style={{ color: "var(--color-cream)" }}>{r.datum}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-cream-muted)" }}>
                {r.arTavling ? "🏆 Tävling" : "⛳ Träning"} · H-HCP {Number(r.hickoryHandicapVid ?? 0).toFixed(0)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold font-mono" style={{ color: "var(--color-cream)" }}>Brutto {r.bruttoscore}</div>
              <div className="text-sm font-mono" style={{ color: "var(--color-gold)" }}>Netto {Math.round(r.nettoscore ?? 0)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Huvud ────────────────────────────────────────────────────────────────────

export default function GolfApp() {
  const [activeTab, setActiveTab] = useState<Tab>("ledartavla");
  return (
    <div className="max-w-2xl mx-auto" style={{ minHeight: "calc(100vh - 80px)" }}>
      <PageHeader />
      <TabBar active={activeTab} setActive={setActiveTab} />
      <div className="py-4">
        {activeTab === "ledartavla" && <Ledartavla />}
        {activeTab === "runda" && <NyRunda />}
        {activeTab === "historik" && <Historik />}
      </div>
    </div>
  );
}
