(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const state = {
    periods: [],
    period: '',
    status: '',
    rs: '',
    dx: '',
    page: 1,
    limit: 100,
    data: null
  };

  const els = {
    period: $('periodSelect'),
    status: $('statusSelect'),
    rs: $('rsSelect'),
    dx: $('dxSelect'),
    reset: $('resetBtn'),
    message: $('message'),
    loading: $('loadingOverlay'),
    identityBox: $('identityBox'),
    identityRole: $('identityRole'),
    identityEmail: $('identityEmail'),
    totalRujukan: $('totalRujukan'),
    totalDx: $('totalDx'),
    jumlahDx: $('jumlahDx'),
    topDxCount: $('topDxCount'),
    topDxName: $('topDxName'),
    chartPeriod: $('chartPeriod'),
    diagnosisChart: $('diagnosisChart'),
    rsRanking: $('rsRanking'),
    rankingInfo: $('rankingInfo'),
    rankingBody: $('rankingBody'),
    selectedSection: $('selectedSection'),
    selectedDxTitle: $('selectedDxTitle'),
    selectedDxMeta: $('selectedDxMeta'),
    selectedCount: $('selectedCount'),
    selectedRsFilterText: $('selectedRsFilterText'),
    selectedRsDistribution: $('selectedRsDistribution'),
    detailInfo: $('detailInfo'),
    detailBody: $('detailBody'),
    detailPagination: $('detailPagination'),
    prevPage: $('prevPageBtn'),
    nextPage: $('nextPageBtn'),
    pageInfo: $('pageInfo'),
    clearDx: $('clearDxBtn')
  };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const fmt = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));

  function setLoading(on) {
    els.loading.hidden = !on;
  }

  function showMessage(text, type = 'error') {
    if (!text) {
      els.message.hidden = true;
      els.message.textContent = '';
      els.message.className = 'message';
      return;
    }
    els.message.hidden = false;
    els.message.textContent = text;
    els.message.className = `message ${type}`;
  }

  async function api(path) {
    const response = await fetch(path, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      throw new Error(`Backend tidak menghasilkan JSON. HTTP ${response.status}`);
    }

    if (!response.ok || data?.ok === false) {
      throw new Error(data?.error?.message || `Request gagal. HTTP ${response.status}`);
    }

    return data;
  }

  function jakartaCurrentPeriod() {
    const parts = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit'
    }).formatToParts(new Date());

    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = Number(parts.find(p => p.type === 'month')?.value || 1);
    const names = ['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI','JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'];
    return `${names[Math.max(0, Math.min(11, month - 1))]} ${year}`;
  }

  async function loadIdentity() {
    try {
      const result = await api('/api/me');
      els.identityRole.textContent = String(result?.user?.role || 'viewer').toUpperCase();
      els.identityEmail.textContent = result?.user?.email || '';
      els.identityBox.hidden = false;
    } catch (_) {
      // Access utama tetap menangani autentikasi. Identitas hanya dekoratif.
    }
  }

  async function loadPeriods() {
    const result = await api('/api/periods');
    state.periods = Array.isArray(result?.data) ? result.data : [];

    els.period.innerHTML = state.periods
      .map(period => `<option value="${escapeHtml(period)}">${escapeHtml(period)}</option>`)
      .join('');

    if (!state.periods.length) {
      els.period.innerHTML = '<option value="">Belum ada periode</option>';
      state.period = '';
      return;
    }

    const queryPeriod = new URLSearchParams(location.search).get('period');
    const current = jakartaCurrentPeriod();

    state.period = state.periods.includes(queryPeriod)
      ? queryPeriod
      : state.periods.includes(current)
        ? current
        : state.periods[0];

    els.period.value = state.period;

    const queryStatus = String(new URLSearchParams(location.search).get('status') || '').toUpperCase();
    state.status = ['BARU', 'KONTROL'].includes(queryStatus) ? queryStatus : '';
    if (els.status) els.status.value = state.status;
  }

  function buildAnalysisUrl() {
    const params = new URLSearchParams();
    params.set('period', state.period);
    params.set('page', String(state.page));
    params.set('limit', String(state.limit));
    if (state.status) params.set('status', state.status);
    if (state.rs) params.set('rs', state.rs);
    if (state.dx) params.set('dx', state.dx);
    return `/api/analysis?${params.toString()}`;
  }

  async function loadAnalysis({ preserveDx = true } = {}) {
    if (!state.period) return;

    setLoading(true);
    showMessage('');

    try {
      const result = await api(buildAnalysisUrl());
      state.data = result.data || null;

      renderRsOptions();
      renderDiagnosisOptions(preserveDx);
      renderSummary();
      renderChart();
      renderRsRanking();
      renderRanking();
      renderSelected();
    } catch (error) {
      showMessage(error?.message || 'Gagal memuat analisis.');
    } finally {
      setLoading(false);
    }
  }

  function renderRsOptions() {
    const items = Array.isArray(state.data?.rsOptions) ? state.data.rsOptions : [];
    const current = state.rs;

    els.rs.innerHTML = '<option value="">Semua Rumah Sakit</option>' + items.map(item =>
      `<option value="${escapeHtml(item.rs)}">${item.rank}. ${escapeHtml(item.rs)} — ${fmt(item.count)} rujukan</option>`
    ).join('');

    els.rs.disabled = false;
    if (items.some(item => item.rs === current)) {
      els.rs.value = current;
    } else {
      state.rs = '';
      els.rs.value = '';
    }
  }

  function renderDiagnosisOptions(preserveDx = true) {
    const items = Array.isArray(state.data?.diagnoses) ? state.data.diagnoses : [];
    const current = preserveDx ? state.dx : '';

    els.dx.innerHTML = '<option value="">Semua diagnosa — tampilkan ranking</option>' + items.map(item =>
      `<option value="${escapeHtml(item.dx)}">${item.rank}. ${escapeHtml(item.dx)} — ${fmt(item.count)} rujukan</option>`
    ).join('');

    els.dx.disabled = false;

    if (current && items.some(item => item.dx.toUpperCase() === current.toUpperCase())) {
      state.dx = current;
      els.dx.value = items.find(item => item.dx.toUpperCase() === current.toUpperCase())?.dx || current;
    } else if (state.dx) {
      state.dx = '';
      els.dx.value = '';
    }
  }

  function renderSummary() {
    const summary = state.data?.summary || {};
    const top = summary.diagnosaTerbanyak;

    els.totalRujukan.textContent = fmt(summary.totalRujukan);
    els.totalDx.textContent = fmt(summary.totalDenganDx);
    els.jumlahDx.textContent = fmt(summary.jumlahDiagnosa);
    els.topDxCount.textContent = top ? fmt(top.count) : '0';
    els.topDxName.textContent = top?.dx || 'Belum ada diagnosa';
    const parts = [state.period];
    if (state.status) parts.push(state.status === 'BARU' ? 'Rujukan Baru' : 'Rujukan Kontrol');
    if (state.rs) parts.push(state.rs);
    els.chartPeriod.textContent = parts.join(' · ');
  }

  function renderChart() {
    const items = (state.data?.diagnoses || []).slice(0, 12);
    if (!items.length) {
      els.diagnosisChart.innerHTML = '<div class="empty">Tidak ada diagnosa pada filter ini.</div>';
      return;
    }

    const max = Math.max(...items.map(item => Number(item.count || 0)), 1);
    els.diagnosisChart.innerHTML = items.map(item => {
      const width = Math.max(2, Math.round((Number(item.count || 0) / max) * 100));
      return `
        <div class="bar-row" title="${escapeHtml(item.dx)}">
          <div class="bar-label"><span class="rank">#${item.rank}</span>${escapeHtml(item.dx)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
          <div class="bar-count">${fmt(item.count)}</div>
        </div>`;
    }).join('');
  }

  function renderRsRanking() {
    const items = (state.data?.rsOptions || []).slice(0, 10);
    if (!items.length) {
      els.rsRanking.innerHTML = '<div class="empty">Tidak ada RS tujuan.</div>';
      return;
    }

    els.rsRanking.innerHTML = items.map(item => `
      <div class="compact-item">
        <span class="compact-rank">${item.rank}</span>
        <span class="compact-name">${escapeHtml(item.rs)}</span>
        <span class="compact-count">${fmt(item.count)}</span>
      </div>`).join('');
  }

  function renderRanking() {
    const items = state.data?.diagnoses || [];
    els.rankingInfo.textContent = `${fmt(items.length)} diagnosa · ${state.period}${state.status ? ` · ${state.status}` : ' · SEMUA STATUS'}`;

    if (!items.length) {
      els.rankingBody.innerHTML = '<tr><td colspan="6" class="empty-cell">Tidak ada diagnosa pada filter ini.</td></tr>';
      return;
    }

    els.rankingBody.innerHTML = items.map(item => `
      <tr>
        <td><span class="rank-badge">${item.rank}</span></td>
        <td><strong>${escapeHtml(item.dx)}</strong></td>
        <td><span class="count-badge">${fmt(item.count)}</span></td>
        <td>${escapeHtml(item.topRs || '-')}</td>
        <td>${item.topRs ? fmt(item.topRsCount) : '-'}</td>
        <td><button type="button" class="link-btn js-view-dx" data-dx="${escapeHtml(item.dx)}">Lihat data</button></td>
      </tr>`).join('');
  }

  function renderSelected() {
    const selected = state.data?.selected;
    if (!state.dx || !selected) {
      els.selectedSection.hidden = true;
      return;
    }

    els.selectedSection.hidden = false;
    els.selectedDxTitle.textContent = selected.dx || state.dx;
    els.selectedDxMeta.textContent = `${state.period} · ${state.status || 'SEMUA STATUS'}${state.rs ? ` · RS: ${state.rs}` : ' · Semua RS'}`;
    els.selectedCount.textContent = fmt(selected.total);
    els.selectedRsFilterText.textContent = state.rs || 'Semua RS';

    const rsDist = selected.rsDistribution || [];
    els.selectedRsDistribution.innerHTML = rsDist.length
      ? rsDist.slice(0, 15).map(item => `
          <div class="compact-item">
            <span class="compact-rank">${item.rank}</span>
            <span class="compact-name">${escapeHtml(item.rs)}</span>
            <span class="compact-count">${fmt(item.count)}</span>
          </div>`).join('')
      : '<div class="empty">Tidak ada RS tujuan.</div>';

    const details = selected.details || {};
    const items = details.items || [];
    els.detailInfo.textContent = `${fmt(details.total)} data ditemukan`;
    els.detailBody.innerHTML = items.length
      ? items.map(item => `
        <tr>
          <td>${escapeHtml(item.tanggal || '-')}</td>
          <td><strong>${escapeHtml(item.nama || '-')}</strong></td>
          <td>${escapeHtml(item.bpjs || '-')}</td>
          <td>${escapeHtml(item.dokter || '-')}</td>
          <td>${escapeHtml(item.status || '-')}</td>
          <td>${escapeHtml(item.rs_tujuan || '-')}</td>
          <td>${escapeHtml(item.poli_tujuan || '-')}</td>
        </tr>`).join('')
      : '<tr><td colspan="7" class="empty-cell">Tidak ada data rujukan.</td></tr>';

    const totalPages = Number(details.totalPages || 1);
    const page = Number(details.page || 1);
    els.detailPagination.hidden = totalPages <= 1;
    els.pageInfo.textContent = `Halaman ${page} dari ${totalPages}`;
    els.prevPage.disabled = page <= 1;
    els.nextPage.disabled = page >= totalPages;
  }

  els.period.addEventListener('change', async () => {
    state.period = els.period.value;
    state.rs = '';
    state.dx = '';
    state.page = 1;
    await loadAnalysis({ preserveDx: false });
  });

  els.status.addEventListener('change', async () => {
    state.status = els.status.value;
    state.rs = '';
    state.dx = '';
    state.page = 1;
    els.rs.value = '';
    els.dx.value = '';
    await loadAnalysis({ preserveDx: false });
  });

  els.rs.addEventListener('change', async () => {
    state.rs = els.rs.value;
    state.dx = '';
    state.page = 1;
    await loadAnalysis({ preserveDx: false });
  });

  els.dx.addEventListener('change', async () => {
    state.dx = els.dx.value;
    state.page = 1;
    await loadAnalysis({ preserveDx: true });
    if (state.dx) {
      setTimeout(() => els.selectedSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  });

  els.rankingBody.addEventListener('click', async (event) => {
    const button = event.target.closest('.js-view-dx');
    if (!button) return;
    state.dx = button.dataset.dx || '';
    state.page = 1;
    await loadAnalysis({ preserveDx: true });
    setTimeout(() => els.selectedSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  });

  els.clearDx.addEventListener('click', async () => {
    state.dx = '';
    state.page = 1;
    els.dx.value = '';
    await loadAnalysis({ preserveDx: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  els.reset.addEventListener('click', async () => {
    state.status = '';
    state.rs = '';
    state.dx = '';
    state.page = 1;
    els.status.value = '';
    els.rs.value = '';
    els.dx.value = '';
    await loadAnalysis({ preserveDx: false });
  });

  els.prevPage.addEventListener('click', async () => {
    if (state.page <= 1) return;
    state.page -= 1;
    await loadAnalysis({ preserveDx: true });
  });

  els.nextPage.addEventListener('click', async () => {
    const totalPages = Number(state.data?.selected?.details?.totalPages || 1);
    if (state.page >= totalPages) return;
    state.page += 1;
    await loadAnalysis({ preserveDx: true });
  });

  async function init() {
    setLoading(true);
    try {
      await Promise.all([loadIdentity(), loadPeriods()]);
      if (state.period) await loadAnalysis({ preserveDx: false });
    } catch (error) {
      showMessage(error?.message || 'Gagal membuka Analisis Rujukan.');
    } finally {
      setLoading(false);
    }
  }

  init();
})();
