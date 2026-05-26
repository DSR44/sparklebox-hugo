function embodyArchetype(archetype) {
  const card = event.target.closest('.archetype-card');
  if (card) {
    card.style.borderColor = 'var(--portal-accent)';
    card.style.boxShadow = '0 0 32px var(--portal-accent-soft)';
  }

  const messages = {
    ignisia: 'You embody Ignisia — the spark of becoming. Feel gentle transformation awakening within.',
    pyrope: 'You embody Pyrope — the blaze of creation. Feel passionate fire igniting your purpose.',
    default: 'You have chosen your archetype. Embody the frequency and carry it forward.'
  };

  const message = messages[archetype] || messages.default;
  const toast = document.createElement('div');
  toast.className = 'sb-portal-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.35s ease';
    setTimeout(() => toast.remove(), 350);
    if (card) {
      card.style.borderColor = '';
      card.style.boxShadow = '';
    }
  }, 3500);
}
