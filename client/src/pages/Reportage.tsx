type FacebookPost = {
  title: string;
  excerpt: string;
  details: string[];
  url: string;
};

export default function ReportageLista() {
  const facebookPosts: FacebookPost[] = [
    {
      title: "Första Björnhultstävlingen för i år – en stark start på säsongen",
      excerpt:
        "Det påminde nästan om ett kosläpp när de ystra hickoryspelarna äntligen fick börja spela igen. I kuling och kyla skuttade de runt på Björnhults golfklubb i säsongens första tävling.",
      details: [
        "Blåst, kyla och ringrostighet blev en utmaning för många, men kamratskapen var som alltid väldigt god.",
        "Flera efterlängtade comebacker från spelare som varit borta några år dök upp, tillsammans med några nykomlingar som spelade sin första tävling på WCS.",
        "Tävlingsledare Anders Ahlström arrangerade tävlingen på ett fint sätt och det bådar gott inför SM i Matchspel som spelas den 27–28 juni på Björnhults GK.",
        "Texten är hämtad från Facebook-inlägget och fungerar som en kort sammanfattning av starten på säsongen.",
      ],
      url: "https://www.facebook.com/share/p/1C1t3qYTC8/",
    },
    {
      title: "Svenska Hickorymästerskapet i Matchspel – Björnhults GK",
      excerpt:
        "Ulf Svenssons ord om att 'om man inte är där man ska vara, så ska man straffas' fångar stämningen i helgens tävlingar på Björnhults GK där matchspel, tuffa lies, höga temperaturer och regn gjorde det extra utmanande.",
      details: [
        "Matchspel var avgörande hela helgen och allt kunde hända hål för hål, särskilt när bollar hamnade i ruff, kring greenerna eller i bunkrar.",
        "Christer Bergström gjorde sin bästa golftävling och tog sig vidare efter att ha slagit ut två gruppsegrare under söndagens matchdag, innan David Johansson satte stopp för honom.",
        "SM-resultat: David Johansson vann före Michael Dawson och Jonas Svensson, medan Christer Bergström slutade fyra. I Molanders Trophy vann Klas Johansson före Stefan Wardenius och Peder Wahlgren.",
        "Tävlingen arrangerades förträffligt av Svenska Golfhistoriska Sällskapet med Johan Johansson, Christer Ellnemark och Claes Kvist.",
      ],
      url: "https://www.facebook.com/share/p/1C1t3qYTC8/",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--color-gold)" }}>
          Nyheter & Berättelser
        </div>
        <h1 className="heading-display" style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}>
          Reportage
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {facebookPosts.map((post, index) => (
          <a
            key={`${post.title}-${index}`}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-vintage p-6 cursor-pointer h-full flex flex-col transition-transform hover:-translate-y-1"
          >
            <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--color-gold)" }}>
              Facebook-inlägg
            </div>
            <h2 className="heading-display text-base mb-3 flex-1">{post.title}</h2>
            <p className="text-sm mb-4" style={{ color: "var(--color-cream-muted)" }}>
              {post.excerpt}
            </p>
            <ul className="text-sm space-y-2 mb-4" style={{ color: "var(--color-cream-muted)" }}>
              {post.details.map((detail) => (
                <li key={detail} className="flex items-start gap-2">
                  <span style={{ color: "var(--color-gold)" }}>•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
            <div className="text-xs font-semibold mt-auto" style={{ color: "var(--color-gold)" }}>
              Öppna inlägget →
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
