/* =========================================================
   Questionnaire de qualification — Jipson Mathas
   100 % navigateur : profile le visiteur, propose une reco
   personnalisée, puis compose un e-mail pré-rempli vers Jipson.
   Pour modifier les questions : éditez le tableau QUESTIONS ci-dessous.
   ========================================================= */

const EMAIL = 'jipsondecorezmathas@gmail.com';

// --- Les questions (faciles à modifier / ajouter) ---
const QUESTIONS = [
  {
    id: 'profil',
    question: 'Pour commencer, vous êtes plutôt…',
    options: [
      { value: 'entreprise',   label: 'Une entreprise / organisation' },
      { value: 'entrepreneur', label: 'Un entrepreneur / une startup' },
      { value: 'particulier',  label: 'Un particulier / porteur de projet' },
      { value: 'pro',          label: 'Un recruteur / confrère / partenaire' },
    ],
  },
  {
    id: 'besoin',
    question: "Qu'est-ce qui vous amène ?",
    options: [
      { value: 'identite',  label: 'Créer mon identité visuelle (logo, charte)' },
      { value: 'refonte',   label: 'Refondre / moderniser mon image de marque' },
      { value: 'digital',   label: 'Développer ma présence digitale' },
      { value: 'strategie', label: 'Une stratégie de communication globale' },
    ],
  },
  {
    id: 'etape',
    question: 'Où en êtes-vous dans votre réflexion ?',
    options: [
      { value: 'precis',      label: "J'ai un projet précis et défini" },
      { value: 'idee',        label: 'J’ai une idée à explorer' },
      { value: 'comparaison', label: 'Je compare plusieurs prestataires' },
      { value: 'veille',      label: 'Je me renseigne pour plus tard' },
    ],
  },
  {
    id: 'echeance',
    question: 'Pour quand, idéalement ?',
    options: [
      { value: 'urgent',   label: "C'est urgent (ce mois-ci)" },
      { value: 'court',    label: 'Dans 1 à 3 mois' },
      { value: 'long',     label: 'Dans plus de 3 mois' },
      { value: 'flexible', label: 'Pas de date précise' },
    ],
  },
];

// --- Recommandation selon le besoin exprimé ---
const FOCUS = {
  identite:  { title: 'Création graphique · Identité visuelle',
               text: "On pose des fondations solides : un logo unique et une charte graphique cohérente, déclinables sur tous vos supports." },
  refonte:   { title: 'Communication 360° · Refonte de marque',
               text: "On modernise votre image et on l'harmonise sur l'ensemble de vos points de contact." },
  digital:   { title: 'Digital · Présence & acquisition',
               text: "On déploie une stratégie digitale sur-mesure : contenus, réseaux sociaux, SEO et campagnes ciblées." },
  strategie: { title: 'Conseil & Communication 360°',
               text: "On construit une stratégie de communication globale, alignée sur vos objectifs business." },
};

// --- État ---
const answers = {};   // { profil: {value,label}, ... }
let current = 0;      // index de la question courante (0..QUESTIONS.length) ; = length → écran résultat
const root = document.getElementById('quiz');

if (root) init();

function init() {
  render();
}

// Barre de progression : avance à chaque étape (résultat = 100 %)
function progressPercent() {
  return Math.round((current / QUESTIONS.length) * 100);
}

function render() {
  const isResult = current >= QUESTIONS.length;
  root.innerHTML = `
    <div class="quiz-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent()}">
      <span style="width:${Math.max(progressPercent(), isResult ? 100 : 8)}%"></span>
    </div>
    <div class="quiz-step">
      ${isResult ? resultHTML() : questionHTML(QUESTIONS[current])}
    </div>
  `;
  isResult ? bindResult() : bindQuestion();
}

function questionHTML(step) {
  const opts = step.options.map((o, i) => {
    const selected = answers[step.id] && answers[step.id].value === o.value;
    return `
      <button class="quiz-option${selected ? ' is-selected' : ''}" data-value="${o.value}" data-index="${i}">
        <span class="quiz-option-key">${String.fromCharCode(65 + i)}</span>
        <span class="quiz-option-label">${o.label}</span>
      </button>`;
  }).join('');

  return `
    <p class="quiz-count">Question ${current + 1} / ${QUESTIONS.length}</p>
    <h3 class="quiz-question">${step.question}</h3>
    <div class="quiz-options">${opts}</div>
    <div class="quiz-nav">
      ${current > 0 ? '<button class="quiz-back" data-back>← Précédent</button>' : '<span></span>'}
    </div>
  `;
}

function bindQuestion() {
  root.querySelectorAll('.quiz-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = QUESTIONS[current];
      const opt = step.options[Number(btn.dataset.index)];
      answers[step.id] = { value: opt.value, label: opt.label, question: step.question };
      // Retour visuel puis passage à l'étape suivante
      root.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      setTimeout(() => { current++; render(); }, 260);
    });
  });
  const back = root.querySelector('[data-back]');
  if (back) back.addEventListener('click', () => { current--; render(); });
}

function resultHTML() {
  const besoin = answers.besoin ? answers.besoin.value : 'identite';
  const focus = FOCUS[besoin] || FOCUS.identite;
  const isPro = answers.profil && answers.profil.value === 'pro';
  const urgent = answers.echeance && answers.echeance.value === 'urgent';

  const heading = isPro
    ? 'Merci de votre visite 👋'
    : 'Voici comment je peux vous aider';

  const lead = isPro
    ? "Ravi de vous compter parmi mes visiteurs ! Mon parcours et mes réalisations sont juste au-dessus. Laissez-moi un mot, je vous réponds avec plaisir."
    : focus.text;

  const focusCard = isPro ? '' : `
    <div class="quiz-focus">
      <span class="quiz-focus-tag">Piste recommandée</span>
      <strong>${focus.title}</strong>
    </div>`;

  const urgentNote = urgent
    ? '<p class="quiz-urgent">⚡ Vous êtes pressé ? Précisez-le, je peux prioriser votre demande.</p>'
    : '';

  return `
    <p class="quiz-count">C'est tout bon !</p>
    <h3 class="quiz-question">${heading}</h3>
    <p class="quiz-result-lead">${lead}</p>
    ${focusCard}
    ${urgentNote}
    <form class="quiz-form" id="quiz-form" novalidate>
      <div class="quiz-field">
        <label for="q-name">Votre prénom</label>
        <input type="text" id="q-name" name="name" placeholder="Ex. Marie" required />
      </div>
      <div class="quiz-field">
        <label for="q-email">Votre e-mail</label>
        <input type="email" id="q-email" name="email" placeholder="vous@exemple.com" required />
      </div>
      <div class="quiz-field">
        <label for="q-msg">Un mot sur votre projet (optionnel)</label>
        <textarea id="q-msg" name="message" rows="3" placeholder="Décrivez en une phrase ce que vous avez en tête…"></textarea>
      </div>
      <p class="quiz-error" id="quiz-error" hidden>Merci d'indiquer votre prénom et un e-mail valide.</p>
      <div class="quiz-actions">
        <button type="button" class="quiz-back" data-back>← Précédent</button>
        <button type="submit" class="btn btn--dark">Envoyer ma demande</button>
      </div>
    </form>
  `;
}

function bindResult() {
  const back = root.querySelector('[data-back]');
  if (back) back.addEventListener('click', () => { current--; render(); });

  const form = document.getElementById('quiz-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('q-name').value.trim();
    const email = document.getElementById('q-email').value.trim();
    const message = document.getElementById('q-msg').value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !emailOk) {
      document.getElementById('quiz-error').hidden = false;
      return;
    }
    window.location.href = buildMailto(name, email, message);
    showThankYou(name);
  });
}

function buildMailto(name, email, message) {
  const lines = [
    'Bonjour Jipson,',
    '',
    'Voici ma demande depuis votre portfolio :',
    '',
  ];
  QUESTIONS.forEach((q) => {
    const a = answers[q.id];
    if (a) lines.push(`• ${labelFor(q.id)} : ${a.label}`);
  });
  lines.push('');
  if (message) { lines.push(`Mon projet : ${message}`, ''); }
  lines.push(`— ${name} (${email})`);

  const subject = `Nouveau projet via le portfolio — ${name}`;
  const body = lines.join('\r\n');
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function labelFor(id) {
  return {
    profil: 'Profil',
    besoin: 'Besoin',
    etape: 'Avancement',
    echeance: 'Échéance',
  }[id] || id;
}

function showThankYou(name) {
  root.innerHTML = `
    <div class="quiz-done">
      <div class="quiz-done-check">✓</div>
      <h3 class="quiz-question">Merci, ${escapeHtml(name)} !</h3>
      <p class="quiz-result-lead">Votre e-mail pré-rempli vient de s'ouvrir — il ne reste qu'à l'envoyer. Je vous réponds très vite.</p>
      <p class="quiz-done-alt">L'e-mail ne s'est pas ouvert ?
        <a href="mailto:${EMAIL}">Écrivez-moi directement</a>.</p>
    </div>
  `;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
