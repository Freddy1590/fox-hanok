'use strict';

document.documentElement.classList.replace('no-js', 'js');

const hero = document.querySelector('.hero');
const journey = document.querySelector('.door-journey');
const doorButton = document.querySelector('#door-toggle');
const doorStatus = document.querySelector('.door-status');
const scrollLabel = document.querySelector('#scroll-label');
const section = document.querySelector('#seasons');
const seasonJourney = document.querySelector('#season-journey');
const scene = document.querySelector('#house-scene');
const pauseButton = document.querySelector('#pause-scene');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
let doorProgress = 0;
let doorStart = 0;
let doorEnd = 1;
let scrollFrame = 0;
let doorEndpoint = '';
let scrollSeasons = false;
let seasonStart = 0;
let seasonEnd = 1;
let seasonProgress = 0;
let seasonMix = 0;
let sceneVisible = false;
let maruFocus = 0;
let ondolFocus = 0;
let cutaway = 0;
let airReveal = 1;
let heatReveal = 0;

function easeRange(value, start, end) {
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function renderDoors(progress) {
  doorProgress = Math.min(1, Math.max(0, progress));
  const open = doorProgress >= .98;
  hero.style.setProperty('--door-progress', doorProgress);
  hero.style.setProperty('--door-copy-fade', Math.min(1, Math.max(0, (doorProgress - .2) / .5)));
  hero.style.setProperty('--sunlight-opacity', Math.sin(Math.PI * doorProgress) * .32);
  hero.classList.toggle('is-open', reducedMotion.matches ? open : doorProgress > .12);
  doorButton.firstChild.textContent = open ? 'Close the doors' : 'Open the doors';
  doorButton.setAttribute('aria-expanded', String(open));
  scrollLabel.textContent = open ? 'Keep scrolling to explore' : 'Scroll to open';
  const endpoint = open ? 'open' : doorProgress <= .01 ? 'closed' : '';
  if (endpoint && endpoint !== doorEndpoint) {
    doorStatus.textContent = open ? 'The doors are open. A hanok courtyard is revealed.' : 'The doors are closed.';
    doorEndpoint = endpoint;
  }
}

function measureDoorJourney() {
  const top = journey.getBoundingClientRect().top + window.scrollY;
  doorStart = Math.max(0, top - 24);
  doorEnd = top + journey.offsetHeight - hero.offsetHeight;
}

function updateScenesFromScroll() {
  scrollFrame = 0;
  if (reducedMotion.matches) return;
  renderDoors((window.scrollY - doorStart) / Math.max(1, doorEnd - doorStart));
  if (scrollSeasons) renderSeasonProgress((window.scrollY - seasonStart) / Math.max(1, seasonEnd - seasonStart));
}

function queueScrollUpdate() {
  if (!scrollFrame && !reducedMotion.matches) scrollFrame = requestAnimationFrame(updateScenesFromScroll);
}

function configureScenes(preservePosition = false) {
  const wasInSeason = scrollSeasons && window.scrollY >= seasonStart && window.scrollY <= seasonEnd;
  const previousProgress = seasonProgress;
  document.documentElement.classList.toggle('scroll-doors', !reducedMotion.matches);
  document.documentElement.classList.toggle('scroll-seasons', !reducedMotion.matches);
  seasonJourney.style.height = '';
  // Keep all prose reachable when a short viewport cannot contain the pinned scene.
  scrollSeasons = !reducedMotion.matches && section.offsetHeight <= window.innerHeight + 1;
  document.documentElement.classList.toggle('scroll-seasons', scrollSeasons);
  if (scrollSeasons) seasonJourney.style.height = `${section.offsetHeight + window.innerHeight * 3.2}px`;
  seasonStart = seasonJourney.getBoundingClientRect().top + window.scrollY;
  seasonEnd = seasonStart + seasonJourney.offsetHeight - section.offsetHeight;
  document.querySelector('#season-scroll-cue').textContent = scrollSeasons ? 'Scroll closer. Follow the breeze and warmth.' : 'Choose a season. Explore the details.';
  if (preservePosition && wasInSeason) {
    window.scrollTo({ top: scrollSeasons ? seasonStart + previousProgress * (seasonEnd - seasonStart) : seasonStart, behavior: 'instant' });
  }
  if (!scrollSeasons) {
    renderSeasonProgress(section.dataset.season === 'winter' ? .85 : .26);
  }
  if (reducedMotion.matches) renderDoors(doorProgress >= .5 ? 1 : 0);
  else { measureDoorJourney(); updateScenesFromScroll(); }
}

doorButton.addEventListener('click', event => {
  if (reducedMotion.matches) renderDoors(doorProgress >= .98 ? 0 : 1);
  else window.scrollTo({ top: doorProgress >= .98 ? doorStart : doorEnd, behavior: event.detail === 0 ? 'auto' : 'smooth' });
});
window.addEventListener('scroll', queueScrollUpdate, { passive: true });
window.addEventListener('resize', () => configureScenes(true));
window.addEventListener('pageshow', () => configureScenes());

const seasons = {
  summer: {
    name: 'MARU · WOODEN FLOOR', heading: 'Let the\nbreeze in.',
    fact: 'Air flows under the raised wooden floor.',
    detail: 'A maru sits above the ground, leaving space for air to flow beneath the boards. Wide eaves can give shade from the high summer sun.',
    feeling: 'A place to enjoy the summer breeze.',
    caption: 'Illustrative model · not the house in the photograph'
  },
  winter: {
    name: 'ONDOL · HEATED FLOOR', heading: 'Warmth, from\nthe ground up.',
    fact: 'Ondol warms the floor from below.',
    detail: 'In a traditional ondol system, hot gases from a hearth travel through channels beneath a room’s stone floor, then leave through a chimney.',
    feeling: 'Warm floors for cold winter days.',
    caption: 'Cutaway view: heat channels beneath the ondol room.'
  }
};

function syncScene() {
  const root = scene.contentDocument?.documentElement;
  if (root?.tagName.toLowerCase() === 'svg') {
    root.dataset.season = section.dataset.season;
    root.dataset.paused = String(paused || reducedMotion.matches || document.hidden || !sceneVisible);
    root.dataset.scroll = String(scrollSeasons);
    root.style.setProperty('--summer-opacity', 1 - seasonMix);
    root.style.setProperty('--winter-opacity', seasonMix);
    root.style.setProperty('--cutaway-opacity', cutaway);
    root.style.setProperty('--air-opacity', airReveal);
    root.style.setProperty('--heat-opacity', heatReveal);
    root.style.setProperty('--overview-opacity', 1 - Math.max(maruFocus, ondolFocus));
    const scale = 1 + maruFocus + ondolFocus * 1.25;
    const x = maruFocus * (500 - 742 * 2) + ondolFocus * (500 - 312 * 2.25);
    const y = maruFocus * (370 - 503 * 2) + ondolFocus * (370 - 447 * 2.25);
    root.querySelector('#camera')?.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
  }
}

function setSeason(season) {
  if (!Object.prototype.hasOwnProperty.call(seasons, season)) return;
  const copy = seasons[season];
  section.dataset.season = season;
  document.querySelectorAll('.season-switch button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.season === season));
  });
  document.querySelector('.season-watermark').textContent = season;
  document.querySelector('#feature-name').textContent = copy.name;
  const heading = document.querySelector('#season-heading');
  heading.replaceChildren();
  copy.heading.split('\n').forEach((line, index) => {
    if (index) heading.append(document.createElement('br'));
    heading.append(document.createTextNode(line));
  });
  document.querySelector('#season-fact').textContent = copy.fact;
  document.querySelector('#season-detail').textContent = copy.detail;
  document.querySelector('#season-feeling').textContent = copy.feeling;
  document.querySelector('#scene-caption').textContent = copy.caption;
}

function renderSeasonProgress(progress) {
  seasonProgress = Math.min(1, Math.max(0, progress));
  const p = seasonProgress;
  seasonMix = easeRange(p, .4, .58);
  maruFocus = easeRange(p, .07, .18) * (1 - easeRange(p, .29, .41));
  ondolFocus = easeRange(p, .59, .71) * (1 - easeRange(p, .88, .99));
  cutaway = easeRange(p, .72, .77) * (1 - easeRange(p, .89, .96));
  airReveal = easeRange(p, .18, .21) * (1 - easeRange(p, .3, .36));
  heatReveal = easeRange(p, .77, .8) * (1 - easeRange(p, .88, .93));
  const overviewCopy = 1 - easeRange(p, .04, .09) + easeRange(p, .98, 1);
  const maruCopy = easeRange(p, .19, .22) * (1 - easeRange(p, .28, .31));
  const ondolCopy = easeRange(p, .78, .81) * (1 - easeRange(p, .87, .9));
  section.style.setProperty('--season-progress', seasonMix);
  section.style.setProperty('--summer-opacity', 1 - seasonMix);
  section.style.setProperty('--winter-opacity', seasonMix);
  section.style.setProperty('--season-copy-opacity', Math.max(overviewCopy, maruCopy, ondolCopy));
  section.style.setProperty('--season-detail-opacity', overviewCopy);
  section.style.setProperty('--caption-opacity', Math.min(1, Math.abs(seasonMix - .5) * 4));
  section.style.setProperty('--overview-opacity', 1 - Math.max(maruFocus, ondolFocus));
  const season = seasonMix < .5 ? 'summer' : 'winter';
  if (section.dataset.season !== season) setSeason(season);
  syncScene();
}

document.querySelectorAll('.season-switch button').forEach(button => {
  button.addEventListener('click', event => {
    if (scrollSeasons) {
      const progress = button.dataset.season === 'winter' ? .85 : .26;
      window.scrollTo({ top: seasonStart + progress * (seasonEnd - seasonStart), behavior: event.detail === 0 ? 'auto' : 'smooth' });
    } else {
      renderSeasonProgress(button.dataset.season === 'winter' ? .85 : .26);
    }
  });
});

function updatePauseControl() {
  section.dataset.paused = String(paused || reducedMotion.matches);
  pauseButton.setAttribute('aria-pressed', String(paused));
  pauseButton.textContent = reducedMotion.matches ? 'Reduced motion on' : paused ? 'Play animation' : 'Pause animation';
  pauseButton.disabled = reducedMotion.matches;
  syncScene();
}

pauseButton.addEventListener('click', () => { paused = !paused; updatePauseControl(); });
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updatePauseControl(); configureScenes(true); });
scene.addEventListener('load', syncScene);
scene.addEventListener('error', () => { document.querySelector('#scene-error').hidden = false; });
new IntersectionObserver(entries => { sceneVisible = entries[0].isIntersecting; syncScene(); }).observe(scene);
document.addEventListener('visibilitychange', syncScene);

document.querySelectorAll('input[name="feature"]').forEach(input => {
  input.addEventListener('change', () => {
    if (input.checked) document.querySelector('#introduction > span:first-child').textContent = `the ${input.value}`;
  });
});

setSeason('summer');
updatePauseControl();
configureScenes();
document.fonts.ready.then(() => configureScenes());
