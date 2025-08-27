"use client";

import { useRef, useState } from "react";

type ParseResult = {
  rows: any[];
  mapping?: Record<string, string>;
  meta?: any;
};

export default function UploadPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  // 기본 테넌트 ID 설정 (기존에 사용하던 값)
  const [tenantId, setTenantId] = useState("84949b3c-2cb7-4c42-b9f9-d1f37d371e00");
  const [type, setType] = useState<"sales" | "inventory">("sales");
  const [parsing, setParsing] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [message, setMessage] = useState<string>("");

  const onChoose = () => fileRef.current?.click();

  const onFile = async (file: File) => {
    setMessage("");
    setResult(null);
    if (!file) return;
    
    const fd = new FormData();
    fd.append("file", file);
    setParsing(true);
    
    try {
      const res = await fetch("/api/upload/parse", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "PARSE_FAILED");
      setResult(json);
      setMessage(`파싱 완료: ${json?.rows?.length || 0}행`);
    } catch (e: any) {
      setMessage(e?.message || "파싱 오류");
    } finally {
      setParsing(false);
    }
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const onIngest = async () => {
    if (!tenantId) return setMessage("테넌트 ID를 입력하세요.");
    if (!result?.rows?.length) return setMessage("파싱된 데이터가 없습니다.");
    
    setIngesting(true);
    try {
      const res = await fetch("/api/upload/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: result.rows, type, tenant_id: tenantId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "INGEST_FAILED");
      setMessage(`저장 완료: ${json?.inserted || result.rows.length}행`);
    } catch (e: any) {
      setMessage(e?.message || "저장 오류");
    } finally {
      setIngesting(false);
    }
  };

  return (
    <main className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">데이터 업로드 (새로운 구조)</h2>
      
      <div className="flex gap-3 items-center">
        <div>
          <label className="block text-sm font-medium mb-1">테넌트 ID:</label>
          <input
            className="border rounded px-2 py-1"
            placeholder="tenant_id"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          />
          <small className="text-green-600 text-sm">💡 기본값이 설정되었습니다. 필요시 수정하세요.</small>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">데이터 타입:</label>
          <select
            className="border rounded px-2 py-1"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="sales">sales</option>
            <option value="inventory">inventory</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">파일:</label>
          <button
            onClick={onChoose}
            className="border rounded px-3 py-1"
            disabled={parsing}
          >
            파일 선택
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="border-2 border-dashed rounded p-8 text-center text-sm text-gray-600"
      >
        여기로 파일을 드래그&드롭하세요 (.csv / .xlsx)
        {parsing && <div className="mt-2">파싱 중...</div>}
      </div>

      {message && <div className="text-sm">{message}</div>}

      {result?.mapping && (
        <div className="mt-4">
          <h3 className="font-semibold">매핑 결과</h3>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
            {JSON.stringify(result.mapping, null, 2)}
          </pre>
        </div>
      )}

      {result?.rows?.length ? (
        <>
          <h3 className="font-semibold">미리보기 (상위 20행)</h3>
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  {Object.keys(result.rows[0] || {}).slice(0, 12).map((k) => (
                    <th key={k} className="text-left px-2 py-1 border-b">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, 20).map((r, i) => (
                  <tr key={i} className="odd:bg-gray-50">
                    {Object.keys(result.rows[0] || {}).slice(0, 12).map((k) => (
                      <td key={k} className="px-2 py-1 border-b whitespace-nowrap">
                        {String(r[k] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={onIngest}
            className="mt-3 border rounded px-3 py-2"
            disabled={ingesting}
          >
            {ingesting ? "저장 중..." : "DB 저장"}
          </button>
        </>
      ) : null}
    </main>
  );
}
