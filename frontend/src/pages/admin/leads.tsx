import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type Row = {
  id: number;
  evaluation_uuid: string;
  nombre: string;
  email: string;
  movil: string;
};

type ApiResp = {
  count: number;
  page: number;
  page_size: number;
  results: Row[];
};

const qs = (obj: Record<string, string>) => {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v?.trim()) sp.set(k, v.trim());
  });
  return sp.toString();
};

export default function LeadsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [search, setSearch] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [movil, setMovil] = useState("");
  const [uuid, setUuid] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    return qs({
      page: String(page),
      page_size: String(pageSize),
      search,
      nombre,
      email,
      movil,
      uuid,
      ordering: "-id",
    });
  }, [page, pageSize, search, nombre, email, movil, uuid]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/api/results/report/users/?${query}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.detail || "Error al cargar leads");
        return json as ApiResp;
      })
      .then((data) => {
        setRows(data.results);
        setCount(data.count);
      })
      .catch((e: any) => setError(e?.message || "Error inesperado"))
      .finally(() => setLoading(false));
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const downloadExcel = () => {
    const exportQuery = qs({ search, nombre, email, movil, uuid, ordering: "-id" });
    window.location.href = `${API_BASE_URL}/api/results/report/users/export/?${exportQuery}`;
  };

  return (
    <div className="results-page">
      <div className="results-container">
        <header className="results-header">
          <div>
            <p className="results-badge">Admin</p>
            <h1 className="results-title">
              Leads — <span>Informe</span>
            </h1>
            <p className="results-subtitle">
              Total: <span className="mono">{count}</span>
            </p>
          </div>

          <div className="results-actions">
            <button className="btn-secondary" onClick={downloadExcel}>
              Descargar Excel
            </button>
          </div>
        </header>

        <section className="results-section">
          <h2 className="section-title">Filtros</h2>

          <div className="geo-grid">
            <div className="form-group">
              <label>Búsqueda global</label>
              <input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="Nombre/email/móvil/uuid…"
              />
            </div>

            <div className="form-group">
              <label>UUID (exacto)</label>
              <input
                value={uuid}
                onChange={(e) => {
                  setPage(1);
                  setUuid(e.target.value);
                }}
                placeholder="uuid"
              />
            </div>
          </div>

          <div className="geo-grid">
            <div className="form-group">
              <label>Nombre</label>
              <input
                value={nombre}
                onChange={(e) => {
                  setPage(1);
                  setNombre(e.target.value);
                }}
                placeholder="contiene…"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => {
                  setPage(1);
                  setEmail(e.target.value);
                }}
                placeholder="contiene…"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Móvil</label>
            <input
              value={movil}
              onChange={(e) => {
                setPage(1);
                setMovil(e.target.value);
              }}
              placeholder="contiene…"
            />
          </div>
        </section>

        <section className="results-section">
          <h2 className="section-title">Tabla</h2>

          {error && <p className="error-text">{error}</p>}

          {loading ? (
            <div className="loading-box">
              <div className="loading-header">
                <div className="spinner" />
                <div>
                  <p className="loading-title">Cargando…</p>
                  <p className="loading-sub">Aplicando filtros</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>UUID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Móvil</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="row-index">{r.id}</td>
                      <td className="mono">{r.evaluation_uuid}</td>
                      <td>{r.nombre}</td>
                      <td>{r.email}</td>
                      <td>{r.movil || "—"}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 16, opacity: 0.75 }}>
                        No hay resultados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16, flexWrap: "wrap" }}>
            <button
              className="btn-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Anterior
            </button>

            <span className="mono">
              Página {page} / {totalPages}
            </span>

            <button
              className="btn-secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Siguiente →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
