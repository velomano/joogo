/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    // TypeScript 관련 규칙 완화
    '@typescript-eslint/no-explicit-any': 'off', // any 타입 허용
    '@typescript-eslint/no-unused-vars': 'off', // 사용하지 않는 변수 허용
    '@typescript-eslint/no-var-requires': 'off', // require 문 허용
    
    // 일반 규칙 완화
    'prefer-const': 'off', // const 사용 권장 비활성화
    'no-case-declarations': 'off', // case 블록에서 선언 허용
    'no-duplicate-case': 'error', // 중복 case는 여전히 오류
    
    // React 관련 규칙 비활성화
    'react-hooks/exhaustive-deps': 'off',
    
    // Import 관련 규칙 완화
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
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

