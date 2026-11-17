const icons = {
  shield: '<path d="M12 22s7-3 7-10V5l-7-3-7 3v7c0 7 7 10 7 10Z"/><path d="m9 12 2 2 4-4"/>',
  person: '<circle cx="12" cy="7.5" r="3.5"/><path d="M4.5 21v-1.5a6 6 0 0 1 6-6h3a6 6 0 0 1 6 6V21"/>',
  reset: '<path d="M3 12a9 9 0 1 1 2.7 6.4M3 12V6m0 6h6"/>',
  messages: '<path d="M20.5 13a3 3 0 0 1-3 3H11l-5.5 3V16a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z"/><path d="M7 9h9m-9 3.5h6"/>',
  bolt: '<path d="m13 2-8 12h6l-1 8 9-12h-6l1-8Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2.1 2.1 0 0 0 4 0"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6 6-6-6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7m4-7v7"/>',
  stop: '<circle cx="12" cy="12" r="9"/><path d="m6 18 12-12"/>',
  alert: '<path d="M10.3 4.5 2.8 18a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2L13.7 4.5a1.9 1.9 0 0 0-3.4 0ZM12 9v4m0 3h.01"/>',
  external: '<path d="M13 5h6v6m0-6-9 9m7-1v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5"/>',
  bridge: '<path d="M2 18h20M6 5v16M18 5v16M2 12c3 0 4-3 4-4 1.5 3 3.5 4 6 4s4.5-1 6-4c0 1 1 4 4 4M12 12v6"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18m-14 5h4"/>',
  signal: '<path d="M4 20v-4m5 4v-7m5 7V9m5 11V5"/>',
  wifi: '<path d="M3 9a14 14 0 0 1 18 0M6 12.5a9 9 0 0 1 12 0m-9 3.4a4 4 0 0 1 6 0M12 19h.01"/>',
  battery: '<rect x="1.5" y="6.5" width="19.5" height="11" rx="3"/><path d="M23 10v4"/><rect x="4" y="9" width="13" height="6" rx="1" fill="currentColor" stroke="none"/>'
};

const screen = document.querySelector('#screen');
const device = document.querySelector('.device');
const dialog = document.querySelector('#payment-dialog');
const announcement = document.querySelector('#announcement');
const storageKey = 'think-twice-demo-v2';
const initialState = { messageRead: false, billPaid: false, tollStatus: 'idle' };
const electricity = { provider: 'Maple City Light', amount: '$64.80' };
const toll = {
  provider: 'Bayline Tolls',
  bridge: 'Bayline Bridge',
  amount: '$12.75',
  date: 'Nov 14',
  domain: 'bayline-notice.example',
  officialDomain: 'baylinetolls.example',
  phone: '+1 (415) 555-0146',
  time: '4:55 PM'
};
const paymentUrl = `https://${toll.domain}/pay`;
const message = `Bayline Tolls: Your ${toll.date} crossing has an unpaid toll of ${toll.amount}. Pay by 6 PM today to avoid a $25 late fee.`;
const outcomes = {
  pending: { title: 'Payment paused', text: 'No money sent. Emily has been notified.', icon: 'pause' },
  approved: { title: 'Payment complete', text: 'Emily approved this payment.', icon: 'check' },
  declined: { title: 'Payment declined', text: 'Emily declined this payment. No money sent.', icon: 'stop' }
};

const lastRoute = { karen: '#karen', emily: '#emily' };
let state = readState() ?? { ...initialState };
let route = { role: 'karen', view: 'home' };

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && (saved.tollStatus === 'idle' || Object.hasOwn(outcomes, saved.tollStatus))) {
      return {
        messageRead: saved.messageRead === true,
        billPaid: saved.billPaid === true,
        tollStatus: saved.tollStatus
      };
    }
  } catch {
    // Role switching still works without browser storage.
  }
  return null;
}

function save(patch) {
  state = { ...(readState() ?? state), ...patch };
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Keep the current tab usable when browser storage is unavailable.
  }
}

function icon(name) {
  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
}

function mark(graphic, status = '') {
  return `<span class="result-mark ${status}">${icon(graphic)}</span>`;
}

function button(label, action, color = '') {
  return `<button class="action ${color}" type="button" data-action="${action}">${label}</button>`;
}

function back(href, label) {
  return `<a class="icon-button" href="${href}" aria-label="${label}">${icon('back')}</a>`;
}

function heading(title, href, label, trailing = '') {
  return `<header class="app-header">
    ${href ? back(href, label) : ''}
    <h1 tabindex="-1">${title}</h1>
    ${trailing}
  </header>`;
}

function rows(items) {
  return `<dl class="details">${items.map(([label, value, style = '']) =>
    `<div><dt>${label}</dt><dd class="${style}">${value}</dd></div>`).join('')}</dl>`;
}

function paymentMethod() {
  return `<div class="method">${icon('card')} Visa •••• 4821</div>`;
}

function homeScreen() {
  const outcome = outcomes[state.tollStatus];
  return `<section class="launcher">
    <h1 class="sr-only" tabindex="-1">Karen’s phone</h1>
    <div class="launcher-grid">
      <a class="app-link" href="#karen/messages" ${state.messageRead ? '' : 'aria-label="Messages, 1 unread"'}>
        <span class="app-tile messages">${icon('messages')}${state.messageRead ? '' : '<span class="unread" aria-hidden="true">1</span>'}</span>
        Messages
      </a>
      <a class="app-link" href="#karen/utilities"><span class="app-tile utilities">${icon('bolt')}</span>Utilities</a>
    </div>
    ${outcome ? `<a class="launcher-status" href="#karen/browser">
      ${mark(outcome.icon, state.tollStatus)}<span>${outcome.title} · ${toll.amount}</span><span class="chevron">${icon('chevron')}</span>
    </a>` : ''}
  </section>`;
}

function inboxScreen() {
  return `${heading('Messages', '#karen', 'Phone home')}
    <section class="inbox">
      <a class="thread-row" href="#karen/thread">
        <span class="contact-icon">${icon('person')}</span>
        <span class="thread-line">
          <span class="thread-meta"><strong>${toll.phone}</strong><time>${toll.time}</time></span>
          <span class="thread-preview">${message}</span>
        </span>
        ${state.messageRead ? '' : '<span class="thread-dot"><span class="sr-only">Unread</span></span>'}
      </a>
    </section>`;
}

function bubble(interactive) {
  return `<div class="bubble">
    <p>${message}</p>
    ${interactive
      ? `<a class="sms-link" href="#karen/browser">${paymentUrl} ${icon('external')}</a>`
      : `<span class="evidence-link">${paymentUrl}</span>`}
  </div>`;
}

function threadScreen() {
  return `${heading(toll.phone, '#karen/messages', 'Back to messages', `<span class="contact-icon">${icon('person')}</span>`)}
    <section class="conversation">
      <time class="timestamp">Today ${toll.time}</time>
      ${bubble(true)}
    </section>`;
}

function receipt(outcome, provider, amount, status = '') {
  return `<section class="result" aria-live="polite">
    ${mark(outcome.icon, status)}
    <h1 tabindex="-1">${outcome.title}</h1>
    ${outcome.text ? `<p>${outcome.text}</p>` : ''}
    ${rows([['To', provider], ['Amount', amount, 'amount']])}
  </section>`;
}

function browserScreen() {
  const outcome = outcomes[state.tollStatus];
  return `<header class="browser-bar" aria-label="Browser">
    ${back('#karen/thread', 'Back to text message')}
    <div class="address">${icon('lock')}<span>${toll.domain}</span></div>
  </header>
  <article class="toll-site">
    <div class="toll-brand">${icon('bridge')} ${toll.provider}</div>
    <div class="checkout">
      ${outcome
        ? receipt(outcome, toll.provider, toll.amount, state.tollStatus)
        : `<h1 tabindex="-1">Pay toll</h1>
          <div class="card">${rows([
            ['Crossing', toll.bridge],
            ['Trip date', toll.date],
            ['Total due', toll.amount, 'amount']
          ])}</div>
          ${paymentMethod()}
          ${button(`Pay ${toll.amount}`, 'pay-toll', 'blue')}`}
    </div>
  </article>`;
}

function utilitiesScreen() {
  return `${heading(electricity.provider, '#karen', 'Phone home')}
    <section class="billing">
      ${state.billPaid
        ? receipt({ title: 'Payment complete', icon: 'check' }, electricity.provider, electricity.amount)
        : `<h1 tabindex="-1">Electricity bill</h1>
          <div class="card">${rows([
            ['Billing period', 'Oct 16 – Nov 15'],
            ['Due date', 'Nov 24'],
            ['Amount due', electricity.amount, 'amount']
          ])}</div>
          ${paymentMethod()}
          ${button(`Pay ${electricity.amount}`, 'pay-bill')}`}
    </section>`;
}

function alertsScreen() {
  const status = state.tollStatus;
  const outcome = outcomes[status];
  return `${heading('Alerts')}
    <section class="alerts">
      ${outcome ? `<article class="alert-card ${status}">
        ${mark(status === 'pending' ? 'bell' : outcome.icon, status)}
        <div class="alert-copy">
          <strong>${status === 'pending' ? 'Karen’s payment was paused' : outcome.title}</strong>
          <p>${toll.amount} · ${toll.provider}</p>
          <a class="action ${status === 'pending' ? '' : 'outline'}" href="#emily/review">${status === 'pending' ? 'Review payment' : 'View payment'}</a>
        </div>
      </article>` : `<div class="empty">${icon('bell')} No alerts</div>`}
    </section>`;
}

function reviewScreen() {
  const status = state.tollStatus;
  const outcome = outcomes[status];
  if (!outcome) return alertsScreen();

  return `${heading('Payment review', '#emily', 'Back to alerts')}
    <article class="review">
      <div class="card">${rows([['From', 'Karen'], ['To', toll.provider], ['Amount', toll.amount, 'amount'], ['Status', outcome.title]])}</div>
      <section class="card">
        <h2>AI summary</h2>
        <p>Karen tried to pay a toll using a link she received by text.</p>
      </section>
      <section class="card">
        <h2>Risk classification</h2>
        <div class="risk-class">${icon('alert')} High risk · Suspected toll impersonation</div>
        <ul class="risks">
          <li>${toll.phone} is outside Karen’s contacts.</li>
          <li>The link uses <code>${toll.domain}</code>. The agency uses <code>${toll.officialDomain}</code>.</li>
          <li>The text demands payment by 6 PM and threatens a $25 late fee.</li>
        </ul>
        <details class="original"><summary>Original text message</summary>${bubble(false)}</details>
      </section>
      ${status === 'pending' ? `<div class="review-actions">
        ${button('Decline', 'decline', 'danger')}
        ${button('Approve', 'confirm-approval', 'outline')}
      </div>` : ''}
    </article>`;
}

const views = {
  karen: { home: homeScreen, messages: inboxScreen, thread: threadScreen, browser: browserScreen, utilities: utilitiesScreen },
  emily: { home: alertsScreen, review: reviewScreen }
};

function render({ focus = false, resetScroll = false } = {}) {
  const { role, view } = route;
  device.dataset.surface = role === 'karen' && view === 'home' ? 'launcher' : view;
  document.querySelector('#home-indicator').href = `#${role}`;
  for (const name of ['karen', 'emily']) {
    const link = document.querySelector(`#role-${name}`);
    link.href = lastRoute[name];
    if (name === role) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  const emilyLink = document.querySelector('#role-emily');
  const pending = state.tollStatus === 'pending';
  emilyLink.querySelector('.role-dot').hidden = !pending;
  if (pending) emilyLink.setAttribute('aria-label', 'Emily, payment awaiting review');
  else emilyLink.removeAttribute('aria-label');

  const textWasOpen = screen.querySelector('.original')?.open;
  screen.innerHTML = views[role][view]();
  if (!resetScroll && textWasOpen) screen.querySelector('.original')?.setAttribute('open', '');
  if (resetScroll) screen.scrollTop = 0;
  if (focus) {
    const target = screen.querySelector(route.view === 'utilities' ? '.billing h1' : 'h1');
    target?.focus({ preventScroll: true });
  }
}

function applyRoute(focus) {
  if (dialog.open) dialog.close();
  const [name, next] = location.hash.slice(1).split('/');
  const role = name === 'emily' ? 'emily' : 'karen';
  let view = next && Object.hasOwn(views[role], next) ? next : 'home';
  if (role === 'emily' && view === 'review' && state.tollStatus === 'idle') view = 'home';
  if (role === 'karen' && view === 'thread' && !state.messageRead) save({ messageRead: true });
  route = { role, view };
  lastRoute[role] = view === 'home' ? `#${role}` : `#${role}/${view}`;
  render({ focus, resetScroll: true });
}

function openDialog(title, messageText, graphic, actionsHtml) {
  dialog.innerHTML = `${mark(graphic, 'pending')}<h2 id="dialog-title">${title}</h2>
    <p id="dialog-message">${messageText}</p><div class="dialog-actions">${actionsHtml}</div>`;
  dialog.showModal();
  dialog.querySelector('button').focus();
}

function decide(status) {
  state = readState() ?? state;
  if (state.tollStatus === 'pending') save({ tollStatus: status });
  if (dialog.open) dialog.close();
  render({ focus: true, resetScroll: true });
  announcement.textContent = outcomes[state.tollStatus]?.title ?? '';
}

const actions = {
  reset() {
    save(initialState);
    lastRoute.emily = '#emily';
    history.replaceState(null, '', '#karen');
    applyRoute(true);
    announcement.textContent = 'Demo reset.';
  },
  'pay-bill'() {
    save({ billPaid: true });
    render({ focus: true });
  },
  'pay-toll'() {
    state = readState() ?? state;
    if (state.tollStatus !== 'idle') {
      render({ focus: true });
      return;
    }
    save({ tollStatus: 'pending' });
    render();
    openDialog('Payment paused', 'Possible scam. No money sent. Emily has been notified.', 'shield', button('OK', 'close-dialog'));
  },
  'close-dialog'() { dialog.close(); },
  'confirm-approval'() {
    openDialog(`Send ${toll.amount}?`, `This releases Karen’s payment to ${toll.provider}.`, 'alert',
      button('Cancel', 'close-dialog', 'outline') + button(`Send ${toll.amount}`, 'approve'));
  },
  approve() { decide('approved'); },
  decline() { decide('declined'); }
};

document.addEventListener('click', (event) => {
  const action = event.target.closest('button[data-action]')?.dataset.action;
  if (Object.hasOwn(actions, action)) actions[action]();
});

dialog.addEventListener('close', () => {
  if (!dialog.contains(document.activeElement) && document.activeElement !== document.body) return;
  const target = route.role === 'emily'
    ? screen.querySelector('[data-action="confirm-approval"]') ?? screen.querySelector('h1')
    : screen.querySelector('.result h1');
  target?.focus({ preventScroll: true });
});

window.addEventListener('hashchange', () => applyRoute(true));
window.addEventListener('storage', (event) => {
  if (event.key !== storageKey) return;
  const previous = state;
  state = readState() ?? { ...initialState };
  if (state.tollStatus !== previous.tollStatus) {
    if (dialog.open) dialog.close();
    if (route.role === 'emily' && route.view === 'review' && state.tollStatus === 'idle') {
      history.replaceState(null, '', '#emily');
      applyRoute(false);
    } else {
      render();
    }
    if (route.role === 'emily' && state.tollStatus === 'pending') {
      announcement.textContent = 'Karen’s payment was paused.';
    }
  } else if (route.role === 'karen') {
    render();
  }
});

for (const element of document.querySelectorAll('[data-icon]')) {
  element.innerHTML = icon(element.dataset.icon);
}
applyRoute(false);
