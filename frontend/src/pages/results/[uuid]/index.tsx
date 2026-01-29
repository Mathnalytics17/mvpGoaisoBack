"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import LeadGateModal from "../../../components/modals/LeadGateModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// 🎨 Colores distintos
const COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#8b5cf6", // violet
  "#84cc16", // lime
  "#f97316", // orange
];

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. (Rellena este texto con tu explicación.)";

export interface Metrics {
  totalEvaluations: number;
  topBrand: string;
  topShare: number;
  uniqueBrands: number;
}

export interface RankingRow {
  [position: string]: string;
}

export interface Phase2CriterionResults {
  criterion: string;
  results: RankingRow[];
}

export interface SummaryBrand {
  name: string;
  score: number;
  share: number;
}


export interface SummaryModel {
  name: string;
  score: number;
  share: number;
}

export interface Phase1Summary {
  topBrands: SummaryBrand[];
  topModels: SummaryModel[];
}

export interface Phase2Summary {
  criterion: string;
  topBrands: SummaryBrand[];
}

export interface Matrix {
  brands: string[];
  criteria: string[];
  // ranks[criterion][brandDisplay] = rank | null
  ranks: Record<string, Record<string, number | null>>;
}

export interface EvaluationReportResponse {
  uuid: string;
  product_type: string;
  timestamp: string;
  status: string;
  metrics: Metrics;
  phase1_results: RankingRow[];
  phase2_results: Phase2CriterionResults[];
  phase1: Phase1Summary;
  phase2: Phase2Summary[];
  matrix: Matrix;
}

function InfoTip({ text = LOREM }: { text?: string }) {
  return (
    <span
      title={text}
      aria-label="info"
      className="inline-flex items-center justify-center ml-2 w-5 h-5 rounded-full border border-white/15 bg-white/5 text-white/70 text-xs cursor-help select-none"
    >
      i
    </span>
  );
}

export default function ResultsPage() {
  const params = useParams();
  const uuid = (params?.uuid as string | undefined) ?? undefined;

  const [data, setData] = useState<EvaluationReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const isPdf = searchParams?.get("pdf") === "1";

  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!uuid) return;

    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/api/results/${uuid}/report/`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Error al cargar resultados");
        return json as EvaluationReportResponse;
      })
      .then((report) => setData(report))
      .catch((err: any) => setError(err?.message || "Error inesperado"))
      .finally(() => setLoading(false));
  }, [uuid]);

  useEffect(() => {
    if (!uuid) return;
    const saved = localStorage.getItem(`goaiso:report_unlocked:${uuid}`);
    if (saved === "1") setUnlocked(true);
  }, [uuid]);

  const handleUnlock = async (payload: { name: string; email: string; phone?: string }) => {
    if (!uuid) return;

    await fetch(`${API_BASE_URL}/api/results/report/users/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uuid,
        nombre: payload.name,
        email: payload.email,
        movil: payload.phone || "",
      }),
    });

    localStorage.setItem(`goaiso:report_unlocked:${uuid}`, "1");
    setUnlocked(true);
  };

  const phase1BrandPie = useMemo(() => {
    if (!data) return [];
    return data.phase1.topBrands.map((b) => ({
      name: b.name,
      share: b.share,
      score: b.score,
    }));
  }, [data]);

  const phase1ModelBars = useMemo(() => {
    if (!data) return [];
    return data.phase1.topModels.slice(0, 10).map((m) => ({
      name: m.name,
      share: m.share,
      score: m.score,
    }));
  }, [data]);

  const phase2BarsByCriterion = useMemo(() => {
    if (!data) return {} as Record<string, { name: string; share: number; score: number }[]>;
    const out: Record<string, { name: string; share: number; score: number }[]> = {};
    data.phase2.forEach((c) => {
      out[c.criterion] = c.topBrands.slice(0, 12).map((b) => ({
        name: b.name,
        share: b.share,
        score: b.score,
      }));
    });
    return out;
  }, [data]);

  useEffect(() => {
    if (!data) return;
    (window as any).__PDF_READY__ = true;
    return () => {
      (window as any).__PDF_READY__ = false;
    };
  }, [data]);

  if (!uuid) return <div className="results-page">UUID inválido</div>;
  if (loading) return <div className="results-page">Cargando resultados…</div>;
  if (error) return <div className="results-page">Error: {error}</div>;
  if (!data) return <div className="results-page">Sin datos</div>;

  return (
    <div className="results-page">
      <LeadGateModal open={!unlocked && !isPdf} onUnlock={handleUnlock} />

      {(unlocked || isPdf) && (
        <div className="results-container">
          {/* HEADER */}
          <header className="results-header">
            <div>
              <p className="results-badge">
                Informe goAISO 
              </p>

              {!isPdf && (
                <button
                  type="button"
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-white/80"
                  title={"Descargar informe completo en PDF"}
                  onClick={() => window.open(`${API_BASE_URL}/api/results/${uuid}/report/pdf/`, "_blank")}
                >
                  Descargar PDF
                </button>
              )}

              <h1 className="results-title" >
                Producto/servicio: <span>{data.product_type}</span> 
              </h1>

              <p className="results-subtitle">
                {new Date(data.timestamp).toLocaleString()} 
              </p>
            </div>
          </header>

         <section className="results-metrics">
  <MetricCard
    title="Marca Top"
    value={data.metrics.topBrand}
    tooltip="Marca con mayor cuota de presencia en los rankings con todos los criterios."
  />
  <MetricCard
    title="Cuota Top"
    value={`${data.metrics.topShare}%`}
    tooltip="Porcentaje de presencia de la marca top en los rankings con todos los criterios."
  />
  <MetricCard
    title="Número de marcas analizadas"
    value={data.metrics.uniqueBrands}
    tooltip="Total de marcas únicas que aparecen en los rankings evaluados con todos los criterios incluidos los que no entran en el top 10"
  />
</section>



          {/* PHASE 1 */}
          <section className="results-section">
            <h2 className="section-title">
              1 — Ranking general 
            </h2>

            <div className="results-status" title={LOREM}>
              <span className="status-pill ok">
                Cómo se calcula 
              </span>
              <p className="status-note">
                Para este ranking se toma el producto/servicio y todos los atributos ingresados y el modelo de IA se encarga de hacer el prompt 5 veces. Este prompt consiste en un ranking de productos/servicios en el que segun el puesto donde aparezcan estos recibiran puntos <strong>1º=5</strong>, <strong>2º=4</strong>,{" "}
                <strong>3º=3</strong>, <strong>4º=2</strong>, <strong>5º=1</strong>. Luego se toma se suma por producto/servicio y tomamos cada total a{" "}
                <strong>porcentaje sobre 100</strong>. 
              </p>
            </div>

            <div className="charts-grid">
              <ChartPiePercent title="Cuota de presencia por marca (100%)" data={phase1BrandPie} />
              <ChartBarPercent title="Top modelos (cuota %)" data={phase1ModelBars} />
            </div>
          </section>

          {/* PHASE 2 */}
          <section className="results-section">
            <h2 className="section-title">
              2 — Detalle por criterio <InfoTip text="Para este ranking se usan las mismas reglas que para el ranking general con el matiz de que aqui el ranking se hace para cada criterio." />
            </h2>
            <p className="section-desc" title={LOREM}>
              Aquí ves cómo cambian las cuotas (%) cuando el usuario busca por cada característica. 
            </p>

            <div className="criteria-list">
              {data.phase2.map((c) => (
                <div key={c.criterion} className="criterion-item" title={LOREM}>
                  <div className="criterion-content">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-extrabold">
                        {c.criterion} 
                      </div>
                      <div className="criterion-hint">
                        Cuota % por marca 
                      </div>
                    </div>

                    <ChartBarPercentCompact data={phase2BarsByCriterion[c.criterion] || []} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* MATRIX */}
          <section className="results-section">
            <h2 className="section-title">
              Resumen — Matriz de posicionamiento por criterio <InfoTip text="Estar matriz resume los resultados de los rankings por criterio obtenidos en los diagramas de barras que estan arriba. La linea ( - ) significa que para ese criterio no apareció la marca del producto/servicio"/>
            </h2>
            <p className="section-desc" title={LOREM}>
              Cada aparición suma puntos según la posición (1º=5, 5º=1). En la matriz mostramos el{" "}
              <strong>puesto relativo</strong> por criterio.
            </p>

            <MatrixTable matrix={data.matrix} />
          </section>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  tooltip,
}: {
  title: string;
  value: any;
  tooltip?: string;
}) {
  return (
    <div className="metric-card relative">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="metric-title">{title}</p>
          <p className="metric-value">{value}</p>
        </div>

        {tooltip ? (
          <span className="relative group shrink-0">
            {/* icono */}
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-white/15 bg-white/5 text-white/70 text-xs cursor-help select-none">
              i
            </span>

            {/* tooltip flotante */}
            <span className="pointer-events-none absolute right-0 top-8 z-50 w-64 rounded-xl border border-white/10 bg-slate-950/95 px-3 py-2 text-xs leading-relaxed text-white/90 shadow-xl opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0">
              {tooltip}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ChartPiePercent({
  title,
  data,
}: {
  title: string;
  data: { name: string; share: number }[];
}) {
  const label = (props: any) => {
    const { name, percent } = props;
    const pct = Math.round((percent || 0) * 100);
    return `${name} — ${pct}%`;
  };

  return (
    <div className="chart-card" title={LOREM}>
      <h3>
        {title} <InfoTip text="Este diagrama de torta muestra solo los nombres de los productos/servicios ejemplo Adidas, DHL, Movistar, siendo este una visión general de marcas usando las reglas anteriormente explicadas."/>
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={data} dataKey="share" nameKey="name" outerRadius={95} labelLine label={label}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
<Tooltip
  formatter={(v: any) => `${Number(v).toFixed(2)}%`}
  contentStyle={{
    background: "rgba(15, 23, 42, 0.95)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    color: "rgba(255,255,255,0.95)",
  }}
  labelStyle={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}
  itemStyle={{ color: "rgba(255,255,255,0.95)" }}
/>

          <Legend
            formatter={(value: any, entry: any) => {
              const v = entry?.payload?.share ?? 0;
              return `${value} — ${Number(v).toFixed(2)}%`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartBarPercent({
  title,
  data,
}: {
  title: string;
  data: { name: string; share: number }[];
}) {
  return (
    <div className="chart-card" title={LOREM}>
      <h3>
        {title} <InfoTip text="Este diagrama de barras horizontal muestra de manera mas especifica los resultados de los productos/servicios junto con su modelo o servicio en especficico, ejemplo iphone 15, dhl mensajeria express, no solamente su marca." />
      </h3>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.18)" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.25)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.25)" }}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={160}
            tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.25)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.25)" }}
          />
        <Tooltip
  formatter={(v: any) => `${Number(v).toFixed(2)}%`}
  contentStyle={{
    background: "rgba(15, 23, 42, 0.95)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    color: "rgba(255,255,255,0.95)",
  }}
  labelStyle={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}
  itemStyle={{ color: "rgba(255,255,255,0.95)" }}
/>

          <Bar dataKey="share" radius={[8, 8, 8, 8]}>
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
            <LabelList
              dataKey="share"
              position="right"
              formatter={(v: any) => `${Number(v).toFixed(1)}%`}
              fill="rgba(255,255,255,0.85)"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartBarPercentCompact({ data }: { data: { name: string; share: number }[] }) {
  return (
    <div className="chart-card" style={{ padding: 16 }} title={LOREM}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.18)" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.25)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.25)" }}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={150}
            tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.25)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.25)" }}
          />
         <Tooltip
  formatter={(value: any, _name: any, item: any) => {
    const v = typeof value === "number" ? value : Number(value);
    return [`${v.toFixed(2)}%`, item?.payload?.name];
  }}
  contentStyle={{
    background: "rgba(15, 23, 42, 0.95)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    color: "rgba(255,255,255,0.95)",
  }}
  labelStyle={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}
  itemStyle={{ color: "rgba(255,255,255,0.95)" }}
/>


          <Bar dataKey="share" radius={[8, 8, 8, 8]}>
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
            <LabelList
              dataKey="share"
              position="right"
              formatter={(v: any) => `${Number(v).toFixed(1)}%`}
              fill="rgba(255,255,255,0.85)"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MatrixTable({ matrix }: { matrix: Matrix }) {
  const { brands, criteria, ranks } = matrix;

  const badgeClass = (rank: number | null) => {
    if (!rank) return "bg-gray-800 text-gray-600 border border-gray-700";
    if (rank === 1) return "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
    if (rank <= 2) return "bg-gray-700 text-gray-300 border border-gray-600";
    if (rank <= 3) return "bg-gray-700 text-gray-400 border border-gray-600";
    return "bg-gray-800 text-gray-500 border border-gray-700";
  };

  const renderRank = (rank: number | null) => {
    if (!rank) return "—";
    return `${rank}º`;
  };

  return (
    <div className="table-wrap" title={LOREM}>
      <table className="results-table" style={{ minWidth: 900 }}>
        <thead>
          <tr>
            <th style={{ width: 240 }}>
              Marcas 
            </th>
            {criteria.map((c) => (
              <th key={c} style={{ textAlign: "center" }}>
                #{c} 
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {brands.map((b) => (
            <tr key={b}>
              <td style={{ fontWeight: 800, opacity: 0.92 }}>
                {b} 
              </td>

              {criteria.map((c) => {
                const r = ranks?.[c]?.[b] ?? null;
                return (
                  <td key={`${b}-${c}`} style={{ textAlign: "center" }}>
                    <span
                      title={LOREM}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-extrabold ${badgeClass(
                        r
                      )}`}
                    >
                      {renderRank(r)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
