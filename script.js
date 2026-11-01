const projects = {
  onboarding: {
    title: 'Onboarding Alternants & Stagiaires',
    lead: 'Une solution RH pensée pour le terrain : recrutement, onboarding, automatisations et finances dans un même environnement.',
    challenge: 'Des campagnes d’alternance dispersées entre Excel, les e-mails et plusieurs fichiers de suivi financier.',
    role: 'Pilotage du projet, cadrage métier et développement de l’application, de la modélisation des données à l’interface.',
    value: ['Une donnée RH centralisée et gouvernée', 'Un suivi fiable des dossiers, échéances et budgets', 'Moins d’opérations manuelles grâce aux automatisations'],
    image: 'assets/projects/onboarding-rh.png',
    alt: 'Tableau de bord de l’application RH'
  },
  atlas: {
    title: 'Atlas — Notes Pays V.I.E',
    lead: 'Une plateforme unique pour piloter 236 pays, partager les fiches pays et organiser les mises à jour.',
    challenge: 'Des informations réparties entre Salesforce, Excel et de multiples supports métier, difficiles à maintenir et à partager.',
    role: 'Conception et développement intégral : modèle de données, interface, droits d’accès, workflows de revue et intégrations.',
    value: ['Un référentiel partagé pour environ 100 utilisateurs', 'Des accès différenciés selon les rôles', '206 tests automatisés pour fiabiliser le code'],
    image: 'assets/projects/atlas-vie.png',
    alt: 'Interface cartographique de l’application Atlas'
  },
  factory: {
    title: 'Digital Factory',
    lead: 'De la demande métier au suivi des tâches : qualification, portefeuille, Kanban et indicateurs dans un outil unique.',
    challenge: 'Des outils de pilotage génériques, coûteux ou peu adaptés au fonctionnement d’une petite équipe IT.',
    role: 'Conception et développement intégral de l’application, ajustée aux processus et aux usages de la Digital Factory.',
    value: ['Des demandes qualifiées pour faciliter les arbitrages', 'Une visibilité partagée sur les charges et les échéances', 'Un outil sur mesure intégré à Microsoft 365'],
    image: 'assets/projects/digital-factory.png',
    alt: 'Tableau de bord de pilotage de la Digital Factory'
  },
  audits: {
    title: 'Restitution Audits',
    lead: 'Une expérience SharePoint repensée pour analyser, rechercher et suivre les recommandations de chaque audit.',
    challenge: 'Une ancienne application liée à Excel et Power BI, avec des données et des usages dispersés.',
    role: 'Conception de la refonte et développement du WebPart SPFx, de l’interface jusqu’à l’intégration SharePoint.',
    value: ['Un référentiel SharePoint commun et gouverné', 'Un suivi structuré des actions à 6 et 12 mois', 'Une interface claire, intégrée aux usages M365'],
    image: 'assets/projects/restitution-audits.png',
    alt: 'Tableaux de bord de l’application Restitution Audits'
  }
};

const header = document.querySelector('[data-header]');
const menu = document.querySelector('[data-menu]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const menuLabel = menuToggle.querySelector('.sr-only');
const progress = document.querySelector('[data-scroll-progress]');

const updatePageChrome = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  progress.style.transform = `scaleX(${ratio})`;
};
updatePageChrome();
window.addEventListener('scroll', updatePageChrome, { passive: true });

menuToggle.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  menuToggle.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuLabel.textContent = open ? 'Fermer le menu' : 'Ouvrir le menu';
  document.body.classList.toggle('dialog-open', open);
});

menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.classList.remove('is-open');
  menuToggle.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuLabel.textContent = 'Ouvrir le menu';
  document.body.classList.remove('dialog-open');
}));

const navLinks = [...document.querySelectorAll('[data-nav-link]')];
const navSections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-30% 0px -55%', threshold: [0, .2, .5] });
  navSections.forEach(section => navObserver.observe(section));
}

const revealItems = document.querySelectorAll('.reveal');
revealItems.forEach(item => {
  if (item.dataset.delay) item.style.setProperty('--delay', `${item.dataset.delay}ms`);
});

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('is-visible'));
}

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(item => {
      item.classList.remove('is-active');
      item.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('is-active');
    button.setAttribute('aria-pressed', 'true');
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-category]').forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
    });
  });
});

const dialog = document.querySelector('[data-dialog]');
const closeDialog = () => {
  dialog.close();
  document.body.classList.remove('dialog-open');
};

document.querySelectorAll('[data-project]').forEach(button => {
  button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    dialog.querySelector('[data-dialog-title]').textContent = project.title;
    dialog.querySelector('[data-dialog-lead]').textContent = project.lead;
    dialog.querySelector('[data-dialog-challenge]').textContent = project.challenge;
    dialog.querySelector('[data-dialog-role]').textContent = project.role;
    const image = dialog.querySelector('[data-dialog-image]');
    image.src = project.image;
    image.alt = project.alt;
    const list = dialog.querySelector('[data-dialog-value]');
    list.replaceChildren(...project.value.map(value => {
      const item = document.createElement('li');
      item.textContent = value;
      return item;
    }));
    dialog.showModal();
    document.body.classList.add('dialog-open');
  });
});

dialog.querySelector('[data-dialog-close]').addEventListener('click', closeDialog);
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) closeDialog();
});
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
