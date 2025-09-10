export default function MockBadge({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs rounded-full border border-yellow-400">
      MOCK MODE
    </span>
  );
}
