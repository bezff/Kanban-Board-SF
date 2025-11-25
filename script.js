// Импортируем SortableJS (если используем Vite/npm)
// Если используете CDN в html, закомментируйте эту строку
import Sortable from 'sortablejs';

// Стартовые данные
const initialTasks = [
    { id: 1, text: 'Сверстать макет', priority: 'high', status: 'todo' },
    { id: 2, text: 'Настроить Vite', priority: 'low', status: 'todo' },
    { id: 3, text: 'Изучить SortableJS', priority: 'medium', status: 'in-progress' },
    { id: 4, text: 'Залить на GitHub', priority: 'high', status: 'done' },
];

document.addEventListener('DOMContentLoaded', () => {
    initBoard();
    initFilters();
});

function initBoard() {
    // Рендерим задачи
    initialTasks.forEach(task => {
        createTaskElement(task);
    });

    // Инициализируем Drag-and-Drop для каждой колонки
    const columns = document.querySelectorAll('.task-list');
    columns.forEach(column => {
        new Sortable(column, {
            group: 'kanban', // Позволяет перетаскивать между списками с одинаковой группой
            animation: 150,
            ghostClass: 'sortable-ghost', // Класс для призрака (место сброса)
            onEnd: (evt) => {
                // Здесь можно добавить логику сохранения нового статуса
                console.log(`Задача перемещена в ${evt.to.dataset.status}`);
            }
        });
    });
}

// Создание DOM-элемента задачи
function createTaskElement(task) {
    const column = document.querySelector(`.task-list[data-status="${task.status}"]`);
    
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('data-priority', task.priority);
    card.setAttribute('draggable', 'true');

    // Цветная полоска приоритета
    const badge = document.createElement('div');
    badge.className = `priority-tag p-${task.priority}`;
    
    // Текст задачи
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;

    // Обработчик двойного клика для редактирования
    textSpan.addEventListener('dblclick', () => enableEditing(textSpan));

    card.appendChild(badge);
    card.appendChild(textSpan);
    column.appendChild(card);
}

// Функция редактирования
function enableEditing(element) {
    const currentText = element.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = currentText;

    // Замена текста на инпут
    element.replaceWith(input);
    input.focus();

    // Сохранение при потере фокуса или нажатии Enter
    const save = () => {
        const newText = input.value.trim() || currentText; // Не разрешаем пустые
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

// Логика фильтрации
function initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.getElementsByClassName('task-card');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Убираем активный класс у всех
            buttons.forEach(b => b.classList.remove('active'));
            // Добавляем нажатой кнопке
            btn.classList.add('active');

            const priority = btn.dataset.priority;

            // Фильтруем карточки
            Array.from(cards).forEach(card => {
                if (priority === 'all' || card.dataset.priority === priority) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}