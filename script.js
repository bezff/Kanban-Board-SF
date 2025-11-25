import Sortable from 'sortablejs';

document.addEventListener('DOMContentLoaded', () => {
    initDnD();
    initAdding();
    initFilters();
});

// Настройка Drag-and-Drop
function initDnD() {
    const columns = document.querySelectorAll('.task-list');
    columns.forEach(column => {
        new Sortable(column, {
            group: 'kanban',
            animation: 150,
            ghostClass: 'sortable-ghost',
        });
    });
}

// Логика добавления задач
function initAdding() {
    const addBtn = document.getElementById('addBtn');
    const taskInput = document.getElementById('taskInput');
    const prioritySelect = document.getElementById('prioritySelect');

    const addTask = () => {
        const text = taskInput.value.trim();
        const priority = prioritySelect.value;

        if (text) {
            // По умолчанию добавляем в первую колонку "todo"
            createTaskElement(text, priority, 'todo');
            taskInput.value = ''; // Очистка поля
            taskInput.focus();
        }
    };

    addBtn.addEventListener('click', addTask);
    
    // Добавление по Enter
    taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addTask();
    });
}

// Создание DOM элемента задачи
function createTaskElement(text, priority, status) {
    // Находим нужную колонку по ID (в HTML id колонок совпадают со статусами)
    const column = document.getElementById(status);
    
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('data-priority', priority);
    
    // Тег приоритета
    const badge = document.createElement('div');
    badge.className = `priority-tag p-${priority}`;
    
    // Текст задачи
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = text;
    textSpan.addEventListener('dblclick', () => enableEditing(textSpan));

    // Кнопка удаления
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;'; // Символ крестика
    deleteBtn.title = 'Удалить';
    
    deleteBtn.addEventListener('click', () => {
        // Простая анимация перед удалением
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => card.remove(), 200);
    });

    // Сборка карточки
    card.appendChild(badge);
    card.appendChild(deleteBtn);
    card.appendChild(textSpan);
    
    // Добавляем в начало списка
    column.prepend(card);
}

// Редактирование текста
function enableEditing(element) {
    const currentText = element.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = currentText;

    element.replaceWith(input);
    input.focus();

    const save = () => {
        const newText = input.value.trim() || currentText;
        const newSpan = document.createElement('span');
        newSpan.className = 'task-text';
        newSpan.textContent = newText;
        newSpan.addEventListener('dblclick', () => enableEditing(newSpan));
        input.replaceWith(newSpan);
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') save();
    });
}

// Фильтрация
function initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI переключение кнопок
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const priority = btn.dataset.priority;
            const cards = document.querySelectorAll('.task-card');

            // Логика скрытия
            cards.forEach(card => {
                if (priority === 'all' || card.dataset.priority === priority) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}