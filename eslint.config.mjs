import js from '@eslint/js'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  prettier,
  {
    ignores: [
      "node_modules",
      "dist",
      "build",
      "coverage",
      "apps/client/**", // exclude Next app
    ],
    plugins: ["unused-imports"],
    rules: {
      "unused-imports/no-unused-imports": "warn",
    },
  },
]
