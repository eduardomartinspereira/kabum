// eslint.config.mjs (ou .js se seu projeto for "type": "module")
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Presets do Next
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Regras/overrides do projeto
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Desliga o erro de any
      "@typescript-eslint/no-explicit-any": "off",

      // (opcional) suaviza alguns avisos que estavam te travando
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@next/next/no-img-element": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },

  // Ignorados
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];
