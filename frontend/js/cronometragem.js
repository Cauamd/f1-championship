// js/cronometragem.js - Módulo de Cronometragem
const CronometragemModule = (() => {
  let timerInterval = null;
  let timerStart = null;
  let timerRunning = false;
  let currentMs = 0;
  let selectedCompetidor = null;

  async function init() {
    await carregarCompetidoresSelect();
  }

  async function carregarCompetidoresSelect() {
    const sel = document.getElementById('timerPilot');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione um piloto...</option>';
    try {
      const res = await API.competidores.listar();
      res.data.forEach(c => {
        sel.innerHTML += `<option value="${c.id}">#${c.numero_carro} ${c.nome} — ${c.equipe}</option>`;
      });
    } catch (err) {
      showToast('Erro ao carregar pilotos: ' + err.message, 'error');
    }
  }

  function toggleTimer() {
    if (!timerRunning) startTimer();
    else stopTimer();
  }

  function startTimer() {
    timerStart = Date.now() - currentMs;
    timerRunning = true;
    timerInterval = setInterval(updateDisplay, 10);
    document.getElementById('timerBtn').innerHTML = '<i class="fas fa-stop me-2"></i>PARAR';
    document.getElementById('timerBtn').style.background = '#ff4444';
    document.getElementById('registerVoltaBtn').disabled = true;
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    currentMs = Date.now() - timerStart;
    document.getElementById('timerBtn').innerHTML = '<i class="fas fa-play me-2"></i>INICIAR';
    document.getElementById('timerBtn').style.background = '';
    document.getElementById('registerVoltaBtn').disabled = false;
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    currentMs = 0;
    updateDisplayValue(0);
    document.getElementById('timerBtn').innerHTML = '<i class="fas fa-play me-2"></i>INICIAR';
    document.getElementById('timerBtn').style.background = '';
    document.getElementById('registerVoltaBtn').disabled = true;
  }

  function updateDisplay() {
    currentMs = Date.now() - timerStart;
    updateDisplayValue(currentMs);
  }

  function updateDisplayValue(ms) {
    const total = ms / 1000;
    const mins = Math.floor(total / 60);
    const secs = (total % 60).toFixed(3).padStart(6, '0');
    const display = mins > 0 ? `${String(mins).padStart(2,'0')}:${secs}` : secs;
    const el = document.getElementById('timerDisplay');
    if (el) el.textContent = display;
  }

  async function registrarVolta() {
    const pilotId = document.getElementById('timerPilot').value;
    if (!pilotId) { showToast('Selecione um piloto primeiro!', 'error'); return; }
    if (currentMs === 0) { showToast('Registre um tempo primeiro!', 'error'); return; }

    const tempoSegundos = (currentMs / 1000).toFixed(3);
    const btn = document.getElementById('registerVoltaBtn');
    btn.disabled = true;
    btn.textContent = 'Registrando...';

    try {
      await API.voltas.registrar({ competidor_id: parseInt(pilotId), tempo_volta: parseFloat(tempoSegundos) });
      showToast(`Volta registrada: ${formatTime(tempoSegundos)}`);
      resetTimer();
      if (selectedCompetidor == pilotId) await carregarHistorico(pilotId);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'REGISTRAR VOLTA';
    }
  }

  async function registrarManual() {
    const pilotId = document.getElementById('manualPilot').value;
    const minutos = parseFloat(document.getElementById('manualMin').value) || 0;
    const segundos = parseFloat(document.getElementById('manualSeg').value) || 0;

    if (!pilotId) { showToast('Selecione um piloto!', 'error'); return; }
    const total = minutos * 60 + segundos;
    if (total <= 0) { showToast('Insira um tempo válido!', 'error'); return; }

    const btn = document.getElementById('manualSaveBtn');
    btn.disabled = true;
    try {
      await API.voltas.registrar({ competidor_id: parseInt(pilotId), tempo_volta: total });
      showToast(`Volta manual registrada: ${formatTime(total)}`);
      document.getElementById('manualMin').value = '';
      document.getElementById('manualSeg').value = '';
      if (selectedCompetidor == pilotId) await carregarHistorico(pilotId);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  async function carregarHistorico(pilotId) {
    const sel = document.getElementById('histPilot');
    if (!pilotId) pilotId = sel?.value;
    if (!pilotId) return;
    selectedCompetidor = pilotId;

    // Sincronizar selects de histórico e manual
    document.getElementById('manualPilot').value = pilotId;

    const container = document.getElementById('voltasHistorico');
    const statsEl = document.getElementById('voltasStats');
    container.innerHTML = '<div class="text-center py-3"><i class="fas fa-spinner fa-spin text-red"></i></div>';

    try {
      const res = await API.voltas.porCompetidor(pilotId);
      const { data: voltas, stats } = res;

      // Stats
      if (stats) {
        statsEl.innerHTML = `
          <div class="row g-2 mb-3">
            <div class="col-6 col-md-3"><div class="timing-stat"><div class="timing-stat-val">${formatTime(stats.melhor_volta)}</div><div class="timing-stat-lbl">Melhor Volta</div></div></div>
            <div class="col-6 col-md-3"><div class="timing-stat"><div class="timing-stat-val">${formatTime(stats.ultima_volta)}</div><div class="timing-stat-lbl">Última Volta</div></div></div>
            <div class="col-6 col-md-3"><div class="timing-stat"><div class="timing-stat-val">${formatTime(stats.media)}</div><div class="timing-stat-lbl">Média</div></div></div>
            <div class="col-6 col-md-3"><div class="timing-stat"><div class="timing-stat-val text-mono">${stats.total_voltas}</div><div class="timing-stat-lbl">Total Voltas</div></div></div>
          </div>
        `;
      } else {
        statsEl.innerHTML = '';
      }

      // Histórico
      if (!voltas.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-flag-checkered"></i><p>Nenhuma volta registrada</p></div>';
        return;
      }

      const melhorTempo = stats ? parseFloat(stats.melhor_volta) : Infinity;
      container.innerHTML = `
        <div style="max-height:320px;overflow-y:auto">
          ${voltas.map((v, i) => {
            const t = parseFloat(v.tempo_volta);
            const isBest = t === melhorTempo;
            return `
              <div class="volta-item">
                <div class="d-flex align-items-center gap-3">
                  <span style="color:var(--f1-silver);font-size:0.75rem;width:30px">#${voltas.length - i}</span>
                  <span class="volta-time ${isBest ? 'volta-best' : ''}">${formatTime(t)} ${isBest ? '⚡' : ''}</span>
                </div>
                <small class="text-silver" style="font-size:0.7rem">${new Date(v.data_hora).toLocaleString('pt-BR')}</small>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle text-red"></i><p>${err.message}</p></div>`;
    }
  }

  // Popula o select de histórico também
  async function initHistorico() {
    const sel = document.getElementById('histPilot');
    const manualSel = document.getElementById('manualPilot');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione um piloto...</option>';
    if (manualSel) manualSel.innerHTML = '<option value="">Selecione um piloto...</option>';
    try {
      const res = await API.competidores.listar();
      res.data.forEach(c => {
        const opt = `<option value="${c.id}">#${c.numero_carro} ${c.nome}</option>`;
        sel.innerHTML += opt;
        if (manualSel) manualSel.innerHTML += opt;
      });
    } catch (err) {}
  }

  return { init, toggleTimer, resetTimer, registrarVolta, registrarManual, carregarHistorico, initHistorico };
})();
