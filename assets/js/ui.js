const UI = {
  escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  },

  badge(status) {
    const value =
      String(status || '')
        .trim()
        .toUpperCase();

    if (value === 'BARU') {
      return '<span class="badge badge-baru">BARU</span>';
    }

    if (value === 'KONTROL') {
      return '<span class="badge badge-kontrol">KONTROL</span>';
    }

    return `<span class="badge">${this.escapeHtml(status)}</span>`;
  },

  unique(values) {
    return [
      ...new Set(
        values
          .map(item => String(item || '').trim())
          .filter(Boolean)
      )
    ].sort((a, b) =>
      a.localeCompare(b, 'id', { sensitivity: 'base' })
    );
  },

  fillSelect(select, values, firstLabel) {
    select.innerHTML =
      `<option value="">${this.escapeHtml(firstLabel)}</option>` +
      values
        .map(value =>
          `<option value="${this.escapeHtml(value)}">${this.escapeHtml(value)}</option>`
        )
        .join('');
  },

  rowHtml(item, index) {
    return `
      <tr>
        <td>${this.escapeHtml(item.tanggal)}</td>
        <td>${this.escapeHtml(item.dokter)}</td>
        <td>
          <span class="patient-name">
            ${this.escapeHtml(item.nama)}
          </span>
        </td>
        <td>${this.escapeHtml(item.bpjs)}</td>
        <td>${this.badge(item.kontrol)}</td>
        <td class="dx-cell">${this.escapeHtml(item.dx)}</td>
        <td class="rs-cell">${this.escapeHtml(item.rsTujuan)}</td>
        <td>${this.escapeHtml(item.poliTujuan)}</td>
        <td>
          <button
            class="detail-button"
            type="button"
            data-detail-index="${index}"
          >
            Detail
          </button>
        </td>
      </tr>
    `;
  },

  mobileCardHtml(item, index) {
    return `
      <article class="mobile-card">

        <div class="mobile-card-header">
          <div>
            <h3>${this.escapeHtml(item.nama)}</h3>
            <p>${this.escapeHtml(item.bpjs)}</p>
          </div>

          ${this.badge(item.kontrol)}
        </div>

        <div class="mobile-details">

          <div class="mobile-detail">
            <span>Tanggal</span>
            <strong>${this.escapeHtml(item.tanggal)}</strong>
          </div>

          <div class="mobile-detail">
            <span>Dokter</span>
            <strong>${this.escapeHtml(item.dokter)}</strong>
          </div>

          <div class="mobile-detail">
            <span>DX</span>
            <strong>${this.escapeHtml(item.dx)}</strong>
          </div>

          <div class="mobile-detail">
            <span>RS</span>
            <strong>${this.escapeHtml(item.rsTujuan)}</strong>
          </div>

          <div class="mobile-detail">
            <span>Poli</span>
            <strong>${this.escapeHtml(item.poliTujuan)}</strong>
          </div>

        </div>

        <button
          class="detail-button"
          type="button"
          data-detail-index="${index}"
        >
          Lihat Detail
        </button>

      </article>
    `;
  },

  detailHtml(item) {
    const fields = [
      ['Tanggal', item.tanggal],
      ['Dokter', item.dokter],
      ['No', item.no],
      ['No. Harian', item.noHarian],
      ['BPJS No.', item.bpjs],
      ['Status', item.kontrol],
      ['RS Tujuan', item.rsTujuan],
      ['Poli Tujuan', item.poliTujuan],
      ['Diagnosis', item.dx, true],
      ['Keterangan', item.keterangan || '-', true],
      ['Pemberat TACC', item.pemberatTacc || '-', true]
    ];

    return fields
      .map(([label, value, full]) => `
        <div class="detail-item ${full ? 'full' : ''}">
          <span>${this.escapeHtml(label)}</span>
          <strong>${this.escapeHtml(value)}</strong>
        </div>
      `)
      .join('');
  }
};
