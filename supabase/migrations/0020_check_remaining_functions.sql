-- 3단계: 남은 함수들 확인
SELECT 
  routine_schema, 
  routine_name, 
  routine_type,
  data_type,
  specific_name
FROM information_schema.routines 
WHERE routine_schema IN ('analytics', 'public')
  AND routine_name LIKE 'board_%'
ORDER BY routine_schema, routine_name;
