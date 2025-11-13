document.addEventListener('DOMContentLoaded', () => {
    console.log("[cursos.js] Inicializando...");

    // ===================================================================
    // 1. CONFIGURACIÓN Y CONSTANTES (Reutilizadas de script.js)
    // ===================================================================
    const PRODUCTION_API_URL = "https://digitalcenter-74109388085.europe-west1.run.app";
    const IS_LOCAL_FRONTEND = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    const API_BASE_URL = IS_LOCAL_FRONTEND ? "http://127.0.0.1:5000" : PRODUCTION_API_URL;
    const WHATSAPP_NUMBER = "573204803221";
    const WHATSAPP_MESSAGE_COURSE = "Hola, estoy interesado en el curso";

    // ===================================================================
    // 2. REFERENCIAS AL DOM
    // ===================================================================
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const coursesGrid = document.getElementById('courses-grid-container');

    // ===================================================================
    // 3. LÓGICA DE RENDERIZADO (similar a script.js)
    // ===================================================================
    const renderCourses = (courses) => {
        coursesGrid.innerHTML = '';
        if (courses.length === 0) {
            coursesGrid.innerHTML = '<p class="empty-state">No se encontraron cursos que coincidan con tu búsqueda.</p>';
            return;
        }

        const DESCRIPTION_LIMIT = 120;
        courses.forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card';

            const description = course.description || 'Descripción no disponible.';
            let descriptionHTML = (description.length > DESCRIPTION_LIMIT)
                ? `<div class="course-card-description"><p>${description}</p></div><button class="toggle-description-btn">Ver más</button>`
                : `<p>${description}</p>`;

            courseCard.innerHTML = `
                <img src="${course.image_url || 'assets/images/bogota-guia-ciudades-colombia-properati.jpg'}" alt="${course.title}" class="course-card-image">
                <div class="course-card-content">
                    <h3>${course.title}</h3>
                    <div class="description-area">${descriptionHTML}</div>
                    <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`${WHATSAPP_MESSAGE_COURSE} ${course.title}.`)}"
                       target="_blank" class="btn btn-solid-primary btn-main-action" style="text-align:center;">
                       Solicitar Acceso
                    </a>
                </div>`;
            coursesGrid.appendChild(courseCard);
        });
        
        // Añadir listeners para los botones "Ver más"
        coursesGrid.querySelectorAll('.toggle-description-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const descriptionArea = button.closest('.description-area');
                const descriptionContainer = descriptionArea.querySelector('.course-card-description');
                descriptionContainer.classList.toggle('expanded');
                button.textContent = descriptionContainer.classList.contains('expanded') ? 'Ver menos' : 'Ver más';
            });
        });
    };

    // ===================================================================
    // 4. LÓGICA DE BÚSQUEDA Y FETCH
    // ===================================================================
    const fetchAndDisplayCourses = async (searchTerm = '') => {
        if (!coursesGrid) return;
        coursesGrid.innerHTML = '<div class="loading-spinner"></div>';

        // Construye la URL. Si hay un término de búsqueda, lo añade como parámetro.
        const url = searchTerm
            ? `${API_BASE_URL}/courses?search=${encodeURIComponent(searchTerm)}`
            : `${API_BASE_URL}/courses`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al conectar con el servidor');
            const courses = await response.json();
            renderCourses(courses);
        } catch (error) {
            coursesGrid.innerHTML = `<p style="color:red;">Error: ${error.message}.</p>`;
        }
    };

    // ===================================================================
    // 5. EVENT LISTENERS Y CARGA INICIAL
    // ===================================================================
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Evita que la página se recargue
            const searchTerm = searchInput.value.trim();
            fetchAndDisplayCourses(searchTerm);
        });
    }
    
    // Opcional: para buscar en tiempo real mientras se escribe o se borra el texto
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = searchInput.value.trim();
                fetchAndDisplayCourses(searchTerm);
            }, 300); // Espera 300ms después de que el usuario deja de teclear
        });
    }

    // Carga inicial de todos los cursos al entrar a la página
    fetchAndDisplayCourses();
});