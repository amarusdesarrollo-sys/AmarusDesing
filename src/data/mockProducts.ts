import type { Product } from "@/types";

// Mock data de productos para todas las categorías
// Estos productos se pueden usar para testing y luego migrar a Firebase

export const mockProducts: Product[] = [
  // JOYERÍA ARTESANAL
  {
    id: "joy-001",
    name: "Anillo de Plata con Cuarzo Rosa",
    description:
      "Hermoso anillo artesanal de plata 925 con cuarzo rosa natural. Diseño único y delicado, perfecto para ocasiones especiales.",
    price: 4500, // €45.00 (en centavos)
    originalPrice: 5500,
    category: "joyeria-artesanal",
    subcategory: "anillos",
    images: [
      {
        id: "img-joy-001-1",
        url: "/images/products/joyeria-artesanal/anillo-cuarzo-rosa.jpg",
        alt: "Anillo de plata con cuarzo rosa",
        publicId: "joyeria-artesanal/anillo-cuarzo-rosa",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 5,
    featured: true,
    tags: ["plata", "cuarzo rosa", "artesanal", "exclusivo"],
    materials: ["Plata 925", "Cuarzo Rosa Natural"],
    dimensions: "Talla 16",
    weight: 5,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    seo: {
      title: "Anillo de Plata con Cuarzo Rosa - Joyería Artesanal",
      description:
        "Anillo artesanal de plata 925 con cuarzo rosa natural. Diseño único.",
      keywords: ["anillo", "plata", "cuarzo rosa", "joyería artesanal"],
    },
  },
  {
    id: "joy-002",
    name: "Colgante de Ámbar del Báltico",
    description:
      "Elegante colgante con ámbar del Báltico auténtico engarzado en plata. Pieza única que captura la luz de forma excepcional.",
    price: 6800,
    originalPrice: 7500,
    category: "joyeria-artesanal",
    subcategory: "colgantes",
    images: [
      {
        id: "img-joy-002-1",
        url: "/images/products/joyeria-artesanal/colgante-ambar.jpg",
        alt: "Colgante de ámbar del Báltico",
        publicId: "joyeria-artesanal/colgante-ambar",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 3,
    featured: true,
    tags: ["ámbar", "plata", "colgante", "única"],
    materials: ["Plata 925", "Ámbar del Báltico"],
    dimensions: "3cm x 2cm",
    weight: 8,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
    seo: {
      title: "Colgante de Ámbar del Báltico - Joyería Artesanal",
      description: "Colgante artesanal con ámbar del Báltico auténtico.",
      keywords: ["colgante", "ámbar", "joyería artesanal"],
    },
  },
  {
    id: "joy-003",
    name: "Pulsera de Perlas de Agua Dulce",
    description:
      "Pulsera elegante con perlas naturales de agua dulce combinadas con plata. Perfecta para complementar cualquier outfit.",
    price: 3200,
    category: "joyeria-artesanal",
    subcategory: "pulseras",
    images: [
      {
        id: "img-joy-003-1",
        url: "/images/products/joyeria-artesanal/pulsera-perlas.jpg",
        alt: "Pulsera de perlas de agua dulce",
        publicId: "joyeria-artesanal/pulsera-perlas",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 8,
    featured: false,
    tags: ["perlas", "plata", "pulsera", "elegante"],
    materials: ["Perlas Naturales", "Plata 925"],
    dimensions: "Talla 17cm",
    weight: 12,
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
    seo: {
      title: "Pulsera de Perlas de Agua Dulce - Joyería Artesanal",
      description: "Pulsera elegante con perlas naturales y plata.",
      keywords: ["pulsera", "perlas", "joyería artesanal"],
    },
  },

  // MINERALES DEL MUNDO
  {
    id: "min-001",
    name: "Geoda de Amatista Brasileña",
    description:
      "Impressionante geoda de amatista de Brasil con formaciones cristalinas únicas. Pieza de colección perfecta para decoración o meditación.",
    price: 8500,
    originalPrice: 10000,
    category: "minerales-del-mundo",
    subcategory: "geodas",
    images: [
      {
        id: "img-min-001-1",
        url: "/images/products/minerales-del-mundo/geoda-amatista.jpg",
        alt: "Geoda de amatista brasileña",
        publicId: "minerales-del-mundo/geoda-amatista",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 2,
    featured: true,
    tags: ["amatista", "geoda", "Brasil", "decoración"],
    materials: ["Amatista Natural"],
    dimensions: "15cm x 12cm x 10cm",
    weight: 1200,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
    seo: {
      title: "Geoda de Amatista Brasileña - Minerales del Mundo",
      description: "Geoda de amatista de Brasil con formaciones únicas.",
      keywords: ["geoda", "amatista", "mineral", "Brasil"],
    },
  },
  {
    id: "min-002",
    name: "Cuarzo Cristal Maestro",
    description:
      "Cuarzo cristal maestro de calidad premium con claridad excepcional. Ideal para coleccionistas y para uso en prácticas espirituales.",
    price: 12000,
    category: "minerales-del-mundo",
    subcategory: "cuarzos",
    images: [
      {
        id: "img-min-002-1",
        url: "/images/products/minerales-del-mundo/cuarzo-cristal.jpg",
        alt: "Cuarzo cristal maestro",
        publicId: "minerales-del-mundo/cuarzo-cristal",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 4,
    featured: true,
    tags: ["cuarzo", "cristal", "maestro", "premium"],
    materials: ["Cuarzo Cristal Natural"],
    dimensions: "12cm x 8cm x 6cm",
    weight: 800,
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-05"),
    seo: {
      title: "Cuarzo Cristal Maestro - Minerales del Mundo",
      description: "Cuarzo cristal maestro de calidad premium.",
      keywords: ["cuarzo", "cristal", "mineral", "premium"],
    },
  },
  {
    id: "min-003",
    name: "Lote de Cabujones Variados",
    description:
      "Colección de 6 cabujones de diferentes minerales (ágata, jade, ópalo, turquesa, cornalina y lapislázuli). Perfecto para joyería artesanal.",
    price: 3500,
    category: "minerales-del-mundo",
    subcategory: "cabujones",
    images: [
      {
        id: "img-min-003-1",
        url: "/images/products/minerales-del-mundo/cabujones-variados.jpg",
        alt: "Lote de cabujones variados",
        publicId: "minerales-del-mundo/cabujones-variados",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 10,
    featured: false,
    tags: ["cabujones", "lote", "variados", "joyería"],
    materials: [
      "Ágata",
      "Jade",
      "Ópalo",
      "Turquesa",
      "Cornelina",
      "Lapislázuli",
    ],
    dimensions: "2-3cm cada uno",
    weight: 150,
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
    seo: {
      title: "Lote de Cabujones Variados - Minerales del Mundo",
      description: "Colección de 6 cabujones de diferentes minerales.",
      keywords: ["cabujones", "minerales", "lote", "joyería"],
    },
  },

  // MACRAMÉ
  {
    id: "mac-001",
    name: "Tapiz de Macramé Bohemio",
    description:
      "Hermoso tapiz de macramé hecho a mano con hilo de algodón natural. Diseño bohemio único que añade calidez a cualquier espacio.",
    price: 5500,
    originalPrice: 6500,
    category: "macrame",
    subcategory: "tapices",
    images: [
      {
        id: "img-mac-001-1",
        url: "/images/products/macrame/tapiz-bohemio.jpg",
        alt: "Tapiz de macramé bohemio",
        publicId: "macrame/tapiz-bohemio",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 6,
    featured: true,
    tags: ["macramé", "tapiz", "bohemio", "decoración"],
    materials: ["Algodón Natural", "Madera"],
    dimensions: "80cm x 120cm",
    weight: 300,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
    seo: {
      title: "Tapiz de Macramé Bohemio - Macramé Artesanal",
      description: "Tapiz de macramé hecho a mano con diseño bohemio.",
      keywords: ["macramé", "tapiz", "decoración", "bohemio"],
    },
  },
  {
    id: "mac-002",
    name: "Porta Macetas con Macramé",
    description:
      "Elegante porta macetas hecho con macramé artesanal. Perfecto para plantas colgantes, añade estilo natural a tu hogar.",
    price: 2800,
    category: "macrame",
    subcategory: "porta-macetas",
    images: [
      {
        id: "img-mac-002-1",
        url: "/images/products/macrame/porta-maceta.jpg",
        alt: "Porta macetas con macramé",
        publicId: "macrame/porta-maceta",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 12,
    featured: false,
    tags: ["macramé", "porta macetas", "plantas", "decoración"],
    materials: ["Algodón Natural"],
    dimensions: "Ajustable hasta 25cm de diámetro",
    weight: 100,
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-02-20"),
    seo: {
      title: "Porta Macetas con Macramé - Macramé Artesanal",
      description: "Porta macetas hecho con macramé artesanal.",
      keywords: ["macramé", "porta macetas", "plantas", "decoración"],
    },
  },
  {
    id: "mac-003",
    name: "Set de 3 Pulseras de Macramé",
    description:
      "Set de 3 pulseras de macramé con diferentes diseños y colores. Hechas a mano con hilo de algodón natural y cuentas decorativas.",
    price: 1800,
    category: "macrame",
    subcategory: "accesorios",
    images: [
      {
        id: "img-mac-003-1",
        url: "/images/products/macrame/pulseras-set.jpg",
        alt: "Set de pulseras de macramé",
        publicId: "macrame/pulseras-set",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 15,
    featured: false,
    tags: ["macramé", "pulseras", "set", "accesorios"],
    materials: ["Algodón Natural", "Cuentas de Madera"],
    dimensions: "Ajustable",
    weight: 50,
    createdAt: new Date("2024-02-25"),
    updatedAt: new Date("2024-02-25"),
    seo: {
      title: "Set de Pulseras de Macramé - Macramé Artesanal",
      description: "Set de 3 pulseras de macramé con diseños únicos.",
      keywords: ["macramé", "pulseras", "accesorios", "set"],
    },
  },

  // ROPA ARTESANAL
  {
    id: "ropa-001",
    name: "Poncho de Lana Alpaca",
    description:
      "Cálido poncho artesanal de lana de alpaca peruana. Diseño tradicional con colores naturales, perfecto para climas fríos.",
    price: 12500,
    originalPrice: 15000,
    category: "ropa-artesanal",
    subcategory: "ponchos",
    images: [
      {
        id: "img-ropa-001-1",
        url: "/images/products/ropa-artesanal/poncho-alpaca.jpg",
        alt: "Poncho de lana alpaca",
        publicId: "ropa-artesanal/poncho-alpaca",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 4,
    featured: true,
    tags: ["poncho", "alpaca", "lana", "Perú"],
    materials: ["Lana de Alpaca 100%"],
    dimensions: "Talla Única (Ajustable)",
    weight: 600,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
    seo: {
      title: "Poncho de Lana Alpaca - Ropa Artesanal",
      description: "Poncho artesanal de lana de alpaca peruana.",
      keywords: ["poncho", "alpaca", "ropa artesanal", "lana"],
    },
  },
  {
    id: "ropa-002",
    name: "Bufanda de Algodón Orgánico",
    description:
      "Bufanda tejida a mano con algodón orgánico. Diseño minimalista y versátil, ideal para todas las estaciones.",
    price: 3200,
    category: "ropa-artesanal",
    subcategory: "bufandas",
    images: [
      {
        id: "img-ropa-002-1",
        url: "/images/products/ropa-artesanal/bufanda-algodon.jpg",
        alt: "Bufanda de algodón orgánico",
        publicId: "ropa-artesanal/bufanda-algodon",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 8,
    featured: false,
    tags: ["bufanda", "algodón", "orgánico", "tejido a mano"],
    materials: ["Algodón Orgánico 100%"],
    dimensions: "180cm x 30cm",
    weight: 200,
    createdAt: new Date("2024-03-05"),
    updatedAt: new Date("2024-03-05"),
    seo: {
      title: "Bufanda de Algodón Orgánico - Ropa Artesanal",
      description: "Bufanda tejida a mano con algodón orgánico.",
      keywords: ["bufanda", "algodón", "ropa artesanal"],
    },
  },

  // TESOROS DEL MUNDO
  {
    id: "tes-001",
    name: "Cuenco de Bronce Tibetano",
    description:
      "Auténtico cuenco cantor tibetano hecho a mano. Usado tradicionalmente para meditación y terapia de sonido. Incluye mazo de madera.",
    price: 9500,
    originalPrice: 11500,
    category: "tesoros-del-mundo",
    subcategory: "artículos-tibetanos",
    images: [
      {
        id: "img-tes-001-1",
        url: "/images/products/tesoros-del-mundo/cuenco-tibetano.jpg",
        alt: "Cuenco de bronce tibetano",
        publicId: "tesoros-del-mundo/cuenco-tibetano",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 3,
    featured: true,
    tags: ["tíbet", "meditación", "sonido", "artesanal"],
    materials: ["Bronce", "Madera"],
    dimensions: "Diámetro 20cm",
    weight: 800,
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-03-10"),
    seo: {
      title: "Cuenco de Bronce Tibetano - Tesoros del Mundo",
      description: "Cuenco cantor tibetano auténtico hecho a mano.",
      keywords: ["tíbet", "cuenco", "meditación", "sonido"],
    },
  },
  {
    id: "tes-002",
    name: "Manta Tejida Marroquí",
    description:
      "Hermosa manta tejida a mano en Marruecos con técnicas tradicionales. Colores vibrantes y diseños geométricos únicos.",
    price: 6800,
    category: "tesoros-del-mundo",
    subcategory: "textiles",
    images: [
      {
        id: "img-tes-002-1",
        url: "/images/products/tesoros-del-mundo/manta-marroqui.jpg",
        alt: "Manta tejida marroquí",
        publicId: "tesoros-del-mundo/manta-marroqui",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 5,
    featured: false,
    tags: ["marruecos", "manta", "textil", "tradicional"],
    materials: ["Lana Natural", "Algodón"],
    dimensions: "150cm x 200cm",
    weight: 1200,
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-15"),
    seo: {
      title: "Manta Tejida Marroquí - Tesoros del Mundo",
      description:
        "Manta tejida a mano en Marruecos con técnicas tradicionales.",
      keywords: ["marruecos", "manta", "textil", "tradicional"],
    },
  },

  // COLECCIÓN ETIOPÍA
  {
    id: "eti-001",
    name: "Set de Joyería Etíope en Plata",
    description:
      "Exclusivo set de joyería artesanal de Etiopía: collar, pulsera y pendientes. Diseño tradicional con detalles únicos en plata.",
    price: 7800,
    originalPrice: 9500,
    category: "coleccion-etiopia",
    subcategory: "joyería",
    images: [
      {
        id: "img-eti-001-1",
        url: "/images/products/coleccion-etiopia/set-joyeria.jpg",
        alt: "Set de joyería etíope en plata",
        publicId: "coleccion-etiopia/set-joyeria",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 2,
    featured: true,
    tags: ["etiopía", "plata", "set", "tradicional"],
    materials: ["Plata 925"],
    dimensions: "Collar 45cm, Pulsera ajustable",
    weight: 150,
    createdAt: new Date("2024-03-20"),
    updatedAt: new Date("2024-03-20"),
    seo: {
      title: "Set de Joyería Etíope en Plata - Colección Etiopía",
      description: "Set de joyería artesanal de Etiopía en plata.",
      keywords: ["etiopía", "joyería", "plata", "tradicional"],
    },
  },
  {
    id: "eti-002",
    name: "Tazón Cerámico Etíope",
    description:
      "Tazón de cerámica hecho a mano en Etiopía con técnicas ancestrales. Diseño único con patrones tradicionales y colores naturales.",
    price: 4200,
    category: "coleccion-etiopia",
    subcategory: "cerámica",
    images: [
      {
        id: "img-eti-002-1",
        url: "/images/products/coleccion-etiopia/tazon-ceramica.jpg",
        alt: "Tazón cerámico etíope",
        publicId: "coleccion-etiopia/tazon-ceramica",
        width: 800,
        height: 800,
        isPrimary: true,
      },
    ],
    inStock: true,
    stock: 6,
    featured: false,
    tags: ["etiopía", "cerámica", "artesanal", "tradicional"],
    materials: ["Cerámica Natural"],
    dimensions: "Diámetro 18cm, Altura 8cm",
    weight: 400,
    createdAt: new Date("2024-03-25"),
    updatedAt: new Date("2024-03-25"),
    seo: {
      title: "Tazón Cerámico Etíope - Colección Etiopía",
      description: "Tazón de cerámica hecho a mano en Etiopía.",
      keywords: ["etiopía", "cerámica", "artesanal", "tradicional"],
    },
  },
];

// Funciones helper para filtrar productos
export const getProductsByCategory = (category: string) => {
  return mockProducts.filter((product) => product.category === category);
};

export const getProductById = (id: string) => {
  return mockProducts.find((product) => product.id === id);
};

export const getFeaturedProducts = () => {
  return mockProducts.filter((product) => product.featured);
};

export const getInStockProducts = () => {
  return mockProducts.filter((product) => product.inStock);
};
