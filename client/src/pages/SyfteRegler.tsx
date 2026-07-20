export default function SyfteRegler() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--color-gold)" }}>
          West Coast Swing
        </div>
        <h1 className="heading-display" style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}>
          Syfte & Regler
        </h1>
      </div>

      <div className="card-vintage p-6 md:p-8 mb-6">
        <h2 className="heading-display text-lg mb-3">Syfte</h2>
        <p className="text-sm leading-7" style={{ color: "var(--color-cream-muted)" }}>
          West Coast Swing (WCS) ska främja intresset för hickoryspel och skapa många välbesökta tävlingar i närområdet. Touren fungerar som en order of merit-tävling i brutto- och nettoklass och är öppen för alla spelare.
        </p>
        <p className="text-sm leading-7 mt-3" style={{ color: "var(--color-cream-muted)" }}>
          Ingen separat anmälan till WCS behövs. Den som deltar i en deltävling deltar automatiskt i WCS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card-vintage p-6">
          <h2 className="heading-display text-lg mb-3">Banans längd</h2>
          <p className="text-sm leading-7" style={{ color: "var(--color-cream-muted)" }}>
            Med hickoryklubbor driver man bollen kortare än med moderna klubbor, varför banan bör anpassas för att upplevas som kul och spelbar. Som tumregel ligger en lagom hickorybana runt 5 300 meter för herrar på en bana med par 72.
          </p>
        </div>

        <div className="card-vintage p-6">
          <h2 className="heading-display text-lg mb-3">Hickory-spelhandicap</h2>
          <p className="text-sm leading-7" style={{ color: "var(--color-cream-muted)" }}>
            Hcp beräknas utifrån spelarens exakta handicap och den huvudsakliga tee som används för tävlingen. Hickory-spelhandicap räknas som 1,4 × antalet erhållna slag, avrundat till närmaste heltal, där 0,50 avrundas uppåt.
          </p>
        </div>
      </div>

      <div className="card-vintage p-6 mb-6">
        <h2 className="heading-display text-lg mb-3">Poängberäkning till Order of Merit</h2>
        <p className="text-sm leading-7" style={{ color: "var(--color-cream-muted)" }}>
          I varje deltävling får spelare placeringpoäng i brutto- och nettoklass. Segrare, tvåor och treor får dessutom bonuspoäng. Resultaten från varje deltävling och totalställningen publiceras på WCS hemsida.
        </p>
        <p className="text-sm leading-7 mt-3" style={{ color: "var(--color-cream-muted)" }}>
          Varje spelare räknar sina bästa poäng från alla tävlingar utom tre. Vid lika resultat avgör bästa placering i en enskild tävling, därefter näst bästa, och så vidare.
        </p>
      </div>

      <div className="card-vintage p-6">
        <h2 className="heading-display text-lg mb-3">Tävlingsledarens ansvar</h2>
        <ul className="text-sm leading-7 list-disc pl-5" style={{ color: "var(--color-cream-muted)" }}>
          <li>Endast spel med klubbor tillverkade före 1935 och som uppfyller SGS-regler tillåts.</li>
          <li>Resultat i brutto- och nettoklass ska redovisas för samtliga deltagare och skickas till ansvariga personer.</li>
          <li>Det ska finnas möjlighet för deltagare att sälja, köpa och byta hickoryutrustning på plats.</li>
        </ul>
      </div>
    </div>
  );
}
