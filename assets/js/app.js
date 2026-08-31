const state = {
  data: [],
  filtered: [],
  page: 1,
  pageSize: 25
};

const elements = {
  period: document.getElementById('periodFilter'),
  search: document.getElementById('searchInput'),
  doctor: document.getElementById('doctorFilter'),
  status: document.getElementById('statusFilter'),
  hospital: document.getElementById('hospitalFilter'),
  clinic: document.getElementById('clinicFilter'),
  reset: document.getElementById('resetButton'),

  statTotal: document.getElementById('statTotal'),
  statBaru: document.getElementById('statBaru'),
  statKontrol: document.getElementById('statKontrol'),
  statRs: document.getElementById('statRs'),

  resultInfo: document.getElementById('resultInfo'),
  pageSize: document.getElementById('pageSize'),
  tableBody: document.getElementById('tableBody'),
  mobileCards: document.getElementById('mobileCards'),
  emptyState: document.getElementById('emptyState'),
  loadingState: document.getElementById('loadingState'),

  prev: document.getElementById('prevButton'),
  next: document.getElementById('nextButton'),
  pageInfo: document.getElementById('pageInfo'),

  modal: document.getElementById('detailModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalContent: document.getElementById('modalContent'),
  modalClose: document.getElementById('modalClose')
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  state.data = [...APP_DATA.rows];

  elements.period.innerHTML =
    APP_DATA.periods
      .map(period =>
        `<option value="${UI.escapeHtml(period)}">${UI.escapeHtml(period)}</option>`
      )
      .join('');

  buildFilterOptions();
  bindEvents();
  applyFilters();
}

function buildFilterOptions() {
  UI.fillSelect(
    elements.doctor,
    UI.unique(state.data.map(item => item.dokter)),
    'Semua Dokter'
  );

  UI.fillSelect(
    elements.status,
    UI.unique(state.data.map(item => item.kontrol)),
    'Semua Status'
  );

  UI.fillSelect(
    elements.hospital,
    UI.unique(state.data.map(item => item.rsTujuan)),
    'Semua RS'
  );

  UI.fillSelect(
    elements.clinic,
    UI.unique(state.data.map(item => item.poliTujuan)),
    'Semua Poli'
  );
}

function bindEvents() {
  elements.search.addEventListener('input', () => {
    state.page = 1;
    applyFilters();
  });

  [
    elements.period,
    elements.doctor,
    elements.status,
    elements.hospital,
    elements.clinic
  ].forEach(element => {
    element.addEventListener('change', () => {
      state.page = 1;
      applyFilters();
    });
  });

  elements.pageSize.addEventListener('change', () => {
    state.pageSize = Number(elements.pageSize.value) || 25;
    state.page = 1;
    render();
  });

  elements.reset.addEventListener('click', resetFilters);

  elements.prev.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      render();
    }
  });

  elements.next.addEventListener('click', () => {
    if (state.page < totalPages()) {
      state.page += 1;
      render();
    }
  });

  document.addEventListener('click', event => {
    const button =
      event.target.closest('[data-detail-index]');

    if (!button) {
      return;
    }

    const index =
      Number(button.dataset.detailIndex);

    const item =
      pageItems()[index];

    if (item) {
      openDetail(item);
    }
  });

  elements.modalClose.addEventListener('click', closeDetail);

  elements.modal.addEventListener('click', event => {
    if (event.target === elements.modal) {
      closeDetail();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeDetail();
    }
  });
}

function applyFilters() {
  const q =
    elements.search.value
      .trim()
      .toLowerCase();

  const doctor = elements.doctor.value;
  const status = elements.status.value;
  const hospital = elements.hospital.value;
  const clinic = elements.clinic.value;

  state.filtered =
    state.data.filter(item => {
      const searchable = [
        item.tanggal,
        item.dokter,
        item.no,
        item.noHarian,
        item.nama,
        item.bpjs,
        item.kontrol,
        item.dx,
        item.rsTujuan,
        item.poliTujuan,
        item.keterangan,
        item.pemberatTacc
      ]
        .join(' ')
        .toLowerCase();

      if (q && !searchable.includes(q)) {
        return false;
      }

      if (doctor && item.dokter !== doctor) {
        return false;
      }

      if (status && item.kontrol !== status) {
        return false;
      }

      if (hospital && item.rsTujuan !== hospital) {
        return false;
      }

      if (clinic && item.poliTujuan !== clinic) {
        return false;
      }

      return true;
    });

  updateStats();
  render();
}

function updateStats() {
  const total = state.filtered.length;

  const baru =
    state.filtered.filter(
      item => item.kontrol.toUpperCase() === 'BARU'
    ).length;

  const kontrol =
    state.filtered.filter(
      item => item.kontrol.toUpperCase() === 'KONTROL'
    ).length;

  const rs =
    new Set(
      state.filtered
        .map(item => item.rsTujuan)
        .filter(Boolean)
    ).size;

  elements.statTotal.textContent = total;
  elements.statBaru.textContent = baru;
  elements.statKontrol.textContent = kontrol;
  elements.statRs.textContent = rs;
}

function totalPages() {
  if (!state.filtered.length) {
    return 1;
  }

  return Math.ceil(
    state.filtered.length / state.pageSize
  );
}

function pageItems() {
  const start =
    (state.page - 1) * state.pageSize;

  return state.filtered.slice(
    start,
    start + state.pageSize
  );
}

function render() {
  const pages = totalPages();

  if (state.page > pages) {
    state.page = pages;
  }

  const items = pageItems();

  elements.resultInfo.textContent =
    `${state.filtered.length} data ditemukan`;

  elements.emptyState.hidden =
    state.filtered.length !== 0;

  document.getElementById('desktopTable').hidden =
    state.filtered.length === 0;

  elements.mobileCards.hidden =
    state.filtered.length === 0;

  elements.tableBody.innerHTML =
    items
      .map((item, index) =>
        UI.rowHtml(item, index)
      )
      .join('');

  elements.mobileCards.innerHTML =
    items
      .map((item, index) =>
        UI.mobileCardHtml(item, index)
      )
      .join('');

  elements.pageInfo.textContent =
    `Halaman ${state.page} dari ${pages}`;

  elements.prev.disabled =
    state.page <= 1;

  elements.next.disabled =
    state.page >= pages;
}

function resetFilters() {
  elements.search.value = '';
  elements.doctor.value = '';
  elements.status.value = '';
  elements.hospital.value = '';
  elements.clinic.value = '';
  elements.period.selectedIndex = 0;

  state.page = 1;

  applyFilters();
}

function openDetail(item) {
  elements.modalTitle.textContent =
    item.nama || 'Detail Rujukan';

  elements.modalContent.innerHTML =
    UI.detailHtml(item);

  elements.modal.hidden = false;

  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  elements.modal.hidden = true;
  document.body.style.overflow = '';
}
