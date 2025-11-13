// Contenido del archivo: assets/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================
    // 1. CONFIGURACIÓN Y CONSTANTES
    // ===================================================================
    console.log("[script.js] Inicializando (Modo B2B)...");
    const PRODUCTION_API_URL = "https://centrodeinovacion-74109388085.southamerica-east1.run.app"; 
    const IS_LOCAL_FRONTEND = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'; 
    const API_BASE_URL = IS_LOCAL_FRONTEND ? "http://127.0.0.1:5000" : PRODUCTION_API_URL; 
    const WHATSAPP_NUMBER = "573204803221"; 
    const WHATSAPP_MESSAGE_GENERAL = "Hola, estoy interesado en obtener acceso a la plataforma"; // Mensaje general para contactar
    const WHATSAPP_MESSAGE_COURSE = "Hola, estoy interesado en el curso"; // Mensaje para curso específico

    // Referencias al DOM
    const coursesGrid = document.getElementById('courses-grid-container');
    const headerButtonsContainer = document.getElementById('header-buttons-container');
    const authModalContainer = document.getElementById('auth-modal-container');
    const indexMessageContainer = document.getElementById('index-message-container');

    // ===================================================================
    // NUEVA LÓGICA: Mostrar mensajes de redirección (ej. por logout forzado)
    // ===================================================================
    const showRedirectMessage = () => {
        console.log("[script.js] Verificando mensajes de redirección...");
        const message = localStorage.getItem('logoutMessage');

        if (message && indexMessageContainer) {
            console.log("[script.js] Mensaje de redirección encontrado:", message);
            indexMessageContainer.textContent = message;
            indexMessageContainer.style.display = 'block';

            // Aplica los mismos estilos que tenías para el mensaje en plataforma.js
            indexMessageContainer.style.backgroundColor = '#ffe0b2'; // Fondo amarillo claro
            indexMessageContainer.style.color = '#e65100'; // Texto naranja oscuro
            indexMessageContainer.style.borderColor = '#ff9800'; // Borde naranja

            // Elimina el mensaje de localStorage para que no se muestre en futuras cargas
            localStorage.removeItem('logoutMessage');
            console.log("[script.js] Mensaje de redirección mostrado y eliminado de localStorage.");

            // Opcional: ocultar el mensaje automáticamente después de un tiempo
            setTimeout(() => {
                indexMessageContainer.style.display = 'none';
                console.log("[script.js] Mensaje de redirección ocultado automáticamente.");
            }, 5000); // Se oculta después de 5 segundos
        } else if (!indexMessageContainer) {
            console.error("[script.js] ERROR: No se encontró el elemento #index-message-container en el DOM.");
        } else {
            console.log("[script.js] No se encontró ningún mensaje de redirección.");
        }
    };

    // ===================================================================
    // 2. LÓGICA DE LA PÁGINA DE INICIO
    // ===================================================================
   const fetchAndRenderCourses = async () => {
    if (!coursesGrid) return;
    coursesGrid.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const response = await fetch(`${API_BASE_URL}/courses`);
        if (!response.ok) throw new Error('Error al conectar con el servidor');
        const courses = await response.json();
        
        coursesGrid.innerHTML = '';
        if (courses.length === 0) {
            coursesGrid.innerHTML = '<p>No hay cursos disponibles por el momento.</p>';
            return;
        }

        // --- CAMBIO 1: Límite de caracteres ---
        const DESCRIPTION_LIMIT = 120;

        courses.forEach(course => {
            // --- CAMBIO 2: La tarjeta ahora es un DIV para un mejor control ---
            const courseCard = document.createElement('div');
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
            
            // --- CAMBIO 3: Estructura HTML actualizada ---
            courseCard.innerHTML = `
                <img src="${course.image_url || 'assets/images/bogota-guia-ciudades-colombia-properati.jpg'}" alt="${course.title}" class="course-card-image">
                <div class="course-card-content">
                    <h3>${course.title}</h3>
                    
                    <div class="description-area">
                        ${descriptionHTML}
                    </div>

                    <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`${WHATSAPP_MESSAGE_COURSE} ${course.title}.`)}"
                       target="_blank"
                       class="btn btn-solid-primary btn-main-action"
                       style="text-align:center;">
                       Solicitar Acceso
                    </a>
                </div>`;
            coursesGrid.appendChild(courseCard);
        });

        // --- CAMBIO 4: Añadir los listeners para los botones "Ver más" ---
        coursesGrid.querySelectorAll('.toggle-description-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const descriptionArea = button.closest('.description-area');
                const descriptionContainer = descriptionArea.querySelector('.course-card-description');
                
                descriptionContainer.classList.toggle('expanded');
                button.textContent = descriptionContainer.classList.contains('expanded') ? 'Ver menos' : 'Ver más';
            });
        });

    } catch (error) {
        coursesGrid.innerHTML = `<p style="color:red;">Error: ${error.message}.</p>`;
    }
};

 // ===================================================================
    // LÓGICA PARA LA PÁGINA DE REGISTRO DEDICADA
    // ===================================================================
    const initializeRegistrationPage = () => {
        const registerForm = document.getElementById('register-form-page');
        const loginLink = document.getElementById('login-link');
        const googleLoginBtn = document.getElementById('google-login-btn');

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Previene la navegación al '#'
        
        // Construye la URL completa del backend y redirige
        const googleLoginUrl = `${API_BASE_URL}/login/google`;
        console.log('Redirigiendo a:', googleLoginUrl);
        window.location.href = googleLoginUrl;
    });
}
        if (registerForm) {
            // Usamos la misma función handleRegister que ya existe en authLogic
            registerForm.addEventListener('submit', (e) => {
                // Pasamos el evento y un callback para redirigir en caso de éxito
                authLogic.handleRegister(e, () => {
                    // En caso de registro exitoso, mostramos el modal de login
                    // con un mensaje de éxito.
                    authLogic.displayAuthModal('login');
                    const msgEl = document.querySelector('#authModal #authMessage');
                    if (msgEl) {
                        msgEl.textContent = '¡Registro exitoso! Ahora puedes iniciar sesión.';
                        msgEl.className = 'form-message success';
                    }
                });
            });
        }

        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Abre el modal de login cuando se hace clic en el enlace
                authLogic.openLoginModal();
            });
        }
    };
    
    // ===================================================================
    // 3. LÓGICA DE AUTENTICACIÓN Y UI DEL HEADER
    // ===================================================================
    const authLogic = {
        // Función genérica para mostrar el modal de autenticación (login o registro)
        displayAuthModal: (type) => {
            const isLogin = type === 'login';
            const title = isLogin ? 'Acceso a la Plataforma' : 'Crear Cuenta';
            const formId = isLogin ? 'loginForm' : 'registerForm';
            const submitHandler = isLogin ? authLogic.handleLogin : authLogic.handleRegister;
            const linkText = isLogin ? '¿No tienes cuenta? Regístrate aquí.' : '¿Ya tienes cuenta? Inicia sesión aquí.';
            const linkType = isLogin ? 'register' : 'login';

            const modalHTML = `
                <div class="modal" id="authModal" style="display:block;">
                    <div class="modal-content">
                        <span class="close-btn">&times;</span>
                        <h2>${title}</h2>
                        ${isLogin ? '' : ''}
                        <form id="${formId}">
                            <div id="authMessage" class="form-message"></div>
                            ${!isLogin ? '<div class="form-group"><label>Nombre Completo<small style="color: grey;">(asi se reflejaran futuras certificaciones)</small></label><input type="text" id="authUsername" required></div>' : ''}
                            <div class="form-group"><label>Correo Electrónico</label><input type="email" id="authEmail" required></div>
                            <div class="form-group"><label>Contraseña</label><input type="password" id="authPassword" required></div>
                            ${!isLogin ? '<div class="form-group"><label>Confirmar Contraseña</label><input type="password" id="authConfirmPassword" required></div>' : ''}
                            <button type="submit" class="btn btn-primary" style="width:100%">${isLogin ? 'Entrar' : 'Registrarse'}</button>
                        </form>
                        <p style="text-align: center; margin-top: 1rem;"><a href="#" id="toggleAuthMode" data-type="${linkType}">${linkText}</a></p>
                    </div>
                </div>`;
            authModalContainer.innerHTML = modalHTML;

            // Event listeners para cerrar el modal y cambiar entre login/registro
            authModalContainer.querySelector('.close-btn').addEventListener('click', authLogic.closeModal);
            authModalContainer.querySelector('form').addEventListener('submit', submitHandler);
            authModalContainer.querySelector('#toggleAuthMode').addEventListener('click', (e) => {
                e.preventDefault();
                const newType = e.target.dataset.type;
                authLogic.displayAuthModal(newType); // Vuelve a mostrar el modal con el nuevo tipo
            });
        },

        openLoginModal: () => authLogic.displayAuthModal('login'),
        openRegisterModal: () => authLogic.displayAuthModal('register'),
        closeModal: () => { authModalContainer.innerHTML = ''; },

        handleLogin: async (e) => {
            e.preventDefault();
            const email = e.target.querySelector(`#authEmail`).value;
            const password = e.target.querySelector(`#authPassword`).value;
            const msgEl = e.target.querySelector(`#authMessage`);
            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                
                localStorage.setItem('accessToken', data.access_token);
                msgEl.textContent = '¡Login exitoso! Redirigiendo...';
                msgEl.className = 'form-message success';
                
                setTimeout(() => {
                    window.location.href = 'plataforma.html';
                }, 1000);
            } catch (error) {
                msgEl.textContent = error.message;
                msgEl.className = 'form-message error';
            }
        },

       handleRegister: async (e, onSuccessCallback) => { // <-- Añadido onSuccessCallback
            e.preventDefault();
            // Usamos e.currentTarget para asegurarnos de que funciona en ambos formularios
            const form = e.currentTarget;
            const username = form.querySelector(`#authUsername`).value;
            const email = form.querySelector(`#authEmail`).value;
            const password = form.querySelector(`#authPassword`).value;
            const confirmPassword = form.querySelector(`#authConfirmPassword`).value;
            const msgEl = form.querySelector(`#authMessage`);

            // Muestra el campo de mensaje si estaba oculto
            if (msgEl) msgEl.style.display = 'block';

            if (password !== confirmPassword) {
                msgEl.textContent = 'Las contraseñas no coinciden.';
                msgEl.className = 'form-message error';
                return;
            }

            // Lógica de captura de UTM (si la tienes)
            const requestBody = { username, email, password };
            const campaignDataString = localStorage.getItem('campaignData');
            if (campaignDataString) {
                requestBody.campaign_data = JSON.parse(campaignDataString);
            }

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                // Si se proporcionó un callback de éxito, lo llamamos
                if (onSuccessCallback) {
                    onSuccessCallback();
                } else {
                    // Comportamiento por defecto (el que ya tenías)
                    msgEl.textContent = 'Registro exitoso. ¡Ahora puedes iniciar sesión!';
                    msgEl.className = 'form-message success';
                    setTimeout(() => {
                        authLogic.displayAuthModal('login');
                    }, 1500);
                }
                localStorage.removeItem('campaignData');

            } catch (error) {
                msgEl.textContent = error.message;
                msgEl.className = 'form-message error';
            }
        },
        
        updateHeaderUI: () => {
            if (!headerButtonsContainer) {
                console.error("Error: headerButtonsContainer no encontrado en el DOM.");
                return;
            }

            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE_GENERAL)}`;
            
            // --- ¡MODIFICACIÓN CLAVE AQUÍ! ---
            // El botón de "Registrarse" ahora es un enlace directo a registro.html
            headerButtonsContainer.innerHTML = `
                <a href="${whatsappUrl}" target="_blank" id="contact-btn-header" class="btn btn-contact"><i class="fab fa-whatsapp"></i> Contactar</a>
                <a href="registro.html" id="register-btn-header" class="btn btn-outline-primary">Registrarse</a>
                <button id="login-btn-header" class="btn btn-solid-primary">Iniciar Sesión</button>
            `;
            
            const loginBtnHeader = document.getElementById('login-btn-header');
            const registerBtnHeader = document.getElementById('register-btn-header');

            if (loginBtnHeader) {
                loginBtnHeader.addEventListener('click', authLogic.openLoginModal);
            } else {
                console.error("Error: El botón de Iniciar Sesión no pudo ser creado o encontrado.");
            }
            if (registerBtnHeader) {
                registerBtnHeader.addEventListener('click', authLogic.openRegisterModal);
            } else {
                console.error("Error: El botón de Registrarse no pudo ser creado o encontrado.");
            }
        }
    };
    // ===================================================================
    // 4. INICIALIZACIÓN
    // ===================================================================
    showRedirectMessage();
    fetchAndRenderCourses();
    authLogic.updateHeaderUI();
    initializeRegistrationPage();
});