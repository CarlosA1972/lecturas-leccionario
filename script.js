document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES GLOBALES ---
    const monthYearEl = document.getElementById('month-year');
    const calendarDaysEl = document.getElementById('calendar-days');
    const readingsContainer = document.getElementById('readings-container');
    const readingsContentEl = document.getElementById('readings-content');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    // Panel de Administración
    const adminPanel = document.getElementById('admin-panel');
    const adminForm = document.getElementById('admin-form');
    const adminDateEl = document.getElementById('admin-date');
    const sourceUrlInput = document.getElementById('source-url');
    const firstReadingInput = document.getElementById('first-reading');
    const psalmInput = document.getElementById('psalm');
    const gospelInput = document.getElementById('gospel');

    let currentDate = new Date(2025, 6, 1); // Julio 2025 (mes 6 porque JS es 0-indexed)
    let readingsData = {};
    let selectedDayElement = null;
    let selectedDateKey = null;

    // --- MODO ADMINISTRADOR ---
    const params = new URLSearchParams(window.location.search);
    const isAdmin = params.get('admin') === 'true';

    // --- FUNCIONES PRINCIPALES ---

    // Cargar datos de las lecturas desde el archivo JSON
    async function loadReadingsData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                // Si el archivo no existe, no es un error fatal.
                console.warn('data.json no encontrado. Se usará un objeto vacío.');
                return {};
            }
            return await response.json();
        } catch (error) {
            console.error('Error cargando data.json:', error);
            return {};
        }
    }

    // Generar y mostrar el calendario para el mes actual
    function generateCalendar() {
        calendarDaysEl.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        monthYearEl.textContent = `${currentDate.toLocaleString('es-ES', { month: 'long' }).toUpperCase()} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDayOfMonth.getDay(); // 0=Domingo, 1=Lunes...

        // Rellenar días del mes anterior
        for (let i = 0; i < firstDayOfWeek; i++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('day', 'other-month');
            calendarDaysEl.appendChild(dayEl);
        }

        // Rellenar días del mes actual
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('day');
            dayEl.textContent = day;
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayEl.dataset.date = dateKey;

            // Añadir punto si hay lecturas
            if (readingsData[dateKey]) {
                const dot = document.createElement('span');
                dot.classList.add('has-reading-dot');
                dayEl.appendChild(dot);
            }

            dayEl.addEventListener('click', () => showReadingsForDay(dayEl, dateKey));
            calendarDaysEl.appendChild(dayEl);
        }
    }

    // Mostrar las lecturas para un día seleccionado
    function showReadingsForDay(dayElement, dateKey) {
        selectedDateKey = dateKey;
        
        if (selectedDayElement) {
            selectedDayElement.classList.remove('selected');
        }
        dayElement.classList.add('selected');
        selectedDayElement = dayElement;
        
        const data = readingsData[dateKey];
        
        if (data) {
            readingsContentEl.innerHTML = `
                <p><strong>Fuente:</strong> <a href="${data.fuente}" target="_blank" rel="noopener noreferrer">${data.fuente}</a></p>
                <h4>Primera Lectura</h4>
                <p>${data.primera}</p>
                <h4>Salmo</h4>
                <p>${data.salmo}</p>
                <h4>Evangelio</h4>
                <p>${data.evangelio}</p>
            `;
        } else {
            readingsContentEl.innerHTML = '<h3>No hay lecturas disponibles para este día.</h3>';
        }

        // Si es admin, mostrar y rellenar el formulario
        if (isAdmin) {
            adminPanel.classList.remove('hidden');
            adminDateEl.textContent = new Date(dateKey + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            sourceUrlInput.value = data?.fuente || '';
            firstReadingInput.value = data?.primera || '';
            psalmInput.value = data?.salmo || '';
            gospelInput.value = data?.evangelio || '';
        }
    }

    // Guardar los cambios del formulario de admin
    function handleAdminFormSubmit(event) {
        event.preventDefault();
        if (!selectedDateKey) {
            alert('Por favor, selecciona un día primero.');
            return;
        }

        const updatedReading = {
            fuente: sourceUrlInput.value,
            primera: firstReadingInput.value,
            salmo: psalmInput.value,
            evangelio: gospelInput.value,
        };

        readingsData[selectedDateKey] = updatedReading;
        
        // Descargar el archivo JSON actualizado
        downloadJson();
        
        // Actualizar UI
        alert('¡Cambios guardados! Se ha iniciado la descarga del archivo data.json. Por favor, súbelo a tu servidor para que los cambios sean públicos.');
        generateCalendar(); // Regenerar calendario para mostrar el punto
        showReadingsForDay(selectedDayElement, selectedDateKey); // Refrescar vista
    }
    
    // Función para descargar el objeto de datos como archivo JSON
    function downloadJson() {
        const dataStr = JSON.stringify(readingsData, null, 2); // El '2' es para que el JSON sea legible
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // --- EVENT LISTENERS ---
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        generateCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar();
    });

    if (isAdmin) {
        adminForm.addEventListener('submit', handleAdminFormSubmit);
    }

    // --- INICIALIZACIÓN ---
    async function init() {
        readingsData = await loadReadingsData();
        generateCalendar();
    }

    init();
});