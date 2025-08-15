import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default [
	{ ignores: ['dist/**', 'node_modules/**'] },
	...tseslint.configs.recommended,
	{
		files: ['src/**/*.{ts,tsx}'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				ecmaVersion: 2023,
				sourceType: 'module',
			},
			globals: {
				browser: true,
				node: true,
			},
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
		},
		rules: {
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},
	{
		files: ['src/**/*.{js,jsx}', 'vite.config.ts', 'vitest.config.ts', 'eslint.config.js'],
		...js.configs.recommended,
	},
]