const todoList = document.querySelector('#todo-list');
const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const resetButton = document.querySelector('#reset');
const taskCount = document.querySelector('#task-count');
const doneCount = document.querySelector('#done-count');
const taskSummary = document.querySelector('#task-summary');
const clock = document.querySelector('#clock');

let tasks = [
  { id: 1, text: 'Design starten', done: false },
  { id: 2, text: 'Datenmodell planen', done: true },
  { id: 3, text: 'Ersten Test bauen', done: false },
];

function renderTime() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderTasks() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.done).length;

  taskCount.textContent = String(total);
  doneCount.textContent = String(completed);
  taskSummary.textContent = `${total} ${total === 1 ? 'Eintrag' : 'Einträge'}`;

  todoList.innerHTML = tasks
    .map(
      (task) => `
        <li class="todo-item ${task.done ? 'done' : ''}">
          <label class="todo-check">
            <input type="checkbox" ${task.done ? 'checked' : ''} data-id="${task.id}" />
            <span>${task.text}</span>
          </label>
          <button class="delete-btn" type="button" data-delete-id="${task.id}" aria-label="Aufgabe löschen">×</button>
        </li>
      `
    )
    .join('');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    input.focus();
    return;
  }

  tasks.unshift({
    id: Date.now(),
    text,
    done: false,
  });

  input.value = '';
  input.focus();
  renderTasks();
});

todoList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-delete-id]');

  if (deleteButton) {
    const id = Number(deleteButton.dataset.deleteId);
    tasks = tasks.filter((task) => task.id !== id);
    renderTasks();
    return;
  }
});

todoList.addEventListener('change', (event) => {
  const checkbox = event.target.closest('input[type="checkbox"]');

  if (!checkbox) return;

  const id = Number(checkbox.dataset.id);
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, done: checkbox.checked } : task
  );
  renderTasks();
});

resetButton.addEventListener('click', () => {
  tasks = [
    { id: 1, text: 'Design starten', done: false },
    { id: 2, text: 'Datenmodell planen', done: true },
    { id: 3, text: 'Ersten Test bauen', done: false },
  ];
  renderTasks();
});

renderTime();
setInterval(renderTime, 1000 * 30);
renderTasks();
