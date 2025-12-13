export default function WarningBanner({ message }: { message?: string }) {
  const text =
    message ||
    'Important: This tool is for estimation only. Figures may not be accurate and do not constitute tax or financial advice. Please verify against official guidance or consult a professional.';
  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 px-4 py-3"
    >
      <p className="text-sm">{text}</p>
    </div>
  );
}
