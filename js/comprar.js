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

    // 2. Form Submission and Validation Logic
    const paymentModal = document.getElementById('payment-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const confirmPaymentBtn = document.getElementById('confirm-payment');
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    let selectedMethod = null;

    function validateForm() {
        const requiredIds = ['firstname', 'lastname', 'email', 'phone', 'address', 'document-id'];
        let firstEmpty = null;
        let isValid = true;

        requiredIds.forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;

            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error-field');
                if (!firstEmpty) firstEmpty = input;

                // Remove error style when user starts typing
                input.oninput = () => {
                    input.classList.remove('error-field');
                    input.oninput = null; // Remove this listener
                };
            } else {
                input.classList.remove('error-field');
            }
        });

        if (!isValid) {
            if (window.showToast) {
                window.showToast('Por favor, completa todos los campos obligatorios.', 'error');
            } else {
                alert('Por favor, completa todos los campos obligatorios.');
            }
            if (firstEmpty) firstEmpty.focus();
        }

        return isValid;
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validate before showing modal
            if (!validateForm()) return;

            // Show the modal if valid
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
            if (!selectedMethod) return;

            confirmPaymentBtn.disabled = true;
            confirmPaymentBtn.innerHTML = '<span class="animate-spin material-symbols-outlined inline-block align-middle mr-2">sync</span> Procesando...';

            const cart = JSON.parse(localStorage.getItem('carrito') || '[]');
            let subtotalVal = 0;
            cart.forEach(item => subtotalVal += (item.precio * item.cantidad));
            const tax = subtotalVal * 0.08;
            const total = subtotalVal + tax;

            try {
                // 1. Create Order in 'venta' table
                const ventaData = {
                    id_cliente: currentClient.id_cliente || currentClient.id,
                    total: total,
                    metodo_pago: selectedMethod,
                    estado: selectedMethod === 'EFECTIVO' ? 'PENDIENTE' : 'PAGADA',
                    fecha: new Date().toISOString()
                };

                const insertedVentaArray = await api.insertarVenta(ventaData);
                if (!insertedVentaArray || insertedVentaArray.length === 0) throw new Error("Error creating order");

                const idVenta = insertedVentaArray[0].id_venta;

                // 2. Insert Order Details in 'detalle_venta'
                for (const item of cart) {
                    const detalleData = {
                        id_venta: idVenta,
                        id_producto: item.id_producto || item.id,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio,
                        subtotal: item.precio * item.cantidad
                    };
                    await api.insertarDetalleVenta(detalleData);
                }

                // 3. Conditional Profile Update
                if (saveInfoCheckbox && saveInfoCheckbox.checked && currentClient) {
                    const formValues = {
                        nombres: document.getElementById('firstname').value.trim(),
                        apellidos: document.getElementById('lastname').value.trim(),
                        telefono: document.getElementById('phone').value.trim(),
                        direccion: document.getElementById('address').value.trim(),
                        documento: document.getElementById('document-id').value.trim()
                    };

                    // Check for differences before updating API
                    const hasChanges =
                        formValues.nombres !== (currentClient.nombres || '') ||
                        formValues.apellidos !== (currentClient.apellidos || '') ||
                        formValues.telefono !== (currentClient.telefono || '') ||
                        formValues.direccion !== (currentClient.direccion || '') ||
                        formValues.documento !== (currentClient.documento || '');

                    if (hasChanges) {
                        const clientId = currentClient.id_cliente || currentClient.id;
                        await api.actualizarCliente(clientId, formValues);
                        console.log("Profile updated with changes");

                        // Update local storage
                        localStorage.setItem('clienteLogueado', JSON.stringify({
                            ...JSON.parse(localStorage.getItem('clienteLogueado')),
                            ...formValues,
                            nombre: `${formValues.nombres} ${formValues.apellidos}`
                        }));
                    }
                }

                // 4. Finalize
                if (paymentModal) {
                    paymentModal.classList.add('hidden');
                    document.body.style.overflow = '';
                }

                if (window.showToast) {
                    window.showToast(`¡Pedido #${idVenta} procesado! Redirigiendo...`, 'success');
                }

                localStorage.removeItem('carrito');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);

            } catch (error) {
                console.error("Critical error in checkout:", error);
                if (window.showToast) {
                    window.showToast('Error al procesar el pedido. Intente de nuevo.', 'error');
                } else {
                    alert('Error al procesar el pedido.');
                }
                confirmPaymentBtn.disabled = false;
                confirmPaymentBtn.textContent = 'Aceptar';
            }
        });
    }

    // 3. Order Summary Logic
    function renderOrderSummary() {
        const cartItems = JSON.parse(localStorage.getItem('carrito') || '[]');
        const container = document.getElementById('order-summary-items');
        const countBadge = document.getElementById('order-items-count');
        const subtotalEl = document.getElementById('summary-subtotal');
        const taxEl = document.getElementById('summary-tax');
        const totalEl = document.getElementById('summary-total');

        if (!container) return;

        container.innerHTML = '';
        let subtotal = 0;
        let totalItems = 0;

        if (cartItems.length === 0) {
            container.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">Tu carrito está vacío</p>';
        } else {
            cartItems.forEach(item => {
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
