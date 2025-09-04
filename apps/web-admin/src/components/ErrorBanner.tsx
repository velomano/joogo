"use client";

type Props = { message: string; onClose?: () => void; };

export default function ErrorBanner({ message, onClose }: Props) {
  if (!message) return null;
  return (
    <div className="rounded-xl p-3 text-sm bg-red-100 text-red-800 flex items-start gap-3">
      <span role="img" aria-label="error">⚠️</span>
      <div className="flex-1 whitespace-pre-wrap">{message}</div>
      <button
        onClick={onClose}
        className="px-2 py-1 rounded-md hover:bg-red-200 transition"
        aria-label="닫기"
      >
        닫기
      </button>
    </div>
  );
}
