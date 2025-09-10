export default function ErrorBanner({ message }: { message?: string }) {
  return (
    <div style={{
      padding: "8px 12px",
      border: "1px solid #fca5a5",
      background: "#fee2e2",
      color: "#7f1d1d",
      borderRadius: 8
    }}>
      {message ?? "문제가 발생했습니다."}
    </div>
  );
}
