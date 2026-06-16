document.addEventListener('DOMContentLoaded', function(){
  // Toggle nav (acessível)
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  if(btn && nav){
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('nav--hidden');
    });
  }

  // Exemplo: substitua chamadas à API existentes mantendo endpoints e payloads
  // fetch('/api/alguma-rota', { method: 'GET' })
  //   .then(r => r.json()).then(console.log).catch(console.error);
});
