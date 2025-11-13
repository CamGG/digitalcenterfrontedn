// Se asegura de que todo el código se ejecute únicamente después de que el HTML de la página se haya cargado por completo.
document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================
    // 1. CONFIGURACIÓN Y ESTADO DE LA APLICACIÓN
    // ===================================================================
 // --- NUEVA LÓGICA PARA CAPTURAR TOKEN DESDE URL ---
    const handleTokenFromUrl = () => {
        if (window.location.hash.includes('access_token=')) {
            // Extrae el token de la URL (ej: #access_token=ey...)
            const tokenFromUrl = window.location.hash.split('=')[1];
            if (tokenFromUrl) {
                console.log("[plataforma.js] Token de acceso encontrado en la URL. Guardando...");
                // Guarda el token en localStorage
                localStorage.setItem('accessToken', tokenFromUrl);
                // Limpia la URL para que el token no quede visible
                window.location.hash = '';
            }
        }
    };
    handleTokenFromUrl();
    console.log("[plataforma.js] Inicializando v-final (Multi-Content)...");

    const PRODUCTION_API_URL = "https://centrodeinovacion-74109388085.southamerica-east1.run.app";
    const IS_LOCAL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    const API_BASE_URL = IS_LOCAL ? "http://127.0.0.1:5000" : PRODUCTION_API_URL;
    const token = localStorage.getItem('accessToken');
    const toggleButton = document.getElementById('sidebar-toggle');
    const body = document.body;

    const appState = {
        profile: null,
        myCourses: [],
    };

    // --- Lógica del Menú Lateral (Sidebar) ---
    if (toggleButton) {
        toggleButton.addEventListener('click', function() {
            body.classList.toggle('sidebar-open');
        });
    }

    body.addEventListener('click', function(event) {
        if (body.classList.contains('sidebar-open') && event.target === body) {
            body.classList.remove('sidebar-open');
        }
    });

    // --- Referencias a Elementos del DOM ---
    const myCoursesListContainer = document.getElementById('my-courses-list');
    const mainContentArea = document.getElementById('main-content-area');
    const userProfileInfo = document.getElementById('user-profile-info');
    const logoutBtn = document.getElementById('logout-btn');

    // ===================================================================
    // LÓGICA DE AUTENTICACIÓN Y ACCIONES DEL USUARIO
    // ===================================================================
   window.auth = {
    logout: (message = 'Tu sesión ha sido cerrada.') => {
        console.log("-> Se llamó a window.auth.logout desde plataforma.js.");
        console.log("Mensaje recibido para logout en plataforma.js:", message);

        localStorage.removeItem('accessToken');
        if (message) {
            localStorage.setItem('logoutMessage', message);
            console.log("Mensaje guardado en localStorage:", message);
        }

        console.log("Redirigiendo a index.html desde plataforma.js en breve...");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 50);
    },
};

    if (!token) {
        console.warn("No se encontró token de acceso. Redirigiendo a index.html");
        window.location.href = 'index.html';
        return;
    }

    // ===================================================================
    // 2. SERVICIO DE API (Llamadas al backend)
    // ===================================================================
    const apiService = {
        get: async (endpoint) => {
            const headers = { 'Authorization': `Bearer ${token}` };
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, { headers });

            if (response.status === 401) {
                console.log("-> apiService.get detectó 401 en plataforma.js. Llamando a logout.");
                window.auth.logout('Tu sesión ha sido cerrada porque se ha iniciado sesión en otro lugar.');
                throw new Error('Sesión inválida o expirada.');
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
                throw new Error(errorData.message || 'Error de red o del servidor.');
            }
            return response.json();
        },
        post: async (endpoint, body = {}) => {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, { method: 'POST', headers, body: JSON.stringify(body) });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Ocurrió un error en la solicitud.');
            }
            return data;
        },
    };

    // ===================================================================
    // 4. LÓGICA DE LA INTERFAZ DE USUARIO (UI)
    // ===================================================================
    const ui = {
        renderSpinner: (container) => {
            container.innerHTML = '<div class="loading-spinner"></div>';
        },

        renderUserProfile: (profile) => {
            if (!userProfileInfo) return;
            userProfileInfo.innerHTML = `<div class="user-profile"><i class="fas fa-user-circle"></i><span>${profile.username}</span></div>`;
        },

        renderMyCoursesNav: (courses) => {
            if (!myCoursesListContainer) return;
        
            const enrolledCoursesHTML = courses.length > 0
                ? courses.map(course => `<li><a href="#" data-course-id="${course.id}" class="course-link"><i class="fas fa-book"></i><span>${course.title}</span></a></li>`).join('')
                : `<li style="padding: 0.8rem 1rem; color: rgba(255,255,255,0.6); font-style: italic;">No tienes cursos.</li>`;
        
            const sidebarNav = myCoursesListContainer.parentElement;
            sidebarNav.innerHTML = `<h3 style="margin-top:1rem;">Mis Cursos</h3><ul id="my-courses-list">${enrolledCoursesHTML}</ul>`;
        
            // --- NUEVA SECCIÓN AÑADIDA ---
            const availableCoursesNav = document.createElement('div');
            availableCoursesNav.innerHTML = `
                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <h3>Explorar</h3>
                    <ul>
                        <li>
                            <a href="#" id="explore-courses-link">
                                <i class="fas fa-search"></i>
                                <span>Ver Cursos Disponibles</span>
                            </a>
                        </li>
                    </ul>
                </div>
            `;
            sidebarNav.appendChild(availableCoursesNav);
        
            // Añadir listeners a los elementos generados
            document.querySelectorAll('.course-link').forEach(link => link.addEventListener('click', ui.handleNavClick));
            document.getElementById('explore-courses-link').addEventListener('click', ui.handleExploreCoursesClick);
        },

        handleExploreCoursesClick: async (e) => {
            e.preventDefault();
            if (window.matchMedia("(max-width: 992px)").matches) {
                body.classList.remove('sidebar-open');
            }
            // Deselecciona cualquier otro enlace activo
            document.querySelectorAll('.sidebar-nav a.active').forEach(activeLink => activeLink.classList.remove('active'));
            // Activa el enlace de explorar
            e.currentTarget.classList.add('active');
        
            mainContentArea.innerHTML = `
                <div class="platform-main-header"><h1>Catálogo de Cursos</h1></div>
                <div class="platform-content-area">
                    <p class="section-subtitle">Explora nuestras opciones y solicita acceso a la que te interese.</p>
                    <div id="available-courses-grid" class="courses-grid"></div>
                </div>`;
            
            ui.renderSpinner(mainContentArea.querySelector('#available-courses-grid'));
        
            try {
                const allCourses = await apiService.get('courses');
                ui.renderAvailableCourses(allCourses);
            } catch (error) {
                console.error("Error al cargar los cursos disponibles:", error);
                mainContentArea.querySelector('#available-courses-grid').innerHTML = '<p style="color:red;">No se pudieron cargar los cursos. Inténtalo de nuevo más tarde.</p>';
            }
        },

        renderWelcomeMessage: () => {
             mainContentArea.innerHTML = `<div class="platform-main-header"><h1>Bienvenido a tu plataforma de aprendizaje</h1></div><div class="platform-content-area"><div class="welcome-message"><h2>Selecciona un curso de la barra lateral para comenzar.</h2><i class="fas fa-hand-point-left" style="font-size: 3rem; margin-top: 1rem; color: var(--blue-primary);"></i></div></div>`;
        },
       renderAvailableCourses: (courses) => {
    const availableCoursesGrid = document.getElementById('available-courses-grid');
    if (!availableCoursesGrid) return;

    if (courses.length === 0) {
        availableCoursesGrid.innerHTML = '<p>No hay cursos disponibles por el momento.</p>';
        return;
    }

    const WHATSAPP_NUMBER = "573204803221";
    const WHATSAPP_MESSAGE_COURSE = "Hola, estoy interesado en el curso";
    const DESCRIPTION_LIMIT = 120;

    availableCoursesGrid.innerHTML = '';
    courses.forEach(course => {
        const courseCard = document.createElement('div'); // Cambiado de 'a' a 'div' para un mejor control
        courseCard.className = 'course-card';

        const description = course.description || 'Descripción no disponible.';
        let descriptionHTML = '';

        if (description.length > DESCRIPTION_LIMIT) {
            descriptionHTML = `
                <div class="course-card-description">
                    <p>${description}</p>
                </div>
                <button class="toggle-description-btn">Ver más</button>
            `;
        } else {
            descriptionHTML = `<p>${description}</p>`;
        }

        // --- ESTRUCTURA HTML MODIFICADA ---
        // Se envuelve la descripción en .description-area y se usa un <a> para el botón principal
        courseCard.innerHTML = `
            <img src="${course.image_url || 'assets/images/bogota-guia-ciudades-colombia-properati.jpg'}" alt="${course.title}" class="course-card-image">
            <div class="course-card-content">
                <h3>${course.title}</h3>
                
                <div class="description-area">
                    ${descriptionHTML}
                </div>

                <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`${WHATSAPP_MESSAGE_COURSE} ${course.title}.`)}"
                   target="_blank"
                   class="btn btn-solid-primary btn-main-action">
                   Solicitar Acceso
                </a>
            </div>`;
        
        availableCoursesGrid.appendChild(courseCard);
    });

    // La lógica de los listeners para el botón "Ver más" no cambia
    availableCoursesGrid.querySelectorAll('.toggle-description-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            // Ya no necesitamos preventDefault ni stopPropagation porque la tarjeta ya no es un enlace
            const descriptionArea = button.closest('.description-area');
            const descriptionContainer = descriptionArea.querySelector('.course-card-description');
            
            descriptionContainer.classList.toggle('expanded');

            if (descriptionContainer.classList.contains('expanded')) {
                button.textContent = 'Ver menos';
            } else {
                button.textContent = 'Ver más';
            }
        });
    });
},

        renderCourseView: async (courseId) => {
            ui.renderSpinner(mainContentArea);

            try {
                const [course, lessons] = await Promise.all([
                    apiService.get(`courses/${courseId}`),
                    apiService.get(`courses/${courseId}/lessons`)
                ]);

                const lessonsHTML = lessons.length > 0
                    ? lessons.map(l => {
                        let iconClass;
                        switch (l.content_type) {
                            case 'pdf': iconClass = 'fa-file-pdf'; break;
                            case 'html': iconClass = 'fa-file-code'; break;
                            case 'image': iconClass = 'fa-file-image'; break;
                            case 'video': iconClass = 'fa-play-circle'; break;
                            default: iconClass = 'fa-file-alt';
                        }
                        return `<li class="lesson-item"
                                     data-lesson-id="${l.id}"
                                    data-content-filename="${l.content || ''}"
                                    data-content-type="${l.content_type || 'text'}">
                                     <i class="far ${iconClass}"></i>
                                    ${l.title}
                                 </li>`;
                    }).join('')
                    : '<li class="lesson-item">Este curso aún no tiene lecciones publicadas.</li>';

                mainContentArea.innerHTML = `
                    <div class="platform-main-header"><h1>${course.title}</h1></div>
                    <div class="platform-content-area">
                        <div id="content-viewer-container" class="content-viewer-wrapper">
                         </div>

                        <div id="course-actions-container" style="margin-top: 2rem;">
                            <strong style="color: gray;">Los Simulacros cuentan con analisis de respuesta incorrecta y justificacion al realizarlos podras ver este contenido.</strong>
                         </div>

                        <hr style="margin: 2rem 0;">
                        <h2>Contenido del Curso</h2>
                        <ul class="lesson-list">${lessonsHTML}</ul>
                     </div>`;

                mainContentArea.querySelector('.lesson-list').addEventListener('click', (event) => ui.handleLessonClick(event, courseId));

                const firstLessonWithContent = lessons.find(l => l.content);
                if (firstLessonWithContent) {
                    const firstLessonElement = mainContentArea.querySelector('.lesson-item');
                    if (firstLessonElement) ui.selectLesson(firstLessonElement, courseId);
                } else {
                    mainContentArea.querySelector('#content-viewer-container').innerHTML = `<p>Selecciona una lección para comenzar.</p>`;
                }

            } catch (error) {
                mainContentArea.innerHTML = `<p>Error al cargar el curso.</p>`;
                console.error("Error en renderCourseView:", error);
            }
        },

        selectLesson: (lessonElement, courseId) => {
            document.querySelectorAll('.lesson-item.active').forEach(activeLesson => activeLesson.classList.remove('active'));
            lessonElement.classList.add('active');

            const filename = lessonElement.dataset.contentFilename;
            const contentType = lessonElement.dataset.contentType;

            if (filename) {
                ui.loadLessonContent(filename, contentType);
            } else {
                alert("Esta lección no tiene contenido asociado.");
            }
        },

        loadLessonContent: async (filename, contentType) => {
            const container = document.getElementById('content-viewer-container');
            if (!container) return;
        
            container.className = 'content-viewer-wrapper';
        
            switch(contentType) {
                case 'video':
                    container.classList.add('viewer-video');
                    container.innerHTML = `<video controls><source src="${filename}" type="video/mp4">Tu navegador no soporta videos.</video>`;
                    break;
                case 'image':
                    container.classList.add('viewer-image');
                    container.innerHTML = `<img src="${filename}" alt="Contenido de la lección">`;
                    break;
                case 'html':
                    container.classList.add('viewer-html');
                    container.innerHTML = `<iframe id="content-frame" src="${filename}" title="${filename}" sandbox="allow-scripts allow-forms allow-same-origin"></iframe>`;
                    break;
                case 'pdf':
                    container.classList.add('viewer-pdf-js');
                    container.innerHTML = `
                        <div class="pdf-toolbar">
                            <button id="pdf-prev" class="btn btn-secondary" title="Página Anterior"><i class="fas fa-arrow-left"></i></button>
                            <button id="pdf-zoom-out" class="btn btn-secondary" title="Alejar"><i class="fas fa-search-minus"></i></button>
                            <span id="pdf-page-info">
                                <span id="pdf-page-num">1</span> de <span id="pdf-page-count">?</span>
                            </span>
                            <button id="pdf-zoom-in" class="btn btn-secondary" title="Acercar"><i class="fas fa-search-plus"></i></button>
                            <button id="pdf-next" class="btn btn-secondary" title="Página Siguiente"><i class="fas fa-arrow-right"></i></button>
                        </div>
                        <div class="pdf-canvas-container">
                            <canvas id="pdf-canvas"></canvas>
                        </div>
                        <div id="pdf-loading-state" style="text-align: center; padding: 2rem;">Cargando PDF...</div>
                     `;
        
            try {
                const { pdfjsLib } = window;
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
        
                let pageNum = 1;
                let pdfDoc = null;
                let zoomScale;
                let pdfPage = null;
                const canvas = document.getElementById('pdf-canvas');
                const ctx = canvas.getContext('2d');
                const loadingState = document.getElementById('pdf-loading-state');
                let isRendering = false;
        
                const renderCurrentPage = async () => {
                    if (!pdfPage || isRendering) return;
                    isRendering = true;
        
                    const dpr = window.devicePixelRatio || 1;
                    const viewport = pdfPage.getViewport({ scale: zoomScale * dpr });
        
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    canvas.style.height = `${viewport.height / dpr}px`;
                    canvas.style.width = `${viewport.width / dpr}px`;
        
                    await pdfPage.render({
                        canvasContext: ctx,
                        viewport: viewport,
                    }).promise;
                    isRendering = false;
                };
        
                const loadAndRenderPage = async (num) => {
                    loadingState.style.display = 'block';
                    const isFirstLoad = pdfPage === null;
        
                    pdfPage = await pdfDoc.getPage(num);
                    pageNum = num;
                    document.getElementById('pdf-page-num').textContent = num;
        
                    if (isFirstLoad) {
                        if (window.innerWidth <= 768) {
                            const containerWidth = document.querySelector('.pdf-canvas-container').clientWidth;
                            const unscaledViewport = pdfPage.getViewport({ scale: 1 });
                            zoomScale = containerWidth > 0 ? containerWidth / unscaledViewport.width : 1.0;
                        } else {
                            zoomScale = 1.0;
                        }
                    }
        
                    await renderCurrentPage();
                    loadingState.style.display = 'none';
                };

                pdfDoc = await pdfjsLib.getDocument(filename).promise;
                document.getElementById('pdf-page-count').textContent = pdfDoc.numPages;
                requestAnimationFrame(() => loadAndRenderPage(pageNum));
        
                document.getElementById('pdf-prev').addEventListener('click', () => {
                    if (pageNum <= 1 || isRendering) return;
                    loadAndRenderPage(pageNum - 1);
                });
                document.getElementById('pdf-next').addEventListener('click', () => {
                    if (pageNum >= pdfDoc.numPages || isRendering) return;
                    loadAndRenderPage(pageNum + 1);
                });
                document.getElementById('pdf-zoom-in').addEventListener('click', () => {
                    if (isRendering) return;
                    zoomScale += 0.25;
                    renderCurrentPage();
                });
                document.getElementById('pdf-zoom-out').addEventListener('click', () => {
                    if (zoomScale > 0.5 && !isRendering) {
                        zoomScale -= 0.25;
                        renderCurrentPage();
                    }
                });
        
            } catch (error) {
                console.error('Error detallado al cargar el PDF:', error);
                document.getElementById('pdf-loading-state').textContent = 'Error al mostrar el PDF.';
            }
            break;
        default:
            container.innerHTML = `<div class="text-content-viewer"><p>${filename}</p></div>`;
        }
        },

        handleNavClick: (e) => {
            e.preventDefault();
            if (window.matchMedia("(max-width: 992px)").matches) {
                body.classList.remove('sidebar-open');
            }
            const targetLink = e.currentTarget;
            document.querySelectorAll('.sidebar-nav a.active').forEach(activeLink => activeLink.classList.remove('active'));
            targetLink.classList.add('active');

            const courseId = targetLink.dataset.courseId;
            if (courseId) {
                ui.renderCourseView(courseId);
            }
        },

        handleLessonClick: (event, courseId) => {
            document.querySelector('.platform-main')?.scrollTo({ top: 0, behavior: 'smooth' });
            const lessonElement = event.target.closest('.lesson-item');
            if (!lessonElement) return;
            ui.selectLesson(lessonElement, courseId);
        }
    };
    window.ui = ui;

    // ===================================================================
    // 5. INICIALIZACIÓN DE LA PLATAFORMA
    // ===================================================================
    const initializePlatform = async () => {
        if (!token) {
            console.warn("[plataforma.js] initializePlatform: No hay token de acceso.");
            return;
        }
    
        try {
            console.log("[plataforma.js] initializePlatform: Intentando cargar perfil y cursos...");
            const [profile, myCourses] = await Promise.all([
                apiService.get('profile'),
                apiService.get('my-courses')
            ]);
    
            appState.profile = profile;
            appState.myCourses = myCourses;
            
            ui.renderUserProfile(profile);
            ui.renderMyCoursesNav(myCourses);
    
            if (myCourses.length === 0) {
                console.log("[plataforma.js] No hay cursos inscritos. Mostrando catálogo disponible.");
                
                mainContentArea.innerHTML = `
                    <div class="platform-main-header"><h1>Catálogo de Cursos</h1></div>
                    <div class="platform-content-area">
                        <p class="section-subtitle">Aún no estás inscrito en ningún curso. ¡Explora nuestras opciones y solicita acceso a la que te interese!</p>
                        <div id="available-courses-grid" class="courses-grid"></div>
                    </div>`;
                
                ui.renderSpinner(mainContentArea.querySelector('#available-courses-grid'));
                const allCourses = await apiService.get('courses');
                ui.renderAvailableCourses(allCourses);

            } else {
                console.log("[plataforma.js] Cursos encontrados. Mostrando mensaje de bienvenida.");
                ui.renderWelcomeMessage();
            }
    
            console.log("[plataforma.js] initializePlatform: Perfil y cursos cargados exitosamente.");
            
            const checkTokenValidityInterval = 120 * 1000;
            console.log(`[plataforma.js] initializePlatform: Iniciando polling para verificar token cada ${checkTokenValidityInterval / 1000} segundos.`);
            setInterval(async () => {
                try {
                    await apiService.get('profile');
                } catch (error) {
                    console.warn("[plataforma.js] Polling: Error detectado, sesión posiblemente inválida:", error.message);
                }
            }, checkTokenValidityInterval);
    
        } catch (error) {
            console.error("[plataforma.js] initializePlatform: Error al cargar perfil/cursos:", error);
        }
    };

    // ===================================================================
    // INICIALIZACIÓN PRINCIPAL
    // ===================================================================
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.auth.logout();
        });
    } else {
        console.error("Error: El botón de salir ('logout-btn') no fue encontrado en el DOM.");
    }

    initializePlatform(); 
});