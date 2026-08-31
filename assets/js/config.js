/**
 * ============================================================
 * MONITORING RUJUKAN MITRA SEHAT
 * Frontend Config - STEP 4
 * ============================================================
 *
 * PENTING:
 *
 * File ini berada di GitHub Pages sehingga isinya PUBLIC.
 *
 * Jangan pernah memasukkan:
 * - GAS_API_TOKEN
 * - password
 * - API secret
 * - credential Google
 *
 * Semua secret disimpan di Cloudflare Worker.
 */

const APP_CONFIG = Object.freeze({

  /**
   * Frontend hanya memanggil API pada domain yang sama.
   *
   * Contoh:
   *
   * https://rujukan.mitrassehatms.com/api/periods
   *
   * Cloudflare Worker kemudian meneruskan request
   * ke Google Apps Script.
   */
  API_BASE: '/api',


  /**
   * GitHub Pages hanya menjadi sumber file frontend.
   *
   * Data pasien TIDAK boleh dimuat jika aplikasi
   * dibuka langsung melalui github.io.
   */
  BLOCKED_DIRECT_HOSTS: [
    'rizkyjan.github.io'
  ],


  /**
   * Delay pencarian.
   *
   * Supaya API tidak dipanggil setiap satu huruf
   * ketika user sedang mengetik.
   */
  SEARCH_DEBOUNCE_MS: 350

});