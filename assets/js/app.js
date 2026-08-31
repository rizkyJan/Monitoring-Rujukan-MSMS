/**
 * ============================================================
 * MONITORING RUJUKAN MITRA SEHAT
 * Frontend Application - STEP 4
 * ============================================================
 *
 * Arsitektur:
 *
 * Browser
 *   ↓
 * rujukan.mitrassehatms.com
 *   ↓
 * Cloudflare Access
 *   ↓
 * Cloudflare Worker
 *   ↓
 * Google Apps Script
 *   ↓
 * Google Spreadsheet
 *
 *
 * STEP 4:
 *
 * VIEWER
 * - lihat
 * - search
 * - filter
 * - pagination
 *
 * ERM
 * - sementara masih sama seperti viewer
 *
 * Tambah/edit akan dibuat di STEP berikutnya.
 */


// ============================================================
// STATE
// ============================================================

const state = {

  /**
   * User hasil Cloudflare Access.
   *
   * Contoh:
   *
   * {
   *   email: "erm@...",
   *   role: "erm"
   * }
   */
  user: null,


  /**
   * Daftar periode.
   *
   * Contoh:
   *
   * [
   *   "AGUSTUS 2026",
   *   "JULI 2026",
   *   ...
   * ]
   */
  periods: [],


  /**
   * Data rujukan halaman aktif.
   */
  items: [],


  /**
   * Pagination
   */
  page: 1,

  pageSize: 25,

  total: 0,

  totalPages: 0,


  /**
   * Timer debounce search.
   */
  searchTimer: null

};


// ============================================================
// DOM ELEMENT
// ============================================================

const elements = {

  appContent:
    document.getElementById(
      'appContent'
    ),


  secureMessage:
    document.getElementById(
      'secureMessage'
    ),


  modeBadge:
    document.getElementById(
      'modeBadge'
    ),


  userRole:
    document.getElementById(
      'userRole'
    ),


  userEmail:
    document.getElementById(
      'userEmail'
    ),


  // ----------------------------------------------------------
  // FILTER
  // ----------------------------------------------------------

  period:
    document.getElementById(
      'periodFilter'
    ),


  search:
    document.getElementById(
      'searchInput'
    ),


  doctor:
    document.getElementById(
      'doctorFilter'
    ),


  status:
    document.getElementById(
      'statusFilter'
    ),


  hospital:
    document.getElementById(
      'hospitalFilter'
    ),


  clinic:
    document.getElementById(
      'clinicFilter'
    ),


  reset:
    document.getElementById(
      'resetButton'
    ),


  // ----------------------------------------------------------
  // DASHBOARD
  // ----------------------------------------------------------

  statTotal:
    document.getElementById(
      'statTotal'
    ),


  statBaru:
    document.getElementById(
      'statBaru'
    ),


  statKontrol:
    document.getElementById(
      'statKontrol'
    ),


  statRs:
    document.getElementById(
      'statRs'
    ),


  // ----------------------------------------------------------
  // TABLE
  // ----------------------------------------------------------

  resultInfo:
    document.getElementById(
      'resultInfo'
    ),


  pageSize:
    document.getElementById(
      'pageSize'
    ),


  tableBody:
    document.getElementById(
      'tableBody'
    ),


  desktopTable:
    document.getElementById(
      'desktopTable'
    ),


  mobileCards:
    document.getElementById(
      'mobileCards'
    ),


  // ----------------------------------------------------------
  // STATE MESSAGE
  // ----------------------------------------------------------

  loadingState:
    document.getElementById(
      'loadingState'
    ),


  emptyState:
    document.getElementById(
      'emptyState'
    ),


  errorState:
    document.getElementById(
      'errorState'
    ),


  // ----------------------------------------------------------
  // PAGINATION
  // ----------------------------------------------------------

  pagination:
    document.getElementById(
      'pagination'
    ),


  prev:
    document.getElementById(
      'prevButton'
    ),


  next:
    document.getElementById(
      'nextButton'
    ),


  pageInfo:
    document.getElementById(
      'pageInfo'
    ),


  // ----------------------------------------------------------
  // MODAL DETAIL
  // ----------------------------------------------------------

  modal:
    document.getElementById(
      'detailModal'
    ),


  modalTitle:
    document.getElementById(
      'modalTitle'
    ),


  modalContent:
    document.getElementById(
      'modalContent'
    ),


  modalClose:
    document.getElementById(
      'modalClose'
    )

};


// ============================================================
// START APPLICATION
// ============================================================

document.addEventListener(
  'DOMContentLoaded',
  init
);


// ============================================================
// INIT
// ============================================================

async function init() {

  /**
   * Jangan mengambil data pasien jika aplikasi
   * dibuka langsung melalui GitHub Pages.
   */
  if (
    isDirectGithubPages()
  ) {

    showSecureDomainMessage();

    return;

  }


  /**
   * Pasang semua event listener.
   */
  bindEvents();


  try {

    setLoading(true);

    clearError();


    /**
     * 1. Ambil user login.
     */
    await loadCurrentUser();


    /**
     * 2. Ambil daftar periode.
     */
    await loadPeriods();


    if (
      state.periods.length === 0
    ) {

      throw new Error(
        'Tidak ada periode rujukan yang tersedia.'
      );

    }


    /**
     * 3. Ambil filter + dashboard.
     */
    await Promise.all([

      loadFilterOptions(),

      loadSummary()

    ]);


    /**
     * 4. Ambil data rujukan.
     */
    await loadRujukan();


  } catch (error) {

    console.error(error);

    showError(
      error?.message ||
      'Gagal memuat aplikasi.'
    );

  } finally {

    setLoading(false);

  }

}


// ============================================================
// CEK DOMAIN
// ============================================================

function isDirectGithubPages() {

  const hostname =
    window.location.hostname
      .toLowerCase();


  return APP_CONFIG
    .BLOCKED_DIRECT_HOSTS
    .includes(hostname);

}


// ============================================================
// PESAN JIKA DIBUKA DARI GITHUB.IO
// ============================================================

function showSecureDomainMessage() {

  if (
    elements.appContent
  ) {

    elements.appContent.hidden =
      true;

  }


  if (
    elements.secureMessage
  ) {

    elements.secureMessage.hidden =
      false;

  }


  if (
    elements.userRole
  ) {

    elements.userRole.textContent =
      'SECURE';

  }


  if (
    elements.userEmail
  ) {

    elements.userEmail.textContent =
      '';

  }


  if (
    elements.modeBadge
  ) {

    elements.modeBadge.textContent =
      'CUSTOM DOMAIN';

  }

}


// ============================================================
// LOAD CURRENT USER
// ============================================================

async function loadCurrentUser() {

  const payload =
    await apiFetch(
      '/me'
    );


  state.user =
    payload.user || null;


  const role =
    String(
      state.user?.role ||
      'viewer'
    )
      .toUpperCase();


  if (
    elements.userRole
  ) {

    elements.userRole.textContent =
      role;

  }


  if (
    elements.userEmail
  ) {

    elements.userEmail.textContent =
      state.user?.email || '';

  }


  if (
    elements.modeBadge
  ) {

    /**
     * STEP 4 masih read-only.
     */
    elements.modeBadge.textContent =
      'READ ONLY';

  }

}


// ============================================================
// LOAD PERIOD
// ============================================================

async function loadPeriods() {

  const payload =
    await apiFetch(
      '/periods'
    );


  state.periods =
    Array.isArray(
      payload.data
    )
      ? payload.data
      : [];


  if (
    !elements.period
  ) {

    return;

  }


  elements.period.innerHTML =
    state.periods
      .map(period => {

        return `
          <option
            value="${UI.escapeHtml(period)}"
          >
            ${UI.escapeHtml(period)}
          </option>
        `;

      })
      .join('');

}


// ============================================================
// LOAD FILTER OPTIONS
// ============================================================

async function loadFilterOptions() {

  const period =
    elements.period?.value;


  if (
    !period
  ) {

    return;

  }


  const params =
    new URLSearchParams({
      period: period
    });


  const payload =
    await apiFetch(
      '/filters?' +
      params.toString()
    );


  const filters =
    payload.data || {};


  // ----------------------------------------------------------
  // Dokter
  // ----------------------------------------------------------

  UI.fillSelect(

    elements.doctor,

    filters.dokter || [],

    'Semua Dokter'

  );


  // ----------------------------------------------------------
  // Status
  // ----------------------------------------------------------

  UI.fillSelect(

    elements.status,

    filters.status || [],

    'Semua Status'

  );


  // ----------------------------------------------------------
  // Rumah sakit
  // ----------------------------------------------------------

  UI.fillSelect(

    elements.hospital,

    filters.rs || [],

    'Semua RS'

  );


  // ----------------------------------------------------------
  // Poli
  // ----------------------------------------------------------

  UI.fillSelect(

    elements.clinic,

    filters.poli || [],

    'Semua Poli'

  );

}


// ============================================================
// LOAD DASHBOARD SUMMARY
// ============================================================

async function loadSummary() {

  const period =
    elements.period?.value;


  if (
    !period
  ) {

    return;

  }


  const params =
    new URLSearchParams({
      period: period
    });


  const payload =
    await apiFetch(
      '/summary?' +
      params.toString()
    );


  const summary =
    payload.data || {};


  elements.statTotal.textContent =
    summary.total ?? 0;


  elements.statBaru.textContent =
    summary.baru ?? 0;


  elements.statKontrol.textContent =
    summary.kontrol ?? 0;


  elements.statRs.textContent =
    summary.rumahSakit ?? 0;

}


// ============================================================
// LOAD RUJUKAN
// ============================================================

async function loadRujukan() {

  clearError();

  setLoading(true);


  try {

    const period =
      elements.period?.value;


    if (
      !period
    ) {

      throw new Error(
        'Periode belum dipilih.'
      );

    }


    // --------------------------------------------------------
    // Query dasar
    // --------------------------------------------------------

    const params =
      new URLSearchParams({

        period:
          period,

        page:
          String(
            state.page
          ),

        limit:
          String(
            state.pageSize
          )

      });


    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    const q =
      elements.search
        ?.value
        .trim();


    if (
      q
    ) {

      params.set(
        'q',
        q
      );

    }


    // --------------------------------------------------------
    // FILTER DOKTER
    // --------------------------------------------------------

    if (
      elements.doctor?.value
    ) {

      params.set(
        'dokter',
        elements.doctor.value
      );

    }


    // --------------------------------------------------------
    // FILTER STATUS
    // --------------------------------------------------------

    if (
      elements.status?.value
    ) {

      params.set(
        'status',
        elements.status.value
      );

    }


    // --------------------------------------------------------
    // FILTER RS
    // --------------------------------------------------------

    if (
      elements.hospital?.value
    ) {

      params.set(
        'rs',
        elements.hospital.value
      );

    }


    // --------------------------------------------------------
    // FILTER POLI
    // --------------------------------------------------------

    if (
      elements.clinic?.value
    ) {

      params.set(
        'poli',
        elements.clinic.value
      );

    }


    // --------------------------------------------------------
    // Request API
    // --------------------------------------------------------

    const payload =
      await apiFetch(
        '/rujukan?' +
        params.toString()
      );


    const data =
      payload.data || {};


    // --------------------------------------------------------
    // Simpan state
    // --------------------------------------------------------

    state.items =
      Array.isArray(
        data.items
      )
        ? data.items
        : [];


    state.page =
      Number(
        data.page || 1
      );


    state.total =
      Number(
        data.total || 0
      );


    state.totalPages =
      Number(
        data.totalPages || 0
      );


    // --------------------------------------------------------
    // Render
    // --------------------------------------------------------

    render();


  } catch (error) {

    console.error(error);


    showError(
      error?.message ||
      'Gagal membaca data rujukan.'
    );


  } finally {

    setLoading(false);

  }

}


// ============================================================
// EVENT LISTENER
// ============================================================

function bindEvents() {

  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  elements.search
    ?.addEventListener(
      'input',
      () => {

        clearTimeout(
          state.searchTimer
        );


        state.searchTimer =
          setTimeout(
            () => {

              state.page = 1;

              loadRujukan();

            },

            APP_CONFIG
              .SEARCH_DEBOUNCE_MS

          );

      }
    );


  // ----------------------------------------------------------
  // PERIODE
  // ----------------------------------------------------------

  elements.period
    ?.addEventListener(
      'change',
      async () => {

        state.page = 1;


        try {

          setLoading(true);

          clearError();


          /**
           * Saat periode berubah,
           * dropdown filter juga berubah.
           */
          await Promise.all([

            loadFilterOptions(),

            loadSummary()

          ]);


          await loadRujukan();


        } catch (error) {

          console.error(error);

          showError(
            error?.message ||
            'Gagal mengganti periode.'
          );


        } finally {

          setLoading(false);

        }

      }
    );


  // ----------------------------------------------------------
  // FILTER DOKTER / STATUS / RS / POLI
  // ----------------------------------------------------------

  [

    elements.doctor,

    elements.status,

    elements.hospital,

    elements.clinic

  ]
    .filter(Boolean)
    .forEach(element => {

      element.addEventListener(
        'change',
        () => {

          state.page = 1;

          loadRujukan();

        }
      );

    });


  // ----------------------------------------------------------
  // PAGE SIZE
  // ----------------------------------------------------------

  elements.pageSize
    ?.addEventListener(
      'change',
      () => {

        state.pageSize =
          Number(
            elements.pageSize.value
          ) || 25;


        state.page = 1;


        loadRujukan();

      }
    );


  // ----------------------------------------------------------
  // RESET
  // ----------------------------------------------------------

  elements.reset
    ?.addEventListener(
      'click',
      async () => {

        if (
          elements.search
        ) {

          elements.search.value =
            '';

        }


        if (
          elements.doctor
        ) {

          elements.doctor.value =
            '';

        }


        if (
          elements.status
        ) {

          elements.status.value =
            '';

        }


        if (
          elements.hospital
        ) {

          elements.hospital.value =
            '';

        }


        if (
          elements.clinic
        ) {

          elements.clinic.value =
            '';

        }


        state.page = 1;


        await loadRujukan();

      }
    );


  // ----------------------------------------------------------
  // PREVIOUS
  // ----------------------------------------------------------

  elements.prev
    ?.addEventListener(
      'click',
      () => {

        if (
          state.page > 1
        ) {

          state.page -= 1;

          loadRujukan();

        }

      }
    );


  // ----------------------------------------------------------
  // NEXT
  // ----------------------------------------------------------

  elements.next
    ?.addEventListener(
      'click',
      () => {

        if (
          state.page <
          state.totalPages
        ) {

          state.page += 1;

          loadRujukan();

        }

      }
    );


  // ----------------------------------------------------------
  // DETAIL
  // ----------------------------------------------------------

  document.addEventListener(
    'click',
    event => {

      const button =
        event.target.closest(
          '[data-detail-index]'
        );


      if (
        !button
      ) {

        return;

      }


      const index =
        Number(
          button.dataset.detailIndex
        );


      const item =
        state.items[index];


      if (
        item
      ) {

        openDetail(item);

      }

    }
  );


  // ----------------------------------------------------------
  // CLOSE MODAL
  // ----------------------------------------------------------

  elements.modalClose
    ?.addEventListener(
      'click',
      closeDetail
    );


  // ----------------------------------------------------------
  // Klik backdrop modal
  // ----------------------------------------------------------

  elements.modal
    ?.addEventListener(
      'click',
      event => {

        if (
          event.target ===
          elements.modal
        ) {

          closeDetail();

        }

      }
    );


  // ----------------------------------------------------------
  // ESC untuk tutup modal
  // ----------------------------------------------------------

  document.addEventListener(
    'keydown',
    event => {

      if (
        event.key ===
        'Escape'
      ) {

        closeDetail();

      }

    }
  );

}


// ============================================================
// RENDER TABLE
// ============================================================

function render() {

  // ----------------------------------------------------------
  // Jumlah hasil
  // ----------------------------------------------------------

  if (
    elements.resultInfo
  ) {

    elements.resultInfo.textContent =
      `${state.total} data ditemukan`;

  }


  const hasData =
    state.items.length > 0;


  // ----------------------------------------------------------
  // Empty state
  // ----------------------------------------------------------

  if (
    elements.emptyState
  ) {

    elements.emptyState.hidden =
      state.total !== 0;

  }


  // ----------------------------------------------------------
  // Desktop table
  // ----------------------------------------------------------

  if (
    elements.desktopTable
  ) {

    elements.desktopTable.hidden =
      !hasData;

  }


  // ----------------------------------------------------------
  // Mobile cards
  // ----------------------------------------------------------

  if (
    elements.mobileCards
  ) {

    elements.mobileCards.hidden =
      !hasData;

  }


  // ----------------------------------------------------------
  // Pagination
  // ----------------------------------------------------------

  if (
    elements.pagination
  ) {

    elements.pagination.hidden =
      state.total === 0;

  }


  // ----------------------------------------------------------
  // TABLE ROWS
  // ----------------------------------------------------------

  if (
    elements.tableBody
  ) {

    elements.tableBody.innerHTML =
      state.items
        .map(
          (item, index) =>
            UI.rowHtml(
              item,
              index
            )
        )
        .join('');

  }


  // ----------------------------------------------------------
  // MOBILE CARDS
  // ----------------------------------------------------------

  if (
    elements.mobileCards
  ) {

    elements.mobileCards.innerHTML =
      state.items
        .map(
          (item, index) =>
            UI.mobileCardHtml(
              item,
              index
            )
        )
        .join('');

  }


  // ----------------------------------------------------------
  // PAGE INFO
  // ----------------------------------------------------------

  const displayTotalPages =
    Math.max(
      1,
      state.totalPages
    );


  if (
    elements.pageInfo
  ) {

    elements.pageInfo.textContent =
      `Halaman ${state.page} dari ${displayTotalPages}`;

  }


  // ----------------------------------------------------------
  // Previous
  // ----------------------------------------------------------

  if (
    elements.prev
  ) {

    elements.prev.disabled =
      state.page <= 1;

  }


  // ----------------------------------------------------------
  // Next
  // ----------------------------------------------------------

  if (
    elements.next
  ) {

    elements.next.disabled =

      state.totalPages === 0 ||

      state.page >=
        state.totalPages;

  }

}


// ============================================================
// API FETCH
// ============================================================

async function apiFetch(path) {

  const url =
    APP_CONFIG.API_BASE +
    path;


  let response;


  try {

    response =
      await fetch(
        url,
        {
          method:
            'GET',

          headers: {
            Accept:
              'application/json'
          },

          credentials:
            'same-origin',

          cache:
            'no-store'
        }
      );


  } catch (error) {

    console.error(error);


    throw new Error(
      'Tidak dapat terhubung ke server.'
    );

  }


  let payload;


  try {

    payload =
      await response.json();


  } catch (error) {

    console.error(error);


    throw new Error(
      'Response server bukan JSON yang valid.'
    );

  }


  // ==========================================================
  // ERROR HTTP / API
  // ==========================================================

  if (
    !response.ok ||
    payload.ok === false
  ) {

    let message =
      'Request gagal.';


    if (
      typeof payload.error ===
      'string'
    ) {

      message =
        payload.error;

    }


    if (
      payload.error &&
      typeof payload.error ===
      'object'
    ) {

      message =
        payload.error.message ||
        message;

    }


    throw new Error(
      message
    );

  }


  return payload;

}


// ============================================================
// LOADING
// ============================================================

function setLoading(
  isLoading
) {

  if (
    !elements.loadingState
  ) {

    return;

  }


  elements.loadingState.hidden =
    !isLoading;

}


// ============================================================
// ERROR
// ============================================================

function showError(
  message
) {

  if (
    !elements.errorState
  ) {

    return;

  }


  elements.errorState.textContent =
    message;


  elements.errorState.hidden =
    false;

}


// ============================================================
// CLEAR ERROR
// ============================================================

function clearError() {

  if (
    !elements.errorState
  ) {

    return;

  }


  elements.errorState.hidden =
    true;


  elements.errorState.textContent =
    '';

}


// ============================================================
// MODAL DETAIL
// ============================================================

function openDetail(
  item
) {

  if (
    !elements.modal
  ) {

    return;

  }


  elements.modalTitle.textContent =
    item.nama ||
    'Detail Rujukan';


  elements.modalContent.innerHTML =
    UI.detailHtml(
      item
    );


  elements.modal.hidden =
    false;


  document.body.style.overflow =
    'hidden';

}


// ============================================================
// CLOSE DETAIL
// ============================================================

function closeDetail() {

  if (
    !elements.modal
  ) {

    return;

  }


  elements.modal.hidden =
    true;


  document.body.style.overflow =
    '';

}