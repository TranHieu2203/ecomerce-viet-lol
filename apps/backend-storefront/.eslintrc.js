module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    // Next.js 15 App Router (no /pages dir) can trigger this rule to crash in some setups.
    // Disable it to keep `next lint` runnable for this repo.
    "@next/next/no-html-link-for-pages": "off",
    // This rule can also crash in App Router-only setups depending on Next/ESLint versions.
    "@next/next/no-page-custom-font": "off",
    // `next lint` crashing in this repo; disable to keep CI/dev lint runnable.
    "@next/next/no-typos": "off",
    "@next/next/no-duplicate-head": "off",
    "@next/next/no-before-interactive-script-outside-document": "off",
    "@next/next/no-styled-jsx-in-document": "off",
  },
};