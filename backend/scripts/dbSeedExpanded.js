const { pool } = require('../src/config/db');

const categoriesData = [
  {
    nombre: 'Calzado Deportivo',
    descripcion: 'Zapatos, tenis de running y calzado ergonómico para entrenamiento de alto rendimiento.',
  },
  {
    nombre: 'Ropa y Accesorios',
    descripcion: 'Prendas transpirables, sudaderas, camisetas técnicas y accesorios deportivos.',
  },
  {
    nombre: 'Equipamiento Outdoor',
    descripcion: 'Mochilas técnicas, bastones, carpas y accesorios para senderismo y montañismo.',
  },
  {
    nombre: 'Nutrición e Hidratación',
    descripcion: 'Botellas térmicas, geles isotónicos, electrolitos y suplementos deportivos.',
  },
];

const productsData = [
  {
    categoriaNombre: 'Calzado Deportivo',
    nombre: 'Tenis Running Nitro 2.0',
    descripcion: 'Calzado ligero con suela de amortiguación reactiva ideal para media y larga distancia.',
    precio: 89.99,
    stock: 25,
    imagen_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
  },
  {
    categoriaNombre: 'Calzado Deportivo',
    nombre: 'Zapatillas Trail Runner Waterproof',
    descripcion: 'Calzado reforzado con agarre multidireccional y membrana impermeable.',
    precio: 115.5,
    stock: 14,
    imagen_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
  },
  {
    categoriaNombre: 'Calzado Deportivo',
    nombre: 'Botas Trekking Alpine Explorer',
    descripcion: 'Calzado de caña media con soporte de tobillo y suela de alta tracción para roca.',
    precio: 139.99,
    stock: 8,
    imagen_url: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600',
  },
  {
    categoriaNombre: 'Calzado Deportivo',
    nombre: 'Sandalias Deportivas Recovery Slide',
    descripcion: 'Calzado ergonómico para descanso post-entrenamiento con espuma de retorno.',
    precio: 34.5,
    stock: 20,
    imagen_url: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600',
  },
  {
    categoriaNombre: 'Ropa y Accesorios',
    nombre: 'Camiseta Técnica Dry-Fit',
    descripcion: 'Camiseta deportiva transpirable con tecnología de secado rápido y protección UV.',
    precio: 24.9,
    stock: 50,
    imagen_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600',
  },
  {
    categoriaNombre: 'Ropa y Accesorios',
    nombre: 'Sudadera con Capucha Sport Fleece',
    descripcion: 'Sudadera térmica con bolsillo canguro y capucha ajustable para entrenamiento en clima frío.',
    precio: 49.99,
    stock: 30,
    imagen_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600',
  },
  {
    categoriaNombre: 'Ropa y Accesorios',
    nombre: 'Gorra Deportiva Aeroready',
    descripcion: 'Gorra con visera curva, cierre ajustable y paneles transpirables.',
    precio: 18.0,
    stock: 40,
    imagen_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600',
  },
  {
    categoriaNombre: 'Ropa y Accesorios',
    nombre: 'Pantalón Corto Running 2 en 1',
    descripcion: 'Short ultraligero con licra interna compresiva y bolsillo con cremallera.',
    precio: 32.0,
    stock: 22,
    imagen_url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600',
  },
  {
    categoriaNombre: 'Ropa y Accesorios',
    nombre: 'Chaqueta Cortavientos Reflectiva',
    descripcion: 'Chaqueta plegable resistente al agua con reflectores de alta visibilidad 360.',
    precio: 65.0,
    stock: 15,
    imagen_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600',
  },
  {
    categoriaNombre: 'Equipamiento Outdoor',
    nombre: 'Mochila Trekking 40L Impermeable',
    descripcion: 'Mochila ergonómica con soporte lumbar, funda de lluvia y compartimento para bolsa de agua.',
    precio: 85.0,
    stock: 12,
    imagen_url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600',
  },
  {
    categoriaNombre: 'Equipamiento Outdoor',
    nombre: 'Bastones de Senderismo Ultraligeros',
    descripcion: 'Par de bastones plegables de fibra de carbono con empuñadura de corcho natural.',
    precio: 42.5,
    stock: 18,
    imagen_url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600',
  },
  {
    categoriaNombre: 'Nutrición e Hidratación',
    nombre: 'Botella Térmica Inox 750ml',
    descripcion: 'Botella de doble pared al vacío con tapón hermético deportivo y libre de BPA.',
    precio: 21.99,
    stock: 35,
    imagen_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600',
  },
  {
    categoriaNombre: 'Nutrición e Hidratación',
    nombre: 'Pack 6 Geles Energéticos Isotónicos',
    descripcion: 'Geles sabor cítrico de absorción rápida con 22g de carbohidratos y electrolitos.',
    precio: 15.0,
    stock: 60,
    imagen_url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600',
  },
  {
    categoriaNombre: 'Nutrición e Hidratación',
    nombre: 'Proteína Whey Isolate 1kg Vainilla',
    descripcion: 'Proteína aislada de suero de leche con 27g de proteína por porción y cero azúcar.',
    precio: 45.0,
    stock: 20,
    imagen_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600',
  },
];

async function seedExpanded() {
  const client = await pool.connect();
  try {
    console.log('Iniciando carga del conjunto de datos ampliado...');
    await client.query('BEGIN');

    const categoryMap = new Map();

    for (const cat of categoriesData) {
      const res = await client.query(
        `INSERT INTO categoria (nombre, descripcion)
         VALUES ($1, $2)
         ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion
         RETURNING id_categoria, nombre`,
        [cat.nombre, cat.descripcion]
      );
      categoryMap.set(res.rows[0].nombre, res.rows[0].id_categoria);
    }

    for (const prod of productsData) {
      const idCategoria = categoryMap.get(prod.categoriaNombre);
      if (!idCategoria) continue;

      const existingProd = await client.query(
        'SELECT id_producto FROM producto WHERE id_categoria = $1 AND nombre = $2',
        [idCategoria, prod.nombre]
      );

      if (existingProd.rows.length === 0) {
        await client.query(
          `INSERT INTO producto (id_categoria, nombre, descripcion, precio, stock, imagen_url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [idCategoria, prod.nombre, prod.descripcion, prod.precio, prod.stock, prod.imagen_url]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`Catálogo ampliado cargado con éxito: ${categoriesData.length} categorías y ${productsData.length} productos.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error durante la carga ampliada:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedExpanded();
