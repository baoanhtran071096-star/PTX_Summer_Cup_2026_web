const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'archive/**',
      'thư viện/**',
      'index.html',
      'reset-admin.html',
    ],
  },
  ...nextCoreWebVitals,
];
