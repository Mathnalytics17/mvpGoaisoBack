import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  title?: string;
  subtitle?: string;
  onUnlock: (payload: { name: string; email: string; phone?: string }) => void;
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());

export default function LeadGateModal({
  open,
  onUnlock,
  title = "¡Ya casi está!",
  subtitle = "Déjanos tus datos para poder visualizar el informe.",
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [touched, setTouched] = useState<{ name: boolean; email: boolean }>({
    name: false,
    email: false,
  });

  useEffect(() => {
    if (!open) return;

    // Bloquear scroll mientras esté abierto (gate)
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // si el modal se abre, resetea (opcional)
  useEffect(() => {
    if (!open) return;
    setTouched({ name: false, email: false });
  }, [open]);

  const nameOk = useMemo(() => name.trim().length >= 2, [name]);
  const emailOk = useMemo(() => isValidEmail(email), [email]);
  const canSubmit = nameOk && emailOk;

  const handleSubmit = () => {
    setTouched({ name: true, email: true });
    if (!canSubmit) return;

    onUnlock({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true">
      {/* overlay bloqueante */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* panel */}
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b122a]/80 shadow-2xl overflow-hidden">
        <div className="px-6 sm:px-8 py-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{title}</h2>
          <p className="mt-2 text-sm sm:text-base text-white/70">{subtitle}</p>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-5">
          {/* Nombre */}
          <div className="form-group">
            <label className="flex items-center gap-1">
              Nombre <span className="text-red-400 font-bold">*</span>
            </label>
            <input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            />
            {touched.name && !nameOk && (
              <p className="mt-2 text-sm text-red-300">
                El nombre es obligatorio.
              </p>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="flex items-center gap-1">
              Email <span className="text-red-400 font-bold">*</span>
            </label>
            <input
              type="email"
              placeholder="tuemail@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            />
            {touched.email && !emailOk && (
              <p className="mt-2 text-sm text-red-300">
                Introduce un email válido.
              </p>
            )}
          </div>

          {/* Móvil opcional */}
          <div className="form-group">
            <label className="flex items-center justify-between">
              <span>Móvil</span>
              <span className="text-xs text-white/50">Opcional</span>
            </label>
            <input
              type="tel"
              placeholder="Ej: +34 600 123 123"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="analyze-btn"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              opacity: canSubmit ? 1 : 0.55,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            Ver informe
          </button>

          <p className="text-xs text-white/50">
            Al continuar, aceptas que te contactemos para compartirte el informe.
          </p>
        </div>
      </div>
    </div>
  );
}
