


export default function UseCasePage() {
  return (
    <div className="bg-gray-900 flex items-center justify-center min-h-screen p-4">
      {/* COMIENZO DEL COMPONENTE DE CASO DE USO (DARK MODE) */}
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
        {/* Cabecera del ejemplo */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
              Ejemplo
            </span>
            <h3 className="text-gray-200 font-semibold text-sm">
              Caso de Uso: Banca y Finanzas
            </h3>
          </div>

          {/* Texto de introducción / Objetivo */}
          <p className="text-gray-300 text-sm mb-4 leading-relaxed border-l-2 border-gray-600 pl-3">
            <strong className="text-white block mb-1">El Objetivo:</strong>
            Quiere saber si su hipoteca sale recomendada por la IA cuando la gente
            busca condiciones específicas, no solo por marca.
          </p>

          {/* La frase entre comillas solicitada */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
            <p className="text-indigo-200 text-sm italic leading-relaxed">
              "Descubre si tu <strong className="text-white">Hipoteca Joven</strong>{" "}
              lidera el ranking de la IA gracias a sus{" "}
              <strong className="text-white">Comisiones</strong> e{" "}
              <strong className="text-white">Interés</strong>."
            </p>
          </div>
        </div>

        {/* Cuerpo del formulario simulado */}
        <div className="p-6 space-y-5">
          {/* Campo 1: Producto */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Producto de interés
            </label>

            <div className="flex items-center bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5">
              {/* Icono de casa/banca */}
              <svg
                className="w-4 h-4 text-indigo-400 mr-2"
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

              <span className="text-gray-200 text-sm font-medium">
                Hipoteca Joven Bonificada
              </span>
            </div>
          </div>

          {/* Campo 2: Características (Tags) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Características clave (5)
            </label>

            <div className="flex flex-wrap gap-2">
              {["Comisiones", "Interés", "Online", "Edad", "Vinculación"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-700 text-indigo-300 border border-gray-600"
                  >
                    # {tag}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      {/* FIN DEL COMPONENTE */}
    </div>
  );
}
