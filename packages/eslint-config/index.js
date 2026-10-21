/**
 * Shared ESLint base rules across the POS monorepo.
 */
module.exports = {
  rules: {
    "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    "prefer-const": "error",
    "no-unused-vars": "off",
  },
};
