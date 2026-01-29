import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function UseCaseModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* panel (MÁS GRANDE) */}
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 rounded-xl
                     border border-white/10 bg-white/5 hover:bg-white/10 transition
                     flex items-center justify-center text-white/90"
          aria-label="Cerrar"
          title="Cerrar"
        >
          ✕
        </button>

        <div className="w-full bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-7 sm:px-9 py-6 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wide">
                Ejemplo
              </span>
              <h3 className="text-gray-100 font-semibold text-base sm:text-lg">
                Caso de Uso: Banca y Finanzas
              </h3>
            </div>

            <p className="text-gray-200 text-sm sm:text-base mb-5 leading-relaxed border-l-2 border-gray-600 pl-4">
              <strong className="text-white block mb-1">El Objetivo:</strong>
              Quiere saber si su hipoteca sale recomendada por la IA cuando la gente busca condiciones específicas, no
              solo por marca.
            </p>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <p className="text-indigo-200 text-sm sm:text-base italic leading-relaxed">
                Descubre si tu <strong className="text-white">Hipoteca Joven</strong> lidera el ranking de la IA gracias
                a sus <strong className="text-white">Comisiones</strong> e{" "}
                <strong className="text-white">Interés</strong>.
              </p>
            </div>
          </div>

          <div className="px-7 sm:px-9 py-7 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Producto de interés
              </label>

              <div className="flex items-center bg-gray-900 border border-gray-600 rounded-xl px-4 py-3">
                <svg
                  className="w-5 h-5 text-indigo-400 mr-3"
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>

                <span className="text-gray-100 text-sm sm:text-base font-semibold">
                  Hipoteca Joven Bonificada
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Características clave (5)
              </label>

              <div className="flex flex-wrap gap-2.5">
                {["Comisiones", "Interés", "Online", "Edad", "Vinculación"].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold
                               bg-gray-700/70 text-indigo-200 border border-gray-600"
                  >
                    # {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* (opcional) scrollbar más suave en algunos navegadores */}
      </div>
    </div>
  );
}
