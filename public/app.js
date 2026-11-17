const icons = {
  shield: '<path d="M12 22s7-3 7-10V5l-7-3-7 3v7c0 7 7 10 7 10Z"/><path d="m9 12 2 2 4-4"/>',
  person: '<circle cx="12" cy="7.5" r="3.5"/><path d="M4.5 21v-1.5a6 6 0 0 1 6-6h3a6 6 0 0 1 6 6V21"/>',
  users: '<circle cx="9" cy="8" r="3.25"/><path d="M2 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1m2-15a3.5 3.5 0 0 1 0 7m4 8v-1a5 5 0 0 0-3.4-4.75"/>',
  reset: '<path d="M3 12a9 9 0 1 1 2.7 6.4M3 12V6m0 6h6"/>',
  bill: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6m-6 4h6m-6 4h3"/>',
  message: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.3 0-2.6-.3-3.7-.8l-5.3 1.4 1.4-5.1a8.5 8.5 0 1 1 16.1-4Z"/><path d="M8 11.5h8m-8 3h5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2.1 2.1 0 0 0 4 0"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  back: '<path d="M20 12H5m6 6-6-6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5m-4 4v2"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7m4-7v7"/>',
  stop: '<circle cx="12" cy="12" r="9"/><path d="m6 18 12-12"/>',
  alert: '<path d="M10.3 4.5 2.8 18a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2L13.7 4.5a1.9 1.9 0 0 0-3.4 0ZM12 9v4m0 3h.01"/>',
  link: '<path d="M10 13a4 4 0 0 0 6 1l3-3a4 4 0 0 0-6-6l-1 1m2 5a4 4 0 0 0-6-1l-3 3a4 4 0 0 0 6 6l1-1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};

const app = document.querySelector('#main');
const dialog = document.querySelector('#dialog');
const announcer = document.querySelector('#announcer');
const contactToast = document.querySelector('#contact-toast');
const storageKey = 'think-twice-demo-v1';
const electricity = { name: 'Electricity bill', recipient: 'Maple City Utilities', amount: '$64.80' };
const toll = { name: 'Toll payment', recipient: 'Unverified toll collector', amount: '$47.50' };
const SMS = 'Your toll balance of $47.50 is due today. Pay by 6 PM to avoid a late fee.';
const domain = 'toll-notice.example';
const initialState = { billPaid: false, tollStatus: 'idle' };
const outcomes = {
  pending: {
    title: 'Payment paused', icon: 'pause', color: 'amber', short: 'Awaiting review',
    message: 'No money was sent. Emily, your trusted contact, was notified and will review the request.'
  },
  approved: {
    title: 'Payment approved and sent', icon: 'check', color: '', short: 'Approved',
    message: 'Emily approved the request. Your $47.50 payment was completed.'
  },
  declined: {
    title: 'Payment declined', icon: 'stop', color: 'red', short: 'Declined',
    message: 'Emily declined the request. No money was sent.'
  }
};
const risks = [
  { icon: 'person', name: 'Unknown sender', description: 'The message came from a number outside Karen’s contacts.' },
  { icon: 'link', name: 'Unverified payment link', description: 'The link’s domain does not match the demo toll agency’s official domain.' },
  { icon: 'clock', name: 'Pressure to pay today', description: 'The message gives a same-day deadline and threatens a late fee.' }
];

let state = storedState() ?? { ...initialState };
let role = location.hash === '#emily' ? 'emily' : 'karen';
let screen = 'home';
let toastDismissed = false;

function storedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && (saved.tollStatus === 'idle' || Object.hasOwn(outcomes, saved.tollStatus))) {
      return { billPaid: saved.billPaid === true, tollStatus: saved.tollStatus };
    }
  } catch {
    // The demo remains usable when browser storage is unavailable.
  }
  return null;
}

function save(patch) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // The role views can still share the current in-memory state.
  }
}

function icon(name) {
  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
}

function tile(name, color = '') {
  return `<span class="icon-tile ${color}">${icon(name)}</span>`;
}

function button(text, action, style = 'primary') {
  return `<button type="button" class="${style}" data-action="${action}">${text}</button>`;
}

function back(label, action = 'home') {
  return button(icon('back') + label, action, 'back');
}

function hero(label, heading, description, artIcon) {
  return `<section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">${label}</p>
      <h1 tabindex="-1">${heading}</h1>
      <p>${description}</p>
    </div>
    <div class="hero-art" aria-hidden="true">
      <span class="art-ring"></span><span class="art-ring"></span><span class="art-ring"></span>
      <span class="art-center">${icon(artIcon)}</span>
      <span class="art-small art-left">${icon('check')}</span>
      <span class="art-small art-right">${icon('message')}</span>
    </div>
  </section>`;
}

function taskCard(title, description, action, graphic, color = '') {
  return `<button type="button" class="task-card" data-action="${action}">
    ${tile(graphic, color)}
    <span class="task-arrow">${icon('arrow')}</span>
    <span class="task-content">
      <span class="task-title">${title}</span>
      <span class="task-description">${description}</span>
    </span>
  </button>`;
}

function notice(outcome, forContact) {
  const status = state.tollStatus;
  const title = forContact && status === 'pending' ? 'Payment paused for Karen' : outcome.title;
  const description = forContact ? `${toll.amount} · Toll payment from a text message` : outcome.message;
  const action = forContact ? 'review' : 'toll-result';
  const buttonLabel = forContact && status === 'pending' ? 'Review payment' : 'View details';
  const live = forContact && status === 'pending' ? ' role="status"' : '';
  return `<div class="notice ${status}"${live}>
    ${tile(forContact && status === 'pending' ? 'bell' : outcome.icon, outcome.color)}
    <div class="notice-copy"><h3>${title}</h3><p>${description}</p></div>
    ${button(buttonLabel, action, status === 'pending' ? 'primary' : 'secondary')}
  </div>`;
}

function karenHome() {
  const outcome = outcomes[state.tollStatus];
  return `${hero('Your payment hub', 'Hi, Karen.', 'Pay a bill or check your latest message.', 'shield')}
    <section class="section" aria-labelledby="quick-actions">
      <h2 class="section-title" id="quick-actions">Quick actions</h2>
      <div class="task-grid">
        ${taskCard(state.billPaid ? 'View electricity receipt' : 'Pay electricity bill',
          `Maple City Utilities · ${electricity.amount}${state.billPaid ? ' · Paid' : ''}`,
          state.billPaid ? 'bill-result' : 'bill', 'bill')}
        ${taskCard('Read text message', 'Unknown number · Toll balance reminder', 'message', 'message', 'blue')}
      </div>
    </section>
    ${outcome ? `<section class="section"><h2 class="section-title">Payment update</h2>${notice(outcome, false)}</section>` : ''}
    <div class="contact-strip">
      <span class="avatar" aria-hidden="true">E</span>
      <div><strong>Emily is your trusted contact</strong><p>She’ll get an alert if a payment needs review.</p></div>
    </div>`;
}

function emilyHome() {
  const outcome = outcomes[state.tollStatus];
  return `${hero('Trusted contact for Karen', 'Hi, Emily.', 'See payments that need your review.', 'users')}
    <section class="section" aria-labelledby="alerts">
      <h2 class="section-title" id="alerts">Payment alerts</h2>
      ${outcome ? notice(outcome, true) : `<div class="empty-state">
        ${tile('bell')}
        <div><h3>No payments to review</h3><p>When Think Twice pauses a payment, you’ll get an alert here.</p></div>
      </div>`}
    </section>`;
}

function transactionDetails(payment, extra = '') {
  return `<dl class="info-list">
    <div><dt>To</dt><dd>${payment.recipient}</dd></div>
    <div><dt>Amount</dt><dd class="amount">${payment.amount}</dd></div>
    ${extra}
  </dl>`;
}

function payScreen(payment, isToll) {
  return `<div class="flow">
    ${back(isToll ? 'Back to text message' : 'Back to home', isToll ? 'message' : 'home')}
    <h1 tabindex="-1">Review payment</h1>
    <p class="subtitle">Check the recipient and amount before you pay.</p>
    <section class="panel">
      <div class="panel-heading">${tile('bill')}<h2>${payment.name}</h2></div>
      ${transactionDetails(payment, isToll ? '<div><dt>Opened from</dt><dd>Text message link</dd></div>' : '<div><dt>Account</dt><dd>Electricity account ending in 0318</dd></div>')}
      ${button(`Pay ${payment.amount}`, isToll ? 'attempt-toll' : 'pay-bill', 'primary full')}
      <p class="fineprint">Demo payment</p>
    </section>
  </div>`;
}

function messageBubble(interactive) {
  return `<div class="message-bubble">${SMS}
    ${interactive ? button(domain, 'open-toll', 'message-link') : `<span class="message-domain">${domain}</span>`}
  </div>`;
}

function messageScreen() {
  return `<div class="flow">
    ${back('Back to home')}
    <h1 tabindex="-1">Text message</h1>
    <p class="subtitle">From an unknown number</p>
    <section class="panel" aria-label="Message conversation">
      <div class="panel-heading">${tile('person', 'blue')}<h2>Unknown sender</h2></div>
      <p class="message-time">Today</p>
      ${messageBubble(true)}
    </section>
  </div>`;
}

function resultScreen(payment, details) {
  return `<div class="flow">
    <section class="panel result">
      ${tile(details.icon, details.color)}
      <h1 tabindex="-1">${details.title}</h1>
      <p class="subtitle">${details.message}</p>
      ${transactionDetails(payment)}
      ${button('Back to payments', 'home', 'primary full')}
    </section>
  </div>`;
}

function reviewScreen() {
  const status = state.tollStatus;
  const outcome = outcomes[status];
  if (!outcome) return emilyHome();
  const pending = status === 'pending';
  const riskItems = risks.map((risk) => `<li>${icon(risk.icon)}<div><strong>${risk.name}</strong><p>${risk.description}</p></div></li>`).join('');
  return `<div class="flow wide">
    ${back('Back to payment alerts')}
    <h1 tabindex="-1">Review Karen’s payment</h1>
    <p class="subtitle">${pending ? 'The payment is paused while you decide.' : 'Your decision is visible on Karen’s phone.'}</p>
    <div class="decision-grid">
      <section class="panel analysis">
        <h2>AI summary</h2>
        <p>Karen received a text claiming she owed ${toll.amount} in tolls. She opened the link and tried to pay. Think Twice paused the payment before any money was sent.</p>
        <h3>Risk classification</h3>
        <span class="status-pill">${icon('alert')} High risk · Suspected toll impersonation</span>
        <h3>Why it was flagged</h3>
        <ul class="risk-list">${riskItems}</ul>
        <details class="original"><summary>View original text message</summary>${messageBubble(false)}</details>
      </section>
      <section class="panel">
        <h2>Payment details</h2>
        ${transactionDetails(toll, '<div><dt>Requested by</dt><dd>Karen</dd></div>')}
        <span class="status-pill ${status}">${icon(outcome.icon)} ${outcome.short}</span>
        ${pending ? `<div class="review-actions">
          <p>Approve only if you’ve verified the toll bill and recipient.</p>
          ${button('Decline payment', 'decline', 'danger')}
          ${button('Approve payment', 'confirm-approval', 'secondary')}
        </div>` : `<div class="review-actions"><p>${status === 'approved'
          ? 'The payment was sent and Karen can see her receipt.'
          : 'No money was sent. Karen can see that you declined the payment.'}</p></div>`}
      </section>
    </div>
  </div>`;
}

const views = {
  home: () => role === 'emily' ? emilyHome() : karenHome(),
  message: messageScreen,
  toll: () => payScreen(toll, true),
  bill: () => payScreen(electricity, false),
  'bill-result': () => resultScreen(electricity, {
    title: 'Payment complete', icon: 'check', color: '', message: 'Your electricity bill has been paid.'
  }),
  'toll-result': () => outcomes[state.tollStatus] ? resultScreen(toll, outcomes[state.tollStatus]) : karenHome(),
  review: reviewScreen
};

function render(moveFocus = false) {
  for (const name of ['karen', 'emily']) {
    const link = document.querySelector(`#role-${name}`);
    if (name === role) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  const hasAlert = state.tollStatus === 'pending';
  const contactLink = document.querySelector('#role-emily');
  contactLink.querySelector('.nav-dot').hidden = !hasAlert;
  if (hasAlert) contactLink.setAttribute('aria-label', 'Emily · Trusted contact · Payment awaiting review');
  else contactLink.removeAttribute('aria-label');

  if (!hasAlert) toastDismissed = false;
  contactToast.hidden = !hasAlert || role !== 'emily' || screen !== 'home' || toastDismissed;

  app.innerHTML = views[screen]();
  if (moveFocus) {
    app.querySelector('h1').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

function go(next) {
  if (next === 'review') toastDismissed = true;
  screen = next;
  render(true);
}

function openDialog(title, description, graphic, color, actions) {
  if (dialog.open) dialog.close();
  dialog.innerHTML = `${tile(graphic, color)}
    <h2 id="dialog-title">${title}</h2>
    <p id="dialog-description">${description}</p>
    <div class="modal-actions">${actions}</div>`;
  dialog.showModal();
  dialog.querySelector('button').focus();
}

function decide(result) {
  state = storedState() ?? state;
  if (state.tollStatus === 'pending') save({ tollStatus: result });
  if (dialog.open) dialog.close();
  go('review');
  announcer.textContent = outcomes[state.tollStatus]?.title ?? '';
}

const actions = {
  'dismiss-toast'() {
    toastDismissed = true;
    contactToast.hidden = true;
    app.querySelector('[data-action="review"]')?.focus();
  },
  reset() {
    save(initialState);
    role = 'karen';
    if (location.hash !== '#karen') history.replaceState(null, '', '#karen');
    go('home');
    announcer.textContent = 'Demo reset.';
  },
  'pay-bill'() {
    state = storedState() ?? state;
    if (!state.billPaid) save({ billPaid: true });
    go('bill-result');
  },
  'open-toll'() {
    go(state.tollStatus === 'idle' ? 'toll' : 'toll-result');
  },
  'attempt-toll'() {
    state = storedState() ?? state;
    if (state.tollStatus !== 'idle') {
      go('toll-result');
      return;
    }
    save({ tollStatus: 'pending' });
    go('toll-result');
    openDialog('We paused this payment', 'This payment may be a scam. No money was sent. We alerted Emily so she can review it.', 'pause', 'amber',
      button('OK, view payment status', 'close-dialog'));
  },
  'close-dialog'() {
    dialog.close();
  },
  'confirm-approval'() {
    openDialog('Approve this payment?', 'Approving releases Karen’s $47.50 payment to the recipient. Continue only if you’ve verified who is requesting the money.', 'alert', 'amber',
      button('Keep payment paused', 'close-dialog', 'secondary') + button('Approve and send $47.50', 'approve'));
  },
  approve() { decide('approved'); },
  decline() { decide('declined'); }
};

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('button[data-action]');
  if (!trigger) return;
  const { action } = trigger.dataset;
  if (Object.hasOwn(actions, action)) actions[action]();
  else if (Object.hasOwn(views, action)) go(action);
});

document.querySelector('.skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  app.focus();
});

document.querySelectorAll('.brand, .role-switch a').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (link.hash !== location.hash) history.pushState(null, '', link.hash);
    role = link.hash === '#emily' ? 'emily' : 'karen';
    go('home');
  });
});

window.addEventListener('hashchange', () => {
  role = location.hash === '#emily' ? 'emily' : 'karen';
  go('home');
});

window.addEventListener('storage', (event) => {
  if (event.key !== storageKey) return;
  const previous = state.tollStatus;
  state = storedState() ?? { ...initialState };
  const statusChanged = previous !== state.tollStatus;
  if (statusChanged && dialog.open) dialog.close();
  if (role === 'karen' && screen === 'toll' && state.tollStatus !== 'idle') screen = 'toll-result';
  if (state.tollStatus === 'idle' && (screen === 'review' || screen === 'toll-result')) screen = 'home';
  if (!state.billPaid && screen === 'bill-result') screen = 'home';
  render();
  if (statusChanged && state.tollStatus === 'pending' && role === 'emily') {
    announcer.textContent = 'Payment paused for Karen. Review it in Payment alerts.';
  }
});

for (const element of document.querySelectorAll('[data-icon]')) {
  element.innerHTML = icon(element.dataset.icon);
}
render();
