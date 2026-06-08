// js/grid.js - Módulo do Grid de Largada
const GridModule = (() => {
  let gridData = [];
  let dragSrc = null;

  async function carregar() {
    const container = document.getElementById('gridContainer');
    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
      // Carrega grid e competidores
      const [gridRes, compRes] = await Promise.all([API.grid.listar(), API.competidores.listar()]);
      gridData = gridRes.data;

      // Se não há grid salvo, usa todos os competidores
      if (!gridData.length && compRes.data.length) {
        gridData = compRes.data.map((c, i) => ({ ...c, competidor_id: c.id, posicao: i + 1 }));
      }

      render();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle text-red"></i><p>${err.message}</p></div>`;
    }
  }

  function render() {
    const container = document.getElementById('gridContainer');
    if (!gridData.length) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-th-list"></i><p>Nenhum piloto no grid. Adicione competidores primeiro.</p></div>`;
      return;
    }

    // Garante posições ordenadas
    gridData.sort((a, b) => a.posicao - b.posicao);
    gridData.forEach((item, i) => item.posicao = i + 1);

    // Luzes de largada animadas
    const lights = Array(5).fill(0).map((_, i) =>
      `<div class="grid-light" id="gl-${i}"></div>`
    ).join('');

    container.innerHTML = `
      <div class="d-flex align-items-center gap-3 mb-3">
        <div class="grid-indicator">${lights}</div>
        <span style="font-size:0.75rem;color:var(--f1-silver);letter-spacing:2px;text-transform:uppercase">Grid de Largada</span>
      </div>
      <div id="gridRows" class="grid-track">
        ${gridData.map(item => `
          <div class="grid-row" draggable="true" data-id="${item.competidor_id}" data-pos="${item.posicao}">
            <div class="grid-pos">${item.posicao}</div>
            <div class="me-2" style="color:var(--f1-silver);font-size:1.2rem"><i class="fas fa-grip-vertical"></i></div>
            <div class="flex-grow-1">
              <div style="font-weight:700">${item.nome}</div>
              <div style="font-size:0.75rem;color:var(--f1-silver);text-transform:uppercase;letter-spacing:1px">${item.equipe}</div>
            </div>
            <div style="font-family:var(--font-title);font-size:1.5rem;color:rgba(225,6,0,0.3)">${item.numero_carro}</div>
          </div>
        `).join('')}
      </div>
    `;

    // Anima luzes
    animateLights();
    // Drag and drop
    initDragDrop();
  }

  function animateLights() {
    let i = 0;
    const interval = setInterval(() => {
      const el = document.getElementById(`gl-${i}`);
      if (el) el.classList.add('on');
      i++;
      if (i >= 5) {
        clearInterval(interval);
        setTimeout(() => {
          document.querySelectorAll('.grid-light').forEach(l => l.classList.remove('on'));
        }, 1000);
      }
    }, 400);
  }

  function initDragDrop() {
    const rows = document.querySelectorAll('.grid-row');
    rows.forEach(row => {
      row.addEventListener('dragstart', (e) => {
        dragSrc = row;
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragend', () => row.classList.remove('dragging'));
      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        row.classList.add('drag-over');
      });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        if (dragSrc && dragSrc !== row) {
          const parent = row.parentNode;
          const srcPos = [...parent.children].indexOf(dragSrc);
          const dstPos = [...parent.children].indexOf(row);
          if (srcPos < dstPos) parent.insertBefore(dragSrc, row.nextSibling);
          else parent.insertBefore(dragSrc, row);
          recalcPositions();
        }
      });
    });
  }

  function recalcPositions() {
    const rows = document.querySelectorAll('.grid-row');
    rows.forEach((row, i) => {
      row.dataset.pos = i + 1;
      row.querySelector('.grid-pos').textContent = i + 1;
    });
  }

  async function salvar() {
    const rows = document.querySelectorAll('.grid-row');
    if (!rows.length) { showToast('Grid vazio!', 'error'); return; }

    const grid = [...rows].map((row, i) => ({
      competidor_id: parseInt(row.dataset.id),
      posicao: i + 1
    }));

    const btn = document.getElementById('saveGridBtn');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      await API.grid.salvar(grid);
      showToast('Grid salvo com sucesso! 🏁');
      animateLights();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'SALVAR GRID';
    }
  }

  return { carregar, salvar };
})();

// ============================================
// js/ranking.js - Módulo de Ranking
// ============================================
const RankingModule = (() => {

  async function carregar() {
    const container = document.getElementById('rankingTable');
    container.innerHTML = `<tr><td colspan="6" class="text-center py-4"><i class="fas fa-spinner fa-spin text-red"></i> Calculando ranking...</td></tr>`;

    try {
      const res = await API.ranking.get();
      const data = res.data;

      if (!data.length) {
        container.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-trophy"></i><p>Nenhum dado disponível</p></div></td></tr>`;
        return;
      }

      container.innerHTML = data.map(p => {
        let medalHtml = '';
        if (p.posicao === 1) medalHtml = `<div class="pos-medal pos-1">1</div>`;
        else if (p.posicao === 2) medalHtml = `<div class="pos-medal pos-2">2</div>`;
        else if (p.posicao === 3) medalHtml = `<div class="pos-medal pos-3">3</div>`;
        else medalHtml = `<div class="pos-medal pos-n">${p.posicao}</div>`;

        const rowClass = p.posicao === 1 ? 'style="background:rgba(255,215,0,0.04)"' : '';

        return `
          <tr ${rowClass}>
            <td><div class="d-flex justify-content-center">${medalHtml}</div></td>
            <td>
              <div style="font-weight:700">${p.nome}</div>
              ${p.posicao === 1 ? '<small style="color:var(--f1-gold);font-size:0.7rem;letter-spacing:1px">⚡ LÍDER</small>' : ''}
            </td>
            <td><span class="team-badge">${p.equipe}</span></td>
            <td><span style="font-family:var(--font-mono);color:var(--f1-red)">${p.melhor_volta ? formatTime(p.melhor_volta) : '—'}</span></td>
            <td><span style="font-family:var(--font-mono);color:var(--f1-silver)">${p.media_voltas ? formatTime(p.media_voltas) : '—'}</span></td>
            <td style="color:var(--f1-silver)">${p.total_voltas}</td>
          </tr>
        `;
      }).join('');

      // Atualiza stat de piloto líder
      if (data.length) {
        const liderEl = document.getElementById('liderNome');
        if (liderEl) liderEl.textContent = data[0].nome;
        const melhorEl = document.getElementById('melhorVoltaGlobal');
        if (melhorEl && data[0].melhor_volta) melhorEl.textContent = formatTime(data[0].melhor_volta);
      }

    } catch (err) {
      container.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-exclamation-triangle text-red"></i><p>${err.message}</p></div></td></tr>`;
    }
  }

  return { carregar };
})();
