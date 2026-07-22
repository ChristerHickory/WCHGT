import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Hem from "@/pages/Hem";
import GolfApp from "@/pages/GolfApp";
import OrderOfMerit from "@/pages/OrderOfMerit";
import Tavlingar from "@/pages/Tavlingar";
import Reportage from "@/pages/Reportage";
import ReportageArtikel from "@/pages/ReportageArtikel";
import OmOss from "@/pages/OmOss";
import Kontakt from "@/pages/Kontakt";
import SyfteRegler from "@/pages/SyfteRegler";
import SpelareProfil from "@/pages/SpelareProfil";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function NavBar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Hem" },
    { href: "/app", label: "Golf-appen" },
    { href: "/order-of-merit", label: "OoM" },
    { href: "/tavlingar", label: "Tävlingar" },
    { href: "/reportage", label: "Reportage" },
    { href: "/syfte-regler", label: "Syfte & Regler" },
    { href: "/om-oss", label: "Om oss" },
    { href: "/kontakt", label: "Kontakt" },
  ];

  return (
    <header className="sticky top-0 z-50" style={{ background: "rgba(13, 31, 20, 0.97)", borderBottom: "1px solid rgba(201,162,39,0.3)", backdropFilter: "blur(8px)" }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-label="WCHGT logotyp">
              <circle cx="18" cy="18" r="17" stroke="#C9A227" strokeWidth="1.5"/>
              <circle cx="18" cy="18" r="12" fill="#1A3322"/>
              <path d="M10 18 Q14 12 18 18 Q22 24 26 18" stroke="#C9A227" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="2" fill="#C9A227"/>
              <path d="M26 22 L28 28 L30 22" stroke="#C9A227" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <div className="heading-display text-sm font-bold leading-tight" style={{ color: "var(--color-gold)" }}>
                WEST COAST
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "var(--color-cream-muted)", fontSize: "0.65rem" }}>
                Hickory Golf Tour
              </div>
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}>
              <span
                className="px-3 py-1.5 text-sm rounded transition-all cursor-pointer"
                style={{
                  fontFamily: "var(--font-body)",
                  color: location === l.href ? "var(--color-gold)" : "var(--color-cream-muted)",
                  borderBottom: location === l.href ? "1px solid var(--color-gold)" : "1px solid transparent",
                  letterSpacing: "0.04em",
                }}
              >
                {l.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Mobile menu knapp */}
        <MobileMenu links={links} location={location} />
      </div>
    </header>
  );
}

function MobileMenu({ links, location }: { links: { href: string; label: string }[]; location: string }) {
  return (
    <div className="md:hidden">
      <details className="relative">
        <summary className="list-none cursor-pointer p-2" style={{ color: "var(--color-gold)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </summary>
        <div className="absolute right-0 mt-2 w-52 rounded-lg shadow-xl" style={{ background: "var(--color-green-mid)", border: "1px solid rgba(201,162,39,0.3)" }}>
          {links.map(l => (
            <Link key={l.href} href={l.href}>
              <span className="block px-4 py-3 text-sm border-b cursor-pointer" style={{ color: location === l.href ? "var(--color-gold)" : "var(--color-cream)", borderColor: "rgba(201,162,39,0.1)" }}>
                {l.label}
              </span>
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ background: "var(--color-green-mid)", borderTop: "1px solid rgba(201,162,39,0.2)" }} className="mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="heading-display text-base mb-2">West Coast Hickory Golf Tour</div>
            <p className="text-sm" style={{ color: "var(--color-cream-muted)" }}>
              Hickorygolf i Västsverige sedan 2017. Ett samarbete mellan hickorysällskap och klubbar med målet att främja golfens ursprungliga värderingar.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2 tracking-widest uppercase" style={{ color: "var(--color-gold)" }}>Snabblänkar</div>
            <div className="flex flex-col gap-1">
              {[["/#/tavlingar", "Tävlingsprogram"], ["/#/app", "Golf-appen"], ["/#/reportage", "Reportage"], ["/#/kontakt", "Kontakt"]].map(([href, label]) => (
                <a key={href} href={href} className="text-sm" style={{ color: "var(--color-cream-muted)" }}>{label}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2 tracking-widest uppercase" style={{ color: "var(--color-gold)" }}>Relaterade Tourer</div>
            <div className="flex flex-col gap-1">
              {[["https://www.eastcoastswing.se", "East Coast Swing"], ["https://www.southernhickory.se", "Southern Hickory Tour"], ["https://www.golfhistoriska.se", "SGS"]].map(([href, label]) => (
                <a key={href} href={href} target="_blank" rel="noopener" className="text-sm" style={{ color: "var(--color-cream-muted)" }}>{label} ↗</a>
              ))}
            </div>
          </div>
        </div>
        <hr className="gold-divider mt-6" />
        <p className="text-center text-xs" style={{ color: "var(--color-cream-muted)" }}>
          © 2017–2026 West Coast Hickory Golf Tour
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <NavBar />
        <main>
          <Switch>
            <Route path="/" component={Hem} />
            <Route path="/app" component={GolfApp} />
            <Route path="/order-of-merit" component={OrderOfMerit} />
            <Route path="/tavlingar" component={Tavlingar} />
            <Route path="/reportage" component={Reportage} />
            <Route path="/reportage/:id" component={ReportageArtikel} />
            <Route path="/syfte-regler" component={SyfteRegler} />
            <Route path="/golfare/:id" component={SpelareProfil} />
            <Route path="/om-oss" component={OmOss} />
            <Route path="/kontakt" component={Kontakt} />
            <Route path="/admin" component={Admin} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}
