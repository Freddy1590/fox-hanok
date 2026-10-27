'use strict';

document.documentElement.classList.replace('no-js', 'js');

const hero = document.querySelector('.hero');
const journey = document.querySelector('.door-journey');
const doorButton = document.querySelector('#door-toggle');
const doorStatus = document.querySelector('.door-status');
const scrollLabel = document.querySelector('#scroll-label');
const section = document.querySelector('#seasons');
const scene = document.querySelector('#house-scene');
const pauseButton = document.querySelector('#pause-scene');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
let doorProgress = 0;
let doorStart = 0;
let doorEnd = 1;
let doorFrame = 0;
let doorEndpoint = '';

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

function updateDoorsFromScroll() {
  doorFrame = 0;
  if (!reducedMotion.matches) renderDoors((window.scrollY - doorStart) / Math.max(1, doorEnd - doorStart));
}

function queueDoorUpdate() {
  if (!doorFrame && !reducedMotion.matches) doorFrame = requestAnimationFrame(updateDoorsFromScroll);
}

function configureDoors() {
  document.documentElement.classList.toggle('scroll-doors', !reducedMotion.matches);
  if (reducedMotion.matches) renderDoors(doorProgress >= .5 ? 1 : 0);
  else { measureDoorJourney(); updateDoorsFromScroll(); }
}

doorButton.addEventListener('click', event => {
  if (reducedMotion.matches) renderDoors(doorProgress >= .98 ? 0 : 1);
  else window.scrollTo({ top: doorProgress >= .98 ? doorStart : doorEnd, behavior: event.detail === 0 ? 'auto' : 'smooth' });
});
window.addEventListener('scroll', queueDoorUpdate, { passive: true });
window.addEventListener('resize', () => { if (!reducedMotion.matches) { measureDoorJourney(); queueDoorUpdate(); } });
window.addEventListener('pageshow', configureDoors);

const seasons = {
  summer: {
    name: 'MARU · WOODEN FLOOR', heading: 'Let the\nbreeze in.',
    fact: 'Air moves under the raised wooden floor.',
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
    root.dataset.paused = String(paused || reducedMotion.matches);
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
  syncScene();
}

document.querySelectorAll('.season-switch button').forEach(button => {
  button.addEventListener('click', () => setSeason(button.dataset.season));
});

function updatePauseControl() {
  section.dataset.paused = String(paused || reducedMotion.matches);
  pauseButton.setAttribute('aria-pressed', String(paused));
  pauseButton.textContent = reducedMotion.matches ? 'Reduced motion on' : paused ? 'Play animation' : 'Pause animation';
  pauseButton.disabled = reducedMotion.matches;
  syncScene();
}

pauseButton.addEventListener('click', () => { paused = !paused; updatePauseControl(); });
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updatePauseControl(); configureDoors(); });
scene.addEventListener('load', syncScene);
scene.addEventListener('error', () => { document.querySelector('#scene-error').hidden = false; });

document.querySelectorAll('input[name="feature"]').forEach(input => {
  input.addEventListener('change', () => {
    if (input.checked) document.querySelector('#introduction > span:first-child').textContent = `the ${input.value}`;
  });
});

setSeason('summer');
updatePauseControl();
configureDoors();
