const API_URL = 'https://kwxbvneneywyxkhhutcl.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eGJ2bmVuZXl3eXhraGh1dGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDI1NTcsImV4cCI6MjA4Nzc3ODU1N30.TEyIHnZfFRsFaJ8jGsKUKVqDtJVoAeWX0uE9cRXN8EY';

const headers = {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json'
};

export async function getProductos(categoriaId = null) {
    try {
        let url = `${API_URL}/rest/v1/producto?select=*`;
        if (categoriaId) {
            url += `&id_tipo_producto=eq.${encodeURIComponent(categoriaId)}`;
        }
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) throw new Error('Error al consultar productos');
        return await response.json();
    } catch (error) {
        console.error('getProductos error:', error);
        throw error;
    }
}

export async function getTipoProductos() {
    try {
        const response = await fetch(`${API_URL}/rest/v1/tipo_producto?select=*`, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) throw new Error('Error al consultar tipo_producto');
        return await response.json();
    } catch (error) {
        console.error('getTipoProductos error:', error);
        throw error;
    }
}

export async function getCliente(email) {
    try {
        const url = `${API_URL}/rest/v1/cliente?email=eq.${encodeURIComponent(email)}&select=*`;
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) throw new Error('Error al consultar cliente');
        return await response.json();
    } catch (error) {
        console.error('getCliente error:', error);
        throw error;
    }
}

export async function insertarCliente(clienteData) {
    try {
        const response = await fetch(`${API_URL}/rest/v1/cliente`, {
            method: 'POST',
            headers: {
                ...headers,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(clienteData)
        });
        if (!response.ok) throw new Error('Error al insertar cliente');
        return await response.json();
    } catch (error) {
        console.error('insertarCliente error:', error);
        throw error;
    }
}

export async function getVentasByCliente(clienteId) {
    try {
        const url = `${API_URL}/rest/v1/venta?id_cliente=eq.${encodeURIComponent(clienteId)}&select=*`;
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) throw new Error('Error al consultar ventas');
        return await response.json();
    } catch (error) {
        console.error('getVentas error:', error);
        throw error;
    }
}

export async function insertarVenta(ventaData) {
    try {
        const response = await fetch(`${API_URL}/rest/v1/venta`, {
            method: 'POST',
            headers: {
                ...headers,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(ventaData)
        });
        if (!response.ok) throw new Error('Error al insertar venta');
        return await response.json();
    } catch (error) {
        console.error('insertarVenta error:', error);
        throw error;
    }
}

export async function insertarDetalleVenta(detalleData) {
    try {
        const response = await fetch(`${API_URL}/rest/v1/detalle_venta`, {
            method: 'POST',
            headers: {
                ...headers,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(detalleData)
        });
        if (!response.ok) throw new Error('Error al insertar detalle venta');
        return await response.json();
    } catch (error) {
        console.error('insertarDetalleVenta error:', error);
        throw error;
    }
}

export async function getDetalleVenta(ventaId) {
    try {
        const url = `${API_URL}/rest/v1/detalle_venta?id_venta=eq.${encodeURIComponent(ventaId)}&select=*,producto(nombre,precio)`;
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) throw new Error('Error al consultar detalle de venta');
        return await response.json();
    } catch (error) {
        console.error('getDetalleVenta error:', error);
        throw error;
    }
}
