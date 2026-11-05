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

const galaxy = document.querySelector('[data-galaxy]');
const galaxyToggle = document.querySelector('[data-galaxy-toggle]');
if (galaxy && galaxyToggle) {
  const scene = galaxy.querySelector('.galaxy');
  const core = galaxy.querySelector('.galaxy-core');
  const satellites = [...galaxy.querySelectorAll('.galaxy-satellite')];
  const tools = [...galaxy.querySelectorAll('.galaxy-tool')];
  const planes = satellites.map(item => ({
    axis: parseFloat(item.style.getPropertyValue('--axis')) * Math.PI / 180,
    tilt: parseFloat(item.style.getPropertyValue('--tilt')) * Math.PI / 180
  }));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const period = 64000;
  const radiusRatio = .43;
  const perspectiveRatio = 1.8;

  // Parameterize each tilted circle by its projected bearing. The planets stay
  // 60 degrees apart on screen, while travelling in distinct, deeply tilted planes.
  const orbitPoint = (phase, index, radius, perspective) => {
    const { axis, tilt } = planes[index];
    const bearing = phase + index * 2 * Math.PI / satellites.length - axis;
    const angle = Math.atan2(Math.sin(bearing) / Math.cos(tilt), Math.cos(bearing));
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle) * Math.cos(tilt);
    const z = radius * Math.sin(angle) * Math.sin(tilt);
    const scale = perspective / (perspective - z);
    return {
      x: (Math.cos(axis) * x - Math.sin(axis) * y) * scale,
      y: (Math.sin(axis) * x + Math.cos(axis) * y) * scale,
      scale,
      angle
    };
  };

  const fitGalaxyTools = () => {
    const width = scene.clientWidth;
    if (!width) return;
    const radius = width * radiusRatio;
    const perspective = width * perspectiveRatio;
    scene.style.perspective = `${perspective}px`;
    const diameter = Math.max(...tools.map(item => Math.hypot(item.offsetWidth, item.offsetHeight)));
    if (!diameter) return;
    const coreRadius = Math.max(core.offsetWidth, core.offsetHeight) / 2;
    const tilt = Math.max(...planes.map(plane => Math.abs(plane.tilt)));
    const nearScale = perspective / (perspective - radius * Math.sin(tilt));
    const samples = 720;
    // Bound motion between samples as well: safety holds over the continuous
    // orbit, rather than only at the sampled positions. Labels count as part
    // of each planet's bounding circle, including after a resize or font load.
    const speedBound = radius / Math.cos(tilt) * (nearScale + radius * nearScale ** 2 / perspective);
    const sampleError = speedBound * Math.PI / samples;
    const scaleSpeedBound = nearScale ** 2 / perspective * radius / Math.cos(tilt);
    const error = sampleError + diameter / 2 * scaleSpeedBound * Math.PI / samples;
    const gap = 8;
    let fittedScale = 1;
    for (let step = 0; step < samples; step++) {
      const phase = step / samples * 2 * Math.PI;
      const points = planes.map((_, index) => orbitPoint(phase, index, radius, perspective));
      points.forEach((point, index) => {
        const size = Math.hypot(tools[index].offsetWidth, tools[index].offsetHeight) / 2 * point.scale;
        fittedScale = Math.min(fittedScale, (Math.hypot(point.x, point.y) - coreRadius - gap - error) / size);
        for (let other = 0; other < index; other++) {
          const otherSize = Math.hypot(tools[other].offsetWidth, tools[other].offsetHeight) / 2 * points[other].scale;
          const distance = Math.hypot(point.x - points[other].x, point.y - points[other].y);
          fittedScale = Math.min(fittedScale, (distance - gap - 2 * error) / (size + otherSize));
        }
      });
    }
    scene.style.setProperty('--tool-scale', String(Math.max(0, fittedScale)));
  };

  let elapsed = 0;
  let lastTime = null;
  let frame = null;
  let visible = true;
  const renderGalaxy = () => {
    const phase = elapsed / period * 2 * Math.PI + 25 * Math.PI / 180;
    planes.forEach((_, index) => {
      const point = orbitPoint(phase, index, radiusRatio, perspectiveRatio);
      satellites[index].style.setProperty('--travel', `${point.angle * 180 / Math.PI}deg`);
    });
  };
  const tick = time => {
    if (lastTime !== null) elapsed = (elapsed + Math.min(time - lastTime, 100)) % period;
    lastTime = time;
    renderGalaxy();
    frame = requestAnimationFrame(tick);
  };
  const syncGalaxyMotion = () => {
    galaxyToggle.hidden = reducedMotion.matches;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastTime = null;
    if (visible && !document.hidden && !reducedMotion.matches && !galaxy.classList.contains('is-paused')) {
      frame = requestAnimationFrame(tick);
    }
  };
  fitGalaxyTools();
  renderGalaxy();
  if ('ResizeObserver' in window) {
    const galaxyResizeObserver = new ResizeObserver(fitGalaxyTools);
    galaxyResizeObserver.observe(scene);
    galaxyResizeObserver.observe(core);
    tools.forEach(item => galaxyResizeObserver.observe(item));
  } else {
    window.addEventListener('resize', fitGalaxyTools);
  }
  if ('IntersectionObserver' in window) {
    const galaxyVisibilityObserver = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncGalaxyMotion();
    }, { rootMargin: '100px' });
    galaxyVisibilityObserver.observe(scene);
  }
  document.fonts?.ready.then(fitGalaxyTools);
  document.addEventListener('visibilitychange', syncGalaxyMotion);
  reducedMotion.addEventListener('change', syncGalaxyMotion);
  galaxyToggle.addEventListener('click', () => {
    const paused = galaxy.classList.toggle('is-paused');
    galaxyToggle.setAttribute('aria-pressed', String(paused));
    galaxyToggle.textContent = paused ? 'Reprendre l’animation' : 'Mettre l’animation en pause';
    syncGalaxyMotion();
  });
  syncGalaxyMotion();
}

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
