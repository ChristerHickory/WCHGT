import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="heading-display text-6xl mb-4" style={{ opacity: 0.3 }}>404</div>
        <h1 className="heading-display text-xl mb-4">Sidan hittades inte</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-cream-muted)" }}>Den här sidan verkar ha hamnat i rough...</p>
        <Link href="/">
          <button className="px-6 py-2.5 rounded font-bold text-sm" style={{ background: "var(--color-gold)", color: "var(--color-green-dark)" }}>
            Tillbaka till startsidan
          </button>
        </Link>
      </div>
    </div>
  );
}
