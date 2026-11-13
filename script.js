(function () {
  'use strict';

  // Paste the Apps Script web app URL (ends in /exec) between the quotes. See rsvp-backend/SETUP.md.
  var RSVP_URL = 'https://script.google.com/macros/s/AKfycby5vOfqc36CUKcGCEIEZIjoENEBdzomkH_xcIqYD_TqpOm36GrOtZ_g0RKcE62xA0LGNA/exec';
  var BARAAT = Date.parse('2027-02-11T17:00:00+05:30');

  var L = window.InviteLogic;
  var body = document.body;
  var cover = document.getElementById('cover');
  var music = document.getElementById('music');
  var mute = document.getElementById('mute');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* ----- music ----- */
  function showMusicState() {
    var off = music.paused;
    mute.classList.toggle('off', off);
    mute.setAttribute('aria-pressed', String(off));
    mute.setAttribute('aria-label', off ? 'Play music' : 'Mute music');
  }
  function playMusic() {
    // Rejected when blocked or the file fails to load; the invite must carry on silently.
    var p = music.play();
    if (p && p.catch) p.catch(showMusicState);
  }
  music.addEventListener('play', showMusicState);
  music.addEventListener('pause', showMusicState);
  music.addEventListener('error', showMusicState);
  mute.addEventListener('click', function () {
    if (music.paused) playMusic(); else music.pause();
  });
  var pausedByHide = false;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && !music.paused) { music.pause(); pausedByHide = true; }
    else if (!document.hidden && pausedByHide) { pausedByHide = false; playMusic(); }
  });

  /* ----- cover ----- */
  function petals() {
    var box = document.getElementById('petals');
    for (var i = 0; i < 22; i++) {
      var p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDuration = (4 + Math.random() * 4) + 's';
      p.style.animationDelay = (Math.random() * 2.5) + 's';
      box.appendChild(p);
    }
    setTimeout(function () { box.textContent = ''; }, 11000);
  }
  function openInvite() {
    if (body.classList.contains('open')) return;
    body.classList.add('open');
    body.classList.remove('locked');
    mute.hidden = false;
    showMusicState();
    playMusic();
    if (!calm) petals();
    setTimeout(function () { cover.hidden = true; }, calm ? 200 : 2100);
  }
  cover.addEventListener('click', openInvite);
  cover.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openInvite(); }
  });

  /* ----- reveal on scroll ----- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !calm) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ----- RSVP ----- */
  var form = document.getElementById('rsvp');
  var status = document.getElementById('rsvp-status');
  var button = form.querySelector('button[type="submit"]');
  var guestsRow = document.getElementById('guests-row');
  var sending = false;

  function showErrors(errors) {
    form.querySelectorAll('.err').forEach(function (el) {
      el.textContent = errors[el.getAttribute('data-for')] || '';
    });
  }
  form.addEventListener('change', function (ev) {
    if (ev.target.name === 'attending') guestsRow.hidden = ev.target.value !== 'yes';
  });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (sending) return;
    var data = new FormData(form);
    var res = L.validateRsvp({ name: data.get('name'), attending: data.get('attending'), guests: data.get('guests') });
    showErrors(res.errors);
    status.textContent = '';
    if (!res.ok) return;
    if (!RSVP_URL) { status.textContent = 'RSVP opens soon. Please check back shortly.'; return; }

    sending = true;
    button.disabled = true;
    status.textContent = 'Sending…';
    var abort = new AbortController();
    // Apps Script can take 10 s+ (sheet lock, mail); a shorter limit invites a retry and a duplicate row.
    var timeout = setTimeout(function () { abort.abort(); }, 30000);
    // text/plain keeps this a "simple" request: Apps Script cannot answer a CORS preflight.
    fetch(RSVP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(res.value),
      signal: abort.signal
    }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (j) {
      if (!j || j.ok !== true) throw new Error('rejected');
      form.hidden = true;
      document.getElementById('rsvp-thanks-msg').textContent = res.value.attending === 'yes'
        ? 'We look forward to celebrating with you, ' + res.value.name + '.'
        : 'We will miss you, ' + res.value.name + '. Thank you for letting us know.';
      document.getElementById('rsvp-thanks').hidden = false;
    }).catch(function () {
      status.textContent = 'Could not send your RSVP. Please check your connection and tap Confirm again.';
    }).then(function () {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
    });
  });

  /* ----- countdown ----- */
  var units = document.querySelectorAll('#countdown [data-u]');
  var timer = null;
  function tick() {
    var c = L.countdownParts(BARAAT, Date.now());
    if (c.done) {
      document.getElementById('countdown').hidden = true;
      document.getElementById('count-note').hidden = true;
      document.getElementById('count-done').hidden = false;
      clearInterval(timer);
      return;
    }
    for (var i = 0; i < units.length; i++) {
      var v = c[units[i].getAttribute('data-u')];
      units[i].textContent = v < 10 ? '0' + v : String(v);
    }
  }
  tick();
  timer = setInterval(tick, 1000);
})();
