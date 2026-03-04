import * as db from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    // Ensure user is logged in
    const rawUserData = localStorage.getItem('clienteLogueado');
    if (!rawUserData) {
        window.location.href = 'login.html';
        return;
    }

    const userData = JSON.parse(rawUserData);
    const container = document.getElementById('orders-container');

    if (container) {
        let allOrders = [];

        function renderOrders(ordersToRender) {
            container.innerHTML = '';
            if (!ordersToRender || ordersToRender.length === 0) {
                container.innerHTML = `
                    <div class="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span class="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-700 mb-4 block">receipt_long</span>
                        <h4 class="font-bold text-lg mb-2">No se encontraron órdenes</h4>
                        <p class="text-slate-500 text-sm">Prueba con otro término de búsqueda.</p>
                    </div>`;
                return;
            }

            ordersToRender.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).forEach((order, index) => {
                const date = new Date(order.fecha).toLocaleDateString();
                const card = document.createElement('div');
                card.className = "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex items-center justify-between";
                card.innerHTML = `
                    <div>
                        <h4 class="font-bold text-slate-900 dark:text-slate-100">Pedido #${allOrders.length - allOrders.indexOf(order)}</h4>
                        <p class="text-sm text-slate-500 font-medium mt-1">Realizada el ${date}</p>
                    </div>
                    <div class="flex items-center gap-8">
                        <div class="text-right">
                            <p class="text-xs text-slate-400 uppercase font-bold tracking-tight">Total</p>
                            <p class="text-lg font-black text-slate-900 dark:text-slate-100">$${order.total}</p>
                        </div>
                        <button class="view-details-btn px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-all">
                            Ver Detalles
                        </button>
                    </div>`;

                const viewBtn = card.querySelector('.view-details-btn');
                viewBtn.addEventListener('click', () => showOrderDetails(order, allOrders.length - allOrders.indexOf(order)));

                container.appendChild(card);
            });
        }

        try {
            const userId = userData.id || userData.id_cliente;
            allOrders = await db.getVentasByCliente(userId);

            if (!allOrders || allOrders.length === 0) {
                container.innerHTML = `
                    <div class="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span class="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-700 mb-4 block">receipt_long</span>
                        <h4 class="font-bold text-lg mb-2">No se encontraron órdenes</h4>
                        <p class="text-slate-500 text-sm">Parece que aún no has realizado ninguna compra.</p>
                    </div>`;
                return;
            }

            renderOrders(allOrders);

            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase().trim();
                    const filtered = allOrders.filter(order => {
                        const date = new Date(order.fecha).toLocaleDateString().toLowerCase();
                        const orderNum = (allOrders.length - allOrders.indexOf(order)).toString();
                        return orderNum.includes(term) ||
                            order.total.toString().includes(term) ||
                            date.includes(term) ||
                            (order.estado && order.estado.toLowerCase().includes(term));
                    });
                    renderOrders(filtered);
                });
            }
        } catch (e) {
            console.error(e);
            container.innerHTML = '<p class="text-red-500 py-12 text-center">Error al cargar las órdenes.</p>';
        }
    }

    // Modal elements
    const modal = document.getElementById('order-modal');
    const modalContent = modal?.querySelector('div > div');
    const closeBtns = [document.getElementById('close-modal'), document.getElementById('close-modal-btn')];
    const itemsContainer = document.getElementById('modal-items-container');

    async function showOrderDetails(order, orderNum) {
        if (!modal || !itemsContainer) return;

        // Reset and show loading
        itemsContainer.innerHTML = '<p class="text-slate-500 py-8 text-center">Cargando detalles...</p>';
        document.getElementById('modal-order-number').textContent = `Detalles del Pedido #${orderNum}`;
        document.getElementById('modal-order-date').textContent = new Date(order.fecha).toLocaleDateString();
        document.getElementById('modal-order-total').textContent = `$${order.total}`;

        // Populate Status and Payment
        const statusEl = document.getElementById('modal-order-status');
        const paymentEl = document.getElementById('modal-order-payment');

        if (statusEl) {
            statusEl.textContent = order.estado || 'Pendiente';
            // Apply colors based on status
            const status = (order.estado || '').toUpperCase();
            statusEl.className = 'inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ';
            if (status === 'PAGADA' || status === 'COMPLETADA' || status === 'DELIVERED') {
                statusEl.classList.add('bg-emerald-100', 'text-emerald-700');
            } else if (status === 'PENDIENTE' || status === 'PENDING') {
                statusEl.classList.add('bg-amber-100', 'text-amber-700');
            } else if (status === 'CANCELADA' || status === 'CANCELLED') {
                statusEl.classList.add('bg-red-100', 'text-red-700');
            } else {
                statusEl.classList.add('bg-slate-100', 'text-slate-600');
            }
        }

        if (paymentEl) {
            paymentEl.textContent = order.metodo_pago || 'No especificado';
        }

        // Show modal with animation
        modal.classList.remove('pointer-events-none', 'opacity-0');
        modal.classList.add('opacity-100');
        modalContent?.classList.remove('scale-95');
        modalContent?.classList.add('scale-100');

        try {
            const idVenta = order.id_venta || order.id;
            const details = await db.getDetalleVenta(idVenta);

            if (!details || details.length === 0) {
                itemsContainer.innerHTML = '<p class="text-slate-500 py-8 text-center">No se encontraron productos para este pedido.</p>';
                return;
            }

            itemsContainer.innerHTML = '';
            details.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = "flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800";
                itemDiv.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined">shopping_bag</span>
                        </div>
                        <div>
                            <p class="font-bold text-slate-900 dark:text-slate-100">${item.producto?.nombre || 'Producto'}</p>
                            <p class="text-xs text-slate-500">Cantidad: ${item.cantidad} • Precio: $${item.precio_unitario || item.producto?.precio}</p>
                        </div>
                    </div>
                    <p class="font-black text-slate-900 dark:text-slate-100">$${(item.cantidad * (item.precio_unitario || item.producto?.precio)).toFixed(2)}</p>
                `;
                itemsContainer.appendChild(itemDiv);
            });
        } catch (error) {
            console.error(error);
            itemsContainer.innerHTML = '<p class="text-red-500 py-8 text-center">Error al cargar los detalles.</p>';
        }
    }

    function closeModal() {
        modal?.classList.add('opacity-0', 'pointer-events-none');
        modal?.classList.remove('opacity-100');
        modalContent?.classList.add('scale-95');
        modalContent?.classList.remove('scale-100');
    }

    closeBtns.forEach(btn => btn?.addEventListener('click', closeModal));
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
});
