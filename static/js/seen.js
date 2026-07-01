(function () {
  'use strict';

  const QUESTIONS = [
    {
      id: 'q1',
      type: 'text',
      prompt: 'When was the last time you felt truly seen?',
      sub: "Don't think about this one. Just answer.",
      placeholder: 'Type whatever comes first...',
    },
    {
      id: 'q2',
      type: 'sliders',
      prompt: 'What do people think you are — versus what you actually are?',
      sub: 'Slide to show the gap.',
    },
    {
      id: 'q3',
      type: 'choice',
      prompt: 'Where do you go when you need to feel like someone is paying attention?',
      options: [
        { value: 'social-media', label: 'Social media' },
        { value: 'specific-person', label: 'A specific person' },
        { value: 'nowhere', label: 'Nowhere — I sit with it' },
        { value: 'dont-know', label: "I don't know" },
        { value: 'elsewhere', label: 'Somewhere else', hasOther: true },
      ],
    },
    {
      id: 'q4',
      type: 'text',
      prompt: 'If your nervous system could speak, what would it say right now?',
      sub: "There's no wrong answer. But there is an honest one.",
      placeholder: "Be honest. This one's just for you.",
    },
    {
      id: 'q5',
      type: 'text',
      prompt: 'What would change if you felt seen — not by the world, but by yourself?',
      sub: 'This one might sting a little.',
      placeholder: 'What would be different?',
    },
  ];

  const state = {
    step: 0,
    answers: {
      q1: '',
      q2a: 5,
      q2b: 5,
      q3: '',
      q3other: '',
      q4: '',
      q5: '',
    },
    archetype: null,
    paragraph: '',
    cta: null,
    email: '',
  };

  let archetypeData = null;

  const screens = {
    hero: document.querySelector('[data-screen="hero"]'),
    questions: document.querySelector('[data-screen="questions"]'),
    email: document.querySelector('[data-screen="email"]'),
    output: document.querySelector('[data-screen="output"]'),
  };

  const els = {
    begin: document.getElementById('seen-begin'),
    back: document.getElementById('seen-back'),
    next: document.getElementById('seen-next'),
    panel: document.getElementById('seen-question-panel'),
    dots: document.querySelectorAll('.sb-seen__dot'),
    previewName: document.getElementById('seen-preview-name'),
    previewLine: document.getElementById('seen-preview-line'),
    emailForm: document.getElementById('seen-email-form'),
    emailInput: document.getElementById('seen-email'),
    emailMsg: document.getElementById('seen-email-msg'),
    mirrorBg: document.getElementById('seen-mirror-bg'),
    mirrorArchetype: document.getElementById('seen-mirror-archetype'),
    mirrorOneline: document.getElementById('seen-mirror-oneline'),
    mirrorParagraph: document.getElementById('seen-mirror-paragraph'),
    ctaLink: document.getElementById('seen-cta-link'),
    saveBtn: document.getElementById('seen-save'),
    shareBtn: document.getElementById('seen-share'),
    waitlistForm: document.getElementById('seen-waitlist-form'),
    waitlistEmail: document.getElementById('seen-waitlist-email'),
    waitlistMsg: document.getElementById('seen-waitlist-msg'),
    mirror: document.getElementById('seen-mirror'),
  };

  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      const el = screens[key];
      if (!el) return;
      const active = key === name;
      el.classList.toggle('sb-seen__screen--active', active);
      el.hidden = !active;
    });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function updateProgress() {
    els.dots.forEach(function (dot, i) {
      dot.classList.remove('sb-seen__dot--active', 'sb-seen__dot--done');
      if (i < state.step) dot.classList.add('sb-seen__dot--done');
      if (i === state.step) dot.classList.add('sb-seen__dot--active');
    });
    els.back.style.visibility = state.step === 0 ? 'hidden' : 'visible';
    els.next.textContent = state.step === QUESTIONS.length - 1 ? 'See my mirror →' : 'Next →';
  }

  function renderQuestion() {
    const q = QUESTIONS[state.step];
    updateProgress();

    let html = '<h2 class="sb-seen__q-prompt">' + escapeHtml(q.prompt) + '</h2>';
    if (q.sub) {
      html += '<p class="sb-seen__q-sub">' + escapeHtml(q.sub) + '</p>';
    }

    if (q.type === 'text') {
      const val = state.answers[q.id] || '';
      html +=
        '<textarea class="sb-seen__textarea" id="seen-field" placeholder="' +
        escapeHtml(q.placeholder || '') +
        '">' +
        escapeHtml(val) +
        '</textarea>';
    }

    if (q.type === 'sliders') {
      html +=
        '<div class="sb-seen__sliders">' +
        sliderRow('What they see', 'q2a', state.answers.q2a) +
        sliderRow('What I am', 'q2b', state.answers.q2b) +
        '<p class="sb-seen__gap">Gap: <strong id="seen-gap">' +
        Math.abs(state.answers.q2a - state.answers.q2b) +
        '</strong></p></div>';
    }

    if (q.type === 'choice') {
      html += '<div class="sb-seen__choices">';
      q.options.forEach(function (opt) {
        const selected = state.answers.q3 === opt.value;
        html +=
          '<label class="sb-seen__choice' +
          (selected ? ' sb-seen__choice--selected' : '') +
          '">' +
          '<input type="radio" name="q3" value="' +
          escapeHtml(opt.value) +
          '"' +
          (selected ? ' checked' : '') +
          '>' +
          '<span class="sb-seen__choice-label">' +
          escapeHtml(opt.label) +
          '</span></label>';
        if (opt.hasOther && selected) {
          html +=
            '<input type="text" class="sb-seen__input" id="seen-q3other" placeholder="Where?" value="' +
            escapeHtml(state.answers.q3other) +
            '">';
        }
      });
      html += '</div>';
    }

    els.panel.innerHTML = html;
    bindQuestionInputs(q);
  }

  function sliderRow(label, key, value) {
    return (
      '<div class="sb-seen__slider-row">' +
      '<label><span>' +
      escapeHtml(label) +
      '</span><output id="seen-out-' +
      key +
      '">' +
      value +
      '</output></label>' +
      '<input type="range" class="sb-seen__slider" id="seen-' +
      key +
      '" min="1" max="10" value="' +
      value +
      '">' +
      '</div>'
    );
  }

  function bindQuestionInputs(q) {
    if (q.type === 'text') {
      const field = document.getElementById('seen-field');
      field.addEventListener('input', function () {
        state.answers[q.id] = field.value;
      });
      field.focus();
    }

    if (q.type === 'sliders') {
      ['q2a', 'q2b'].forEach(function (key) {
        const slider = document.getElementById('seen-' + key);
        const out = document.getElementById('seen-out-' + key);
        slider.addEventListener('input', function () {
          state.answers[key] = parseInt(slider.value, 10);
          out.textContent = slider.value;
          document.getElementById('seen-gap').textContent = Math.abs(
            state.answers.q2a - state.answers.q2b
          );
        });
      });
    }

    if (q.type === 'choice') {
      document.querySelectorAll('input[name="q3"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
          state.answers.q3 = radio.value;
          renderQuestion();
        });
      });
      const other = document.getElementById('seen-q3other');
      if (other) {
        other.addEventListener('input', function () {
          state.answers.q3other = other.value;
        });
        other.focus();
      }
    }
  }

  function validateStep() {
    const q = QUESTIONS[state.step];
    if (q.type === 'text' && !state.answers[q.id].trim()) {
      shakePanel();
      return false;
    }
    if (q.type === 'choice' && !state.answers.q3) {
      shakePanel();
      return false;
    }
    return true;
  }

  function shakePanel() {
    els.panel.style.animation = 'none';
    void els.panel.offsetWidth;
    els.panel.style.animation = 'seenFadeUp 0.35s ease both';
  }

  function collectCurrentField() {
    const q = QUESTIONS[state.step];
    if (q.type === 'text') {
      const field = document.getElementById('seen-field');
      if (field) state.answers[q.id] = field.value.trim();
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function truncate(str, max) {
    const s = (str || '').trim();
    if (s.length <= max) return s;
    return s.slice(0, max - 1).trim() + '…';
  }

  function countKeywords(text, keywords) {
    const lower = (text || '').toLowerCase();
    let score = 0;
    keywords.forEach(function (word) {
      if (lower.includes(word)) score += 1;
    });
    return score;
  }

  function scoreArchetype() {
    const scores = {};
    archetypeData.archetypes.forEach(function (a) {
      scores[a.id] = 0;
    });

    const q1 = state.answers.q1.toLowerCase();
    if (/never|can't remember|cannot remember|don't know|dont know|long time|years|forgot|not sure|can't recall/.test(q1)) {
      scores.ghost += 3;
    }
    if (/yesterday|today|recent|last week|partner|friend|therapist|mom|dad|someone/.test(q1)) {
      scores['signal-keeper'] += 1;
      scores.anchor += 1;
    }
    if (/myself|alone|mirror|journal|write|create|build/.test(q1)) {
      scores['quiet-architect'] += 2;
      scores.witness += 1;
    }

    const gap = Math.abs(state.answers.q2a - state.answers.q2b);
    if (gap >= 5) {
      scores['quiet-architect'] += 3;
      scores['mirror-walker'] += 3;
      scores['fracture-point'] += 2;
    } else if (gap >= 3) {
      scores['mirror-walker'] += 2;
      scores['edge-walker'] += 1;
    } else if (gap <= 1) {
      scores.anchor += 2;
      scores.witness += 1;
    }

    const q3Scores = archetypeData.q3Scores[state.answers.q3] || {};
    Object.keys(q3Scores).forEach(function (id) {
      scores[id] += q3Scores[id];
    });

    archetypeData.archetypes.forEach(function (a) {
      scores[a.id] += countKeywords(state.answers.q4, a.q4Keywords) * 2;
      scores[a.id] += countKeywords(state.answers.q5, a.q5Keywords);
    });

    let bestId = 'witness';
    let bestScore = -1;
    let tied = [];

    Object.keys(scores).forEach(function (id) {
      if (scores[id] > bestScore) {
        bestScore = scores[id];
        bestId = id;
        tied = [id];
      } else if (scores[id] === bestScore) {
        tied.push(id);
      }
    });

    if (tied.length > 1) {
      let q4Best = tied[0];
      let q4BestScore = -1;
      tied.forEach(function (id) {
        const arch = archetypeData.archetypes.find(function (a) {
          return a.id === id;
        });
        const s = countKeywords(state.answers.q4, arch.q4Keywords);
        if (s > q4BestScore) {
          q4BestScore = s;
          q4Best = id;
        }
      });
      bestId = q4Best;
    }

    return archetypeData.archetypes.find(function (a) {
      return a.id === bestId;
    });
  }

  function pickCta(archetypeId) {
    const ctas = archetypeData.ctas;
    if (['quiet-architect', 'witness', 'ghost', 'mirror-walker'].includes(archetypeId)) {
      return ctas[0];
    }
    if (['fracture-point', 'edge-walker', 'echo', 'anchor'].includes(archetypeId)) {
      return ctas[1];
    }
    return ctas[0];
  }

  function buildParagraphLocal(archetype) {
    const q1bit = truncate(state.answers.q1, 90) || 'it has been a while';
    const q4bit = truncate(state.answers.q4, 110) || 'something is asking to be heard';
    const bridges = {
      'quiet-architect': 'Your system has been drafting blueprints in silence — perception running ahead of what you show.',
      'signal-keeper': 'You have been holding frequency for everyone else while your own signal went quiet.',
      'fracture-point': 'The pressure you are carrying is not weakness — it is compressed light looking for an exit.',
      ghost: 'Feeling overlooked is data, not destiny — your perception is registering absence where attention should be.',
      'mirror-walker': 'When identity is built through reflection, the self gets distorted — that is perception architecture, not personality.',
      anchor: 'Stability can become a cage when growth gets mistaken for chaos.',
      echo: 'The pattern repeating is not failure — it is your nervous system pointing at the verse you keep skipping.',
      'edge-walker': 'You have been hovering at the threshold — the gap between almost and actually is where perception shifts.',
      spark: 'High voltage without direction reads as scattered — but it is raw creative frequency waiting for a channel.',
      witness: 'Observation kept you safe — but witnessing from the outside has a cost the body eventually invoices.',
    };
    const bridge = bridges[archetype.id] || 'Your answers are showing you something precise about how you perceive.';
    return (
      'You said ' +
      q1bit +
      " — that's not a flaw, that's data. Your nervous system said: \"" +
      q4bit +
      '." ' +
      bridge +
      ' The layers go deeper than this.'
    );
  }

  async function fetchParagraph(archetype) {
    try {
      const res = await fetch('/api/seen-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: state.answers,
          archetype: { id: archetype.id, name: archetype.name, oneLiner: archetype.oneLiner },
          preview: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.paragraph) return data.paragraph;
      }
    } catch (e) {
      /* fallback below */
    }
    return buildParagraphLocal(archetype);
  }

  function showEmailGate() {
    state.archetype = scoreArchetype();
    els.previewName.textContent = state.archetype.name;
    els.previewLine.textContent = state.archetype.oneLiner;
    showScreen('email');
  }

  async function revealOutput(email) {
    state.email = email;
    state.archetype = state.archetype || scoreArchetype();
    state.cta = pickCta(state.archetype.id);
    state.paragraph = await fetchParagraph(state.archetype);

    els.mirrorBg.setAttribute('data-archetype', state.archetype.id);
    els.mirrorArchetype.textContent = state.archetype.name;
    els.mirrorOneline.textContent = state.archetype.oneLiner;
    els.mirrorParagraph.textContent = state.paragraph;
    els.ctaLink.textContent = state.cta.text + ' →';
    els.ctaLink.href = state.cta.url;
    if (els.waitlistEmail) els.waitlistEmail.value = email;

    showScreen('output');
  }

  async function submitEmail(e) {
    e.preventDefault();
    const email = els.emailInput.value.trim().toLowerCase();
    const btn = document.getElementById('seen-email-btn');
    btn.disabled = true;
    btn.textContent = '...';
    els.emailMsg.hidden = true;

    try {
      const subRes = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, source: 'seen' }),
      });
      const subData = await subRes.json();
      if (!subRes.ok) throw new Error(subData.error || 'Subscribe failed');

      await fetch('/api/seen-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          answers: state.answers,
          archetype: {
            id: state.archetype.id,
            name: state.archetype.name,
            oneLiner: state.archetype.oneLiner,
          },
        }),
      });

      await revealOutput(email);
    } catch (err) {
      els.emailMsg.textContent = err.message || 'Something went wrong. Try again.';
      els.emailMsg.className = 'sb-seen__message sb-seen__message--err';
      els.emailMsg.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Reveal my mirror →';
    }
  }

  async function submitWaitlist(e) {
    e.preventDefault();
    const email = els.waitlistEmail.value.trim().toLowerCase();
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, source: 'seen', waitlist: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      els.waitlistMsg.textContent = "You're on the list. I'll reach out when the Map is ready.";
      els.waitlistMsg.className = 'sb-seen__message sb-seen__message--ok';
      els.waitlistMsg.hidden = false;
    } catch (err) {
      els.waitlistMsg.textContent = err.message || 'Try again.';
      els.waitlistMsg.className = 'sb-seen__message sb-seen__message--err';
      els.waitlistMsg.hidden = false;
    }
  }

  async function saveMirrorImage() {
    if (typeof html2canvas !== 'function') {
      alert('Image generator still loading — try again in a moment.');
      return;
    }
    els.saveBtn.disabled = true;
    els.saveBtn.textContent = '...';
    try {
      const canvas = await html2canvas(els.mirror, {
        backgroundColor: '#0a0118',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = 'sparklebox-seen-mirror.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('Could not save image. Try a screenshot instead.');
    }
    els.saveBtn.disabled = false;
    els.saveBtn.textContent = 'Save this';
  }

  async function shareMirror() {
    if (typeof html2canvas !== 'function') {
      if (navigator.share) {
        navigator.share({ title: 'SEEN — Sparklebox', url: 'https://www.sparklebox.blog/seen/' });
      }
      return;
    }
    try {
      const canvas = await html2canvas(els.mirror, { backgroundColor: '#0a0118', scale: 2, useCORS: true });
      canvas.toBlob(async function (blob) {
        if (!blob) return;
        const file = new File([blob], 'sparklebox-seen.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My Perception Mirror — SEEN',
            text: state.archetype ? state.archetype.oneLiner : 'Try SEEN at sparklebox.blog',
            files: [file],
          });
        } else if (navigator.share) {
          await navigator.share({
            title: 'SEEN — Sparklebox',
            text: (state.archetype ? state.archetype.oneLiner + ' — ' : '') + 'https://www.sparklebox.blog/seen/',
            url: 'https://www.sparklebox.blog/seen/',
          });
        } else {
          await saveMirrorImage();
        }
      }, 'image/png');
    } catch (err) {
      await saveMirrorImage();
    }
  }

  function initStars() {
    const canvas = document.getElementById('seen-stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let w = 0;
    let h = 0;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      stars = Array.from({ length: Math.floor(w * 0.08) }, function () {
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.2 + 0.2,
          a: Math.random() * 0.3 + 0.05,
          s: Math.random() * 0.015 + 0.002,
        };
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      stars.forEach(function (star) {
        star.a += Math.sin(Date.now() * star.s) * 0.002;
        ctx.fillStyle = 'rgba(241, 245, 249, ' + Math.max(0.05, Math.min(0.35, star.a)) + ')';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  async function init() {
    try {
      const res = await fetch('/js/seen-archetypes.json');
      archetypeData = await res.json();
    } catch (e) {
      console.error('Could not load archetypes', e);
      return;
    }

    initStars();

    els.begin.addEventListener('click', function () {
      showScreen('questions');
      renderQuestion();
    });

    els.back.addEventListener('click', function () {
      if (state.step > 0) {
        collectCurrentField();
        state.step -= 1;
        renderQuestion();
      }
    });

    els.next.addEventListener('click', function () {
      collectCurrentField();
      if (!validateStep()) return;
      if (state.step < QUESTIONS.length - 1) {
        state.step += 1;
        renderQuestion();
      } else {
        showEmailGate();
      }
    });

    els.emailForm.addEventListener('submit', submitEmail);
    els.saveBtn.addEventListener('click', saveMirrorImage);
    els.shareBtn.addEventListener('click', shareMirror);
    if (els.waitlistForm) els.waitlistForm.addEventListener('submit', submitWaitlist);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
