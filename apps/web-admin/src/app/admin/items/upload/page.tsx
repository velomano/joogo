"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type JobStatus = {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_name: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  error?: string;
  result?: any;
  progress: number;
  message: string;
};

export default function UploadPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [tenantId, setTenantId] = useState("84949b3c-2cb7-4c42-b9f9-d1f37d371e00");
  const [type, setType] = useState<"sales" | "inventory">("sales");
  const [uploading, setUploading] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [message, setMessage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // 파일 초기화 함수
  const resetFile = () => {
    setSelectedFile(null);
    setJobStatus(null);
    setMessage("");
    setUploading(false);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
    // 폴링 중지
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // 업로드 취소 함수
  const cancelUpload = () => {
    setUploading(false);
    setMessage("업로드가 취소되었습니다.");
  };

  // 작업 상태 폴링
  const startPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload/status/${jobId}?tenant_id=${tenantId}`);
        const status: JobStatus = await res.json();
        
        setJobStatus(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
          
          if (status.status === 'completed') {
            setMessage(`✅ 파싱 완료!\n\n📊 처리 결과:\n• 총 처리: ${status.result?.total_rows || 0}개 상품\n• 성공 저장: ${status.result?.inserted || 0}개\n• 건너뛴 행: ${status.result?.skipped || 0}개\n\n3초 후 재고 목록 페이지로 이동합니다...`);
            
            setTimeout(() => {
              router.push(`/admin/items?tenant_id=${tenantId}`);
            }, 3000);
          } else {
            setMessage(`❌ 파싱 실패!\n\n오류 내용: ${status.error || '알 수 없는 오류'}\n\n문제가 지속되면 CSV 파일을 확인하거나 다시 시도해주세요.`);
          }
        }
      } catch (error) {
        console.error('Status polling failed:', error);
      }
    }, 2000); // 2초마다 폴링
    
    setPollingInterval(interval);
  };

  // 파일 선택 함수 (업로드는 하지 않음)
  const onFileSelect = (file: File) => {
    setMessage("");
    setJobStatus(null);
    setSelectedFile(file);
    
    if (file) {
      setMessage(`📁 파일이 선택되었습니다: ${file.name}\n\n이제 "📤 파일 업로드" 버튼을 눌러주세요.`);
    }
  };

  // 실제 업로드 함수
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("업로드할 파일을 먼저 선택해주세요.");
      return;
    }
    
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("tenant_id", tenantId);
    setUploading(true);
    
    try {
      const res = await fetch("/api/upload/parse", { method: "POST", body: fd });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json?.error || "UPLOAD_FAILED");
      
      if (json.success && json.job_id) {
        setMessage(`📤 파일 업로드 완료!\n\n파싱 작업이 시작되었습니다. 상태를 확인하는 중...`);
        
        // 작업 상태 폴링 시작
        startPolling(json.job_id);
        
        // 초기 상태 설정
        setJobStatus({
          job_id: json.job_id,
          status: 'pending',
          file_name: json.file_name,
          file_size: json.file_size,
          created_at: json.meta?.job_created_at || new Date().toISOString(),
          updated_at: json.meta?.job_created_at || new Date().toISOString(),
          progress: 0,
          message: '업로드 완료. 파싱 작업 대기 중...'
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e: any) {
      setMessage(e?.message || "업로드 오류");
    } finally {
      setUploading(false);
    }
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return (
    <main className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">데이터 업로드 (수동 업로드)</h2>
      
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
            onClick={() => fileRef.current?.click()}
            className="border rounded px-3 py-1"
            disabled={uploading}
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
              if (file) onFileSelect(file);
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
        {uploading && (
          <div className="mt-4 space-y-2">
            <div className="text-blue-600 font-medium">업로드 중...</div>
            <button
              onClick={cancelUpload}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              ❌ 업로드 취소
            </button>
          </div>
        )}
      </div>

      {/* 작업 상태 표시 */}
      {jobStatus && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">작업 상태</h3>
          <div className="space-y-2 text-sm">
            <div><strong>작업 ID:</strong> {jobStatus.job_id}</div>
            <div><strong>상태:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                jobStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                jobStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
                jobStatus.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {jobStatus.status}
              </span>
            </div>
            <div><strong>진행률:</strong> {jobStatus.progress}%</div>
            <div><strong>메시지:</strong> {jobStatus.message}</div>
            <div><strong>생성:</strong> {new Date(jobStatus.created_at).toLocaleString()}</div>
            <div><strong>수정:</strong> {new Date(jobStatus.updated_at).toLocaleString()}</div>
          </div>
          
          {/* 진행률 바 */}
          {jobStatus.status === 'processing' && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${jobStatus.progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-lg whitespace-pre-line ${
          message.includes('성공') || message.includes('완료') ? 'bg-green-50 border border-green-200 text-green-800' :
          message.includes('오류') || message.includes('취소') || message.includes('실패') ? 'bg-red-50 border border-red-200 text-red-800' :
          'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      {/* 작업 완료 후 결과 표시 */}
      {jobStatus?.status === 'completed' && jobStatus.result && (
        <div className="mt-4">
          <h3 className="font-semibold">처리 결과</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>총 처리:</strong> {jobStatus.result.total_rows || 0}개</div>
              <div><strong>성공 저장:</strong> {jobStatus.result.inserted || 0}개</div>
              <div><strong>건너뛴 행:</strong> {jobStatus.result.skipped || 0}개</div>
              <div><strong>날짜 컬럼:</strong> {jobStatus.result.date_columns || 0}개</div>
            </div>
          </div>
        </div>
      )}

      {/* 작업 실패 시 에러 표시 */}
      {jobStatus?.status === 'failed' && jobStatus.error && (
        <div className="mt-4">
          <h3 className="font-semibold">에러 상세</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <pre className="text-sm text-red-800 whitespace-pre-wrap">{jobStatus.error}</pre>
          </div>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="flex gap-3 mt-3">
        <button
          onClick={() => router.push(`/admin/items?tenant_id=${tenantId}`)}
          className="border rounded px-3 py-2 bg-gray-600 text-white hover:bg-gray-700"
        >
          📋 목록 보기
        </button>

        <button
          onClick={handleUpload}
          className="border rounded px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
          disabled={!selectedFile || uploading}
        >
          {uploading ? "업로드 중..." : "📤 파일 업로드"}
        </button>

        <button
          onClick={resetFile}
          className="border rounded px-3 py-2 bg-orange-600 text-white hover:bg-orange-700"
        >
          🔄 새로 시작
        </button>
      </div>
    </main>
  );
}


