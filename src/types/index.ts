// Tipos para productos
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  subcategory?: string;
  images: ProductImage[];
  inStock: boolean;
  stock: number;
  featured: boolean;
  tags: string[];
  materials?: string[];
  dimensions?: string;
  weight?: number;
  /** Atributos libres: ej. { "Color": "Plateado", "Talla": "16", "Piedra": "Cuarzo rosa" } */
  attributes?: Record<string, string>;
  artisan?: Artisan;
  createdAt: Date;
  updatedAt: Date;
  seo: SEOData;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  publicId: string; // Cloudinary public ID
  width: number;
  height: number;
  isPrimary: boolean;
}

// Tipo flexible para categorías dinámicas
// El slug debe coincidir con una categoría en Firestore
export type ProductCategory = string;

// Interfaz para categorías gestionadas desde admin
export interface Category {
  id: string;
  name: string;
  slug: string; // URL-friendly (ej: "joyeria-artesanal")
  description: string;
  image?: string; // Cloudinary public ID - para cards y generar URLs
  imageUrl?: string; // URL completa (de upload) - prioritaria para hero, garantiza que funciona
  icon?: string;
  order: number; // Orden de visualización
  active: boolean; // Si está visible
  featured?: boolean; // Si aparece en la página principal como sección hero
  parentId?: string; // Para subcategorías (opcional)
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para artesanos
export interface Artisan {
  id: string;
  name: string;
  bio: string;
  image: string;
  specialties: string[];
  location: string;
  socialMedia?: {
    instagram?: string;
    website?: string;
  };
}

/** Dirección guardada en perfil de usuario — compatible con Klarna y múltiples direcciones */
export interface SavedAddress {
  id: string;
  type: "shipping" | "billing";
  street: string;
  street2?: string;
  postalCode: string;
  city: string;
  region?: string;
  country: string;
  isDefault: boolean;
}

// Tipos para usuarios (perfil para dashboard + Klarna)
export interface User {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  phone?: string;
  address?: Address;
  /** Múltiples direcciones para envío/facturación — modelo recomendado Klarna */
  addresses?: SavedAddress[];
  loyaltyPoints: number;
  preferences: UserPreferences;
  createdAt: Date;
  lastLogin: Date;
}

/** Dirección compatible con Klarna (ES): street_address, street_address2, postal_code, city, region, country */
export interface Address {
  street: string;
  /** Piso / puerta / bloque (opcional, Klarna: street_address2) */
  street2?: string;
  city: string;
  postalCode: string;
  country: string;
  /** Provincia (Klarna: region). Guardar como string. */
  state?: string;
}

export interface UserPreferences {
  newsletter: boolean;
  notifications: boolean;
  language: "es" | "en";
}

// Tipos para carrito y órdenes
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedVariants?: Record<string, string>;
}

export interface Order {
  id: string;
  userId: string;
  /** Datos de contacto para checkout (guest) — mapeo 1:1 Klarna given_name / family_name */
  customerName?: string;
  customerGivenName?: string;
  customerFamilyName?: string;
  customerEmail?: string;
  /** Teléfono con prefijo recomendado (ej: +34). Klarna obligatorio. */
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  shipping: number;
  tax: number;
  /** Nombre del método de envío para Klarna (ej: "Envío estándar") */
  shippingOptionName?: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

// Tipos para SEO
export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  openGraph?: {
    title: string;
    description: string;
    image: string;
    type: "website" | "product";
  };
}

// Tipos para blog/contenido
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  author: string;
  publishedAt: Date;
  updatedAt: Date;
  tags: string[];
  seo: SEOData;
}

// Tipos para CMS (Equipo, Historia, Políticas, etc.)
export interface TeamMember {
  id: string;
  name: string;
  imagePublicId?: string;
  imageUrl?: string;
  bio: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoriaContent {
  title: string;
  subtitle?: string;
  imagePublicId?: string;
  imageUrl?: string;
  paragraphs: string[];
}

export interface PoliticasSection {
  title: string;
  content: string;
}

export interface PoliticasContent {
  heroTitle: string;
  heroImagePublicId?: string;
  heroImageUrl?: string;
  intro: string;
  sections: PoliticasSection[];
}

export interface HomeProyectoFamiliar {
  title: string;
  paragraphs: string[];
}

export interface HomeHistoria {
  title: string;
  imagePublicId?: string;
  imageUrl?: string;
  paragraphs: string[];
}

export interface HomeContent {
  proyectoFamiliar: HomeProyectoFamiliar;
  historia: HomeHistoria;
}

export interface EquipoCierreContent {
  title: string;
  paragraphs: string[];
}

export interface ContactoContent {
  heroTitle: string;
  heroSubtitle: string;
}

// Tipos para configuración
export interface SiteConfig {
  name: string;
  description: string;
  logo: string;
  favicon: string;
  socialMedia: {
    instagram: string;
    email: string;
  };
  contact: {
    email: string;
    phone?: string;
    address: Address;
  };
  shipping: {
    freeShippingThreshold: number;
    standardShippingCost: number;
    expressShippingCost: number;
  };
}
