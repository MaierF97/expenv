const STORAGE_KEY = 'nikolaus-booking-mvp-v1';
const DATE_OPTIONS = ['2026-12-05', '2026-12-06'];

const defaultState = {
  santaProfiles: [
    {
      id: 'santa-1',
      name: 'Nikolaus Josef',
      active: true,
      days: ['2026-12-05', '2026-12-06'],
      times: ['17:00', '17:30', '18:00', '18:30']
    },
    {
      id: 'santa-2',
      name: 'Nikolaus Peter',
      active: true,
      days: ['2026-12-05', '2026-12-06'],
      times: ['16:30', '17:00', '17:30']
    }
  ],
  bookings: [
    {
      id: 'b-1001',
      parentName: 'Anna & Tobias Weber',
      email: 'anna.weber@example.de',
      address: 'Musterstraße 12, 85521 Ottobrunn',
      familyCount: 3,
      date: '2026-12-05',
      time: '17:00',
      santaId: 'santa-1',
      santaName: 'Nikolaus Josef',
      status: 'confirmed',
      cancelToken: 'cancel-1001',
      visitToken: 'visit-1001',
      createdAt: '2026-09-15T09:00:00.000Z'
    }
  ],
  visitEntries: [
    {
      id: 'v-1001',
      bookingId: 'b-1001',
      message: 'Ich wünsche mir ein Buch und ein schönes Weihnachtsfest.',
      note: 'Bitte schaut bitte auch auf unsere Katze.',
      submittedAt: '2026-09-15T09:15:00.000Z'
    }
  ]
};

const state = loadState();

const navButtons = [...document.querySelectorAll('.nav-item')];
const panels = [...document.querySelectorAll('.panel')];
const bookingForm = document.querySelector('#booking-form');
const bookingDateSelect = document.querySelector('#booking-date');
const bookingSantaSelect = document.querySelector('#booking-santa');
const bookingTimeSelect = document.querySelector('#booking-time');
const bookingSuccessBox = document.querySelector('#booking-success');
const santaForm = document.querySelector('#santa-form');
const santaList = document.querySelector('#santa-list');
const bookingTable = document.querySelector('#booking-table');
const visitTokenInput = document.querySelector('#visit-token');
const visitTokenButton = document.querySelector('#visit-token-btn');
const visitForm = document.querySelector('#visit-form');
const visitSuccess = document.querySelector('#visit-success');
const resetDataButton = document.querySelector('#reset-data');

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : structuredClone(defaultState);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function randomToken(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function openPanel(target) {
  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${target}`);
  });

  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.panel === target);
  });
}

function renderDateOptions() {
  bookingDateSelect.innerHTML = DATE_OPTIONS.map(
    (date) => `<option value="${date}">${formatDate(date)}</option>`
  ).join('');
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  }).format(date);
}

function renderSantaOptions() {
  const selected = bookingSantaSelect.value || state.santaProfiles[0]?.id || '';
  bookingSantaSelect.innerHTML = state.santaProfiles
    .filter((profile) => profile.active)
    .map((profile) => `<option value="${profile.id}">${profile.name}</option>`)
    .join('');

  if (selected && state.santaProfiles.some((profile) => profile.id === selected)) {
    bookingSantaSelect.value = selected;
  }

  renderTimeOptions();
}

function renderTimeOptions() {
  const date = bookingDateSelect.value;
  const santaId = bookingSantaSelect.value;
  const santa = state.santaProfiles.find((profile) => profile.id === santaId);

  if (!santa) {
    bookingTimeSelect.innerHTML = '<option value="">Keine Verfügbarkeit</option>';
    return;
  }

  const usedTimes = state.bookings
    .filter((booking) => booking.date === date && booking.santaId === santaId && booking.status !== 'cancelled')
    .map((booking) => booking.time);

  const available = santa.times.filter((time) => !usedTimes.includes(time));

  bookingTimeSelect.innerHTML = available.length
    ? available.map((time) => `<option value="${time}">${time}</option>`).join('')
    : '<option value="">Keine freien Termine</option>';
}

function renderSantaList() {
  santaList.innerHTML = state.santaProfiles
    .map(
      (profile) => `
        <li class="list-item">
          <div>
            <strong>${profile.name}</strong><br />
            <small>${profile.days.join(', ')}</small>
          </div>
          <button type="button" class="small-btn" data-delete-santa="${profile.id}">Entfernen</button>
        </li>
      `
    )
    .join('');
}

function renderBookingTable() {
  bookingTable.innerHTML = state.bookings
    .map((booking) => `
      <tr>
        <td>
          <strong>${booking.parentName}</strong><br />
          <small>${booking.familyCount} Person(en)</small>
        </td>
        <td>${formatDate(booking.date)}<br /><small>${booking.time}</small></td>
        <td>${booking.santaName}</td>
        <td><span class="badge ${booking.status}">${booking.status}</span></td>
        <td>
          <button class="small-btn" type="button" data-cancel-booking="${booking.id}">Stornieren</button>
        </td>
      </tr>
    `)
    .join('');

  document.querySelectorAll('[data-cancel-booking]').forEach((button) => {
    button.addEventListener('click', () => {
      const bookingId = button.dataset.cancelBooking;
      const booking = state.bookings.find((entry) => entry.id === bookingId);
      if (!booking) return;
      booking.status = 'cancelled';
      saveState();
      renderDashboard();
    });
  });
}

function renderDashboard() {
  const total = state.bookings.length;
  const confirmed = state.bookings.filter((booking) => booking.status === 'confirmed').length;
  const cancelled = state.bookings.filter((booking) => booking.status === 'cancelled').length;

  document.querySelector('#stat-total').textContent = total;
  document.querySelector('#stat-confirmed').textContent = confirmed;
  document.querySelector('#stat-cancelled').textContent = cancelled;

  renderBookingTable();
}

function handleBookingSubmit(event) {
  event.preventDefault();

  const date = bookingDateSelect.value;
  const santaId = bookingSantaSelect.value;
  const time = bookingTimeSelect.value;
  const parentName = document.querySelector('#booking-parent-name').value.trim();
  const email = document.querySelector('#booking-email').value.trim();
  const address = document.querySelector('#booking-address').value.trim();
  const familyCount = Number(document.querySelector('#booking-family-count').value || 1);

  if (!date || !santaId || !time || !parentName || !email || !address) {
    alert('Bitte fülle alle Felder aus.');
    return;
  }

  const santa = state.santaProfiles.find((profile) => profile.id === santaId);
  const booking = {
    id: randomToken('booking'),
    parentName,
    email,
    address,
    familyCount,
    date,
    time,
    santaId,
    santaName: santa.name,
    status: 'confirmed',
    cancelToken: randomToken('cancel'),
    visitToken: randomToken('visit'),
    createdAt: new Date().toISOString()
  };

  state.bookings.push(booking);
  saveState();
  renderDashboard();
  renderTimeOptions();

  const emailPreview = `
    <strong>Bestätigung versendet an ${email}</strong><br />
    Termin: ${formatDate(date)} um ${time}<br />
    Nikolaus: ${santa.name}<br />
    Stornieren: /?cancel=${booking.cancelToken}<br />
    Besuchsseite: /?visit=${booking.visitToken}
  `;

  bookingSuccessBox.innerHTML = emailPreview;
  bookingSuccessBox.classList.remove('hidden');
  bookingForm.reset();
  document.querySelector('#booking-family-count').value = '1';
}

function handleSantaSubmit(event) {
  event.preventDefault();

  const santaName = document.querySelector('#santa-name').value.trim();
  const selectedDays = [...document.querySelectorAll('input[name="santa-days"]:checked')].map((input) => input.value);
  const rawTimes = document.querySelector('#santa-times').value.split(',').map((value) => value.trim()).filter(Boolean);

  if (!santaName || !selectedDays.length || !rawTimes.length) {
    alert('Bitte Name, Tage und Zeiten ausfüllen.');
    return;
  }

  state.santaProfiles.push({
    id: randomToken('santa'),
    name: santaName,
    active: true,
    days: selectedDays,
    times: rawTimes
  });

  saveState();
  renderSantaOptions();
  renderSantaList();
  santaForm.reset();
  document.querySelector('input[name="santa-days"][value="2026-12-05"]').checked = true;
  document.querySelector('input[name="santa-days"][value="2026-12-06"]').checked = true;
  document.querySelector('#santa-times').value = '17:00,17:30,18:00,18:30';
}

function handleSantaDelete(santaId) {
  state.santaProfiles = state.santaProfiles.filter((profile) => profile.id !== santaId);
  saveState();
  renderSantaOptions();
  renderSantaList();
}

function initVisitTokenLookup() {
  const params = new URLSearchParams(window.location.search);
  const visitToken = params.get('visit');
  const cancelToken = params.get('cancel');

  if (cancelToken) {
    const booking = state.bookings.find((entry) => entry.cancelToken === cancelToken);
    if (booking) {
      booking.status = 'cancelled';
      saveState();
      renderDashboard();
      visitSuccess.innerHTML = `<strong>Der Termin wurde storniert.</strong><br />Für ${booking.parentName} wurde der Termin erfolgreich aufgehoben.`;
      visitSuccess.classList.remove('hidden');
    }
  }

  if (visitToken) {
    const booking = state.bookings.find((entry) => entry.visitToken === visitToken);
    if (booking) {
      visitForm.classList.remove('hidden');
      visitTokenInput.value = visitToken;
      visitForm.dataset.bookingId = booking.id;
      visitSuccess.classList.add('hidden');
      return;
    }
  }

  visitForm.classList.add('hidden');
}

function handleVisitSubmit(event) {
  event.preventDefault();
  const bookingId = visitForm.dataset.bookingId;
  const message = document.querySelector('#visit-message').value.trim();
  const note = document.querySelector('#visit-note').value.trim();

  if (!bookingId || !message) {
    alert('Bitte Nachricht eingeben.');
    return;
  }

  state.visitEntries.push({
    id: randomToken('visit-entry'),
    bookingId,
    message,
    note,
    submittedAt: new Date().toISOString()
  });

  const booking = state.bookings.find((entry) => entry.id === bookingId);
  if (booking) {
    booking.status = 'visited';
  }

  saveState();
  renderDashboard();
  visitSuccess.innerHTML = '<strong>Vielen Dank!</strong><br />Der Text wurde an das Team übermittelt.';
  visitSuccess.classList.remove('hidden');
  visitForm.reset();
  visitForm.classList.add('hidden');
}

function resetAppData() {
  localStorage.removeItem(STORAGE_KEY);
  const fresh = structuredClone(defaultState);
  Object.assign(state, fresh);
  saveState();
  renderAll();
}

function renderAll() {
  renderDateOptions();
  renderSantaOptions();
  renderSantaList();
  renderDashboard();
  initVisitTokenLookup();
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => openPanel(button.dataset.panel));
});

bookingDateSelect.addEventListener('change', renderTimeOptions);
bookingSantaSelect.addEventListener('change', renderTimeOptions);
bookingForm.addEventListener('submit', handleBookingSubmit);

santaForm.addEventListener('submit', handleSantaSubmit);
santaList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-santa]');
  if (!button) return;
  handleSantaDelete(button.dataset.deleteSanta);
});

visitTokenButton.addEventListener('click', () => {
  const token = visitTokenInput.value.trim();
  const booking = state.bookings.find((entry) => entry.visitToken === token);

  if (!booking) {
    alert('Token nicht gefunden');
    return;
  }

  visitForm.classList.remove('hidden');
  visitForm.dataset.bookingId = booking.id;
  visitSuccess.classList.add('hidden');
});

visitForm.addEventListener('submit', handleVisitSubmit);
resetDataButton.addEventListener('click', resetAppData);

renderAll();
