// js/analise.js - Grafico e tabela de voltas por piloto
const AnaliseModule = (() => {
  let pilotos = [];
  let selectedPilotId = '';

  async function carregar() {
    const select = document.getElementById('analysisPilot');
    if (!select) return;

    const current = selectedPilotId || select.value;
    select.innerHTML = '<option value="">Selecione um piloto...</option>';
    limparVisualizacao('Selecione um piloto para ver o grafico');

    try {
      const res = await API.competidores.listar();
      pilotos = res.data;
      pilotos.forEach(p => {
        select.innerHTML += `<option value="${p.id}">#${p.numero_carro} ${escapeHtml(p.nome)} - ${escapeHtml(p.equipe)}</option>`;
      });

      if (current && pilotos.some(p => String(p.id) === String(current))) {
        select.value = current;
        await selecionarPiloto(current);
      }
    } catch (err) {
      showToast('Erro ao carregar pilotos: ' + err.message, 'error');
    }
  }

  async function selecionarPiloto(pilotId) {
    selectedPilotId = pilotId;
    if (!pilotId) {
      limparVisualizacao('Selecione um piloto para ver o grafico');
      renderPilotoInfo(null);
      return;
    }

    const table = document.getElementById('analysisTable');
    table.innerHTML = `<tr><td colspan="3" class="text-center py-4"><i class="fas fa-spinner fa-spin text-red"></i> Carregando voltas...</td></tr>`;

    try {
      const res = await API.voltas.porCompetidor(pilotId);
      const voltas = [...res.data].reverse();
      renderPilotoInfo(res.competidor, res.stats);
      renderTabela(voltas);
      renderGrafico(voltas);
    } catch (err) {
      table.innerHTML = `<tr><td colspan="3"><div class="empty-state"><i class="fas fa-exclamation-triangle text-red"></i><p>${err.message}</p></div></td></tr>`;
      limparGrafico('Nao foi possivel carregar as voltas');
    }
  }

  function renderPilotoInfo(piloto, stats = null) {
    const el = document.getElementById('analysisPilotInfo');
    if (!el) return;
    if (!piloto) {
      el.innerHTML = '';
      return;
    }

    el.innerHTML = `
      <div class="pilot-avatar small">
        ${piloto.foto ? `<img src="${piloto.foto}" alt="${escapeHtml(piloto.nome)}">` : `<i class="fas fa-user"></i>`}
      </div>
      <div>
        <div style="font-weight:700">${escapeHtml(piloto.nome)}</div>
        <div style="font-size:0.75rem;color:var(--f1-silver)">${stats ? `${stats.total_voltas} voltas - melhor ${formatTime(stats.melhor_volta)}` : 'Sem voltas'}</div>
      </div>
    `;
  }

  function renderTabela(voltas) {
    const table = document.getElementById('analysisTable');
    if (!voltas.length) {
      table.innerHTML = `<tr><td colspan="3"><div class="empty-state"><i class="fas fa-flag-checkered"></i><p>Nenhuma volta registrada</p></div></td></tr>`;
      return;
    }

    const melhorTempo = Math.min(...voltas.map(v => parseFloat(v.tempo_volta)));
    table.innerHTML = voltas.map((v, index) => {
      const tempo = parseFloat(v.tempo_volta);
      const isBest = tempo === melhorTempo;
      return `
        <tr>
          <td style="color:var(--f1-silver)">#${index + 1}</td>
          <td><span class="volta-time ${isBest ? 'volta-best' : ''}">${formatTime(tempo)} ${isBest ? '<i class="fas fa-bolt"></i>' : ''}</span></td>
          <td><small class="text-silver">${new Date(v.data_hora).toLocaleString('pt-BR')}</small></td>
        </tr>
      `;
    }).join('');
  }

  function renderGrafico(voltas) {
    if (!voltas.length) {
      limparGrafico('Nenhuma volta registrada');
      return;
    }

    const canvas = document.getElementById('lapsChart');
    const empty = document.getElementById('lapsChartEmpty');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(640, Math.floor(rect.width * dpr));
    canvas.height = Math.floor(420 * dpr);
    ctx.scale(dpr, dpr);
    if (empty) empty.style.display = 'none';

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const padding = { top: 24, right: 28, bottom: 46, left: 58 };
    const tempos = voltas.map(v => parseFloat(v.tempo_volta));
    const min = Math.min(...tempos);
    const max = Math.max(...tempos);
    const range = Math.max(max - min, 1);
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.font = '12px Share Tech Mono, monospace';
    ctx.fillStyle = '#b0b0c0';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (plotH / 4) * i;
      const value = min + (range / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillText(formatTime(value), padding.left - 10, y);
    }

    const points = tempos.map((tempo, index) => {
      const x = padding.left + (voltas.length === 1 ? plotW / 2 : (plotW / (voltas.length - 1)) * index);
      const y = padding.top + ((tempo - min) / range) * plotH;
      return { x, y, tempo, index };
    });

    ctx.strokeStyle = '#e10600';
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    points.forEach(p => {
      const isBest = p.tempo === min;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isBest ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isBest ? '#FFD700' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#e10600';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.fillStyle = '#b0b0c0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    points.forEach(p => {
      if (voltas.length <= 12 || p.index % Math.ceil(voltas.length / 12) === 0) {
        ctx.fillText(`#${p.index + 1}`, p.x, height - padding.bottom + 18);
      }
    });

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`Melhor: ${formatTime(min)}   Media: ${formatTime(media(tempos))}`, padding.left, 12);
  }

  function limparVisualizacao(message) {
    renderPilotoInfo(null);
    const table = document.getElementById('analysisTable');
    if (table) {
      table.innerHTML = `<tr><td colspan="3"><div class="empty-state"><i class="fas fa-flag-checkered"></i><p>Selecione um piloto</p></div></td></tr>`;
    }
    limparGrafico(message);
  }

  function limparGrafico(message) {
    const canvas = document.getElementById('lapsChart');
    const empty = document.getElementById('lapsChartEmpty');
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    if (empty) {
      empty.style.display = 'block';
      empty.querySelector('p').textContent = message;
    }
  }

  function media(valores) {
    return valores.reduce((sum, v) => sum + v, 0) / valores.length;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  return { carregar, selecionarPiloto };
})();
