export default function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-block animate-spin rounded-full border-b-2 border-[#6B5BB6] ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}
