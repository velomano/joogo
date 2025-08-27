"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ParseResult = {
  rows: any[];
  mapping?: Record<string, string>;
  meta?: any;
};

export default function UploadPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  // 기본 테넌트 ID 설정 (기존에 사용하던 값)
  const [tenantId, setTenantId] = useState("84949b3c-2cb7-4c42-b9f9-d1f37d371e00");
  const [type, setType] = useState<"sales" | "inventory">("sales");
  const [parsing, setParsing] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [message, setMessage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onChoose = () => fileRef.current?.click();

  // 파일 초기화 함수
  const resetFile = () => {
    setSelectedFile(null);
    setResult(null);
    setMessage("");
    setParsing(false);
    setIngesting(false);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  // 파싱 취소 함수
  const cancelParsing = () => {
    setParsing(false);
    setMessage("파싱이 취소되었습니다.");
  };

  const onFile = async (file: File) => {
    setMessage("");
    setResult(null);
    setSelectedFile(file);
    
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
      
      // 성공 메시지 표시
      const successMessage = `✅ 업로드 성공!\n\n` +
        `📊 처리 결과:\n` +
        `• 총 처리: ${json?.processed || 0}개 상품\n` +
        `• 성공 저장: ${json?.inserted || 0}개\n` +
        `• 건너뛴 행: ${json?.skipped || 0}개\n` +
        `• 날짜 컬럼: ${json?.date_columns || 0}개\n\n` +
        `3초 후 재고 목록 페이지로 이동합니다...`;
      
      setMessage(successMessage);
      
      // 3초 후 items 페이지로 자동 이동
      setTimeout(() => {
        router.push(`/admin/items?tenant_id=${tenantId}`);
      }, 3000);
      
    } catch (e: any) {
      const errorMessage = `❌ 업로드 실패!\n\n` +
        `오류 내용: ${e?.message || "알 수 없는 오류"}\n\n` +
        `문제가 지속되면 CSV 파일을 확인하거나 다시 시도해주세요.`;
      
      setMessage(errorMessage);
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

      {/* 파일 정보 및 취소 버튼 */}
      {selectedFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">📁</span>
              <span className="text-sm text-blue-800">
                <strong>선택된 파일:</strong> {selectedFile.name} 
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              onClick={resetFile}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              🗑️ 파일 제거
            </button>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="border-2 border-dashed rounded p-8 text-center text-sm text-gray-600"
      >
        여기로 파일을 드래그&드롭하세요 (.csv / .xlsx)
        {parsing && (
          <div className="mt-4 space-y-2">
            <div className="text-blue-600 font-medium">파싱 중...</div>
            <button
              onClick={cancelParsing}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              ❌ 파싱 취소
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-lg whitespace-pre-line ${
          message.includes('성공') ? 'bg-green-50 border border-green-200 text-green-800' :
          message.includes('오류') || message.includes('취소') || message.includes('실패') ? 'bg-red-50 border border-red-200 text-red-800' :
          'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {message}
        </div>
      )}

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

          <div className="flex gap-3 mt-3">
            <button
              onClick={onIngest}
              className="border rounded px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
              disabled={ingesting}
            >
              {ingesting ? "저장 중..." : "DB 저장"}
            </button>
            
            <button
              onClick={() => router.push(`/admin/items?tenant_id=${tenantId}`)}
              className="border rounded px-3 py-2 bg-gray-600 text-white hover:bg-gray-700"
            >
              📋 목록 보기
            </button>

            <button
              onClick={resetFile}
              className="border rounded px-3 py-2 bg-orange-600 text-white hover:bg-orange-700"
            >
              🔄 새로 시작
            </button>
          </div>
        </>
      ) : null}
    </main>
  );
}


