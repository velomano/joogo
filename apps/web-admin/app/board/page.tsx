'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UploadLog {
  id: string;
  tenant_id: string;
  file_name: string;
  file_size: number;
  upload_time: string;
  total_rows: number;
  inserted_rows: number;
  skipped_rows: number;
  status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  reset_time?: string;
  created_at: string;
}

export default function UploadLogsPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string>('');
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // tenant_id 가져오기
  useEffect(() => {
    const loadTenantId = async () => {
      try {
        const response = await fetch('/api/tenants');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (json.tenants && json.tenants.length > 0) {
          setTenantId(json.tenants[0].id);
        }
      } catch (err) {
        console.error('Tenant ID 로드 실패:', err);
        setError('Tenant ID를 가져올 수 없습니다.');
      }
    };
    loadTenantId();
  }, []);

  // 업로드 로그 가져오기
  useEffect(() => {
    if (!tenantId) return;

    const loadLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/upload-logs?tenant_id=${tenantId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (json.ok) {
          setLogs(json.logs);
        } else {
          setError(json.error || '로그를 가져올 수 없습니다.');
        }
      } catch (err) {
        console.error('업로드 로그 로드 실패:', err);
        setError('업로드 로그를 가져올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [tenantId]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadge = (status: string, isReset: boolean) => {
    if (isReset) {
      return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">리셋</span>;
    }
    
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">완료</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">실패</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">처리중</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">업로드 로그를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">업로드 로그</h1>
              <p className="mt-2 text-gray-600">파일 업로드 및 데이터 리셋 기록을 확인할 수 있습니다.</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← 뒤로가기
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">총 업로드</dt>
                    <dd className="text-lg font-medium text-gray-900">{logs.filter(log => log.file_name !== 'SYSTEM_RESET').length}건</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">성공</dt>
                    <dd className="text-lg font-medium text-gray-900">{logs.filter(log => log.status === 'completed' && log.file_name !== 'SYSTEM_RESET').length}건</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">실패</dt>
                    <dd className="text-lg font-medium text-gray-900">{logs.filter(log => log.status === 'failed').length}건</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">리셋</dt>
                    <dd className="text-lg font-medium text-gray-900">{logs.filter(log => log.file_name === 'SYSTEM_RESET').length}건</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 로그 테이블 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">업로드 기록</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">최근 100건의 업로드 및 리셋 기록</p>
          </div>
          
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">업로드 기록이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">파일을 업로드하거나 데이터를 리셋하면 여기에 기록이 표시됩니다.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {logs.map((log) => (
                <li key={log.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {log.file_name === 'SYSTEM_RESET' ? (
                          <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">{log.file_name}</p>
                          {getStatusBadge(log.status, log.file_name === 'SYSTEM_RESET')}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {log.file_name === 'SYSTEM_RESET' ? (
                            <span>시스템 리셋 실행</span>
                          ) : (
                            <span>
                              {formatFileSize(log.file_size)} • {log.total_rows.toLocaleString()}행
                              {log.inserted_rows > 0 && (
                                <span className="ml-2 text-green-600">
                                  +{log.inserted_rows.toLocaleString()} 삽입
                                </span>
                              )}
                              {log.skipped_rows > 0 && (
                                <span className="ml-2 text-yellow-600">
                                  {log.skipped_rows.toLocaleString()} 건너뜀
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        {log.error_message && (
                          <div className="mt-1 text-sm text-red-600">
                            오류: {log.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {formatDateTime(log.upload_time || log.created_at)}
                      </p>
                      {log.reset_time && (
                        <p className="text-xs text-purple-600">
                          리셋: {formatDateTime(log.reset_time)}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
