import * as db from './api.js';

document.addEventListener("DOMContentLoaded", () => {
    console.log("registro.js loaded for registro.html");

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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstnameInput = document.getElementById('firstname');
        const lastnameInput = document.getElementById('lastname');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const submitBtn = form.querySelector('button[type="submit"]');

        if (!firstnameInput || !lastnameInput || !emailInput || !passwordInput || !confirmPasswordInput) return;

        const nombres = firstnameInput.value.trim();
        const apellidos = lastnameInput.value.trim();
        const email = emailInput.value.trim();
        const telefono = passwordInput.value.trim(); // Phone as password
        const confirmPassword = confirmPasswordInput.value.trim();

        if (telefono !== confirmPassword) {
            if (window.showToast) window.showToast('Las contraseñas no coinciden', 'error');
            return;
        }

        // Show loading state
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Creando cuenta...';
        submitBtn.disabled = true;

        try {
            // Check if email already exists
            const existing = await db.getCliente(email);
            if (existing && existing.length > 0) {
                if (window.showToast) window.showToast('El correo electrónico ya está registrado', 'error');
                return;
            }

            const newCliente = {
                nombres,
                apellidos,
                email,
                telefono
            };

            await db.insertarCliente(newCliente);

            if (window.showToast) window.showToast('¡Cuenta creada correctamente! Redirigiendo...', 'success');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);

        } catch (err) {
            console.error('Registration error:', err);
            if (window.showToast) window.showToast('Error al crear la cuenta. Intenta de nuevo.', 'error');
        } finally {
            submitBtn.innerHTML = originalBtnHtml;
            submitBtn.disabled = false;
        }
    });
});
