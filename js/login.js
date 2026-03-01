import * as db from './api.js';

document.addEventListener("DOMContentLoaded", () => {
    console.log("login.js loaded for login.html");

    const form = document.querySelector('form');
    if (!form) return;

    // Toggle password visibility
    const toggleBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggle-password-icon');

    if (toggleBtn && passwordInput && toggleIcon) {
        toggleBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.textContent = 'visibility_off';
            } else {
                passwordInput.type = 'password';
                toggleIcon.textContent = 'visibility';
            }
        });
    }

    // Custom Alert Function
    const alertBox = document.getElementById('login-alert');
    const alertIcon = document.getElementById('login-alert-icon');
    const alertMsg = document.getElementById('login-alert-message');

    function showAlert(message, type = 'error') {
        if (!alertBox) return alert(message);

        alertBox.classList.remove('hidden', 'bg-red-50', 'text-red-600', 'border-red-200', 'bg-green-50', 'text-green-600', 'border-green-200', 'dark:bg-red-900/20', 'dark:border-red-800', 'dark:text-red-400', 'dark:bg-green-900/20', 'dark:border-green-800', 'dark:text-green-400');
        alertBox.classList.add('border');

        if (type === 'error') {
            alertBox.classList.add('bg-red-50', 'text-red-600', 'border-red-200', 'dark:bg-red-900/20', 'dark:border-red-800', 'dark:text-red-400');
            alertIcon.textContent = 'error';
        } else {
            alertBox.classList.add('bg-green-50', 'text-green-600', 'border-green-200', 'dark:bg-green-900/20', 'dark:border-green-800', 'dark:text-green-400');
            alertIcon.textContent = 'check_circle';
        }

        alertMsg.textContent = message;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const submitBtn = form.querySelector('button[type="submit"]');

        if (!emailInput || !passwordInput) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (alertBox) alertBox.classList.add('hidden'); // Hide previous alerts

        // Show loading state
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Iniciando sesión...';
        submitBtn.disabled = true;

        try {
            const clientes = await db.getCliente(email);

            if (clientes && clientes.length > 0) {
                const cliente = clientes[0];

                // Compare provided password with user's phone number as requested
                if (cliente.telefono === password) {
                    // Success! Save session state
                    localStorage.setItem('clienteLogueado', JSON.stringify({
                        id: cliente.id_cliente || cliente.id,
                        nombre: (cliente.nombres || '') + ' ' + (cliente.apellidos || ''),
                        email: cliente.email
                    }));
                    showAlert('¡Sesión iniciada correctamente!', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                } else {
                    showAlert('Contraseña (teléfono) incorrecta. Por favor intente de nuevo.', 'error');
                }
            } else {
                showAlert('No se encontró ninguna cuenta con ese correo electrónico.', 'error');
            }
        } catch (err) {
            console.error('Error in login:', err);
            showAlert('Error al intentar iniciar sesión. Por favor revise su conexión.', 'error');
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalBtnHtml;
            submitBtn.disabled = false;
        }
    });
});
