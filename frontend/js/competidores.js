// js/competidores.js - Modulo de Competidores
const CompetidoresModule = (() => {
  let editingId = null;
  let allCompetidores = [];
  let cameraStream = null;

  async function carregar(busca = '') {
    const container = document.getElementById('competidoresList');
    container.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Carregando...</p></div>`;
    try {
      const res = await API.competidores.listar(busca);
      allCompetidores = res.data;
      renderLista(allCompetidores);
      updateStats();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle text-red"></i><p>${err.message}</p></div>`;
    }
  }

  function renderLista(competidores) {
    const container = document.getElementById('competidoresList');
    if (!competidores.length) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-car"></i><p>Nenhum competidor encontrado</p><button class="btn-f1 mt-3" onclick="CompetidoresModule.showForm()">Adicionar Piloto</button></div>`;
      return;
    }

    container.innerHTML = competidores.map(c => `
      <div class="pilot-card mb-2" id="pilot-${c.id}">
        <div class="pilot-number">${c.numero_carro}</div>
        <div class="d-flex justify-content-between align-items-start">
          <div class="d-flex align-items-center gap-3">
            <div class="pilot-avatar">
              ${c.foto ? `<img src="${c.foto}" alt="${escapeHtml(c.nome)}">` : `<i class="fas fa-user"></i>`}
            </div>
            <div>
              <div class="pilot-name">${escapeHtml(c.nome)}</div>
              <div class="pilot-team"><span class="team-badge">${escapeHtml(c.equipe)}</span></div>
              ${c.nacionalidade ? `<small class="text-silver" style="font-size:0.75rem"><i class="fas fa-flag me-1"></i>${escapeHtml(c.nacionalidade)}</small>` : ''}
            </div>
          </div>
          <div class="d-flex gap-2 flex-shrink-0">
            <button class="btn-f1-outline" onclick="CompetidoresModule.showForm(${c.id})" style="font-size:0.75rem;padding:6px 12px">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-danger-f1" onclick="CompetidoresModule.confirmarExcluir(${c.id}, '${escapeJs(c.nome)}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function updateStats() {
    const el = document.getElementById('totalPilotosCount');
    if (el) animateCounter(el, allCompetidores.length);
  }

  async function showForm(id = null) {
    editingId = id;
    const modal = document.getElementById('pilotModal');
    const title = document.getElementById('pilotModalTitle');
    const form = document.getElementById('pilotForm');
    form.reset();
    pararCamera();
    setFoto('');

    title.textContent = id ? 'EDITAR PILOTO' : 'NOVO PILOTO';

    if (id) {
      try {
        const res = await API.competidores.buscar(id);
        const c = res.data;
        document.getElementById('pilotNome').value = c.nome;
        document.getElementById('pilotEquipe').value = c.equipe;
        document.getElementById('pilotNumero').value = c.numero_carro;
        document.getElementById('pilotNac').value = c.nacionalidade || '';
        setFoto(c.foto || '');
      } catch (err) {
        showToast('Erro ao carregar dados: ' + err.message, 'error');
        return;
      }
    }

    modal.classList.add('show');
  }

  function hideForm() {
    document.getElementById('pilotModal').classList.remove('show');
    editingId = null;
    pararCamera();
  }

  async function salvar() {
    const nome = document.getElementById('pilotNome').value.trim();
    const equipe = document.getElementById('pilotEquipe').value.trim();
    const numero_carro = parseInt(document.getElementById('pilotNumero').value);
    const nacionalidade = document.getElementById('pilotNac').value.trim();
    const foto = document.getElementById('pilotFoto').value;

    if (!nome || !equipe || !numero_carro) {
      showToast('Preencha todos os campos obrigatorios', 'error');
      return;
    }

    const btn = document.getElementById('pilotSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      if (editingId) {
        await API.competidores.atualizar(editingId, { nome, equipe, numero_carro, nacionalidade, foto });
        showToast(`${nome} atualizado com sucesso!`);
      } else {
        await API.competidores.criar({ nome, equipe, numero_carro, nacionalidade, foto });
        showToast(`${nome} adicionado a grid!`);
      }
      hideForm();
      carregar();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'SALVAR';
    }
  }

  async function confirmarExcluir(id, nome) {
    const ok = await showConfirm(`Tem certeza que deseja excluir "${nome}"? Esta acao tambem removera todas as voltas registradas.`, 'EXCLUIR PILOTO');
    if (!ok) return;
    try {
      await API.competidores.excluir(id);
      showToast(`${nome} removido da competicao`, 'info');
      carregar();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function setFoto(foto) {
    const input = document.getElementById('pilotFoto');
    const preview = document.getElementById('pilotPhotoPreview');
    if (input) input.value = foto || '';
    if (!preview) return;

    preview.innerHTML = foto
      ? `<img src="${foto}" alt="Foto do piloto">`
      : '<i class="fas fa-camera"></i>';
  }

  async function iniciarCamera() {
    const video = document.getElementById('pilotCameraVideo');
    const captureBtn = document.getElementById('pilotCaptureBtn');
    if (!video || !navigator.mediaDevices?.getUserMedia) {
      showToast('Camera nao disponivel neste navegador.', 'error');
      return;
    }

    try {
      pararCamera();
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      video.srcObject = cameraStream;
      video.classList.add('active');
      if (captureBtn) captureBtn.style.display = '';
    } catch (err) {
      showToast('Nao foi possivel acessar a camera.', 'error');
    }
  }

  function tirarFoto() {
    const video = document.getElementById('pilotCameraVideo');
    const canvas = document.getElementById('pilotCameraCanvas');
    if (!video || !canvas || !video.videoWidth) {
      showToast('Inicie a camera antes de tirar a foto.', 'error');
      return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = 320;
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * canvas.width) || 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFoto(canvas.toDataURL('image/jpeg', 0.75));
    pararCamera();
    showToast('Foto adicionada ao cadastro.');
  }

  function removerFoto() {
    setFoto('');
    pararCamera();
  }

  function pararCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }

    const video = document.getElementById('pilotCameraVideo');
    const captureBtn = document.getElementById('pilotCaptureBtn');
    if (video) {
      video.srcObject = null;
      video.classList.remove('active');
    }
    if (captureBtn) captureBtn.style.display = 'none';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  function escapeJs(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  let searchTimer;
  function onSearch(val) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => carregar(val), 400);
  }

  return {
    carregar,
    showForm,
    hideForm,
    salvar,
    confirmarExcluir,
    onSearch,
    iniciarCamera,
    tirarFoto,
    removerFoto
  };
})();
