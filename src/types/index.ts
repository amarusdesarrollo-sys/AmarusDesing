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

export type ProductCategory =
  | "joyeria-artesanal"
  | "minerales-del-mundo"
  | "macrame"
  | "ropa-artesanal"
  | "tesoros-del-mundo"
  | "coleccion-etiopia";

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

// Tipos para usuarios
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: Address;
  loyaltyPoints: number;
  preferences: UserPreferences;
  createdAt: Date;
  lastLogin: Date;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
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
  items: OrderItem[];
  total: number;
  shipping: number;
  tax: number;
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
