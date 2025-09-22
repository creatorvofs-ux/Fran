// Array para armazenar as tarefas
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// Elementos do DOM
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const totalTasks = document.getElementById('totalTasks');
const completedTasks = document.getElementById('completedTasks');

// Função para adicionar tarefa
function addTask() {
    const text = taskInput.value.trim();
    
    if (text === '') {
        showMessage('Por favor, digite uma tarefa!', 'error');
        return;
    }

    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toLocaleDateString('pt-BR'),
        createdAtTime: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
    };

    tasks.push(newTask);
    taskInput.value = '';
    saveTasks();
    renderTasks();
    showMessage('Tarefa adicionada com sucesso!', 'success');
    
    // Track no Analytics
    gtag('event', 'add_task', {
        'event_category': 'engagement',
        'event_label': 'Nova tarefa adicionada'
    });
}

// Função para renderizar tarefas
function renderTasks() {
    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'completed') return task.completed;
        if (currentFilter === 'pending') return !task.completed;
        return true;
    });

    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="loading">
                ${currentFilter === 'completed' ? 'Nenhuma tarefa concluída ainda!' : 
                  currentFilter === 'pending' ? 'Todas as tarefas estão concluídas! 🎉' : 
                  'Nenhuma tarefa adicionada. Comece agora!'}
            </div>
        `;
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${task.id})">
            <span class="task-text">${task.text}</span>
            <small style="margin-left: auto; margin-right: 10px; color: #666; font-size: 10px;">
                ${task.createdAt} ${task.createdAtTime}
            </small>
            <button class="delete-btn" onclick="deleteTask(${task.id})" title="Excluir tarefa">🗑️</button>
        `;

        taskList.appendChild(li);
    });

    updateStats();
}

// Função para alternar tarefa (concluída/pendente)
function toggleTask(id) {
    tasks = tasks.map(task => 
        task.id === id ? {...task, completed: !task.completed} : task
    );
    saveTasks();
    renderTasks();
    
    // Track no Analytics
    gtag('event', 'toggle_task', {
        'event_category': 'engagement',
        'event_label': 'Tarefa alterada'
    });
}

// Função para deletar tarefa
function deleteTask(id) {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        showMessage('Tarefa excluída!', 'success');
    }
}

// Função para filtrar tarefas
function filterTasks(filter) {
    currentFilter = filter;
    
    // Atualizar botões ativos
    document.querySelectorAll('.filter-buttons button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderTasks();
}

// Função para limpar tarefas concluídas
function clearCompleted() {
    const completedCount = tasks.filter(task => task.completed).length;
    
    if (completedCount === 0) {
        showMessage('Não há tarefas concluídas para limpar!', 'info');
        return;
    }

    if (confirm(`Limpar ${completedCount} tarefa(s) concluída(s)?`)) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        showMessage(`${completedCount} tarefa(s) limpa(s) com sucesso!`, 'success');
    }
}

// Função para salvar no localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Função para atualizar estatísticas
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    totalTasks.textContent = `Total: ${total}`;
    completedTasks.textContent = `Concluídas: ${completed}`;
    
    // Atualizar título da página
    document.title = `(${pending}) Minhas Tarefas`;
}

// Função para mostrar mensagens
function showMessage(message, type = 'info') {
    // Remove mensagem anterior se existir
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #28a745;' : 
         type === 'error' ? 'background: #dc3545;' : 
         'background: #17a2b8;'}
    `;
    
    document.body.appendChild(messageDiv);
    
    // Remove após 3 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Event listener para Enter no input
taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Função para carregar tarefas ao iniciar
function loadTasks() {
    renderTasks();
    console.log('App carregado com sucesso!');
    
    // Track no Analytics
    gtag('event', 'page_view', {
        'page_title': 'Meu Controle Diário',
        'page_location': window.location.href
    });
}

// Inicializar app quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    
    // Focar no input automaticamente
    taskInput.focus();
});

// Exportar funções para uso global (necessário para onclick)
window.addTask = addTask;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.filterTasks = filterTasks;
window.clearCompleted = clearCompleted;
window.saveTasks = saveTasks;

// Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
            console.log('ServiceWorker registration successful');
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
      }
