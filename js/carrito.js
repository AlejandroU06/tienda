import * as db from './api.js';

document.addEventListener("DOMContentLoaded", () => {
    console.log("carrito.js loaded for carrito.html");

    // Ensure user is logged in
    const userData = localStorage.getItem('clienteLogueado');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    renderCart();
});

function renderCart() {
    const cart = JSON.parse(localStorage.getItem('carrito') || '[]');
    const itemsContainer = document.getElementById('cart-items-container');
    const summaryContainer = document.getElementById('cart-summary-container');
    const emptyMessage = document.getElementById('empty-cart-message');
    const cartCard = itemsContainer?.parentElement;
    const cartTitle = document.getElementById('cart-title');

    if (!itemsContainer || !summaryContainer || !emptyMessage) return;

    if (cart.length === 0) {
        if (cartCard) cartCard.classList.add('hidden');
        summaryContainer.classList.add('hidden');
        emptyMessage.classList.remove('hidden');
        if (cartTitle) cartTitle.textContent = "Cart Items (0)";
        return;
    }

    // Show cart, hide empty message
    if (cartCard) cartCard.classList.remove('hidden');
    summaryContainer.classList.remove('hidden');
    emptyMessage.classList.add('hidden');

    itemsContainer.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.precio * item.cantidad;
        subtotal += itemTotal;

        const itemHtml = `
        <div class="p-6 flex items-center gap-6">
            <div class="size-24 rounded-lg bg-slate-100 dark:bg-slate-800 bg-cover bg-center flex-shrink-0 shadow-inner"
                style="background-image: url('${item.imagen}')"></div>
            <div class="flex-1">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-slate-900 dark:text-slate-100">${item.nombre}</h4>
                        <p class="text-xs text-slate-500 mt-1 uppercase tracking-wider">NexusStore Item</p>
                    </div>
                    <p class="font-black text-lg">$${item.precio.toFixed(2)}</p>
                </div>
                <div class="flex items-center justify-between mt-4">
                    <div class="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <button onclick="changeQuantity('${item.id}', -1)"
                            class="px-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 border-r border-slate-200 dark:border-slate-700">-</button>
                        <span class="px-4 py-1 text-sm font-bold min-w-[40px] text-center">${item.cantidad}</span>
                        <button onclick="changeQuantity('${item.id}', 1)"
                            class="px-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 border-l border-slate-200 dark:border-slate-700">+</button>
                    </div>
                    <button onclick="removeFromCart('${item.id}')"
                        class="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-tight">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                        Remove
                    </button>
                </div>
            </div>
        </div>`;
        itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
    });

    // Update Title
    if (cartTitle) {
        const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
        cartTitle.textContent = `Cart Items (${totalItems})`;
    }

    // Update Summary
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

window.changeQuantity = function (id, delta) {
    let cart = JSON.parse(localStorage.getItem('carrito') || '[]');
    const item = cart.find(i => i.id === id);
    if (item) {
        item.cantidad += delta;
        if (item.cantidad <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        localStorage.setItem('carrito', JSON.stringify(cart));
        renderCart();
        if (window.updateCartCount) window.updateCartCount();
    }
};

window.removeFromCart = function (id) {
    let cart = JSON.parse(localStorage.getItem('carrito') || '[]');
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('carrito', JSON.stringify(cart));
    renderCart();
    if (window.updateCartCount) window.updateCartCount();
};
