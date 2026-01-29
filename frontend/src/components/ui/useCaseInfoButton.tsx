type UseCaseInfoButtonProps = {
  onClick: () => void;
};

type Props = {
  onClick: () => void;
};

export default function UseCaseInfoButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 mt-1 inline-flex items-center justify-center w-10 h-10 rounded-xl
                 border border-white/10 bg-white/5 hover:bg-white/10 transition"
      aria-label="Ver ejemplo"
      title="Ver ejemplo"
    >
      <svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M12 10v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 7h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </button>
  );
}
