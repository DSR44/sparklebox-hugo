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
<p>This transmission lives on the site — not in your inbox as a copy-paste article. Enter the email you subscribed with. If you are on the list, you can read.</p>
<p class="sb-path-emphasis">Sharing a link is not enough. The read pages require a verified subscriber.</p>
</div>
</div>

<div class="sb-arch-subscribe-wrap">
<div class="sb-subscribe sb-subscribe--architecture">
  <div class="sb-subscribe__neon-bar" aria-hidden="true"></div>
  <span class="sb-subscribe__eyebrow">Verify access</span>
  <h3 class="sb-subscribe__title">Enter your email</h3>
  <p class="sb-subscribe__text">Same address you used to subscribe at <a href="/the-architecture/">The Layered Tree</a>.</p>

  <form id="unlock-form" class="sb-subscribe__form">
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
  const emailInput = document.getElementById('unlock-email');
  if (prefill) emailInput.value = prefill;

  document.getElementById('unlock-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = emailInput.value;
    const msg = document.getElementById('unlock-message');
    const btn = document.getElementById('unlock-btn');
    btn.disabled = true;
    btn.textContent = '...';
    try {
      const response = await fetch('/api/verify-subscriber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok && data.status === 'verified') {
        msg.textContent = 'Access granted. Opening transmission...';
        msg.className = 'sb-subscribe__message sb-subscribe__message--ok';
        msg.hidden = false;
        window.location.href = next;
        return;
      }
      if (data.error === 'not_subscribed') {
        msg.textContent = 'That email is not on the list. Subscribe first, then return here.';
      } else {
        msg.textContent = data.message || data.error || 'Could not verify. Try again.';
      }
      msg.className = 'sb-subscribe__message sb-subscribe__message--err';
      msg.hidden = false;
    } catch {
      msg.textContent = 'Something went wrong. Try again.';
      msg.className = 'sb-subscribe__message sb-subscribe__message--err';
      msg.hidden = false;
    }
    btn.disabled = false;
    btn.textContent = 'Unlock →';
  });
})();
</script>
