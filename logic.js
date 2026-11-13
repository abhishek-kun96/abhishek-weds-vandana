// Pure logic shared by the page (window.InviteLogic) and the Node tests (module.exports).
(function (root) {
  'use strict';

  function countdownParts(targetMs, nowMs) {
    var left = targetMs - nowMs;
    if (!(left > 0)) return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    var s = Math.floor(left / 1000);
    return {
      done: false,
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60
    };
  }

  function validateRsvp(input) {
    input = input || {};
    var errors = {};

    var name = String(input.name == null ? '' : input.name).replace(/\s+/g, ' ').trim();
    if (!name) errors.name = 'Please enter your name.';
    else if (name.length > 80) errors.name = 'Name is too long (80 characters at most).';

    var attending = input.attending;
    if (attending !== 'yes' && attending !== 'no') errors.attending = 'Please choose yes or no.';

    var guests = 0;
    if (attending === 'yes') {
      var raw = String(input.guests == null ? '' : input.guests).trim();
      guests = /^\d+$/.test(raw) ? parseInt(raw, 10) : NaN;
      if (!(guests >= 1 && guests <= 20)) errors.guests = 'Enter a whole number of guests from 1 to 20.';
    }

    var ok = Object.keys(errors).length === 0;
    return { ok: ok, errors: errors, value: ok ? { name: name, attending: attending, guests: guests } : null };
  }

  var api = { countdownParts: countdownParts, validateRsvp: validateRsvp };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.InviteLogic = api;
})(typeof window !== 'undefined' ? window : this);
