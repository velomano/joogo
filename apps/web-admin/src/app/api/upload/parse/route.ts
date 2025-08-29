export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // CSV 파일 읽기
    const buffer = await file.arrayBuffer();
    const csvText = new TextDecoder().decode(buffer);
    
    // CSV 파싱
    const rows: any[] = [];
    const parser = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    for await (const record of parser) {
      rows.push(record);
    }

    // 컬럼 매핑 생성 (필요시)
    const mapping = rows.length > 0 ? Object.keys(rows[0]).reduce((acc, key) => {
      acc[key] = key; // 기본적으로 동일한 이름 사용
      return acc;
    }, {} as Record<string, string>) : {};

    return NextResponse.json({
      rows,
      mapping,
      meta: {
        total_rows: rows.length,
        file_name: file.name,
        file_size: file.size,
      }
    });

  } catch (error: any) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse file' },
      { status: 500 }
    );
  }
}


