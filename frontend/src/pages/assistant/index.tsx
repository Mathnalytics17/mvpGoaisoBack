"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import UseCaseInfoButton from "../../components/ui/useCaseInfoButton";
import UseCaseModal from "../../components/modals/useCaseModal";
/* =========================
   CONFIG
========================= */
const API_BASE_URL = "http://localhost:8000";

/* =========================
   PAGE
========================= */

const buildPromptES = (
  product: string,
  features: string[],
  country?: string,
  location?: string
) => {
  const cleanProduct = product.trim();
  const cleanFeatures = features.map((f) => f.trim()).filter(Boolean);

  const geoParts = [location?.trim(), country?.trim()].filter(Boolean);
  const geoText =
    geoParts.length > 0 ? ` en ${geoParts.join(", ")}` : "";

  const criteriaText =
    cleanFeatures.length > 0
      ? cleanFeatures.join(", ")
      : "— (añade al menos una característica)";

  const productText = cleanProduct || "— (indica un producto)";

  return `
Recomienda los 5 mejores ${productText} hoy${geoText} basándote en: ${criteriaText}.`;
};

export default function Assistant() {
  const router = useRouter();

  const [product, setProduct] = useState("");
  const [features, setFeatures] = useState<string[]>([""]);

  // ✅ NUEVO: GEO OPCIONAL
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "creating" | "running">("idle");
  const [error, setError] = useState<string | null>(null);
  const [useCaseOpen, setUseCaseOpen] = useState(false);
  const promptPreview = buildPromptES(product, features, country, location);

  const [toast, setToast] = useState<{ open: boolean; message: string; type?: "ok" | "error" }>({
      open: false,
      message: "",
      type: "ok",
      });


  const showToast = (message: string, type: "ok" | "error" = "ok") => {
  setToast({ open: true, message, type });
  window.setTimeout(() => {
    setToast((t) => ({ ...t, open: false }));
  }, 2200);
};

const handleCopyPrompt = async () => {
  try {
    await navigator.clipboard.writeText(promptPreview);
    showToast("✅ Copiado al portapapeles");
  } catch {
    showToast("❌ No se pudo copiar. Revisa permisos del navegador.", "error");
  }
};
  const addFeature = () => {
    if (features.length < 5) setFeatures([...features, ""]);
  };

  const removeFeature = (index: number) => {
    const updated = features.filter((_, i) => i !== index);
    setFeatures(updated.length ? updated : [""]);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  /* =========================
     SUBMIT FLOW
  ========================= */
  const handleSubmit = async () => {
    setError(null);

    const cleanFeatures = features.map((f) => f.trim()).filter(Boolean);

    if (!product.trim()) {
      setError("Debes indicar un producto.");
      return;
    }

    if (cleanFeatures.length === 0) {
      setError("Debes agregar al menos una característica.");
      return;
    }

    try {
      setLoading(true);
      setStep("creating");

      /* 1️⃣ CREATE EVALUATION */
      const createRes = await fetch(`${API_BASE_URL}/api/results/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_type: product.trim(),
          criteria: cleanFeatures,
          country: country.trim(),   // ✅ OPCIONAL
          location: location.trim(), // ✅ OPCIONAL
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok)
        throw new Error(createJson?.error || "Error al crear evaluación");

      const uuid = createJson.uuid as string;

      /* 2️⃣ RUN EVALUATION */
      setStep("running");

      const runRes = await fetch(`${API_BASE_URL}/api/results/${uuid}/run/`, {
        method: "POST",
      });

      const runJson = await runRes.json();
      if (!runRes.ok)
        throw new Error(runJson?.error || "Error al ejecutar evaluación");

      /* 3️⃣ REDIRECT */
      router.push(`/results/${uuid}`);
    } catch (err: any) {
      setError(err.message || "Error inesperado");
      setLoading(false);
      setStep("idle");
    }
  };

  /* =========================
     LOADING UI (BONITO)
  ========================= */
  if (loading) {
    return (
      <div className="assistant-page">
        <div className="assistant-single">
          <h2 className="assistant-title">
            Analizando con <span>goAISO</span>
          </h2>

          <div className="loading-box">
            <div className="loading-header">
              <div className="spinner" />
              <div>
                <p className="loading-title">
                  {step === "creating" ? "Creando evaluación..." : "Ejecutando IA..."}
                </p>
                <p className="loading-sub">
                  {step === "creating"
                    ? "Preparando criterios y generando prompts."
                    : "Consultando web y calculando rankings en tiempo real."}
                </p>
              </div>
            </div>

            {/* ✅ shimmer / skeleton */}
            <div className="skeleton">
              <div className="skeleton-line w-90" />
              <div className="skeleton-line w-70" />
              <div className="skeleton-line w-80" />
            </div>

            {/* ✅ fake progress */}
            <div className="progress-bar">
              <div className={`progress-fill ${step}`} />
            </div>

            <p className="assistant-hint">
              Este proceso puede tardar unos minutos. No cierres la ventana 
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     FORM
  ========================= */
  return (
    <div className="assistant-page">
      <div className="assistant-single">
         <h1 className="assistant-title">
          <span>goAISO</span> Análisis de posicionamiento en la IA
        </h1>
        <div className="flex items-start justify-between gap-3">
          
  <p className="assistant-subtitle">
    Introduce tu producto y sus propuestas de valor (USPs) y descubre si la IA te
    considera y en qué medida frente a tu competencia. (Ej. Camiseta deportiva,
    coche eléctrico familiar...)
  </p>

  <UseCaseInfoButton onClick={() => setUseCaseOpen(true)} />
</div>

<UseCaseModal open={useCaseOpen} onClose={() => setUseCaseOpen(false)} />

        {error && <p className="error-text">{error}</p>}


        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
  <div className="flex items-center justify-between gap-3 mb-2">
    <p className="text-sm font-semibold text-white/90">
      Prompt que se enviará a la IA (preview)
    </p>

    <button
  type="button"
  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-white/80"
  onClick={handleCopyPrompt}
>
  Copiar
</button>
  </div>

  <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-white/75 font-mono">
    {promptPreview}
  </pre>
</div>

        {/* PRODUCT */}
        <div className="form-group">
          <label>Producto de interés</label>
          <input
            type="text"
            placeholder="Ej: Zapatillas deportivas"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
        </div>

        {/* ✅ GEO OPCIONAL */}
        <div className="geo-grid">
          <div className="form-group">
            <label>País (opcional)</label>
            <input
              type="text"
              placeholder="Ej: España"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Ciudad / Localidad (opcional)</label>
            <input
              type="text"
              placeholder="Ej: Madrid"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* FEATURES */}
        <div className="form-group">
          <label>Características (máximo 5)</label>

          <div className="features-list">
            {features.map((feature, index) => (
              <div key={index} className="feature-input">
                <input
                  type="text"
                  placeholder={`Característica ${index + 1}`}
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                />

                {features.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFeature(index)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="add-feature-btn"
            onClick={addFeature}
            disabled={features.length >= 5}
          >
            + Agregar característica
          </button>
        </div>

        {/* SUBMIT */}
        <button className="analyze-btn" onClick={handleSubmit}>
          Generar Estudio goAISO
          
        </button>

      </div>

      {toast.open && (
  <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[99999] px-4">
    <div
      className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md
      ${toast.type === "ok"
        ? "bg-white/10 border-white/15 text-white"
        : "bg-red-500/15 border-red-500/30 text-red-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">{toast.message}</span>
        <button
          type="button"
          onClick={() => setToast((t) => ({ ...t, open: false }))}
          className="ml-2 text-white/70 hover:text-white transition"
          aria-label="Cerrar toast"
          title="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
