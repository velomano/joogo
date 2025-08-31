/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // 핵심: plugin: 접두사
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn', // any 타입 허용 (warn으로 완화)
    '@typescript-eslint/no-unused-vars': 'warn', // 사용하지 않는 변수 허용
    'prefer-const': 'warn', // const 사용 권장 (warn으로 완화)
    '@typescript-eslint/no-var-requires': 'warn', // require 문 허용
    'no-case-declarations': 'warn', // case 블록에서 선언 허용
    'no-duplicate-case': 'error', // 중복 case는 여전히 오류
    'react-hooks/exhaustive-deps': 'off', // React hooks 규칙 비활성화
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: { node: true, browser: true, es6: true },
  settings: {
    'import/resolver': {
      typescript: {
        project: [
          './tsconfig.json',
          './apps/*/tsconfig.json',
          './packages/*/tsconfig.json',
        ],
      },
    },
  },
  ignorePatterns: ['dist', '.next', 'node_modules'],
};

