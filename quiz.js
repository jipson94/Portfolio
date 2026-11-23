/* « Votre projet en 1 minute » — questionnaire qui oriente le visiteur puis pré-remplit le formulaire de contact. */
(function () {
  const box = document.getElementById('quiz'); if (!box) return;

  const Q = [
    { k: 'profil', q: 'Pour commencer, vous êtes plutôt…', r: ['Une institution / organisation', 'Une entreprise', 'Un entrepreneur / une startup', 'Un particulier / porteur de projet', 'Un étudiant / une étudiante', 'Un recruteur'] },
    { k: 'besoin', q: 'De quoi avez-vous besoin en priorité ?', r: ['Identité visuelle & design', 'Vidéo & motion design', 'Communication & relations publiques', 'Site web', 'IA & données', 'Une formation pour mon équipe'] },
    { k: 'etape', q: 'Où en est votre projet ?', r: ['Une simple idée', 'Un projet bien défini', 'La refonte de l’existant', 'C’est urgent'] },
    { k: 'delai', q: 'Dans quel délai souhaitez-vous démarrer ?', r: ['Moins de 2 semaines', 'Dans le mois', 'D’ici 1 à 3 mois', 'Pas encore défini'] }
  ];

  const CONSEILS = {
    'Identité visuelle & design': ['Création d’identité visuelle', 'Je vous propose de construire une identité claire et mémorable : logo, charte graphique et premiers supports. C’est ce que j’ai fait pour plus de 150 marques.', 'projet-le-crime-du-soir.html', 'Voir un exemple de création'],
    'Vidéo & motion design': ['Vidéo & motion design', 'Un film ou une animation courte pour expliquer, convaincre ou annoncer — comme le film des Assises Nationales de l’Industrie du Congo.', 'projet-anic-2026.html', 'Voir le projet ANIC 2026'],
    'Communication & relations publiques': ['Stratégie de communication', 'On commence par un diagnostic de vos publics et de vos messages, puis un plan d’actions concret : contenus, relations presse, réseaux sociaux.', '#services', 'Voir les services'],
    'Site web': ['Site web professionnel', 'Un site rapide, clair et adapté au mobile, relié à votre nom de domaine — pensé pour transformer les visiteurs en contacts.', '#services', 'Voir les services'],
    'IA & données': ['IA & analyse de données', 'Des outils d’IA et des tableaux de bord adaptés à votre activité pour gagner du temps et décider sur des chiffres fiables.', '#services', 'Voir les services'],
    'Une formation pour mon équipe': ['Formation sur mesure', 'Des formations pratiques de 2 semaines à 3 mois, dans votre structure, en session ouverte ou à distance.', 'formations.html', 'Voir le catalogue des formations']
  };

  const A = {}; let step = 0;
  const esc = s => s.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  function render() {
    if (step < Q.length) {
      const q = Q[step];
      box.innerHTML = `
        <div class="quiz-top">
          <span class="quiz-step">Question ${step + 1} / ${Q.length}</span>
          <div class="quiz-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${Q.length}" aria-valuenow="${step}"><i style="width:${step / Q.length * 100}%"></i></div>
        </div>
        <h3 class="quiz-q" tabindex="-1">${q.q}</h3>
        <div class="quiz-opts">${q.r.map((r, i) => `<button type="button" class="quiz-opt${A[q.k] === r ? ' on' : ''}" data-v="${esc(r)}"><span>${String.fromCharCode(65 + i)}</span>${r}</button>`).join('')}</div>
        ${step ? '<button type="button" class="quiz-back">← Question précédente</button>' : ''}`;
    } else {
      const recruteur = A.profil === 'Un recruteur';
      const etudiant = A.profil === 'Un étudiant / une étudiante';
      const c = recruteur
        ? ['Profil polyvalent', 'Communication, design, vidéo, web, IA et données : un profil capable de relier stratégie et production. Je serais ravi d’échanger sur votre besoin.', '#apropos', 'Relire mon parcours']
        : etudiant
        ? ['Apprendre par la pratique', 'Pour un projet d’études, un mémoire ou pour vous former à un métier du numérique, je propose des formations pratiques et un accompagnement adapté à votre niveau.', 'formations.html', 'Voir les formations']
        : CONSEILS[A.besoin];
      box.innerHTML = `
        <div class="quiz-top"><span class="quiz-step">Résultat</span><div class="quiz-bar"><i style="width:100%"></i></div></div>
        <p class="quiz-label">Ce que je vous propose</p>
        <h3 class="quiz-q" tabindex="-1">${c[0]}</h3>
        <p class="quiz-txt">${c[1]}</p>
        <ul class="quiz-recap">${Q.map(q => `<li><small>${q.q.replace(/[?…]/g, '').replace('Pour commencer, vous êtes plutôt', 'Vous êtes')}</small>${A[q.k]}</li>`).join('')}</ul>
        <div class="quiz-actions">
          <button type="button" class="btn quiz-send">Envoyer ma demande →</button>
          <button type="button" class="quiz-back quiz-restart">Recommencer</button>
        </div>`;
    }
    const h = box.querySelector('.quiz-q'); if (h && render.started) h.focus({preventScroll: true});
    render.started = true;
    // Écran de résultat : seuls « Envoyer ma demande » et « Recommencer » restent
    const sk = document.querySelector('[data-to-form]'); if (sk) sk.hidden = step >= Q.length;
  }

  box.addEventListener('click', e => {
    const opt = e.target.closest('.quiz-opt');
    if (opt) { A[Q[step].k] = opt.dataset.v; step++; render(); return; }
    if (e.target.closest('.quiz-restart')) { step = 0; Object.keys(A).forEach(k => delete A[k]); render(); return; }
    if (e.target.closest('.quiz-back')) { step = Math.max(0, step - 1); render(); return; }
    if (e.target.closest('.quiz-send')) {
      // Pré-remplit le formulaire de contact avec les réponses
      const sujet = document.getElementById('c-sujet'), msg = document.getElementById('c-msg');
      const map = { 'Une formation pour mon équipe': 'Une formation' };
      if (sujet) {
        const wanted = A.profil === 'Un recruteur' ? 'Autre' : (map[A.besoin] || 'Un projet (communication, design, vidéo, web)');
        const norm = s => s.replace(/[\u00A0\u202F]/g, ' ').trim();
        [...sujet.options].forEach((o, i) => { if (norm(o.text) === wanted) sujet.selectedIndex = i; });
      }
      if (msg) msg.value = `Bonjour Jipson,\n\n— Profil : ${A.profil}\n— Besoin : ${A.besoin}\n— Avancement : ${A.etape}\n— Délai : ${A.delai}\n\nMon projet en quelques mots : `;
      showForm('Plus qu’à me dire qui vous êtes.');
    }
  });

  /* Formulaire intégré dans la même carte que le questionnaire */
  const form = document.getElementById('contact-form');
  const skip = document.querySelector('[data-to-form]');
  function showForm(title) {
    if (!form) return;
    box.hidden = true; form.hidden = false; if (skip) skip.hidden = true;
    const h = form.querySelector('.quiz-q'); if (h && title) h.textContent = title;
    const card = form.closest('.quiz-card'); const top = card.getBoundingClientRect().top;
    if (top < 70 || top > innerHeight * 0.5) card.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
    setTimeout(() => { const n = document.getElementById('c-nom'); if (n) n.focus({preventScroll: true}); }, 350);
  }
  function showQuiz() {
    box.hidden = false; if (form) form.hidden = true; if (skip) skip.hidden = step >= Q.length;
    const h = box.querySelector('.quiz-q'); if (h) h.focus({preventScroll: true});
  }
  if (skip) skip.addEventListener('click', () => showForm('Écrivez-moi directement.'));
  document.querySelectorAll('[data-to-quiz]').forEach(b => b.addEventListener('click', showQuiz));

  render();
})();
