/**
 * Frontend STEP 4
 *
 * Tidak ada API token/secret di file ini.
 */
const APP_CONFIG = Object.freeze({
  API_BASE: '/api',

  // GitHub Pages hanya menjadi origin source.
  // Data asli hanya boleh dimuat ketika halaman
  // diakses melalui Worker/custom domain.
  BLOCKED_DIRECT_HOSTS: [
    'rizkyjan.github.io'
  ],

  SEARCH_DEBOUNCE_MS: 350
});
