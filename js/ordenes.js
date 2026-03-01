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
        container.innerHTML = '<p class="text-slate-500 py-12 text-center">Cargando órdenes...</p>';
        try {
            const userId = userData.id || userData.id_cliente;
            const orders = await db.getVentasByCliente(userId);

            if (!orders || orders.length === 0) {
                container.innerHTML = `
                    <div class="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span class="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-700 mb-4 block">receipt_long</span>
                        <h4 class="font-bold text-lg mb-2">No se encontraron órdenes</h4>
                        <p class="text-slate-500 text-sm">Parece que aún no has realizado ninguna compra.</p>
                    </div>`;
                return;
            }

            container.innerHTML = '';
            orders.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).forEach((order, index) => {
                const date = new Date(order.fecha).toLocaleDateString();
                const card = document.createElement('div');
                card.className = "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex items-center justify-between";
                card.innerHTML = `
                    <div>
                        <h4 class="font-bold text-slate-900 dark:text-slate-100">Orden #${orders.length - index}</h4>
                        <p class="text-sm text-slate-500 font-medium mt-1">Realizada el ${date}</p>
                    </div>
                    <div class="flex items-center gap-8">
                        <div class="text-right">
                            <p class="text-xs text-slate-400 uppercase font-bold tracking-tight">Total</p>
                            <p class="text-lg font-black text-slate-900 dark:text-slate-100">$${order.total}</p>
                        </div>
                        <button class="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-all">
                            Ver Detalles
                        </button>
                    </div>`;
                container.appendChild(card);
            });
        } catch (e) {
            console.error(e);
            container.innerHTML = '<p class="text-red-500 py-12 text-center">Error al cargar las órdenes.</p>';
        }
    }
});
