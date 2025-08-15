import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default [
	{ ignores: ['dist/**', 'node_modules/**'] },
	{ linterOptions: { reportUnusedDisableDirectives: 'off' } },
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
			'react-refresh/only-export-components': 'off',
			'react-hooks/rules-of-hooks': 'error',
			// Reduce noise from dependency warnings in large components
			'react-hooks/exhaustive-deps': 'off',
			// Cosmetic TypeScript rules tuned down to reduce warning volume
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
		},
	},
	// Tests and test utilities
	{
		files: ['src/test-utils.tsx', 'src/tests/**/*.{ts,tsx}'],
		rules: {
			'react-refresh/only-export-components': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
		},
	},
	// App JS files
	{
		files: ['src/**/*.{js,jsx}'],
		...js.configs.recommended,
	},
	// Tooling/config TS files
	{
		files: ['vite.config.ts', 'vitest.config.ts', 'eslint.config.js'],
		...js.configs.recommended,
		rules: {
			// TS type names like NodeJS.* are provided by types, not globals
			'no-undef': 'off',
			// Config files often have unused helpers and typings
			'no-unused-vars': 'off',
		},
	},
]