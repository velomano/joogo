#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// API 라우트 파일들을 찾기
const routeFiles = glob.sync('apps/web-admin/src/app/api/**/route.ts');

console.log(`Found ${routeFiles.length} API route files`);

routeFiles.forEach(filePath => {
  console.log(`Processing: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 이미 runtime 설정이 있는지 확인
    if (content.includes("export const runtime = 'edge'")) {
      console.log(`  ✓ Already has edge runtime: ${filePath}`);
      return;
    }
    
    // 파일의 시작 부분에 runtime 설정 추가
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // import 문 다음에 삽입
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '') {
        insertIndex = i + 1;
      } else if (!lines[i].trim().startsWith('import ') && lines[i].trim() !== '') {
        break;
      }
    }
    
    // runtime 설정 삽입
    lines.splice(insertIndex, 0, "export const runtime = 'edge';");
    
    // 파일에 다시 쓰기
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent);
    
    console.log(`  ✓ Added edge runtime: ${filePath}`);
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}:`, error.message);
  }
});

console.log('\nEdge runtime configuration completed!');
