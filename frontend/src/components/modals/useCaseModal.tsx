"use client";

import { useEffect, useState } from "react";

type UseCaseModalProps = {
  open: boolean;
  onClose: () => void;
};

const CASES = [
  {
    id: "caso-1",
    tab: "Caso 1",
    sector: "Sector: Dispositivos Móviles de Alta Gama",
    perfil: "Director de Marketing / Country Manager",
    descripcion:
      'Necesita asegurar que su smartphone insignia aparece en el Top 3 de la IA cuando los usuarios buscan "mejor móvil para fotografía" o "batería de larga duración".',
    cita: {
      intro: "Comprueba si tu ",
      strong1: "Smartphone Pro",
      middle: " lidera las recomendaciones de la IA por su ",
      strong2: "Pantalla",
      end: " y ",
      strong3: "Autonomía",
      close: ".",
    },
    producto: "Galaxy Z-Series 5G (Directores)",
    tags: ["Cámara", "Rendimiento", "Seguridad", "Pantalla", "Autonomía"],
    icon: (
      <svg
        className="w-4 h-4 text-indigo-400 mr-2 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    id: "caso-2",
    tab: "Caso 2",
    sector: "Sector: Imagen & Tecnología Pro",
    perfil: "Director de Producto / Senior Manager",
    descripcion:
      "Su objetivo es verificar que su nueva cámara Mirrorless sea la opción predilecta de la IA cuando los profesionales comparan rendimiento en bajas luces o velocidad de enfoque.",
    cita: {
      intro: "Comprueba si tu ",
      strong1: "Cámara Mirrorless",
      middle: " lidera las recomendaciones de la IA por su ",
      strong2: "Resolución",
      end: " y ",
      strong3: "Óptica",
      close: ".",
    },
    producto: "Lumix Pro X-Series (Full Frame)",
    tags: ["Resolución", "Enfoque", "Sensor", "Velocidad", "Estabilización"],
    icon: (
      <svg
        className="w-4 h-4 text-indigo-400 mr-2 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    id: "caso-3",
    tab: "Caso 3",
    sector: "Sector: Seguros e Insurtech",
    perfil: "Director Comercial / Head of Sales",
    descripcion:
      'Su objetivo es auditar si su póliza de salud es la recomendación prioritaria de la IA cuando los directivos buscan "seguros para empresas" o "cobertura internacional".',
    cita: {
      intro: "Verifica si tu ",
      strong1: "Seguro Corporativo",
      middle: " lidera las recomendaciones de la IA por su ",
      strong2: "Red",
      end: " y ",
      strong3: "Rapidez",
      close: ".",
    },
    producto: "Póliza Global Executive (Sin Copago)",
    tags: ["Cobertura", "Digital", "Red", "Reembolso", "Rapidez"],
    icon: (
      <svg
        className="w-4 h-4 text-indigo-400 mr-2 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
];

export default function UseCaseModal({
  open,
  onClose,
}: UseCaseModalProps) {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [open, onClose]);

  if (!open) return null;

  const currentCase = CASES[activeTab];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0f1117] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Casos de uso</h2>
            <p className="text-sm text-white/60">
              Ejemplos de análisis de posicionamiento en IA
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-white/10 px-5 pt-4">
          <div className="flex flex-wrap gap-2">
            {CASES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  activeTab === index
                    ? "bg-indigo-600 text-white"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.tab}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-5">
          <div className="mx-auto max-w-xl w-full bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 border-b border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                  EJEMPLO
                </span>
                <h3 className="text-gray-200 font-semibold text-sm">
                  {currentCase.sector}
                </h3>
              </div>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed border-l-2 border-indigo-500 pl-3">
                <strong className="text-white block mb-1">
                  Perfil: {currentCase.perfil}
                </strong>
                {currentCase.descripcion}
              </p>

              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <p className="text-indigo-200 text-sm italic leading-relaxed">
                  "{currentCase.cita.intro}
                  <strong className="text-white">
                    {currentCase.cita.strong1}
                  </strong>
                  {currentCase.cita.middle}
                  <strong className="text-white">
                    {currentCase.cita.strong2}
                  </strong>
                  {currentCase.cita.end}
                  <strong className="text-white">
                    {currentCase.cita.strong3}
                  </strong>
                  {currentCase.cita.close}"
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Producto de interés
                </label>

                <div className="flex items-center bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5">
                  {currentCase.icon}
                  <span className="text-gray-200 text-sm font-medium">
                    {currentCase.producto}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Características clave (5)
                </label>

                <div className="flex flex-nowrap items-center gap-3 overflow-x-auto pb-1">
                  {currentCase.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-700 text-indigo-300 border border-gray-600 whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}