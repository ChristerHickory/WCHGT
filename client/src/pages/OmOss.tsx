export default function OmOss() {
  const styrelsemedlemmar = [
    { roll: "Tourledare", namn: "Klas Johansson", klubb: "Borås GK" },
    { roll: "Sekreterare", namn: "Johan Johansson", klubb: "Falkenbergs GK" },
    { roll: "Kassör", namn: "Vakant", klubb: "" },
    { roll: "Hemsida & Resultat", namn: "Anders Werneman", klubb: "Vallda G&CC" },
    { roll: "Hemsida & Resultat", namn: "Christer Bergström", klubb: "Vallda G&CC" },
    { roll: "Kommunikatör", namn: "Eva Liljegren", klubb: "" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--color-gold)" }}>Vår historia</div>
        <h1 className="heading-display" style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}>Om West Coast Hickory Golf Tour</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className="heading-display text-lg mb-3">Vad är WCHGT?</h2>
          <p className="text-sm mb-3" style={{ color: "var(--color-cream-muted)" }}>
            West Coast Hickory Golf Tour är ett samarbete mellan hickorysällskap och klubbar i västra Sverige med mål att skapa välbesökta tävlingar och öka det sociala umgänget med likasinnade.
          </p>
          <p className="text-sm mb-3" style={{ color: "var(--color-cream-muted)" }}>
            Vi spelar med historiska golfklubbor tillverkade före 1935, enligt regler fastställda av Sveriges Golfhistoriska Sällskap (SGS). Vi träffas för att ha trevligt – i samma anda som när golfen spelades för första gången.
          </p>
          <p className="text-sm" style={{ color: "var(--color-cream-muted)" }}>
            Touren startade 2017 och har sedan dess vuxit till en av de ledande hickory-tourerna i Sverige med 12 tävlingar per säsong.
          </p>
        </div>
        <div>
          <h2 className="heading-display text-lg mb-3">Hickory Golf</h2>
          <p className="text-sm mb-3" style={{ color: "var(--color-cream-muted)" }}>
            Hickory golf innebär att man spelar med antika träklubbor med skaft i hickoryträ, precis som man gjorde i golfsportens tidiga dagar. Klubborna är tillverkade före 1935.
          </p>
          <p className="text-sm mb-3" style={{ color: "var(--color-cream-muted)" }}>
            Det är en annan upplevelse – mer känsla, mer teknik, lite kortare slag. Banan rekommenderas vara ca 5 300 meter för herrar.
          </p>
          <p className="text-sm" style={{ color: "var(--color-cream-muted)" }}>
            Anmälan till tävlingar sker via Min Golf på golf.se. Ingen separat WCS-registrering behövs – den som anmäler sig till en tävling är automatiskt med i touren.
          </p>
        </div>
      </div>

      <hr className="gold-divider" />

      <h2 className="heading-display text-lg mb-6 mt-8">Exekutivkommittén</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {styrelsemedlemmar.map((m, i) => (
          <div key={i} className="card-vintage p-4">
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--color-gold)" }}>{m.roll}</div>
            <div className="font-semibold text-sm" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>{m.namn}</div>
            {m.klubb && <div className="text-xs mt-0.5" style={{ color: "var(--color-cream-muted)" }}>{m.klubb}</div>}
          </div>
        ))}
      </div>

      <hr className="gold-divider mt-8" />

      <h2 className="heading-display text-lg mb-4 mt-8">Order of Merit</h2>
      <p className="text-sm mb-3" style={{ color: "var(--color-cream-muted)" }}>
        Poäng i Order of Merit ges efter placering i varje tävling, baserat på antal startande. Alla resultat utom de 3 sämsta räknas mot slutpoängen.
      </p>
      <p className="text-sm" style={{ color: "var(--color-cream-muted)" }}>
        Av årets 12 tävlingar räknas 6 stycken i Order of Merit 2026. Touren avslutas med Tourfinal i september.
      </p>

      <div className="mt-8 p-5 rounded-lg" style={{ background: "var(--color-green-mid)", border: "1px solid rgba(201,162,39,0.2)" }}>
        <div className="heading-display text-base mb-2">Följ oss på Facebook</div>
        <p className="text-sm" style={{ color: "var(--color-cream-muted)" }}>Gå med i vår Facebook-grupp för nyheter, bilder och diskussioner.</p>
        <a href="https://www.facebook.com/groups/1326905394845656/" target="_blank" rel="noopener" className="inline-block mt-3 text-sm font-semibold" style={{ color: "var(--color-gold)" }}>
          Facebook-gruppen →
        </a>
      </div>
    </div>
  );
}
