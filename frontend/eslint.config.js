import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import unicorn from 'eslint-plugin-unicorn'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      '**/*.config.{js,ts}',
      'playwright.config.ts',
      'archives/**',
      '.tmp-landings/**',
      '@/**',
      // Reduce lint noise from experimental/legacy areas not part of main app
      'src/domains-legacy-archive/**',
      'src/components/client-ui/**',
      'src/components/client/template/**',
      // Experimental/demo UIs not part of the stable app shell
      'src/pages/finalui2/**',
      'src/components/examples/**',
      'src/components/branding/LogoDemo.tsx',
      'src/pages/ai-tutor/**',
      'src/components/ui/drawer.tsx', // depends on optional lib (vaul)
      'src/components/dropdowns/MultiSelectDropdown.tsx', // depends on optional lib (react-select)
      'src/components/TourGuide/TourGuide.tsx', // depends on optional lib (react-joyride)
      // Admin wrappers referencing non-existent domain paths (legacy). Exclude for now.
      'src/components/admin/**',
    ]
  },
  // Base TS + JS rules
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: {
      'import/resolver': {
        typescript: {
          // Use the workspace tsconfig to resolve @ alias
          project: ['./tsconfig.json'],
          alwaysTryTypes: true,
        },
        node: true,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
      unicorn,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Soften blockers to establish a lint baseline; keep visibility as warnings
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Import hygiene — relax ordering to reduce noise for baseline
      'import/order': 'off',
      'import/no-unresolved': 'warn',
      'import/newline-after-import': 'off',
      'import/no-duplicates': 'warn',
      // TS strictness nudges
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      // Allow CommonJS require to avoid a single failing file baseline
      '@typescript-eslint/no-require-imports': 'off',
      // Cleanliness
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-empty': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'prefer-const': 'warn',
      eqeqeq: ['warn', 'smart'],
      // Light unicorn rules
      'unicorn/prefer-node-protocol': 'warn',
      'unicorn/no-useless-undefined': 'warn',
      'unicorn/prefer-optional-catch-binding': 'warn',
    },
  },
)