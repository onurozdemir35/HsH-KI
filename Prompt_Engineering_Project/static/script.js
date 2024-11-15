document.addEventListener('DOMContentLoaded', function() {
    const todoInput = document.getElementById('todoInput');
    const categorySelect = document.getElementById('categorySelect');
    const suggestionsBox = document.getElementById('suggestions');
    const todoFilter = document.getElementById('todoFilter');
    const inProgressFilter = document.getElementById('inProgressFilter');
    const completedFilter = document.getElementById('completedFilter');
    const profileIcon = document.getElementById('profileIcon');
    const profileDropdown = document.getElementById('profileDropdown');
    const brightModeIcon = document.getElementById('brightModeIcon');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const body = document.body;
    let suggestions = [];

    // Profil ikonu tıklama işlevselliği
    profileIcon.addEventListener('click', function(event) {
        event.stopPropagation();
        profileDropdown.classList.toggle('show');
    });

    // Sayfa dışında tıklama işlevselliği
    window.addEventListener('click', function(event) {
        if (!event.target.closest('.profile')) {
            profileDropdown.classList.remove('show');
        }
    });

    // Bright mode ve dark mode geçişi
    brightModeIcon.addEventListener('click', function() {
        body.classList.remove('dark-mode');
    });

    darkModeIcon.addEventListener('click', function() {
        body.classList.add('dark-mode');
    });

    // Todo input suggestions
    todoInput.addEventListener('input', function() {
        const query = todoInput.value.toLowerCase();
        suggestionsBox.innerHTML = '';
        if (query.length > 0) {
            const filteredSuggestions = suggestions.filter(suggestion => suggestion.toLowerCase().includes(query));
            filteredSuggestions.forEach(suggestion => {
                const suggestionDiv = document.createElement('div');
                suggestionDiv.textContent = suggestion;
                suggestionDiv.addEventListener('click', function() {
                    todoInput.value = suggestion;
                    suggestionsBox.innerHTML = '';
                });
                suggestionsBox.appendChild(suggestionDiv);
            });
        }
    });

    // Todo filter
    todoFilter.addEventListener('change', function() {
        filterTasks('todo', todoFilter.value);
    });

    inProgressFilter.addEventListener('change', function() {
        filterTasks('in-progress', inProgressFilter.value);
    });

    completedFilter.addEventListener('change', function() {
        filterTasks('completed', completedFilter.value);
    });

    function filterTasks(status, category) {
        const tasks = document.querySelectorAll(`.${status} .task`);
        tasks.forEach(task => {
            if (category === 'all' || task.dataset.category === category) {
                task.style.display = 'block';
            } else {
                task.style.display = 'none';
            }
        });
    }

    if (document.getElementById('todoForm')) {
        document.getElementById('todoForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const todoText = todoInput.value;
            const category = categorySelect.value;
            if (todoText === '') {
                alert('Please enter a todo item.');
                return;
            }

            fetch('/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ todoInput: todoText, categorySelect: category })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error:', data.error);
                } else {
                    var li = createTodoElement(data.id, escapeHtml(data.text), data.completed, data.category);
                    if (data.completed) {
                        document.getElementById('completedList').appendChild(li);
                    } else {
                        document.getElementById('todoList').appendChild(li);
                    }
                    addSuggestion(todoText);
                    todoInput.value = '';
                    suggestionsBox.innerHTML = '';
                }
            })
            .catch(error => console.error('Error:', error));
        });

        function createTodoElement(id, text, completed, category) {
            var li = document.createElement('li');
            li.setAttribute('draggable', 'true');
            li.setAttribute('data-category', category); // Kategori attribute'u ekle
            li.addEventListener('dragstart', handleDragStart);
            li.addEventListener('dragover', handleDragOver);
            li.addEventListener('drop', handleDrop);
            li.addEventListener('dragenter', handleDragEnter);
            li.addEventListener('dragleave', handleDragLeave);
            if (completed) {
                li.classList.add('completed');
            }
            var checkbox = createCheckbox(id, completed);
            var textSpan = document.createElement('span');
            textSpan.className = 'text';
            textSpan.innerHTML = text; // Güvenli HTML ekleme
            li.appendChild(checkbox);
            li.appendChild(textSpan);
            var buttonsDiv = createButtonsDiv(id, text);
            li.appendChild(buttonsDiv);
            return li;
        }

        function createCheckbox(id, completed) {
            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'checkbox';
            checkbox.checked = completed;
            checkbox.addEventListener('change', function() {
                var li = this.parentElement;
                fetch(`/complete/${id}`, {
                    method: 'PUT'
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        if (result.completed) {
                            li.classList.add('completed');
                            document.getElementById('completedList').appendChild(li);
                        } else {
                            li.classList.remove('completed');
                            document.getElementById('todoList').appendChild(li);
                        }
                    }
                })
                .catch(error => console.error('Error:', error));
            });
            return checkbox;
        }

        function createButtonsDiv(id, text) {
            var buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'buttons';

            var editButton = document.createElement('button');
            editButton.className = 'edit';
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.onclick = function() {
                window.location.href = `/edit/${id}`;
            };

            var deleteButton = document.createElement('button');
            deleteButton.className = 'delete';
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteButton.onclick = function() {
                fetch(`/delete/${id}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        buttonsDiv.parentElement.remove();
                    }
                })
                .catch(error => console.error('Error:', error));
            };

            var inProgressButton = document.createElement('button');
            inProgressButton.className = 'in-progress';
            inProgressButton.innerHTML = '<i class="fas fa-tasks"></i>';
            inProgressButton.onclick = function() {
                var li = this.parentElement.parentElement;
                fetch(`/inprogress/${id}`, {
                    method: 'PUT'
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        document.getElementById('inProgressList').appendChild(li);
                    }
                })
                .catch(error => console.error('Error:', error));
            };

            buttonsDiv.appendChild(editButton);
            buttonsDiv.appendChild(deleteButton);
            buttonsDiv.appendChild(inProgressButton);
            return buttonsDiv;
        }

        function addSuggestion(text) {
            if (!suggestions.includes(text)) {
                suggestions.push(text);
            }
        }

        // Sürükle ve bırak işlevselliği
        function handleDragStart(e) {
            e.dataTransfer.setData('text/plain', e.target.id);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => {
                e.target.classList.add('dragging');
            }, 0);
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const afterElement = getDragAfterElement(e.target.parentElement, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                e.target.parentElement.appendChild(draggable);
            } else {
                e.target.parentElement.insertBefore(draggable, afterElement);
            }
        }

        function handleDrop(e) {
            e.preventDefault();
            const draggable = document.querySelector('.dragging');
            draggable.classList.remove('dragging');
        }

        function handleDragEnter(e) {
            e.preventDefault();
            e.target.classList.add('drag-over');
        }

        function handleDragLeave(e) {
            e.target.classList.remove('drag-over');
        }

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];

            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        // Filtreleme işlevselliği
        todoFilter.addEventListener('change', function() {
            filterTodos('todoList', todoFilter.value);
        });

        inProgressFilter.addEventListener('change', function() {
            filterTodos('inProgressList', inProgressFilter.value);
        });

        completedFilter.addEventListener('change', function() {
            filterTodos('completedList', completedFilter.value);
        });

        function filterTodos(listId, filterValue) {
            const list = document.getElementById(listId);
            const items = list.getElementsByTagName('li');
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const category = item.getAttribute('data-category').toLowerCase();
                if (filterValue === 'all' || category === filterValue) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            }
        }
    }

    // Load existing todos when the page loads
    fetch('/todos')
    .then(response => response.json())
    .then(data => {
        data.todos.forEach(todo => {
            var li = createTodoElement(todo.id, escapeHtml(todo.text), todo.completed, todo.category);
            if (todo.completed) {
                document.getElementById('completedList').appendChild(li);
            } else if (todo.in_progress) {
                document.getElementById('inProgressList').appendChild(li);
            } else {
                document.getElementById('todoList').appendChild(li);
            }
            addSuggestion(todo.text);
        });
    })
    .catch(error => console.error('Error:', error));

    // Düzenleme sayfası işlevselliği
    if (document.getElementById('editForm')) {
        const todoId = document.getElementById('todoId');
        const todoText = document.getElementById('todoText');
        const categorySelect = document.getElementById('categorySelect');

        // Sayfa yüklendiğinde mevcut todo öğesini yükle
        const id = window.location.pathname.split('/').pop();
        fetch(`/todo/${id}`)
        .then(response => response.json())
        .then(data => {
            todoId.value = data.id;
            todoText.value = data.text;
            categorySelect.value = data.category;
        })
        .catch(error => console.error('Error:', error));

        document.getElementById('editForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const id = todoId.value;
            const text = todoText.value;
            const category = categorySelect.value;

            fetch(`/edit/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text, category: category })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    window.location.href = '/';
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }

    // HTML injection'ı güvenli hale getirmek için kaçış karakterleri kullanma
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    profileIcon.addEventListener('mouseenter', function() {
        profileDropdown.style.display = 'block';
    });

    profileIcon.addEventListener('mouseleave', function() {
        setTimeout(() => {
            if (!profileDropdown.matches(':hover')) {
                profileDropdown.style.display = 'none';
            }
        }, 100);
    });

    profileDropdown.addEventListener('mouseenter', function() {
        profileDropdown.style.display = 'block';
    });

    profileDropdown.addEventListener('mouseleave', function() {
        profileDropdown.style.display = 'none';
    });
});