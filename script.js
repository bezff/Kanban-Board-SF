import Sortable from 'sortablejs';

// Глобальное состояние
let state = {
    boards: [],
    activeBoardId: null
};

// Загрузка приложения
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderBoardsList();
    
    // Если есть доски, выбираем первую активную
    if (state.activeBoardId) {
        renderBoard(state.activeBoardId);
    } else {
        showEmptyState();
    }

    initEvents();
    initDnD();
});

// --- Управление данными (State & LocalStorage) ---

function loadState() {
    const savedData = localStorage.getItem('kanbanData');
    if (savedData) {
        state = JSON.parse(savedData);
    }
}

function saveState() {
    localStorage.setItem('kanbanData', JSON.stringify(state));
}

function createBoard(name) {
    const newBoard = {
        id: Date.now(), // Уникальный ID
        name: name,
        tasks: []
    };
    state.boards.push(newBoard);
    state.activeBoardId = newBoard.id;
    saveState();
    renderBoardsList();
    renderBoard(newBoard.id);
}

function deleteBoard(boardId) {
    state.boards = state.boards.filter(b => b.id !== boardId);
    state.activeBoardId = state.boards.length > 0 ? state.boards[0].id : null;
    saveState();
    renderBoardsList();
    
    if (state.activeBoardId) {
        renderBoard(state.activeBoardId);
    } else {
        showEmptyState();
    }
}

function addTask(text, priority) {
    const board = state.boards.find(b => b.id === state.activeBoardId);
    if (board) {
        const newTask = {
            id: Date.now(), // уникальный id задачи
            text,
            priority,
            status: 'todo'
        };
        board.tasks.push(newTask);
        saveState();
        renderBoard(state.activeBoardId);
    }
}

function deleteTask(taskId) {
    const board = state.boards.find(b => b.id === state.activeBoardId);
    if (board) {
        board.tasks = board.tasks.filter(t => t.id !== taskId);
        saveState();
        renderBoard(state.activeBoardId);
    }
}

function updateTaskStatus(taskId, newStatus) {
    const board = state.boards.find(b => b.id === state.activeBoardId);
    const task = board.tasks.find(t => t.id == taskId); // == т.к. DOM атрибут строка
    if (task) {
        task.status = newStatus;
        saveState();
    }
}

function updateTaskText(taskId, newText) {
    const board = state.boards.find(b => b.id === state.activeBoardId);
    const task = board.tasks.find(t => t.id == taskId);
    if (task) {
        task.text = newText;
        saveState();
    }
}

// --- Рендеринг UI ---

function renderBoardsList() {
    const list = document.getElementById('boardList');
    list.innerHTML = '';
    
    state.boards.forEach(board => {
        const li = document.createElement('li');
        li.className = `board-item ${board.id === state.activeBoardId ? 'active' : ''}`;
        li.textContent = board.name;
        li.addEventListener('click', () => {
            state.activeBoardId = board.id;
            saveState();
            renderBoardsList(); // Обновить подсветку
            renderBoard(board.id);
        });
        list.appendChild(li);
    });
}

function renderBoard(boardId) {
    const board = state.boards.find(b => b.id === boardId);
    if (!board) return;

    // Показываем интерфейс доски
    document.getElementById('boardTitle').textContent = board.name;
    document.getElementById('deleteBoardBtn').classList.remove('hidden');
    document.getElementById('filtersBlock').classList.remove('hidden');
    document.getElementById('controlsBlock').classList.remove('hidden');
    document.getElementById('boardContainer').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');

    // Очищаем колонки перед отрисовкой
    document.querySelectorAll('.task-list').forEach(el => el.innerHTML = '');

    // Рендерим задачи
    board.tasks.forEach(task => {
        createTaskElement(task);
    });
}

function showEmptyState() {
    document.getElementById('boardTitle').textContent = 'Канбан Доска';
    document.getElementById('deleteBoardBtn').classList.add('hidden');
    document.getElementById('filtersBlock').classList.add('hidden');
    document.getElementById('controlsBlock').classList.add('hidden');
    document.getElementById('boardContainer').classList.add('hidden');
    document.getElementById('emptyState').classList.remove('hidden');
}

function createTaskElement(task) {
    const column = document.getElementById(task.status);
    
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('data-id', task.id); // Важно для DnD и удаления
    card.setAttribute('data-priority', task.priority);
    
    if (isFilteredOut(task.priority)) card.classList.add('hidden');

    const badge = document.createElement('div');
    badge.className = `priority-tag p-${task.priority}`;
    
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;
    textSpan.addEventListener('dblclick', () => enableEditing(textSpan, task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-task-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.onclick = () => confirmDeleteTask(card, task.id);

    card.appendChild(badge);
    card.appendChild(deleteBtn);
    card.appendChild(textSpan);
    
    column.appendChild(card);
}

// --- Вспомогательные функции ---

function isFilteredOut(priority) {
    const activeFilter = document.querySelector('.filter-btn.active');
    if (!activeFilter) return false;
    const filterValue = activeFilter.dataset.priority;
    return filterValue !== 'all' && filterValue !== priority;
}

function enableEditing(element, taskId) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = element.textContent;
    
    element.replaceWith(input);
    input.focus();

    const save = () => {
        const val = input.value.trim();
        if (val) {
            updateTaskText(taskId, val);
            const newSpan = document.createElement('span');
            newSpan.className = 'task-text';
            newSpan.textContent = val;
            newSpan.addEventListener('dblclick', () => enableEditing(newSpan, taskId));
            input.replaceWith(newSpan);
        }
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
}

function confirmDeleteTask(card, taskId) {
    card.style.opacity = '0';
    setTimeout(() => {
        deleteTask(taskId);
    }, 200);
}

// --- Инициализация событий и библиотек ---

function initEvents() {
    // Добавление доски
    document.getElementById('addBoardBtn').addEventListener('click', () => {
        const name = prompt('Введите название новой доски:');
        if (name) createBoard(name);
    });

    // Удаление доски
    document.getElementById('deleteBoardBtn').addEventListener('click', () => {
        if (confirm('Удалить текущую доску?')) {
            deleteBoard(state.activeBoardId);
        }
    });

    // Добавление задачи
    const addTaskHandler = () => {
        const input = document.getElementById('taskInput');
        const priority = document.getElementById('prioritySelect').value;
        if (input.value.trim()) {
            addTask(input.value.trim(), priority);
            input.value = '';
            input.focus();
        }
    };
    
    document.getElementById('addTaskBtn').addEventListener('click', addTaskHandler);
    document.getElementById('taskInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addTaskHandler();
    });

    // Фильтры
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderBoard(state.activeBoardId); // Перерисовать с учетом фильтра
        });
    });
}

function initDnD() {
    const columns = document.querySelectorAll('.task-list');
    columns.forEach(column => {
        new Sortable(column, {
            group: 'kanban',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: (evt) => {
                const itemEl = evt.item;
                const newStatus = evt.to.dataset.status;
                const taskId = itemEl.dataset.id;
                
                // Обновляем статус в данных
                updateTaskStatus(taskId, newStatus);
            }
        });
    });
}