import * as api from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    console.log("comprar.js loaded for comprar.html");

    const checkoutForm = document.querySelector('form');
    const saveInfoCheckbox = document.getElementById('save-info');
    let currentClient = null;

    // 1. Auto-fill Logic (Enhanced)
    const rawUserData = localStorage.getItem('clienteLogueado');
    if (rawUserData) {
        try {
            const sessionData = JSON.parse(rawUserData);

            // Fetch fresh data from API to get newest address/document
            const clientes = await api.getCliente(sessionData.email);
            if (clientes && clientes.length > 0) {
                currentClient = clientes[0];

                const firstnameInput = document.getElementById('firstname');
                const lastnameInput = document.getElementById('lastname');
                const emailInput = document.getElementById('email');
                const phoneInput = document.getElementById('phone');
                const addressInput = document.getElementById('address');
                const documentInput = document.getElementById('document-id');

                if (firstnameInput) firstnameInput.value = currentClient.nombres || '';
                if (lastnameInput) lastnameInput.value = currentClient.apellidos || '';
                if (emailInput) emailInput.value = currentClient.email || '';
                if (phoneInput) phoneInput.value = currentClient.telefono || '';
                if (addressInput) addressInput.value = currentClient.direccion || '';
                if (documentInput) documentInput.value = currentClient.documento || '';
            }

        } catch (e) {
            console.error("Error in auto-fill process:", e);
        }
    }

    // 2. Form Submission and "Save Info" logic
    const paymentModal = document.getElementById('payment-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const confirmPaymentBtn = document.getElementById('confirm-payment');
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    let selectedMethod = null;

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Show the modal instead of proceeding immediately
            if (paymentModal) {
                paymentModal.classList.remove('hidden');
                document.body.style.overflow = 'hidden'; // Prevent scroll
            }
        });
    }

    // Modal Control: Close
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (paymentModal) {
                paymentModal.classList.add('hidden');
                document.body.style.overflow = ''; // Restore scroll
            }
        });
    }

    // Modal Style: Enable "Aceptar" when a method is selected
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            selectedMethod = e.target.value;
            if (confirmPaymentBtn) {
                confirmPaymentBtn.disabled = false;
            }
        });
    });

    // Final Confirmation Logic
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', async () => {
            console.log("Processing payment with method:", selectedMethod);

            // 1. Handle "Save Info" logic if checked
            if (saveInfoCheckbox && saveInfoCheckbox.checked && currentClient) {
                const updatedData = {
                    nombres: document.getElementById('firstname').value.trim(),
                    apellidos: document.getElementById('lastname').value.trim(),
                    telefono: document.getElementById('phone').value.trim(),
                    direccion: document.getElementById('address').value.trim(),
                    documento: document.getElementById('document-id').value.trim()
                };

                try {
                    const clientId = currentClient.id_cliente || currentClient.id;
                    await api.actualizarCliente(clientId, updatedData);
                    console.log("Profile updated successfully");

                    // Update localStorage too
                    localStorage.setItem('clienteLogueado', JSON.stringify({
                        ...JSON.parse(localStorage.getItem('clienteLogueado')),
                        nombres: updatedData.nombres,
                        apellidos: updatedData.apellidos,
                        nombre: `${updatedData.nombres} ${updatedData.apellidos}`,
                        telefono: updatedData.telefono
                    }));

                } catch (error) {
                    console.error("Error updating profile:", error);
                }
            }

            // 2. Finalize: Show success message and redirect
            if (paymentModal) {
                paymentModal.classList.add('hidden');
                document.body.style.overflow = '';
            }

            if (window.showToast) {
                window.showToast(`¡Pedido procesado con ${selectedMethod}! Redirigiendo...`, 'success');
            } else {
                alert(`¡Pedido procesado con ${selectedMethod}!`);
            }

            // Clean cart and redirect
            localStorage.removeItem('carrito');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        });
    }

    // 3. Order Summary Logic
    function renderOrderSummary() {
        const cart = JSON.parse(localStorage.getItem('carrito') || '[]');
        const container = document.getElementById('order-summary-items');
        const countBadge = document.getElementById('order-items-count');
        const subtotalEl = document.getElementById('summary-subtotal');
        const taxEl = document.getElementById('summary-tax');
        const totalEl = document.getElementById('summary-total');

        if (!container) return;

        container.innerHTML = '';
        let subtotal = 0;
        let totalItems = 0;

        if (cart.length === 0) {
            container.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">Tu carrito está vacío</p>';
        } else {
            cart.forEach(item => {
                const itemTotal = item.precio * item.cantidad;
                subtotal += itemTotal;
                totalItems += item.cantidad;

                const itemHtml = `
                <div class="flex items-center gap-4">
                    <div class="size-12 rounded bg-slate-100 dark:bg-slate-800 bg-cover bg-center shrink-0"
                        style="background-image: url('${item.imagen || 'assets/imágenes/prueba.jpg'}')"></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold truncate">${item.nombre}</p>
                        <p class="text-xs text-slate-500">Cant: ${item.cantidad}</p>
                    </div>
                    <span class="text-sm font-bold">$${itemTotal.toFixed(2)}</span>
                </div>`;
                container.insertAdjacentHTML('beforeend', itemHtml);
            });
        }

        const tax = subtotal * 0.08;
        const total = subtotal + tax;

        if (countBadge) countBadge.textContent = `${totalItems} Artículo${totalItems !== 1 ? 's' : ''}`;
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }

    renderOrderSummary();
});
