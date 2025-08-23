'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';

export default function SelmateUploadPage() {
	const [file, setFile] = useState<File | null>(null);
	const [tenantId, setTenantId] = useState('84949b3c-2cb7-4c42-b9f9-d1f37d371e00');
	const [uploading, setUploading] = useState(false);
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			setFile(selectedFile);
			setError(null);
			setResult(null);
		}
	};

	const handleUpload = async () => {
		if (!file) {
			setError('파일을 선택해주세요.');
			return;
		}

		setUploading(true);
		setError(null);
		setResult(null);

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('tenant_id', tenantId);

			const response = await fetch('/api/upload/selmate', {
				method: 'POST',
				body: formData,
			});

			const data = await response.json();

			if (response.ok) {
				setResult(data);
			} else {
				setError(data.error || '업로드 실패');
			}
		} catch (err) {
			setError('업로드 중 오류가 발생했습니다.');
			console.error('Upload error:', err);
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Selmate CSV 업로드</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>파일 업로드</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="tenant">테넌트 ID</Label>
						<Input
							id="tenant"
							value={tenantId}
							onChange={(e) => setTenantId(e.target.value)}
							placeholder="테넌트 ID를 입력하세요"
						/>
					</div>
					
					<div>
						<Label htmlFor="file">CSV 파일 선택</Label>
						<Input
							id="file"
							type="file"
							accept=".csv"
							onChange={handleFileChange}
						/>
						{file && (
							<div className="mt-2 text-sm text-gray-600">
								선택된 파일: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
							</div>
						)}
					</div>

					<Button 
						onClick={handleUpload} 
						disabled={!file || uploading}
						className="w-full"
					>
						{uploading ? '업로드 중...' : '업로드'}
					</Button>
				</CardContent>
			</Card>

			{error && (
				<Card className="border-red-200 bg-red-50">
					<CardHeader>
						<CardTitle className="text-red-800">오류</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-red-700">{error}</div>
					</CardContent>
				</Card>
			)}

			{result && (
				<Card className="border-green-200 bg-green-50">
					<CardHeader>
						<CardTitle className="text-green-800">업로드 성공</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="text-sm font-medium">파일 ID</Label>
								<div className="text-sm text-gray-600">{result.file_id}</div>
							</div>
							<div>
								<Label className="text-sm font-medium">처리된 행 수</Label>
								<div className="text-sm text-gray-600">{result.inserted}</div>
							</div>
							<div>
								<Label className="text-sm font-medium">오류 행 수</Label>
								<div className="text-sm text-gray-600">{result.invalidCount}</div>
							</div>
							<div>
								<Label className="text-sm font-medium">총 행 수</Label>
								<div className="text-sm text-gray-600">{result.metadata?.totalRows}</div>
							</div>
						</div>

						{result.metadata && (
							<div>
								<Label className="text-sm font-medium">메타데이터</Label>
								<div className="mt-2 space-y-2">
									<div>
										<Badge variant="secondary">날짜 범위</Badge>
										<span className="ml-2 text-sm">
											{result.metadata.dateColumns[0]} ~ {result.metadata.dateColumns[result.metadata.dateColumns.length - 1]}
										</span>
									</div>
									<div>
										<Badge variant="secondary">날짜 컬럼 수</Badge>
										<span className="ml-2 text-sm">{result.metadata.dateColumns.length}</span>
									</div>
									<div>
										<Badge variant="secondary">기본 컬럼 수</Badge>
										<span className="ml-2 text-sm">{result.metadata.basicColumns.length}</span>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>사용법</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm text-gray-600">
					<div>• Selmate CSV 파일을 선택하고 업로드합니다.</div>
					<div>• 파일은 자동으로 파싱되어 데이터베이스에 저장됩니다.</div>
					<div>• 일별 판매 데이터는 JSONB 형태로 저장됩니다.</div>
					<div>• 업로드 후 분석 대시보드에서 데이터를 확인할 수 있습니다.</div>
				</CardContent>
			</Card>
		</div>
	);
}





