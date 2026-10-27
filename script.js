'use strict';

document.documentElement.classList.replace('no-js', 'js');

const hero = document.querySelector('.hero');
const doorButton = document.querySelector('#door-toggle');
const doorStatus = document.querySelector('.door-status');
const section = document.querySelector('#seasons');
const scene = document.querySelector('#house-scene');
const pauseButton = document.querySelector('#pause-scene');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;

doorButton.addEventListener('click', () => {
  const open = hero.classList.toggle('is-open');
  doorButton.firstChild.textContent = open ? 'Close the doors' : 'Open the doors';
  doorButton.setAttribute('aria-expanded', String(open));
  doorStatus.textContent = open ? 'The doors are open. A hanok courtyard is revealed.' : 'The doors are closed.';
});

const seasons = {
  summer: {
    name: 'MARU · WOODEN FLOOR', heading: 'Let the\nbreeze in.',
    fact: 'Air moves under the raised wooden floor.',
    detail: 'A maru sits above the ground, leaving space for air to flow beneath the boards. Wide eaves can give shade from the high summer sun.',
    feeling: 'A place to enjoy the summer breeze.'
  },
  winter: {
    name: 'ONDOL · HEATED FLOOR', heading: 'Warmth, from\nthe ground up.',
    fact: 'Ondol warms the floor from below.',
    detail: 'In a traditional ondol system, hot gases from a hearth travel through channels beneath a room’s stone floor, then leave through a chimney.',
    feeling: 'Warm floors for cold winter days.'
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
  syncScene();
}

document.querySelectorAll('.season-switch button').forEach(button => {
  button.addEventListener('click', () => setSeason(button.dataset.season));
});

function updatePauseControl() {
  pauseButton.setAttribute('aria-pressed', String(paused));
  pauseButton.textContent = reducedMotion.matches ? 'Reduced motion on' : paused ? 'Play animation' : 'Pause animation';
  pauseButton.disabled = reducedMotion.matches;
  syncScene();
}

pauseButton.addEventListener('click', () => { paused = !paused; updatePauseControl(); });
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updatePauseControl(); });
scene.addEventListener('load', syncScene);
scene.addEventListener('error', () => { document.querySelector('#scene-error').hidden = false; });

document.querySelectorAll('input[name="feature"]').forEach(input => {
  input.addEventListener('change', () => {
    if (input.checked) document.querySelector('#introduction > span:first-child').textContent = `the ${input.value}`;
  });
});

setSeason('summer');
updatePauseControl();
