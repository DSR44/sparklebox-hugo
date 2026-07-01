---
title: "Unlock The Layered Tree"
slug: "the-architecture-unlock"
author: "Elle Vida"
layout: landing
url: "/the-architecture/unlock/"
description: "Verify your subscription to read The Layered Tree transmissions."
robots: "noindex, nofollow"
---

<div class="sb-path-page sb-arch-page sb-arch-unlock">

<div class="sb-path-hero">
<p class="sb-path-brand">Sp<span class="sb-path-pyramid">△</span>rklebox</p>
<p class="sb-path-meta">Subscriber access</p>
<h1 class="sb-path-title">Unlock The Layered Tree</h1>

<div class="sb-path-prose">
<p>Each transmission lives on the site — read here at your pace, not as copy-paste in your inbox. Enter the email you subscribed with to open it.</p>
<p class="sb-path-emphasis">Already inside Sparklebox? Use the same address you subscribed with — each layer unlocks here when you're ready.</p>
</div>
</div>

<div class="sb-arch-subscribe-wrap">
<div class="sb-subscribe sb-subscribe--architecture">
  <div class="sb-subscribe__neon-bar" aria-hidden="true"></div>
  <span class="sb-subscribe__eyebrow">Verify access</span>
  <h3 class="sb-subscribe__title">Enter your email</h3>
  <p class="sb-subscribe__text">Same address you used to subscribe at <a href="/the-architecture/">The Layered Tree</a>.</p>

  <form id="unlock-form" class="sb-subscribe__form" method="POST" action="/api/verify-subscriber">
    <input type="hidden" id="unlock-next" name="next" value="">
    <input type="email" id="unlock-email" name="email" class="sb-subscribe__input" placeholder="your@email.com" required autocomplete="email">
    <button type="submit" id="unlock-btn" class="sb-subscribe__btn">Unlock →</button>
  </form>

  <p id="unlock-message" class="sb-subscribe__message" hidden></p>
  <p class="sb-subscribe__fine">Not subscribed yet? <a href="/the-architecture/#subscribe">Join The Layered Tree</a> first.</p>
</div>
</div>

</div>

<script>
(function () {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next') || '/the-architecture/read/intro/';
  const prefill = params.get('email') || '';
  const error = params.get('error') || '';
  const emailInput = document.getElementById('unlock-email');
  const nextInput = document.getElementById('unlock-next');
  const msg = document.getElementById('unlock-message');
  const form = document.getElementById('unlock-form');

  nextInput.value = next;
  if (prefill) emailInput.value = prefill;

  if (error === 'not_subscribed') {
    msg.textContent = 'That email is not on The Layered Tree list. Subscribe first, then return here.';
    msg.className = 'sb-subscribe__message sb-subscribe__message--err';
    msg.hidden = false;
  } else if (error === 'invalid') {
    msg.textContent = 'Enter a valid email address.';
    msg.className = 'sb-subscribe__message sb-subscribe__message--err';
    msg.hidden = false;
  } else if (error) {
    msg.textContent = 'Could not verify access. Try again.';
    msg.className = 'sb-subscribe__message sb-subscribe__message--err';
    msg.hidden = false;
  }

  // Already unlocked? Skip the form and go straight to the read page.
  fetch('/api/architecture-session', { credentials: 'include' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.ok) {
        window.location.replace(next);
      }
    })
    .catch(function () {});

  form.addEventListener('submit', function () {
    const btn = document.getElementById('unlock-btn');
    btn.disabled = true;
    btn.textContent = '...';
    emailInput.value = emailInput.value.trim().toLowerCase();
    nextInput.value = next;
  });
})();
</script>
