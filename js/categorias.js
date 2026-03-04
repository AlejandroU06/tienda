import * as api from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    console.log("categorias.js loaded for categorias.html");

    const categoriesGrid = document.getElementById("categories-grid");
    if (!categoriesGrid) return;

    try {
        categoriesGrid.innerHTML = '<p class="text-slate-500 col-span-full text-center py-12">Cargando categorías...</p>';
        const categorias = await api.getTipoProductos();

        if (!categorias || categorias.length === 0) {
            categoriesGrid.innerHTML = '<p class="text-slate-500 col-span-full text-center py-12">No hay categorías disponibles.</p>';
            return;
        }

        categoriesGrid.innerHTML = "";

        const imageMap = {
            'electrónica': 'electronica.jpg',
            'hogar': 'hogar.jpg',
            'deportes': 'deporte.jpg',
            'deporte': 'deporte.jpg',
            'ropa': 'ropa.jpg'
        };

        categorias.forEach(cat => {
            const normalizedName = cat.nombre.toLowerCase().trim();
            const fileName = imageMap[normalizedName] || 'prueba.jpg';
            const imageUrl = `assets/imágenes/${fileName}`;

            const catHtml = `
            <div onclick="window.location.href='index.html?categoria=${cat.id_tipo_producto || cat.id}'" class="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-800 shadow-sm hover:shadow-xl transition-all duration-500">
                <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style="background-image: url('${imageUrl}')"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-6">
                    <h4 class="text-white text-2xl font-black">${cat.nombre}</h4>
                    <p class="text-white/60 text-sm mt-2 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Explora productos en esta categoría.</p>
                </div>
            </div>`;
            categoriesGrid.insertAdjacentHTML('beforeend', catHtml);
        });

    } catch (error) {
        console.error("Error al cargar categorías:", error);
        categoriesGrid.innerHTML = '<p class="text-red-500 col-span-full text-center py-12">Error al cargar categorías. Por favor, intenta de nuevo.</p>';
    }
});
