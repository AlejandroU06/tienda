import * as api from './api.js';

window.tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#aa1916",
                "background-light": "#f6f7f8",
                "background-dark": "#101922",
            },
            fontFamily: {
                "display": ["Manrope"]
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
        },
    },
};

document.addEventListener("DOMContentLoaded", async () => {
    console.log("app.js loaded");

    const headerLoginLink = document.getElementById('header-login-link');
    const rawUserData = localStorage.getItem('clienteLogueado');

    if (rawUserData) {
        try {
            const userData = JSON.parse(rawUserData);
            // Hide header login link if logged in
            if (headerLoginLink) headerLoginLink.classList.add('hidden');

            // Update profile in sidebar
            const profileNames = document.querySelectorAll('p.text-sm.font-bold.truncate');
            profileNames.forEach(el => {
                const sidebarTitle = el.textContent.trim();
                // Check if it's currently a placeholder or empty/undefined
                if (sidebarTitle === 'Invitado' || sidebarTitle === 'Alex Morgan' || sidebarTitle === 'undefined' || !sidebarTitle) {
                    el.textContent = userData.nombre || 'Cliente';
                    const subtitle = el.nextElementSibling;
                    if (subtitle && (subtitle.textContent === 'Visitante' || subtitle.textContent === 'Premium Member')) {
                        subtitle.textContent = "Cliente";
                    }
                }
            });

            // Change login link to logout
            const loginLinks = document.querySelectorAll('a[href="login.html"]');
            loginLinks.forEach(link => {
                const icon = link.querySelector('span.material-symbols-outlined');
                if (icon && icon.textContent === 'login') {
                    icon.textContent = 'logout';
                    icon.title = 'Cerrar Sesión';
                    link.href = "#";
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.removeItem('clienteLogueado');
                        localStorage.removeItem('carrito'); // Vaciar el carrito al cerrar sesión
                        window.location.reload();
                    });
                }
            });
        } catch (e) { }
    } else {
        // Show header login link for guests
        if (headerLoginLink) headerLoginLink.classList.remove('hidden');
    }

    const productsGrid = document.getElementById("products-grid");
    if (!productsGrid) return;


    try {
        productsGrid.innerHTML = '<p class="text-slate-500 col-span-full text-center py-12">Cargando productos...</p>';
        const urlParams = new URLSearchParams(window.location.search);
        const categoriaId = urlParams.get('categoria');

        const products = await api.getProductos(categoriaId);

        if (!products || products.length === 0) {
            productsGrid.innerHTML = '<p class="text-slate-500 col-span-full text-center py-12">No hay productos disponibles.</p>';
            return;
        }

        productsGrid.innerHTML = "";

        products.forEach(product => {
            const imageUrl = product.imagen_url || 'assets/imágenes/prueba.jpg';
            const productHtml = `
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div class="aspect-square bg-slate-100 dark:bg-slate-800 relative">
                    <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${imageUrl}')"></div>
                    <!-- Heart icon removed as requested -->
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors cursor-pointer line-clamp-2 pr-2">${product.nombre}</h3>
                        <p class="font-black text-primary flex-shrink-0">$${product.precio.toFixed(2)}</p>
                    </div>
                    <p class="text-xs text-slate-500 mb-4 line-clamp-1">${product.descripcion || ''}</p>
                    <button onclick="addToCart('${product.id_producto || product.id}', '${product.nombre}', ${product.precio}, '${imageUrl}')" class="w-full bg-slate-900 dark:bg-slate-800 hover:bg-primary text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all">
                        <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                        Añadir al Carrito
                    </button>
                </div>
            </div>`;
            productsGrid.insertAdjacentHTML('beforeend', productHtml);
        });

    } catch (error) {
        console.error("Error al cargar productos:", error);
        productsGrid.innerHTML = '<p class="text-red-500 col-span-full text-center py-12">Error al cargar productos. Por favor, intenta de nuevo.</p>';
    }
});
// Global Cart Functionality
window.addToCart = function (id, nombre, precio, imagen) {
    // Check if user is logged in
    const userData = localStorage.getItem('clienteLogueado');
    if (!userData) {
        showToast('Debes iniciar sesión para añadir productos al carrito', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    let cart = JSON.parse(localStorage.getItem('carrito') || '[]');
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.cantidad += 1;
    } else {
        cart.push({ id, nombre, precio, imagen, cantidad: 1 });
    }

    localStorage.setItem('carrito', JSON.stringify(cart));
    updateCartCount();

    // Aesthetic Toast Notification
    showToast(`¡${nombre} añadido al carrito!`, 'success');
};

window.showToast = function (message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl border border-white/10 flex items-center gap-3 animate-slide-in pointer-events-auto min-w-[300px] backdrop-blur-md bg-opacity-90';

    const icon = type === 'success' ? 'check_circle' : 'error';
    const iconColor = type === 'success' ? 'text-emerald-400' : 'text-red-400';

    toast.innerHTML = `
        <span class="material-symbols-outlined ${iconColor}">${icon}</span>
        <div class="flex-1">
            <p class="text-sm font-bold leading-tight">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="text-white/40 hover:text-white transition-colors">
            <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('animate-slide-out');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};

window.updateCartCount = function () {
    const cart = JSON.parse(localStorage.getItem('carrito') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
    const cartButtons = document.querySelectorAll('a[href="carrito.html"]');

    cartButtons.forEach(btn => {
        const cartSpan = btn.querySelector('.cart-text');
        if (cartSpan) {
            cartSpan.textContent = `Carrito (${totalItems})`;
        } else {
            // Fallback to text node if span not found
            let textNode = [...btn.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.includes('Carrito'));
            if (textNode) {
                textNode.textContent = ` Carrito (${totalItems})`;
            }
        }
    });
};

// --- Mobile Responsiveness Logic ---
function setupMobileMenu() {
    const sidebar = document.querySelector('aside');
    const menuToggle = document.getElementById('menu-toggle');
    const overlayId = 'sidebar-overlay';

    // Create overlay if it doesn't exist
    let overlay = document.getElementById(overlayId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.className = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 opacity-0 pointer-events-none transition-opacity duration-300';
        document.body.appendChild(overlay);
    }

    const toggleSidebar = (show) => {
        if (show) {
            sidebar.classList.add('sidebar-open');
            overlay.classList.remove('pointer-events-none', 'opacity-0');
            overlay.classList.add('opacity-100');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('sidebar-open');
            overlay.classList.add('opacity-0', 'pointer-events-none');
            overlay.classList.remove('opacity-100');
            document.body.style.overflow = '';
        }
    };

    if (menuToggle) {
        menuToggle.addEventListener('click', () => toggleSidebar(true));
    }

    overlay.addEventListener('click', () => toggleSidebar(false));

    // Handle navigation clicks on mobile (close sidebar after clicking a link)
    const sidebarLinks = sidebar.querySelectorAll('nav a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                toggleSidebar(false);
            }
        });
    });
}

// Call setup on DOM load
document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
});


// Initial update
updateCartCount();
