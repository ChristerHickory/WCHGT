export default function Kontakt() {
  const kommitte = [
    { roll: "Tourledare", namn: "Klas Johansson", klubb: "Borås GK", tel: "0705-375354", epost: "klas.johansson@ri.se" },
    { roll: "Sekreterare", namn: "Johan Johansson", klubb: "Falkenbergs GK", tel: "0720-666766", epost: "johan.flogard@gmail.com" },
    { roll: "Kassör", namn: "Vakant", klubb: "", tel: "", epost: "" },
    { roll: "Hemsida & Resultat", namn: "Anders Werneman", klubb: "Vallda G&CC", tel: "0733-163264", epost: "anders@werneman.com" },
    { roll: "Hemsida & Resultat", namn: "Christer Bergström", klubb: "Vallda G&CC", tel: "076-6210371", epost: "christerocheva@live.se" },
    { roll: "Kommunikatör", namn: "Eva Liljegren", klubb: "", tel: "072-8811264", epost: "christerocheva@live.se" },
  ];

  const tavlingsansvariga = [
    { klubb: "Björnhults GK", namn: "Anders Ahlström", tel: "0346-714430", epost: "info@bjornhultsgk.se" },
    { klubb: "Borås GK", namn: "Rickard Larsson", tel: "0739-335217", epost: "rigolf@ymail.com" },
    { klubb: "Falkenbergs GK", namn: "Johan Johansson", tel: "0720-666667", epost: "johan.floagard@gmail.com" },
    { klubb: "Göteborgs GK (Öijared)", namn: "Per Zachrisson", tel: "", epost: "zachrissonper@gmail.com" },
    { klubb: "Göteborgs GK (Setterbergs)", namn: "Gunnar Bagge", tel: "", epost: "gunniguggo@hotmail.com" },
    { klubb: "Hulta GK", namn: "David Kirkham", tel: "0705-204366", epost: "info@hultagk.se" },
    { klubb: "Isabergs GK", namn: "Anders Knutsson", tel: "", epost: "" },
    { klubb: "Lundsbrunn GK", namn: "Johan Arnerfors", tel: "0709-144130", epost: "johan.arnerfors@gmail.com" },
    { klubb: "Marks GK", namn: "Jonas Svensson", tel: "", epost: "jonas.svensson74@gmail.com" },
    { klubb: "Öijared GK", namn: "Per Salomonsson", tel: "0708-979899", epost: "per.vasthav@gmail.com" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--color-gold)" }}>Ta kontakt</div>
        <h1 className="heading-display" style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}>Kontakta oss</h1>
      </div>

      <h2 className="heading-display text-lg mb-4">Exekutivkommittén</h2>
      <div className="card-vintage overflow-hidden mb-10">
        {kommitte.map((p, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 px-4 py-3" style={{ borderBottom: i < kommitte.length - 1 ? "1px solid rgba(201,162,39,0.1)" : "none" }}>
            <div className="sm:w-40">
              <div className="text-xs tracking-wide uppercase" style={{ color: "var(--color-gold)" }}>{p.roll}</div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>{p.namn}</div>
              {p.klubb && <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>{p.klubb}</div>}
            </div>
            <div className="flex flex-col sm:items-end gap-0.5">
              {p.tel && <a href={`tel:${p.tel}`} className="text-xs" style={{ color: "var(--color-cream-muted)" }}>{p.tel}</a>}
              {p.epost && <a href={`mailto:${p.epost}`} className="text-xs" style={{ color: "var(--color-gold)" }}>{p.epost}</a>}
            </div>
          </div>
        ))}
      </div>

      <hr className="gold-divider" />

      <h2 className="heading-display text-lg mb-4 mt-8">Tävlingsansvariga 2026</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tavlingsansvariga.map((t, i) => (
          <div key={i} className="card-vintage p-4">
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--color-gold)" }}>{t.klubb}</div>
            <div className="font-semibold text-sm mb-1" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>{t.namn}</div>
            <div className="flex flex-col gap-0.5">
              {t.tel && <a href={`tel:${t.tel}`} className="text-xs" style={{ color: "var(--color-cream-muted)" }}>{t.tel}</a>}
              {t.epost && <a href={`mailto:${t.epost}`} className="text-xs" style={{ color: "var(--color-gold)" }}>{t.epost}</a>}
            </div>
          </div>
        ))}
      </div>

      <hr className="gold-divider mt-8" />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-lg" style={{ background: "var(--color-green-mid)", border: "1px solid rgba(201,162,39,0.2)" }}>
          <div className="heading-display text-base mb-2">Rapportera resultat</div>
          <p className="text-sm" style={{ color: "var(--color-cream-muted)" }}>
            Tävlingsansvarig rapporterar brutto- och nettopoäng samma dag till:
          </p>
          <div className="mt-2 text-sm" style={{ color: "var(--color-gold)" }}>christerocheva@live.se</div>
          <div className="text-sm" style={{ color: "var(--color-gold)" }}>anders@werneman.com</div>
        </div>
        <div className="p-5 rounded-lg" style={{ background: "var(--color-green-mid)", border: "1px solid rgba(201,162,39,0.2)" }}>
          <div className="heading-display text-base mb-2">Startavgift</div>
          <p className="text-sm mb-2" style={{ color: "var(--color-cream-muted)" }}>
            25 kr per startande betalas till:
          </p>
          <div className="text-sm" style={{ color: "var(--color-cream)" }}>Sparbanken Sjuhärad</div>
          <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>Clear nr: 8032-5</div>
          <div className="text-xs" style={{ color: "var(--color-cream-muted)" }}>Konto: 4 363 779-2</div>
        </div>
      </div>
    </div>
  );
}
