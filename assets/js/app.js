const state = {
  user: null,
  permissions: {
    read: false,
    create: false,
    update: false,
    delete: false
  },
  writeApiEnabled: false,

  periods: [],
  items: [],

  page: 1,
  pageSize: 25,
  total: 0,
  totalPages: 0,

  searchTimer: null,

  formMode: 'create',
  editingItem: null,
  formSnapshot: null,
  formSaving: false
};


const elements = {
  appContent:
    document.getElementById('appContent'),

  secureMessage:
    document.getElementById('secureMessage'),

  modeBadge:
    document.getElementById('modeBadge'),

  userRole:
    document.getElementById('userRole'),

  userEmail:
    document.getElementById('userEmail'),

  period:
    document.getElementById('periodFilter'),

  search:
    document.getElementById('searchInput'),

  doctor:
    document.getElementById('doctorFilter'),

  status:
    document.getElementById('statusFilter'),

  hospital:
    document.getElementById('hospitalFilter'),

  clinic:
    document.getElementById('clinicFilter'),

  reset:
    document.getElementById('resetButton'),

  statTotal:
    document.getElementById('statTotal'),

  statBaru:
    document.getElementById('statBaru'),

  statKontrol:
    document.getElementById('statKontrol'),

  statRs:
    document.getElementById('statRs'),

  resultInfo:
    document.getElementById('resultInfo'),

  pageSize:
    document.getElementById('pageSize'),

  addButton:
    document.getElementById('addButton'),

  tableBody:
    document.getElementById('tableBody'),

  desktopTable:
    document.getElementById('desktopTable'),

  mobileCards:
    document.getElementById('mobileCards'),

  loadingState:
    document.getElementById('loadingState'),

  emptyState:
    document.getElementById('emptyState'),

  errorState:
    document.getElementById('errorState'),

  pagination:
    document.getElementById('pagination'),

  prev:
    document.getElementById('prevButton'),

  next:
    document.getElementById('nextButton'),

  pageInfo:
    document.getElementById('pageInfo'),

  detailModal:
    document.getElementById('detailModal'),

  modalTitle:
    document.getElementById('modalTitle'),

  modalContent:
    document.getElementById('modalContent'),

  modalClose:
    document.getElementById('modalClose'),

  formModal:
    document.getElementById('formModal'),

  formModalTitle:
    document.getElementById('formModalTitle'),

  formModalKicker:
    document.getElementById('formModalKicker'),

  formModalClose:
    document.getElementById('formModalClose'),

  formPeriodLabel:
    document.getElementById('formPeriodLabel'),

  formRowWrap:
    document.getElementById('formRowWrap'),

  formRowLabel:
    document.getElementById('formRowLabel'),

  form:
    document.getElementById('rujukanForm'),

  formError:
    document.getElementById('formError'),

  formCancel:
    document.getElementById('formCancelButton'),

  formSubmit:
    document.getElementById('formSubmitButton'),

  formTanggal:
    document.getElementById('formTanggal'),

  formDokter:
    document.getElementById('formDokter'),

  formNo:
    document.getElementById('formNo'),

  formNoHarian:
    document.getElementById('formNoHarian'),

  formNama:
    document.getElementById('formNama'),

  formBpjs:
    document.getElementById('formBpjs'),

  formKontrol:
    document.getElementById('formKontrol'),

  formDx:
    document.getElementById('formDx'),

  formRsTujuan:
    document.getElementById('formRsTujuan'),

  formPoliTujuan:
    document.getElementById('formPoliTujuan'),

  formKeterangan:
    document.getElementById('formKeterangan'),

  formPemberatTacc:
    document.getElementById('formPemberatTacc'),

  toastContainer:
    document.getElementById('toastContainer')
};


document.addEventListener(
  'DOMContentLoaded',
  init
);


async function init() {
  if (isDirectGithubPages_()) {
    showSecureDomainMessage_();
    return;
  }

  bindEvents();

  try {
    setLoading_(true);

    await loadCurrentUser_();
    await loadPeriods_();

    if (!state.periods.length) {
      throw new Error('Tidak ada periode yang tersedia.');
    }

    await Promise.all([
      loadFilterOptions_(),
      loadSummary_()
    ]);

    await loadRujukan_();

  } catch (error) {
    showError_(
      error?.message ||
      'Gagal memuat aplikasi.'
    );
  } finally {
    setLoading_(false);
  }
}


function isDirectGithubPages_() {
  return APP_CONFIG.BLOCKED_DIRECT_HOSTS
    .includes(
      window.location.hostname
        .toLowerCase()
    );
}


function showSecureDomainMessage_() {
  elements.appContent.hidden = true;
  elements.secureMessage.hidden = false;

  elements.userRole.textContent = 'AMAN';
  elements.userEmail.textContent = '';
  elements.modeBadge.textContent = 'CUSTOM DOMAIN';
}


async function loadCurrentUser_() {
  const payload = await apiFetch_('/me');

  state.user = payload.user || null;
  state.permissions = {
    read: Boolean(payload.permissions?.read),
    create: Boolean(payload.permissions?.create),
    update: Boolean(payload.permissions?.update),
    delete: Boolean(payload.permissions?.delete)
  };
  state.writeApiEnabled = Boolean(payload.writeApiEnabled);

  const role = String(state.user?.role || 'viewer')
    .toUpperCase();

  elements.userRole.textContent = role;
  elements.userEmail.textContent = state.user?.email || '';

  if (canWrite_()) {
    elements.modeBadge.textContent = 'AKSES ERM';
    elements.modeBadge.classList.add('erm-mode');
    elements.addButton.hidden = !state.permissions.create;
  } else {
    elements.modeBadge.textContent = 'READ ONLY';
    elements.modeBadge.classList.remove('erm-mode');
    elements.addButton.hidden = true;
  }
}


function canWrite_() {
  return (
    state.user?.role === 'erm' &&
    state.writeApiEnabled
  );
}


function canEdit_() {
  return canWrite_() && state.permissions.update;
}


async function loadPeriods_() {
  const payload = await apiFetch_('/periods');

  state.periods = Array.isArray(payload.data)
    ? payload.data
    : [];

  elements.period.innerHTML = state.periods
    .map(period =>
      `<option value="${UI.escapeHtml(period)}">${UI.escapeHtml(period)}</option>`
    )
    .join('');
}


async function loadFilterOptions_() {
  const period = elements.period.value;

  if (!period) {
    return;
  }

  const params = new URLSearchParams({ period });
  const payload = await apiFetch_(
    '/filters?' + params.toString()
  );

  const filters = payload.data || {};

  const doctorOptions = filters.dokter || [];

  UI.fillSelect(
    elements.doctor,
    doctorOptions,
    'Semua Dokter'
  );

  // Form Tambah/Edit memakai daftar dokter yang sama dengan
  // dropdown dokter pada Spreadsheet/filter periode aktif.
  UI.fillSelect(
    elements.formDokter,
    doctorOptions,
    '- Pilih Dokter -'
  );

  UI.fillSelect(
    elements.status,
    filters.status || [],
    'Semua Status'
  );

  UI.fillSelect(
    elements.hospital,
    filters.rs || [],
    'Semua RS'
  );

  UI.fillSelect(
    elements.clinic,
    filters.poli || [],
    'Semua Poli'
  );
}


async function loadSummary_() {
  const period = elements.period.value;

  if (!period) {
    return;
  }

  const params = new URLSearchParams({ period });
  const payload = await apiFetch_(
    '/summary?' + params.toString()
  );

  const summary = payload.data || {};

  elements.statTotal.textContent = summary.total ?? 0;
  elements.statBaru.textContent = summary.baru ?? 0;
  elements.statKontrol.textContent = summary.kontrol ?? 0;
  elements.statRs.textContent = summary.rumahSakit ?? 0;
}


async function loadRujukan_() {
  clearError_();
  setLoading_(true);

  try {
    const params = new URLSearchParams({
      period: elements.period.value,
      page: String(state.page),
      limit: String(state.pageSize)
    });

    const q = elements.search.value.trim();

    if (q) {
      params.set('q', q);
    }

    if (elements.doctor.value) {
      params.set('dokter', elements.doctor.value);
    }

    if (elements.status.value) {
      params.set('status', elements.status.value);
    }

    if (elements.hospital.value) {
      params.set('rs', elements.hospital.value);
    }

    if (elements.clinic.value) {
      params.set('poli', elements.clinic.value);
    }

    const payload = await apiFetch_(
      '/rujukan?' + params.toString()
    );

    const data = payload.data || {};

    state.items = Array.isArray(data.items)
      ? data.items
      : [];

    state.page = Number(data.page || 1);
    state.total = Number(data.total || 0);
    state.totalPages = Number(data.totalPages || 0);

    render_();

  } catch (error) {
    showError_(
      error?.message ||
      'Gagal membaca data rujukan.'
    );
  } finally {
    setLoading_(false);
  }
}


function bindEvents() {
  elements.search.addEventListener(
    'input',
    () => {
      clearTimeout(state.searchTimer);

      state.searchTimer = setTimeout(
        () => {
          state.page = 1;
          loadRujukan_();
        },
        APP_CONFIG.SEARCH_DEBOUNCE_MS
      );
    }
  );

  elements.period.addEventListener(
    'change',
    async () => {
      state.page = 1;

      try {
        setLoading_(true);

        await Promise.all([
          loadFilterOptions_(),
          loadSummary_()
        ]);

        await loadRujukan_();

      } catch (error) {
        showError_(
          error?.message ||
          'Gagal mengganti periode.'
        );
      } finally {
        setLoading_(false);
      }
    }
  );

  [
    elements.doctor,
    elements.status,
    elements.hospital,
    elements.clinic
  ].forEach(element => {
    element.addEventListener(
      'change',
      () => {
        state.page = 1;
        loadRujukan_();
      }
    );
  });

  elements.pageSize.addEventListener(
    'change',
    () => {
      state.pageSize = Number(elements.pageSize.value) || 25;
      state.page = 1;
      loadRujukan_();
    }
  );

  elements.reset.addEventListener(
    'click',
    () => {
      elements.search.value = '';
      elements.doctor.value = '';
      elements.status.value = '';
      elements.hospital.value = '';
      elements.clinic.value = '';
      state.page = 1;
      loadRujukan_();
    }
  );

  elements.prev.addEventListener(
    'click',
    () => {
      if (state.page > 1) {
        state.page -= 1;
        loadRujukan_();
      }
    }
  );

  elements.next.addEventListener(
    'click',
    () => {
      if (state.page < state.totalPages) {
        state.page += 1;
        loadRujukan_();
      }
    }
  );

  elements.addButton.addEventListener(
    'click',
    openCreateForm_
  );

  document.addEventListener(
    'click',
    async event => {
      const detailButton = event.target.closest(
        '[data-detail-index]'
      );

      if (detailButton) {
        const index = Number(detailButton.dataset.detailIndex);
        const item = state.items[index];

        if (item) {
          openDetail_(item);
        }

        return;
      }

      const editButton = event.target.closest(
        '[data-edit-row]'
      );

      if (editButton) {
        const row = Number(editButton.dataset.editRow);

        if (Number.isInteger(row)) {
          await openEditForm_(row);
        }
      }
    }
  );

  elements.modalClose.addEventListener(
    'click',
    closeDetail_
  );

  elements.detailModal.addEventListener(
    'click',
    event => {
      if (event.target === elements.detailModal) {
        closeDetail_();
      }
    }
  );

  elements.formModalClose.addEventListener(
    'click',
    closeForm_
  );

  elements.formCancel.addEventListener(
    'click',
    closeForm_
  );

  elements.formModal.addEventListener(
    'click',
    event => {
      if (event.target === elements.formModal) {
        closeForm_();
      }
    }
  );

  elements.form.addEventListener(
    'submit',
    submitForm_
  );

  document.addEventListener(
    'keydown',
    event => {
      if (event.key === 'Escape') {
        closeDetail_();

        if (!state.formSaving) {
          closeForm_();
        }
      }
    }
  );
}


function render_() {
  elements.resultInfo.textContent =
    `${state.total} data ditemukan`;

  const hasData = state.items.length > 0;

  elements.emptyState.hidden = state.total !== 0;
  elements.desktopTable.hidden = !hasData;
  elements.mobileCards.hidden = !hasData;
  elements.pagination.hidden = state.total === 0;

  const canEdit = canEdit_();

  elements.tableBody.innerHTML = state.items
    .map((item, index) =>
      UI.rowHtml(item, index, canEdit)
    )
    .join('');

  elements.mobileCards.innerHTML = state.items
    .map((item, index) =>
      UI.mobileCardHtml(item, index, canEdit)
    )
    .join('');

  const displayTotalPages = Math.max(
    1,
    state.totalPages
  );

  elements.pageInfo.textContent =
    `Halaman ${state.page} dari ${displayTotalPages}`;

  elements.prev.disabled = state.page <= 1;
  elements.next.disabled =
    state.totalPages === 0 ||
    state.page >= state.totalPages;
}


function openDetail_(item) {
  elements.modalTitle.textContent =
    item.nama || 'Detail Rujukan';

  elements.modalContent.innerHTML =
    UI.detailHtml(item);

  elements.detailModal.hidden = false;
  document.body.style.overflow = 'hidden';
}


function closeDetail_() {
  elements.detailModal.hidden = true;

  if (elements.formModal.hidden) {
    document.body.style.overflow = '';
  }
}


function openCreateForm_() {
  if (!canWrite_() || !state.permissions.create) {
    showToast_('Akun ini tidak memiliki akses tambah.', 'error');
    return;
  }

  state.formMode = 'create';
  state.editingItem = null;
  state.formSnapshot = null;

  resetFormFields_();

  elements.formModalKicker.textContent = 'Akses ERM';
  elements.formModalTitle.textContent = 'Tambah Rujukan';
  elements.formPeriodLabel.textContent = elements.period.value || '-';
  elements.formRowWrap.hidden = true;
  elements.formSubmit.textContent = 'Simpan Data';

  clearFormError_();
  elements.formModal.hidden = false;
  document.body.style.overflow = 'hidden';

  elements.formNama.focus();
}


async function openEditForm_(row) {
  if (!canEdit_()) {
    showToast_('Akun ini tidak memiliki akses edit.', 'error');
    return;
  }

  closeDetail_();

  try {
    const params = new URLSearchParams({
      period: elements.period.value,
      row: String(row)
    });

    const payload = await apiFetch_(
      '/rujukan-detail?' + params.toString()
    );

    const item = payload.data;

    if (!item) {
      throw new Error('Data edit tidak ditemukan.');
    }

    state.formMode = 'edit';
    state.editingItem = item;

    fillFormFromItem_(item);
    state.formSnapshot = collectFormData_();

    elements.formModalKicker.textContent = 'Edit ERM';
    elements.formModalTitle.textContent = 'Edit Rujukan';
    elements.formPeriodLabel.textContent = elements.period.value || '-';
    elements.formRowWrap.hidden = false;
    elements.formRowLabel.textContent = String(item.row);
    elements.formSubmit.textContent = 'Simpan Perubahan';

    clearFormError_();
    elements.formModal.hidden = false;
    document.body.style.overflow = 'hidden';

    elements.formNama.focus();

  } catch (error) {
    showToast_(
      error?.message || 'Gagal membuka data edit.',
      'error'
    );
  }
}


function resetFormFields_() {
  elements.form.reset();
  ensureStatusOption_('');
}


function fillFormFromItem_(item) {
  resetFormFields_();

  elements.formTanggal.value = displayDateToInput_(item.tanggal);

  ensureDoctorOption_(item.dokter || '');
  elements.formDokter.value = item.dokter || '';

  elements.formNo.value = item.no || '';
  elements.formNoHarian.value = item.noHarian || '';
  elements.formNama.value = item.nama || '';
  elements.formBpjs.value = item.bpjs || '';

  ensureStatusOption_(item.kontrol || '');
  elements.formKontrol.value = item.kontrol || '';

  elements.formDx.value = item.dx || '';
  elements.formRsTujuan.value = item.rsTujuan || '';
  elements.formPoliTujuan.value = item.poliTujuan || '';
  elements.formKeterangan.value = item.keterangan || '';
  elements.formPemberatTacc.value = item.pemberatTacc || '';
}


function ensureDoctorOption_(value) {
  const clean = String(value || '').trim();

  if (!clean) {
    return;
  }

  const exists = Array.from(elements.formDokter.options)
    .some(option => option.value === clean);

  // Pengaman untuk data lama: jika suatu dokter lama belum masuk
  // daftar filter periode, nilainya tetap dapat ditampilkan saat Edit.
  if (!exists) {
    const option = document.createElement('option');
    option.value = clean;
    option.textContent = clean;
    elements.formDokter.appendChild(option);
  }
}


function ensureStatusOption_(value) {
  const clean = String(value || '').trim();

  if (!clean) {
    return;
  }

  const exists = Array.from(elements.formKontrol.options)
    .some(option => option.value === clean);

  if (!exists) {
    const option = document.createElement('option');
    option.value = clean;
    option.textContent = clean;
    elements.formKontrol.appendChild(option);
  }
}


function collectFormData_() {
  return {
    tanggal: elements.formTanggal.value.trim(),
    dokter: elements.formDokter.value.trim(),
    no: elements.formNo.value.trim(),
    noHarian: elements.formNoHarian.value.trim(),
    nama: elements.formNama.value.trim(),
    bpjs: elements.formBpjs.value.trim(),
    kontrol: elements.formKontrol.value.trim(),
    dx: elements.formDx.value.trim(),
    rsTujuan: elements.formRsTujuan.value.trim(),
    poliTujuan: elements.formPoliTujuan.value.trim(),
    keterangan: elements.formKeterangan.value.trim(),
    pemberatTacc: elements.formPemberatTacc.value.trim()
  };
}


function changedFields_(before, after) {
  const changes = {};

  Object.keys(after).forEach(key => {
    if (String(after[key] ?? '') !== String(before?.[key] ?? '')) {
      changes[key] = after[key];
    }
  });

  return changes;
}


async function submitForm_(event) {
  event.preventDefault();

  if (state.formSaving) {
    return;
  }

  if (!canWrite_()) {
    showFormError_('Akun ini tidak memiliki akses tulis.');
    return;
  }

  clearFormError_();

  const data = collectFormData_();

  if (!data.nama) {
    showFormError_('Nama pasien wajib diisi.');
    elements.formNama.focus();
    return;
  }

  state.formSaving = true;
  elements.formSubmit.disabled = true;
  elements.formCancel.disabled = true;

  try {
    if (state.formMode === 'create') {
      if (!state.permissions.create) {
        throw new Error('Akun ini tidak memiliki akses tambah.');
      }

      elements.formSubmit.textContent = 'Menyimpan...';

      const payload = await apiFetch_(
        '/rujukan-create',
        {
          method: 'POST',
          body: {
            period: elements.period.value,
            data
          }
        }
      );

      closeForm_(true);
      showToast_(
        payload.message ||
        `Data berhasil ditambahkan pada row ${payload.data?.row || '-'}.`,
        'success'
      );

    } else {
      if (!state.permissions.update) {
        throw new Error('Akun ini tidak memiliki akses edit.');
      }

      const changes = changedFields_(
        state.formSnapshot,
        data
      );

      if (!Object.keys(changes).length) {
        showFormError_('Tidak ada perubahan yang perlu disimpan.');
        return;
      }

      elements.formSubmit.textContent = 'Menyimpan...';

      const payload = await apiFetch_(
        '/rujukan-update',
        {
          method: 'POST',
          body: {
            period: elements.period.value,
            row: state.editingItem.row,
            data: changes,
            expected: {
              tanggal: state.editingItem.tanggal || '',
              nama: state.editingItem.nama || '',
              bpjs: state.editingItem.bpjs || ''
            }
          }
        }
      );

      closeForm_(true);
      showToast_(
        payload.message || 'Data rujukan berhasil diperbarui.',
        'success'
      );
    }

    await refreshAfterWrite_();

  } catch (error) {
    showFormError_(
      error?.message ||
      'Gagal menyimpan data.'
    );
  } finally {
    state.formSaving = false;
    elements.formSubmit.disabled = false;
    elements.formCancel.disabled = false;

    if (!elements.formModal.hidden) {
      elements.formSubmit.textContent =
        state.formMode === 'create'
          ? 'Simpan Data'
          : 'Simpan Perubahan';
    }
  }
}


async function refreshAfterWrite_() {
  try {
    await Promise.all([
      loadFilterOptions_(),
      loadSummary_()
    ]);

    await loadRujukan_();
  } catch (error) {
    showToast_(
      'Data tersimpan, tetapi tampilan gagal dimuat ulang. Silakan refresh halaman.',
      'error'
    );
  }
}


function closeForm_(force = false) {
  if (state.formSaving && !force) {
    return;
  }

  elements.formModal.hidden = true;
  clearFormError_();
  resetFormFields_();

  state.editingItem = null;
  state.formSnapshot = null;

  if (elements.detailModal.hidden) {
    document.body.style.overflow = '';
  }
}


function displayDateToInput_(value) {
  const clean = String(value || '').trim();

  if (!clean) {
    return '';
  }

  let match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  match = clean.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);

  if (!match) {
    return '';
  }

  return [
    match[3],
    String(match[2]).padStart(2, '0'),
    String(match[1]).padStart(2, '0')
  ].join('-');
}


async function apiFetch_(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();

  const fetchOptions = {
    method,
    headers: {
      Accept: 'application/json'
    },
    credentials: 'same-origin',
    cache: 'no-store'
  };

  if (method !== 'GET' && method !== 'HEAD') {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(options.body || {});
  }

  const response = await fetch(
    APP_CONFIG.API_BASE + path,
    fetchOptions
  );

  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error('Response server bukan JSON yang valid.');
  }

  if (!response.ok || payload.ok === false) {
    throw new Error(
      payload.error?.message ||
      payload.error ||
      'Request gagal.'
    );
  }

  return payload;
}


function setLoading_(isLoading) {
  elements.loadingState.hidden = !isLoading;
}


function showError_(message) {
  elements.errorState.textContent = message;
  elements.errorState.hidden = false;
}


function clearError_() {
  elements.errorState.hidden = true;
  elements.errorState.textContent = '';
}


function showFormError_(message) {
  elements.formError.textContent = message;
  elements.formError.hidden = false;
}


function clearFormError_() {
  elements.formError.hidden = true;
  elements.formError.textContent = '';
}


function showToast_(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  toast.textContent = message;

  elements.toastContainer.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add('toast-hide');

    window.setTimeout(() => {
      toast.remove();
    }, 220);
  }, 3800);
}
