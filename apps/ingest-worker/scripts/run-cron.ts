#!/usr/bin/env tsx

import { runCafe24Ingest } from '../src/cron/cafe24-ingest';

async function main() {
  console.log('🕐 Starting cron job...');
  
  try {
    await runCafe24Ingest();
    console.log('✅ Cron job completed successfully');
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    process.exit(1);
  }
}

main();
