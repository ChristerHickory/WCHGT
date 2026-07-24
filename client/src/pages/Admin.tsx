import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Golfare, Bana, Tavling, Tavlingsresultat } from "@shared/schema";

const ADMIN_PIN = "wchgt2026";

export default function Admin() {
  const [pinInput, setPinInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [aktiveTab, setAktiveTab] = useState<"golfare" | "banor" | "tavlingar" | "resultat" | "ny-tavling">("golfare");

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <div className="heading-display text-xl mb-6">Admin</div>
        <div className="card-vintage p-6">
          <div className="text-sm mb-4" style={{ color: "var(--color-cream-muted)" }}>Ange PIN för att fortsätta</div>
          <input
            type="password"
            className="w-full rounded px-3 py-2 text-sm mb-4"
            style={{ background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.3)", color: "var(--color-cream)" }}
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && pinInput === ADMIN_PIN && setAuthed(true)}
            placeholder="PIN-kod..."
            data-testid="input-admin-pin"
          />
          <button
            onClick={() => { if (pinInput === ADMIN_PIN) setAuthed(true); }}
            className="w-full py-2 rounded font-bold text-sm"
            style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}
            data-testid="button-admin-login"
          >
            Logga in
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "golfare", label: "Golfare" },
    { key: "banor", label: "Banor" },
    { key: "tavlingar", label: "Tävlingar" },
    { key: "resultat", label: "Resultat" },
    { key: "ny-tavling", label: "✚ Ny tävling" },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="heading-display text-xl">Admin</h1>
        <button onClick={() => setAuthed(false)} className="text-xs" style={{ color: "var(--color-cream-muted)" }}>Logga ut</button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setAktiveTab(t.key)}
            className="px-4 py-2 rounded text-sm font-semibold whitespace-nowrap"
            style={{
              background: aktiveTab === t.key ? "var(--color-gold)" : "transparent",
              color: aktiveTab === t.key ? "var(--color-green-dark)" : "var(--color-cream-muted)",
              border: `1px solid ${aktiveTab === t.key ? "var(--color-gold)" : "rgba(201,162,39,0.3)"}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {aktiveTab === "golfare" && <AdminGolfare />}
      {aktiveTab === "banor" && <AdminBanor />}
      {aktiveTab === "tavlingar" && <AdminTavlingar />}
      {aktiveTab === "resultat" && <AdminResultat />}
      {aktiveTab === "ny-tavling" && <NyTavlingFlode />}
    </div>
  );
}

function AdminGolfare() {
  const { toast } = useToast();
  const { data: golfare } = useQuery<Golfare[]>({ queryKey: ["/api/golfare/alla"] });
  const [form, setForm] = useState({ namn: "", klubb: "", standardHandicap: "" });

  const addMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/golfare", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/golfare"] });
      queryClient.invalidateQueries({ queryKey: ["/api/golfare/alla"] });
      queryClient.invalidateQueries({ queryKey: ["/api/order-of-merit"] });
      toast({ title: "Golfare tillagd!" });
      setForm({ namn: "", klubb: "", standardHandicap: "" });
    },
  });

  const stamspelareMutation = useMutation({
    mutationFn: ({ id, stamspelare }: { id: number; stamspelare: boolean }) =>
      apiRequest("PATCH", `/api/golfare/${id}/stamspelare`, { stamspelare }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/golfare/alla"] }),
  });

  const inputStyle = { background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.375rem", color: "var(--color-cream)", padding: "0.5rem 0.75rem", width: "100%", fontSize: "0.875rem" };
  const antalStam = (golfare ?? []).filter(g => g.stamspelare).length;

  return (
    <div>
      <div className="card-vintage p-5 mb-6">
        <h2 className="heading-display text-base mb-4">Lägg till golfare</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input style={inputStyle} placeholder="Namn" value={form.namn} onChange={e => setForm(f => ({ ...f, namn: e.target.value }))} data-testid="input-golfare-namn" />
          <input style={inputStyle} placeholder="Klubb" value={form.klubb} onChange={e => setForm(f => ({ ...f, klubb: e.target.value }))} />
          <input style={inputStyle} type="number" placeholder="Standard HCP (t.ex. 18.0)" value={form.standardHandicap} onChange={e => setForm(f => ({ ...f, standardHandicap: e.target.value }))} data-testid="input-golfare-hcp" />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--color-cream-muted)" }}>Hickory-HCP beräknas automatiskt som 1,4 × Standard-HCP</p>
        <button onClick={() => addMutation.mutate({ ...form, standardHandicap: Number(form.standardHandicap) })} disabled={!form.namn || !form.standardHandicap} className="mt-3 px-5 py-2 rounded text-sm font-bold" style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }} data-testid="button-add-golfare">
          Lägg till
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="heading-display text-base">Alla golfare ({golfare?.length ?? 0})</h2>
        <span className="text-xs" style={{ color: "var(--color-cream-muted)" }}>{antalStam} stamspelare</span>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--color-cream-muted)" }}>
        Markera golfare som <span style={{ color: "var(--color-gold)", fontWeight: 600 }}>Stamspelare</span> — de laddas in automatiskt i startfältet när du skapar ny tävling.
      </p>
      <div className="flex flex-col gap-2">
        {(golfare ?? []).sort((a, b) => {
          if ((a.stamspelare ? 1 : 0) !== (b.stamspelare ? 1 : 0)) return (b.stamspelare ? 1 : 0) - (a.stamspelare ? 1 : 0);
          return a.namn.localeCompare(b.namn);
        }).map(g => (
          <div key={g.id} className="card-vintage px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm" style={{ color: "var(--color-cream)" }}>{g.namn}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-cream-muted)" }}>
                {g.klubb || "–"} · H-HCP {Number(g.hickoryHandicap ?? 0).toFixed(1)}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none" title="Markera som stamspelare">
              <span className="text-xs font-semibold" style={{ color: g.stamspelare ? "var(--color-gold)" : "var(--color-cream-muted)" }}>
                Stamspelare
              </span>
              <input
                type="checkbox"
                checked={g.stamspelare ?? false}
                onChange={e => stamspelareMutation.mutate({ id: g.id, stamspelare: e.target.checked })}
                className="accent-amber-400 w-4 h-4"
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminBanor() {
  const { toast } = useToast();
  const { data: banor } = useQuery<Bana[]>({ queryKey: ["/api/banor"] });
  const [form, setForm] = useState({ namn: "", ort: "", par: "72", slope: "113", kursrating: "72.0", langd: "" });
  const [redigerarParId, setRedigerarParId] = useState<number | null>(null);
  const [parVarden, setParVarden] = useState<string[]>(Array(18).fill("4"));

  const addMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/banor", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banor"] });
      toast({ title: "Bana tillagd!" });
      setForm({ namn: "", ort: "", par: "72", slope: "113", kursrating: "72.0", langd: "" });
    },
  });

  const parMutation = useMutation({
    mutationFn: ({ id, parPerHal }: { id: number; parPerHal: number[] }) =>
      apiRequest("PATCH", `/api/banor/${id}/par`, { parPerHal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banor"] });
      toast({ title: "Par per hål sparat!" });
      setRedigerarParId(null);
    },
  });

  const inputStyle = { background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.375rem", color: "var(--color-cream)", padding: "0.5rem 0.75rem", width: "100%", fontSize: "0.875rem" };
  const halInputStyle = { background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: "0.25rem", color: "var(--color-cream)", padding: "0.25rem", width: "100%", fontSize: "0.875rem", textAlign: "center" as const, fontFamily: "monospace" };

  function startRedigerarPar(b: Bana) {
    setRedigerarParId(b.id);
    const pars = b.parPerHal ? JSON.parse(b.parPerHal) : Array(18).fill(4);
    setParVarden(pars.map(String));
  }

  return (
    <div>
      <div className="card-vintage p-5 mb-6">
        <h2 className="heading-display text-base mb-4">Lägg till bana</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <input style={{ ...inputStyle }} placeholder="Bannamn" value={form.namn} onChange={e => setForm(f => ({ ...f, namn: e.target.value }))} />
          <input style={{ ...inputStyle }} placeholder="Ort" value={form.ort} onChange={e => setForm(f => ({ ...f, ort: e.target.value }))} />
          <input style={{ ...inputStyle }} type="number" placeholder="Par (72)" value={form.par} onChange={e => setForm(f => ({ ...f, par: e.target.value }))} />
          <input style={{ ...inputStyle }} type="number" placeholder="Slope (113)" value={form.slope} onChange={e => setForm(f => ({ ...f, slope: e.target.value }))} />
          <input style={{ ...inputStyle }} type="number" placeholder="Kursrating (72.0)" value={form.kursrating} onChange={e => setForm(f => ({ ...f, kursrating: e.target.value }))} />
          <input style={{ ...inputStyle }} type="number" placeholder="Längd meter" value={form.langd} onChange={e => setForm(f => ({ ...f, langd: e.target.value }))} />
        </div>
        <button onClick={() => addMutation.mutate({ ...form, par: Number(form.par), slope: Number(form.slope), kursrating: Number(form.kursrating), langd: form.langd ? Number(form.langd) : null })} disabled={!form.namn} className="mt-3 px-5 py-2 rounded text-sm font-bold" style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}>
          Lägg till
        </button>
      </div>

      <h2 className="heading-display text-base mb-3">Registrerade banor</h2>
      <div className="flex flex-col gap-3">
        {banor?.map(b => {
          const pars: number[] = b.parPerHal ? JSON.parse(b.parPerHal) : Array(18).fill(4);
          const totPar = pars.reduce((s, v) => s + v, 0);
          const harPar = !!b.parPerHal;
          return (
            <div key={b.id} className="card-vintage overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-sm" style={{ color: "var(--color-cream)" }}>{b.namn}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-cream-muted)" }}>
                    {b.ort} · Par {totPar} · Slope {b.slope}
                    {harPar && <span style={{ color: "var(--color-gold)" }}> · Par/hål inlagt</span>}
                  </div>
                </div>
                <button onClick={() => redigerarParId === b.id ? setRedigerarParId(null) : startRedigerarPar(b)}
                  className="text-xs px-3 py-1 rounded font-semibold"
                  style={{ background: "rgba(201,162,39,0.15)", color: "var(--color-gold)", border: "1px solid rgba(201,162,39,0.3)" }}>
                  {redigerarParId === b.id ? "Stäng" : harPar ? "Ändra par/hål" : "Lägg in par/hål"}
                </button>
              </div>

              {redigerarParId === b.id && (
                <div className="px-4 pb-4">
                  <div className="text-xs mb-2 font-semibold uppercase tracking-widest" style={{ color: "var(--color-gold)" }}>Par per hål (1–18)</div>
                  <div className="grid grid-cols-9 gap-1 mb-1">
                    {[1,2,3,4,5,6,7,8,9].map(h => (
                      <div key={h} className="text-center text-xs" style={{ color: "var(--color-cream-muted)" }}>{h}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-9 gap-1 mb-2">
                    {parVarden.slice(0,9).map((v, i) => (
                      <input key={i} type="number" min={3} max={6} value={v}
                        onChange={e => setParVarden(prev => prev.map((p, j) => j === i ? e.target.value : p))}
                        style={halInputStyle} />
                    ))}
                  </div>
                  <div className="grid grid-cols-9 gap-1 mb-1">
                    {[10,11,12,13,14,15,16,17,18].map(h => (
                      <div key={h} className="text-center text-xs" style={{ color: "var(--color-cream-muted)" }}>{h}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-9 gap-1 mb-3">
                    {parVarden.slice(9,18).map((v, i) => (
                      <input key={i+9} type="number" min={3} max={6} value={v}
                        onChange={e => setParVarden(prev => prev.map((p, j) => j === i+9 ? e.target.value : p))}
                        style={halInputStyle} />
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => parMutation.mutate({ id: b.id, parPerHal: parVarden.map(Number) })}
                      disabled={parMutation.isPending}
                      className="px-4 py-1.5 rounded text-sm font-bold"
                      style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}>
                      Spara par/hål
                    </button>
                    <span className="text-xs" style={{ color: "var(--color-cream-muted)" }}>
                      Totalt par: {parVarden.reduce((s, v) => s + (Number(v) || 0), 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminTavlingar() {
  const { toast } = useToast();
  const { data: tavlingar } = useQuery<Tavling[]>({ queryKey: ["/api/tavlingar"] });
  const { data: banor } = useQuery<Bana[]>({ queryKey: ["/api/banor"] });
  const emptyForm = { namn: "", banaId: "", datum: "", beskrivning: "", arOrderOfMerit: false };
  const [form, setForm] = useState(emptyForm);
  const [redigerarId, setRedigerarId] = useState<number | null>(null);
  const [redigForm, setRedigForm] = useState(emptyForm);

  const addMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/tavlingar", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tavlingar"] });
      toast({ title: "Tävling tillagd!" });
      setForm(emptyForm);
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      apiRequest("PATCH", `/api/tavlingar/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tavlingar"] });
      toast({ title: "Tävling uppdaterad!" });
      setRedigerarId(null);
    },
  });

  const inputStyle = { background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.375rem", color: "var(--color-cream)", padding: "0.5rem 0.75rem", width: "100%", fontSize: "0.875rem" };

  const sorterade = [...(tavlingar ?? [])].sort((a, b) => a.datum.localeCompare(b.datum));

  function startRedigera(t: Tavling) {
    setRedigerarId(t.id);
    setRedigForm({
      namn: t.namn,
      banaId: t.banaId ? String(t.banaId) : "",
      datum: t.datum,
      beskrivning: t.beskrivning ?? "",
      arOrderOfMerit: t.arOrderOfMerit ?? false,
    });
  }

  return (
    <div>
      <div className="card-vintage p-5 mb-6">
        <h2 className="heading-display text-base mb-4">Lägg till tävling</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input style={inputStyle} placeholder="Tävlingsnamn" value={form.namn} onChange={e => setForm(f => ({ ...f, namn: e.target.value }))} />
          <input style={inputStyle} type="date" value={form.datum} onChange={e => setForm(f => ({ ...f, datum: e.target.value }))} />
          <select style={inputStyle} value={form.banaId} onChange={e => setForm(f => ({ ...f, banaId: e.target.value }))}>
            <option value="">Välj bana (valfritt)</option>
            {banor?.map(b => <option key={b.id} value={b.id}>{b.namn}</option>)}
          </select>
          <input style={inputStyle} placeholder="Beskrivning (valfritt)" value={form.beskrivning} onChange={e => setForm(f => ({ ...f, beskrivning: e.target.value }))} />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input type="checkbox" id="oom-ny" checked={form.arOrderOfMerit} onChange={e => setForm(f => ({ ...f, arOrderOfMerit: e.target.checked }))} />
          <label htmlFor="oom-ny" className="text-sm" style={{ color: "var(--color-cream-muted)" }}>Räknas i Order of Merit</label>
        </div>
        <button
          onClick={() => addMutation.mutate({ ...form, banaId: form.banaId ? Number(form.banaId) : null })}
          disabled={!form.namn || !form.datum || addMutation.isPending}
          className="mt-3 px-5 py-2 rounded text-sm font-bold"
          style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}
        >
          Lägg till
        </button>
      </div>

      <h2 className="heading-display text-base mb-3">Alla tävlingar</h2>
      <div className="flex flex-col gap-2">
        {sorterade.map(t => (
          <div key={t.id} className="card-vintage overflow-hidden">
            {redigerarId !== t.id ? (
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>{t.namn}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-cream-muted)" }}>{t.datum}{t.beskrivning ? " · " + t.beskrivning : ""}</div>
                </div>
                <div className="flex gap-2 items-center flex-shrink-0">
                  {t.arOrderOfMerit && <span className="badge-gold">OoM</span>}
                  {t.avslutad
                    ? <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: "rgba(201,162,39,0.15)", color: "var(--color-gold)" }}>Avslutad</span>
                    : <button
                        onClick={() => patchMutation.mutate({ id: t.id, data: { avslutad: true } })}
                        className="text-xs px-2 py-1 rounded font-semibold hover:opacity-80 transition-opacity"
                        style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-cream-muted)", border: "1px solid rgba(201,162,39,0.2)" }}
                      >
                        Markera klar
                      </button>
                  }
                  <button
                    onClick={() => startRedigera(t)}
                    className="text-xs px-2 py-1 rounded font-semibold hover:opacity-80 transition-opacity"
                    style={{ background: "rgba(201,162,39,0.15)", color: "var(--color-gold)", border: "1px solid rgba(201,162,39,0.3)" }}
                  >
                    Redigera
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: "var(--color-gold)" }}>Redigera tävling</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input style={inputStyle} placeholder="Tävlingsnamn" value={redigForm.namn} onChange={e => setRedigForm(f => ({ ...f, namn: e.target.value }))} />
                  <input style={inputStyle} type="date" value={redigForm.datum} onChange={e => setRedigForm(f => ({ ...f, datum: e.target.value }))} />
                  <select style={inputStyle} value={redigForm.banaId} onChange={e => setRedigForm(f => ({ ...f, banaId: e.target.value }))}>
                    <option value="">Välj bana (valfritt)</option>
                    {banor?.map(b => <option key={b.id} value={b.id}>{b.namn}</option>)}
                  </select>
                  <input style={inputStyle} placeholder="Beskrivning (valfritt)" value={redigForm.beskrivning} onChange={e => setRedigForm(f => ({ ...f, beskrivning: e.target.value }))} />
                </div>
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <label className="flex items-center gap-2 text-sm" style={{ color: "var(--color-cream-muted)" }}>
                    <input type="checkbox" checked={redigForm.arOrderOfMerit} onChange={e => setRedigForm(f => ({ ...f, arOrderOfMerit: e.target.checked }))} />
                    Räknas i Order of Merit
                  </label>
                  <label className="flex items-center gap-2 text-sm" style={{ color: "var(--color-cream-muted)" }}>
                    <input type="checkbox" checked={t.avslutad ?? false} onChange={e => patchMutation.mutate({ id: t.id, data: { avslutad: e.target.checked } })} />
                    Avslutad
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => patchMutation.mutate({ id: t.id, data: { ...redigForm, banaId: redigForm.banaId ? Number(redigForm.banaId) : null } })}
                    disabled={!redigForm.namn || !redigForm.datum || patchMutation.isPending}
                    className="px-4 py-1.5 rounded text-sm font-bold"
                    style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => setRedigerarId(null)}
                    className="px-4 py-1.5 rounded text-sm"
                    style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-cream-muted)" }}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminResultat() {
  const { toast } = useToast();
  const { data: tavlingar } = useQuery<Tavling[]>({ queryKey: ["/api/tavlingar"] });
  const { data: golfare } = useQuery<Golfare[]>({ queryKey: ["/api/golfare"] });
  const [valtTavlingId, setValtTavlingId] = useState("");
  const [form, setForm] = useState({ golfareId: "", bruttoscore: "", orderOfMeritPoang: "" });

  const valdTavling = tavlingar?.find(t => t.id === Number(valtTavlingId));
  const { data: befintligaResultat } = useQuery<Tavlingsresultat[]>({
    queryKey: ["/api/tavlingar", valtTavlingId, "resultat"],
    queryFn: () => apiRequest("GET", `/api/tavlingar/${valtTavlingId}/resultat`).then(r => r.json()),
    enabled: !!valtTavlingId,
  });

  const valtGolfare = golfare?.find(g => g.id === Number(form.golfareId));

  const mutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/tavlingsresultat", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tavlingar", valtTavlingId, "resultat"] });
      toast({ title: "Resultat sparat!" });
      setForm({ golfareId: "", bruttoscore: "", orderOfMeritPoang: "" });
    },
  });

  const inputStyle = { background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.375rem", color: "var(--color-cream)", padding: "0.5rem 0.75rem", width: "100%", fontSize: "0.875rem" };

  return (
    <div>
      <div className="card-vintage p-5 mb-6">
        <h2 className="heading-display text-base mb-4">Lägg in tävlingsresultat</h2>
        <select style={{ ...inputStyle, marginBottom: "0.75rem" }} value={valtTavlingId} onChange={e => setValtTavlingId(e.target.value)}>
          <option value="">Välj tävling...</option>
          {tavlingar?.map(t => <option key={t.id} value={t.id}>{t.namn} ({t.datum})</option>)}
        </select>
        {valtTavlingId && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select style={inputStyle} value={form.golfareId} onChange={e => setForm(f => ({ ...f, golfareId: e.target.value }))}>
              <option value="">Välj golfare...</option>
              {golfare?.map(g => <option key={g.id} value={g.id}>{g.namn}</option>)}
            </select>
            <input style={inputStyle} type="number" placeholder="Bruttoscore" value={form.bruttoscore} onChange={e => setForm(f => ({ ...f, bruttoscore: e.target.value }))} />
            <input style={inputStyle} type="number" placeholder="OoM-poäng (valfritt)" value={form.orderOfMeritPoang} onChange={e => setForm(f => ({ ...f, orderOfMeritPoang: e.target.value }))} />
          </div>
        )}
        {valtGolfare && form.bruttoscore && (
          <p className="text-xs mt-2" style={{ color: "var(--color-cream-muted)" }}>
            Netto beräknas automatiskt baserat på H-HCP ({valtGolfare.hickoryHandicap.toFixed(1)}) och banans slope.
          </p>
        )}
        {valtTavlingId && (
          <button onClick={() => mutation.mutate({ tavlingId: Number(valtTavlingId), golfareId: Number(form.golfareId), bruttoscore: Number(form.bruttoscore), hickoryHandicapVid: valtGolfare?.hickoryHandicap ?? 36, orderOfMeritPoang: form.orderOfMeritPoang ? Number(form.orderOfMeritPoang) : null })} disabled={!form.golfareId || !form.bruttoscore} className="mt-3 px-5 py-2 rounded text-sm font-bold" style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}>
            Spara resultat
          </button>
        )}
      </div>

      {valtTavlingId && befintligaResultat && befintligaResultat.length > 0 && (
        <div>
          <h2 className="heading-display text-base mb-3">Resultat: {valdTavling?.namn}</h2>
          <div className="card-vintage overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.2)" }}>
                  {["Golfare", "Brutto", "Netto", "H-HCP", "OoM"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: "var(--color-gold)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {befintligaResultat.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid rgba(201,162,39,0.06)" }}>
                    <td className="px-4 py-2" style={{ color: "var(--color-cream)" }}>{golfare?.find(g => g.id === r.golfareId)?.namn ?? "Okänd"}</td>
                    <td className="px-4 py-2 font-mono" style={{ color: "var(--color-cream)" }}>{r.bruttoscore}</td>
                    <td className="px-4 py-2 font-mono font-bold" style={{ color: "var(--color-gold)" }}>{r.nettoscore != null ? Math.round(r.nettoscore) : "–"}</td>
                    <td className="px-4 py-2 font-mono text-xs" style={{ color: "var(--color-cream-muted)" }}>{r.hickoryHandicapVid.toFixed(1)}</td>
                    <td className="px-4 py-2" style={{ color: "var(--color-cream-muted)" }}>{r.orderOfMeritPoang ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ny Tävling – Setup-flöde ─────────────────────────────────────────────

type Steg = 1 | 2 | 3 | 4;

interface Deltagare {
  golfareId: number;
  namn: string;
  hhcp: number;
  brutto: string;
  countback: number[]; // hål 10-18 vid behov
}

function oomPoang(plats: number, antalDeltagare: number): number {
  // Bonus baserat på placering: 1:a +3, 2:a +2, 3:a +1, 4+ +0
  let bonus = 0;
  if (plats === 1) bonus = 3;
  else if (plats === 2) bonus = 2;
  else if (plats === 3) bonus = 1;
  
  const poang = antalDeltagare - plats + bonus;
  return Math.max(1, poang); // Minimum 1 poäng
}

function raknaPlaceringar(
  deltagare: Deltagare[],
  typ: "brutto" | "netto"
): Map<number, number> {
  const sorted = [...deltagare]
    .filter(d => d.brutto !== "")
    .map(d => {
      const brutto = Number(d.brutto);
      const netto = Math.round(brutto - d.hhcp);
      const score = typ === "brutto" ? brutto : netto;
      return { golfareId: d.golfareId, score, countback: d.countback };
    })
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      // Countback: jämför sista 9, 6, 3, 1 om tillgängligt
      const windows = [9, 6, 3, 1];
      for (const w of windows) {
        if (a.countback.length >= w && b.countback.length >= w) {
          const aSum = a.countback.slice(-w).reduce((s, v) => s + v, 0);
          const bSum = b.countback.slice(-w).reduce((s, v) => s + v, 0);
          if (aSum !== bSum) return aSum - bSum;
        }
      }
      return 0;
    });

  const placMap = new Map<number, number>();
  let plats = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].score === sorted[i - 1].score) {
      // Dela placeringen med föregående
      placMap.set(sorted[i].golfareId, placMap.get(sorted[i - 1].golfareId)!);
    } else {
      placMap.set(sorted[i].golfareId, plats);
    }
    plats++;
  }
  return placMap;
}

function NyTavlingFlode() {
  const { toast } = useToast();
  const { data: alleGolfare } = useQuery<Golfare[]>({ queryKey: ["/api/golfare/alla"] });
  const { data: banor } = useQuery<Bana[]>({ queryKey: ["/api/banor"] });

  const [steg, setSteg] = useState<Steg>(1);
  const [tavlingForm, setTavlingForm] = useState({ namn: "", datum: "", banaId: "", beskrivning: "", arOrderOfMerit: true });
  const [skapadTavlingId, setSkapadTavlingId] = useState<number | null>(null);
  const [deltagare, setDeltagare] = useState<Deltagare[]>([]);
  const [sokTerm, setSokTerm] = useState("");
  const [countbackModal, setCountbackModal] = useState<{ ids: number[]; typ: "brutto" | "netto" } | null>(null);

  const inputStyle = { background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.375rem", color: "var(--color-cream)", padding: "0.5rem 0.75rem", width: "100%", fontSize: "0.875rem" };

  const skapasTavlingMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/tavlingar", data),
    onSuccess: (data: Tavling) => {
      setSkapadTavlingId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/tavlingar"] });
      // Preloada stamspelare som deltagare
      const stamspelarna = (alleGolfare ?? []).filter(g => g.stamspelare);
      setDeltagare(stamspelarna.map(g => ({
        golfareId: g.id,
        namn: g.namn,
        hhcp: Number(g.hickoryHandicap ?? 0),
        brutto: "",
        countback: [],
      })));
      setSteg(2);
    },
  });

  const sparaResultatMutation = useMutation({
    mutationFn: ({ tavId, resultat }: { tavId: number; resultat: object[] }) =>
      apiRequest("POST", `/api/tavlingar/${tavId}/resultat/bulk`, { resultat }),
    onSuccess: () => {
      // Mark as avslutad
      if (skapadTavlingId) {
        apiRequest("PATCH", `/api/tavlingar/${skapadTavlingId}`, { avslutad: true });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/tavlingar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/order-of-merit"] });
      toast({ title: "Tävling sparad!", description: "Resultat och OoM uppdaterade." });
      setSteg(4);
    },
    onError: () => toast({ title: "Fel", description: "Kunde inte spara resultaten." }),
  });

  // Golfare som INTE redan lagts till
  const filtreradeGolfare = (alleGolfare ?? []).filter(g => {
    const ej = deltagare.some(d => d.golfareId === g.id);
    if (ej) return false;
    if (!sokTerm) return true;
    return g.namn.toLowerCase().includes(sokTerm.toLowerCase());
  });

  function laggTillDeltagare(g: Golfare) {
    setDeltagare(prev => [...prev, {
      golfareId: g.id,
      namn: g.namn,
      hhcp: g.hickoryHandicap ?? 0,
      brutto: "",
      countback: [],
    }]);
    setSokTerm("");
  }

  function taBortDeltagare(id: number) {
    setDeltagare(prev => prev.filter(d => d.golfareId !== id));
  }

  function uppdateraHhcp(id: number, val: string) {
    setDeltagare(prev => prev.map(d => d.golfareId === id ? { ...d, hhcp: Number(val) } : d));
  }

  function uppdateraBrutto(id: number, val: string) {
    setDeltagare(prev => prev.map(d => d.golfareId === id ? { ...d, brutto: val } : d));
  }

  // Beräkna placeringar och kolla om countback behövs
  const nettoPlacer = raknaPlaceringar(deltagare, "netto");
  const bruttoPlacer = raknaPlaceringar(deltagare, "brutto");

  // Hitta lika-score-grupper som saknar countback
  function hittaLika(typ: "brutto" | "netto"): number[] {
    const placer = typ === "brutto" ? bruttoPlacer : nettoPlacer;
    const groups = new Map<number, number[]>();
    for (const [gId, plats] of placer.entries()) {
      if (!groups.has(plats)) groups.set(plats, []);
      groups.get(plats)!.push(gId);
    }
    for (const [, ids] of groups.entries()) {
      if (ids.length > 1) {
        // Kolla om de saknar countback
        const saknarCb = ids.filter(id => {
          const d = deltagare.find(x => x.golfareId === id);
          return !d || d.countback.length === 0;
        });
        if (saknarCb.length > 1) return saknarCb;
      }
    }
    return [];
  }

  const likaIBrutto = hittaLika("brutto");
  const likaINetto = hittaLika("netto");

  function sparaAllt() {
    if (!skapadTavlingId) return;
    const deltagareMedResultat = deltagare.filter(d => d.brutto !== "");
    const antalDeltagare = deltagareMedResultat.length;
    const resultat = deltagareMedResultat
      .map(d => {
        const brutto = Number(d.brutto);
        const netto = Math.round(brutto - d.hhcp);
        const nettoPlats = nettoPlacer.get(d.golfareId) ?? 99;
        const bruttoPlats = bruttoPlacer.get(d.golfareId) ?? 99;
        return {
          golfareId: d.golfareId,
          bruttoscore: brutto,
          nettoscore: netto,
          hickoryHandicapVid: d.hhcp,
          placering: nettoPlats,
          orderOfMeritPoang: oomPoang(nettoPlats, antalDeltagare),
          bruttoPlacering: bruttoPlats,
          bruttoOmPoang: oomPoang(bruttoPlats, antalDeltagare),
        };
      });
    sparaResultatMutation.mutate({ tavId: skapadTavlingId, resultat });
  }

  const stegLabels = ["Skapa tävling", "Lägg till deltagare", "Mata in resultat", "Klart"];

  return (
    <div className="max-w-2xl">
      {/* Steg-indikator */}
      <div className="flex items-center gap-2 mb-8">
        {stegLabels.map((label, i) => {
          const s = (i + 1) as Steg;
          const aktiv = steg === s;
          const klar = steg > s;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: klar ? "var(--color-gold)" : aktiv ? "var(--color-gold)" : "rgba(255,255,255,0.1)", color: klar || aktiv ? "var(--color-green-dark)" : "var(--color-cream-muted)" }}>
                  {klar ? "✓" : s}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: aktiv ? "var(--color-cream)" : "var(--color-cream-muted)" }}>{label}</span>
              </div>
              {i < stegLabels.length - 1 && <div className="w-6 h-px" style={{ background: "rgba(201,162,39,0.3)" }} />}
            </div>
          );
        })}
      </div>

      {/* STEG 1: Skapa tävling */}
      {steg === 1 && (
        <div className="card-vintage p-6">
          <h2 className="heading-display text-base mb-5">Steg 1 — Skapa tävling</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <input style={inputStyle} placeholder="Tävlingsnamn *" value={tavlingForm.namn} onChange={e => setTavlingForm(f => ({ ...f, namn: e.target.value }))} />
            <input style={inputStyle} type="date" value={tavlingForm.datum} onChange={e => setTavlingForm(f => ({ ...f, datum: e.target.value }))} />
            <select style={inputStyle} value={tavlingForm.banaId} onChange={e => setTavlingForm(f => ({ ...f, banaId: e.target.value }))}>
              <option value="">Välj bana (valfritt)</option>
              {banor?.map(b => <option key={b.id} value={b.id}>{b.namn}</option>)}
            </select>
            <input style={inputStyle} placeholder="Beskrivning (valfritt)" value={tavlingForm.beskrivning} onChange={e => setTavlingForm(f => ({ ...f, beskrivning: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm mb-5" style={{ color: "var(--color-cream-muted)" }}>
            <input type="checkbox" checked={tavlingForm.arOrderOfMerit} onChange={e => setTavlingForm(f => ({ ...f, arOrderOfMerit: e.target.checked }))} />
            Räknas i Order of Merit
          </label>
          <button
            onClick={() => skapasTavlingMutation.mutate({ ...tavlingForm, banaId: tavlingForm.banaId ? Number(tavlingForm.banaId) : null, avslutad: false })}
            disabled={!tavlingForm.namn || !tavlingForm.datum || skapasTavlingMutation.isPending}
            className="px-6 py-2 rounded font-bold text-sm"
            style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}
          >
            Skapa & gå vidare →
          </button>
        </div>
      )}

      {/* STEG 2: Lägg till deltagare */}
      {steg === 2 && (
        <div>
          <div className="card-vintage p-6 mb-4">
            <h2 className="heading-display text-base mb-1">Steg 2 — Deltagare</h2>
            <p className="text-xs mb-4" style={{ color: "var(--color-cream-muted)" }}>Sök och lägg till golfare. H-HCP kan justeras per tävling.</p>
            <div className="relative mb-3">
              <input style={inputStyle} placeholder="Sök golfare..." value={sokTerm} onChange={e => setSokTerm(e.target.value)} />
              {sokTerm && (
                <div className="absolute left-0 right-0 top-full z-20 rounded-b overflow-hidden shadow-lg" style={{ background: "var(--color-green-mid)", border: "1px solid rgba(201,162,39,0.3)", maxHeight: "220px", overflowY: "auto" }}>
                  {filtreradeGolfare.slice(0, 20).map(g => (
                    <button key={g.id} onClick={() => laggTillDeltagare(g)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 flex justify-between"
                      style={{ color: "var(--color-cream)" }}>
                      <span>{g.namn}</span>
                      <span style={{ color: "var(--color-cream-muted)" }}>H-HCP {g.hickoryHandicap ?? 0}</span>
                    </button>
                  ))}
                  {filtreradeGolfare.length === 0 && <div className="px-4 py-2 text-sm" style={{ color: "var(--color-cream-muted)" }}>Inga träffar</div>}
                </div>
              )}
            </div>
            <div className="text-xs mb-1" style={{ color: "var(--color-cream-muted)" }}>{deltagare.length} deltagare tillagda</div>
          </div>

          {deltagare.length > 0 && (
            <div className="card-vintage overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.2)", background: "rgba(0,0,0,0.2)" }}>
                    <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: "var(--color-gold)" }}>Golfare</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold w-28" style={{ color: "var(--color-gold)" }}>H-HCP</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {deltagare.map(d => (
                    <tr key={d.golfareId} style={{ borderBottom: "1px solid rgba(201,162,39,0.06)" }}>
                      <td className="px-4 py-2" style={{ color: "var(--color-cream)" }}>{d.namn}</td>
                      <td className="px-4 py-2">
                        <input type="number" step="0.5" value={d.hhcp}
                          onChange={e => uppdateraHhcp(d.golfareId, e.target.value)}
                          className="text-right rounded px-2 py-1 text-sm w-20 ml-auto block font-mono"
                          style={{ background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.2)", color: "var(--color-cream)" }} />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => taBortDeltagare(d.golfareId)} className="text-xs hover:opacity-70" style={{ color: "var(--color-cream-muted)" }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setSteg(1)} className="px-4 py-2 rounded text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-cream-muted)" }}>← Tillbaka</button>
            <button onClick={() => setSteg(3)} disabled={deltagare.length === 0}
              className="px-6 py-2 rounded font-bold text-sm" style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}>
              Gå till resultat ({deltagare.length} st) →
            </button>
          </div>
        </div>
      )}

      {/* STEG 3: Mata in resultat */}
      {steg === 3 && (
        <div>
          <div className="card-vintage p-5 mb-4">
            <h2 className="heading-display text-base mb-1">Steg 3 — Resultat</h2>
            <p className="text-xs" style={{ color: "var(--color-cream-muted)" }}>Ange bruttoscore. Netto räknas automatiskt. Placeringar beräknas när du sparar.</p>
          </div>

          {/* Countback-varningar */}
          {likaIBrutto.length > 1 && (
            <div className="mb-3 p-3 rounded text-sm" style={{ background: "rgba(201,162,39,0.12)", border: "1px solid rgba(201,162,39,0.4)", color: "var(--color-gold)" }}>
              Lika bruttoscore — countback behövs för:{" "}
              <strong>{likaIBrutto.map(id => deltagare.find(d => d.golfareId === id)?.namn).join(", ")}</strong>
              <button onClick={() => setCountbackModal({ ids: likaIBrutto, typ: "brutto" })}
                className="ml-3 px-2 py-0.5 rounded text-xs font-bold"
                style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}>
                Ange sista 9 hål
              </button>
            </div>
          )}
          {likaINetto.length > 1 && (
            <div className="mb-3 p-3 rounded text-sm" style={{ background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.3)", color: "var(--color-gold)" }}>
              Lika nettoscore — countback behövs för:{" "}
              <strong>{likaINetto.map(id => deltagare.find(d => d.golfareId === id)?.namn).join(", ")}</strong>
              <button onClick={() => setCountbackModal({ ids: likaINetto, typ: "netto" })}
                className="ml-3 px-2 py-0.5 rounded text-xs font-bold"
                style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}>
                Ange sista 9 hål
              </button>
            </div>
          )}

          <div className="card-vintage overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.2)", background: "rgba(0,0,0,0.2)" }}>
                  <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: "var(--color-gold)" }}>Golfare</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold" style={{ color: "var(--color-gold)" }}>H-HCP</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold" style={{ color: "var(--color-gold)" }}>Brutto</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold" style={{ color: "var(--color-gold)" }}>Netto</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold hidden sm:table-cell" style={{ color: "var(--color-gold)" }}>N-Plats</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold hidden sm:table-cell" style={{ color: "var(--color-gold)" }}>B-Plats</th>
                </tr>
              </thead>
              <tbody>
                {deltagare.map(d => {
                  const brutto = Number(d.brutto);
                  const netto = d.brutto !== "" ? Math.round(brutto - d.hhcp) : null;
                  const nPlats = nettoPlacer.get(d.golfareId);
                  const bPlats = bruttoPlacer.get(d.golfareId);
                  return (
                    <tr key={d.golfareId} style={{ borderBottom: "1px solid rgba(201,162,39,0.06)" }}>
                      <td className="px-4 py-2" style={{ color: "var(--color-cream)" }}>{d.namn}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs" style={{ color: "var(--color-cream-muted)" }}>{d.hhcp}</td>
                      <td className="px-3 py-2">
                        <input type="number" value={d.brutto}
                          onChange={e => uppdateraBrutto(d.golfareId, e.target.value)}
                          placeholder="–"
                          className="text-right rounded px-2 py-1 text-sm w-16 ml-auto block font-mono"
                          style={{ background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.2)", color: "var(--color-cream)" }} />
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm font-bold" style={{ color: netto !== null ? "var(--color-cream)" : "var(--color-cream-muted)" }}>
                        {netto ?? "–"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs hidden sm:table-cell" style={{ color: "var(--color-gold)" }}>
                        {nPlats !== undefined ? `${nPlats}.` : "–"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs hidden sm:table-cell" style={{ color: "var(--color-cream-muted)" }}>
                        {bPlats !== undefined ? `${bPlats}.` : "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setSteg(2)} className="px-4 py-2 rounded text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-cream-muted)" }}>← Tillbaka</button>
            <button
              onClick={sparaAllt}
              disabled={deltagare.filter(d => d.brutto !== "").length === 0 || sparaResultatMutation.isPending}
              className="px-6 py-2 rounded font-bold text-sm"
              style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}>
              {sparaResultatMutation.isPending ? "Sparar..." : `Spara resultat (${deltagare.filter(d => d.brutto !== "").length} st) →`}
            </button>
          </div>

          {/* Countback-modal */}
          {countbackModal && (
            <CountbackModal
              ids={countbackModal.ids}
              typ={countbackModal.typ}
              deltagare={deltagare}
              onSave={(updates) => {
                setDeltagare(prev => prev.map(d => {
                  const u = updates.find(x => x.golfareId === d.golfareId);
                  return u ? { ...d, countback: u.countback } : d;
                }));
                setCountbackModal(null);
              }}
              onClose={() => setCountbackModal(null)}
            />
          )}
        </div>
      )}

      {/* STEG 4: Klart */}
      {steg === 4 && (
        <div className="card-vintage p-8 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="heading-display text-xl mb-3">Tävling sparad!</h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-cream-muted)" }}>Resultat, placeringar och OoM-poäng är uppdaterade.</p>
          <div className="flex gap-3 justify-center">
            <a href="/#/tavlingar" className="px-5 py-2 rounded font-bold text-sm" style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}>
              Se tävlingssidan →
            </a>
            <button onClick={() => { setSteg(1); setSkapadTavlingId(null); setDeltagare([]); setTavlingForm({ namn: "", datum: "", banaId: "", beskrivning: "", arOrderOfMerit: true }); }}
              className="px-5 py-2 rounded text-sm"
              style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-cream-muted)" }}>
              Ny tävling
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CountbackModal({ ids, typ, deltagare, onSave, onClose }: {
  ids: number[];
  typ: "brutto" | "netto";
  deltagare: Deltagare[];
  onSave: (updates: { golfareId: number; countback: number[] }[]) => void;
  onClose: () => void;
}) {
  const berordaDelt = deltagare.filter(d => ids.includes(d.golfareId));
  const [hal, setHal] = useState<Record<number, string[]>>(
    Object.fromEntries(berordaDelt.map(d => [d.golfareId, Array(9).fill("")]))
  );

  function uppdateraHal(gId: number, index: number, val: string) {
    setHal(prev => ({ ...prev, [gId]: prev[gId].map((v, i) => i === index ? val : v) }));
  }

  function spara() {
    const updates = berordaDelt.map(d => ({
      golfareId: d.golfareId,
      countback: hal[d.golfareId].map(Number).filter(v => !isNaN(v) && v > 0),
    }));
    onSave(updates);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="card-vintage p-6 w-full max-w-lg mx-4">
        <h3 className="heading-display text-base mb-1">Countback — {typ === "brutto" ? "Brutto" : "Netto"}</h3>
        <p className="text-xs mb-5" style={{ color: "var(--color-cream-muted)" }}>Ange score för hål 10–18 per spelare (lämna tomt om ej känt)</p>
        <div className="mb-4">
          <div className="grid grid-cols-10 gap-1 text-xs text-center mb-1" style={{ color: "var(--color-cream-muted)" }}>
            <div className="text-left">Spelare</div>
            {[10,11,12,13,14,15,16,17,18].map(h => <div key={h}>{h}</div>)}
          </div>
          {berordaDelt.map(d => (
            <div key={d.golfareId} className="grid grid-cols-10 gap-1 mb-2 items-center">
              <div className="text-xs truncate" style={{ color: "var(--color-cream)" }}>{d.namn.split(" ")[0]}</div>
              {hal[d.golfareId].map((v, i) => (
                <input key={i} type="number" value={v}
                  onChange={e => uppdateraHal(d.golfareId, i, e.target.value)}
                  className="text-center rounded text-xs py-1 font-mono w-full"
                  style={{ background: "var(--color-green-light)", border: "1px solid rgba(201,162,39,0.2)", color: "var(--color-cream)" }} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={spara} className="px-5 py-2 rounded font-bold text-sm" style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}>Spara countback</button>
          <button onClick={onClose} className="px-4 py-2 rounded text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-cream-muted)" }}>Avbryt</button>
        </div>
      </div>
    </div>
  );
}
