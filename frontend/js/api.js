// js/api.js - Serviço de comunicação com a API REST
const API_BASE = localStorage.getItem('f1_api_url') || 'http://localhost:3001';

// ============ Serviço de API ============
const API = {
  async request(method, endpoint, data = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (data) opts.body = JSON.stringify(data);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, opts);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      return json;
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando em ' + API_BASE);
      }
      throw err;
    }
  },

  get: (ep) => API.request('GET', ep),
  post: (ep, data) => API.request('POST', ep, data),
  put: (ep, data) => API.request('PUT', ep, data),
  delete: (ep) => API.request('DELETE', ep),

  // Competidores
  competidores: {
    listar: (busca = '') => API.get(`/competidores${busca ? `?busca=${encodeURIComponent(busca)}` : ''}`),
    buscar: (id) => API.get(`/competidores/${id}`),
    criar: (data) => API.post('/competidores', data),
    atualizar: (id, data) => API.put(`/competidores/${id}`, data),
    excluir: (id) => API.delete(`/competidores/${id}`),
  },

  // Voltas
  voltas: {
    listar: () => API.get('/voltas'),
    porCompetidor: (id) => API.get(`/voltas/${id}`),
    registrar: (data) => API.post('/voltas', data),
  },

  // Ranking
  ranking: {
    get: () => API.get('/ranking'),
  },

  // Grid
  grid: {
    listar: () => API.get('/grid'),
    salvar: (grid) => API.post('/grid', { grid }),
    atualizar: (id, posicao) => API.put(`/grid/${id}`, { posicao }),
  },
};

// ============ Toast Notifications ============
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
  const colors = { success: '#00ff88', error: '#e10600', info: '#4488ff' };

  const toast = document.createElement('div');
  toast.className = `f1-toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type]}" style="color:${colors[type]};font-size:1.2rem;flex-shrink:0"></i>
    <span style="font-size:0.875rem;font-weight:500">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============ Modal de Confirmação ============
function showConfirm(message, title = 'Confirmar Ação') {
  return new Promise((resolve) => {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const modal = document.getElementById('confirmModal');
    modal.classList.add('show');

    const yes = document.getElementById('confirmYes');
    const no = document.getElementById('confirmNo');

    const cleanup = () => { modal.classList.remove('show'); yes.onclick = null; no.onclick = null; };
    yes.onclick = () => { cleanup(); resolve(true); };
    no.onclick = () => { cleanup(); resolve(false); };
  });
}

// ============ Formatação de Tempo ============
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '—';
  const s = parseFloat(seconds);
  const mins = Math.floor(s / 60);
  const secs = (s % 60).toFixed(3).padStart(6, '0');
  return mins > 0 ? `${mins}:${secs}` : `${secs}s`;
}

// ============ Navegação ============
function navigate(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const page = document.getElementById(pageId);
  const link = document.querySelector(`[data-page="${pageId}"]`);
  if (page) page.classList.add('active');
  if (link) link.classList.add('active');

  localStorage.setItem('f1_current_page', pageId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ Cursor Personalizado ============
function initCursor() {
  const cursor = document.querySelector('.cursor');
  const trail = document.querySelector('.cursor-trail');
  if (!cursor || !trail) return;

  let mx = 0, my = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
  });

  function animateTrail() {
    tx += (mx - tx) * 0.15;
    ty += (my - ty) * 0.15;
    trail.style.left = tx + 'px';
    trail.style.top = ty + 'px';
    requestAnimationFrame(animateTrail);
  }
  animateTrail();
}

// ============ Partículas ============
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    r: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.4 + 0.1
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(225, 6, 0, ${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ============ Speed Lines ============
function initSpeedLines() {
  const container = document.querySelector('.speed-lines');
  if (!container) return;
  for (let i = 0; i < 12; i++) {
    const line = document.createElement('div');
    line.className = 'speed-line';
    line.style.cssText = `
      top: ${Math.random() * 100}%;
      width: ${Math.random() * 40 + 30}%;
      animation-delay: ${Math.random() * 3}s;
      animation-duration: ${Math.random() * 2 + 2}s;
    `;
    container.appendChild(line);
  }
}

// ============ Contador Regressivo ============
function initCountdown() {
  const target = new Date();
  target.setDate(target.getDate() + 14);
  target.setHours(14, 0, 0, 0);

  function update() {
    const diff = target - new Date();
    if (diff <= 0) return;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val).padStart(2, '0'); };
    set('cd-days', d); set('cd-hours', h); set('cd-mins', m); set('cd-secs', s);
  }
  update();
  setInterval(update, 1000);
}

// ============ Estatísticas Animadas ============
function animateCounter(el, target, duration = 1000) {
  const start = performance.now();
  const from = 0;
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (target - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
