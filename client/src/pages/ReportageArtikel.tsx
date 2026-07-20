import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Reportage } from "@shared/schema";

export default function ReportageArtikel() {
  const { id } = useParams<{ id: string }>();
  const { data: artikel, isLoading } = useQuery<Reportage>({
    queryKey: ["/api/reportage", id],
    queryFn: () => apiRequest("GET", `/api/reportage/${id}`).then(r => r.json()),
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center" style={{ color: "var(--color-cream-muted)" }}>Laddar...</div>;
  if (!artikel) return <div className="max-w-3xl mx-auto px-4 py-16 text-center" style={{ color: "var(--color-cream-muted)" }}>Reportage hittades inte.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/reportage">
        <span className="text-sm cursor-pointer mb-6 inline-block" style={{ color: "var(--color-gold)" }}>← Alla reportage</span>
      </Link>
      <div className="text-xs tracking-widest uppercase mb-3 mt-4" style={{ color: "var(--color-gold)" }}>{artikel.datum}</div>
      <h1 className="heading-display mb-4" style={{ fontSize: "clamp(1.5rem, 4vw, 2.4rem)" }}>{artikel.rubrik}</h1>
      {artikel.ingress && (
        <p className="text-base mb-6 font-semibold" style={{ color: "var(--color-cream-muted)", borderLeft: "3px solid var(--color-gold)", paddingLeft: "1rem" }}>
          {artikel.ingress}
        </p>
      )}
      <hr className="gold-divider" />
      <div className="mt-6 text-base leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-cream)" }}>
        {artikel.innehall}
      </div>
    </div>
  );
}
