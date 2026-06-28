"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User, Instagram, Mail } from "lucide-react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import CartIcon from "./CartIcon";
import { getActiveCategories } from "@/lib/firebase/categories";
import type { Category } from "@/types";

const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "joyeria-artesanal",
    name: "Joyería Artesanal",
    slug: "joyeria-artesanal",
    description: "",
    order: 1,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "minerales-del-mundo",
    name: "Minerales del mundo",
    slug: "minerales-del-mundo",
    description: "",
    order: 2,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "macrame",
    name: "Macramé",
    slug: "macrame",
    description: "",
    order: 3,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "tesoros-del-mundo",
    name: "Tesoros del mundo",
    slug: "tesoros-del-mundo",
    description: "",
    order: 4,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "ropa-artesanal",
    name: "Ropa Artesanal",
    slug: "ropa-artesanal",
    description: "",
    order: 5,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "coleccion-etiopia",
    name: "Colección ETIOPÍA",
    slug: "coleccion-etiopia",
    description: "",
    order: 6,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const Navbar = ({ initialCategories = [] }: { initialCategories?: Category[] }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileShopOpen, setIsMobileShopOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initialCategories.length > 0) return;

    const loadCategories = async () => {
      try {
        const activeCategories = await getActiveCategories();
        setCategories(activeCategories);
      } catch (error) {
        console.error("Error loading categories:", error);
        setCategories(FALLBACK_CATEGORIES);
      }
    };

    loadCategories();
  }, [initialCategories.length]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    const next = !isMenuOpen;
    setIsMenuOpen(next);
    if (!next) setIsMobileShopOpen(false);
  };

  const topCategories = categories.filter((c) => !c.parentId);
  const subcategoriesByParentId = categories.reduce<Record<string, Category[]>>(
    (acc, c) => {
      if (!c.parentId) return acc;
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
      return acc;
    },
    {}
  );

  return (
    <nav
      aria-label="Principal"
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#6B5BB6]/70 backdrop-blur-md shadow-md"
          : "bg-[#6B5BB6] shadow-lg"
      }`}
    >
      {/* Navbar principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo */}
          <Link
            href="/"
            className="group flex shrink-0 touch-manipulation items-center transition-transform duration-300 [@media(hover:hover)_and_(pointer:fine)]:hover:scale-105"
            aria-label="Amarus Design — Inicio"
          >
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo.avif"
                alt=""
                width={40}
                height={40}
                priority
                className="w-9 h-9 rounded-full object-cover bg-white/10"
              />
              <span className="whitespace-nowrap text-lg font-bold text-white transition-all duration-300 md:text-xl [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-[#F5EFFF]">
                Amarus Design
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (solo pantallas grandes; tablet usa menú hamburguesa) */}
          <div className="hidden min-w-0 overflow-visible lg:block">
            <div className="ml-4 flex items-baseline space-x-3">
              <Link
                href="/"
                className="group relative shrink-0 touch-manipulation whitespace-nowrap px-2 py-2 text-sm font-medium text-white transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#F5EFFF]"
              >
                Inicio
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#F5EFFF] transition-all duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:w-full"></span>
              </Link>

              {/* Tienda Online Dropdown: pegado al enlace para que al pasar el ratón no se cierre y se pueda hacer clic en cada categoría */}
              <div className="group relative shrink-0">
                <Link
                  href="/tienda-online"
                  className="relative flex touch-manipulation items-center whitespace-nowrap px-2 py-2 text-sm font-medium text-white transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#F5EFFF]"
                >
                  Tienda Online
                  <svg
                    className="ml-1.5 h-5 w-5 transition-transform duration-200 [@media(hover:hover)_and_(pointer:fine)]:group-hover:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#F5EFFF] transition-all duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:w-full"></span>
                </Link>
                <div className="absolute left-0 top-full z-[100] w-72 max-h-[min(70vh,28rem)] overflow-y-auto rounded-b-lg border border-t-0 border-gray-200 bg-white pt-1 shadow-xl opacity-0 invisible transition-all duration-200 [@media(hover:hover)_and_(pointer:fine)]:group-hover:visible [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100">
                  <div className="py-1.5">
                    <Link
                      href="/tienda-online"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-[#F5EFFF] font-semibold transition-colors duration-200 rounded-md mx-1"
                    >
                      Ver todas las categorías
                    </Link>
                    {categories.length > 0 && (
                      <>
                        <div className="border-t border-gray-200 my-2" />
                        {topCategories.map((category) => (
                          <div key={category.id} className="mx-1">
                            <Link
                              href={`/categorias/${category.slug}`}
                              className="block px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-[#F5EFFF] transition-colors duration-200 rounded-md"
                            >
                              {category.name}
                            </Link>
                            {(subcategoriesByParentId[category.id] || [])
                              .slice()
                              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                              .map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/categorias/${category.slug}?sub=${encodeURIComponent(sub.slug)}`}
                                  className="block py-1.5 pl-6 pr-3 text-xs text-gray-600 hover:bg-[#F5EFFF] hover:text-gray-900 transition-colors duration-200 rounded-md"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href="/equipo"
                className="group relative shrink-0 touch-manipulation whitespace-nowrap px-2 py-2 text-sm font-medium text-white transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#F5EFFF]"
              >
                Equipo
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#F5EFFF] transition-all duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:w-full"></span>
              </Link>
              <a
                href="/#historia"
                className="group relative shrink-0 touch-manipulation whitespace-nowrap px-2 py-2 text-sm font-medium text-white transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#F5EFFF]"
              >
                Historia
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#F5EFFF] transition-all duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:w-full"></span>
              </a>
              <Link
                href="/politicas"
                className="group relative shrink-0 touch-manipulation whitespace-nowrap px-2 py-2 text-sm font-medium text-white transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#F5EFFF]"
              >
                Políticas
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#F5EFFF] transition-all duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:w-full"></span>
              </Link>
              <Link
                href="/blog"
                className="group relative shrink-0 touch-manipulation whitespace-nowrap px-2 py-2 text-sm font-medium text-white transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#F5EFFF]"
              >
                Blog
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#F5EFFF] transition-all duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:w-full"></span>
              </Link>
            </div>
          </div>

          {/* Right side icons — ancho fijo para evitar saltos al resolver Firebase Auth */}
          <div className="hidden min-h-10 min-w-[17rem] shrink-0 items-center justify-end space-x-2 lg:flex">
            <Link
              href="/contacto"
              className="flex items-center justify-center min-h-11 min-w-11 p-2 text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-lg transition-colors shrink-0"
              aria-label="Contacto por email"
            >
              <Mail className="h-5 w-5" />
            </Link>
            <Link
              href="https://instagram.com/amarusdesign"
              target="_blank"
              className="flex items-center justify-center min-h-11 min-w-11 p-2 text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-lg transition-colors shrink-0"
              rel="noopener noreferrer"
              aria-label="Instagram de Amarus Design"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            {!authReady ? (
              <div className="h-9 w-[9.5rem] shrink-0" aria-hidden />
            ) : user ? (
              <Link
                href="/mi-cuenta"
                className="flex items-center space-x-1 text-white hover:text-[#F5EFFF] transition-colors duration-200 px-2 py-1.5 rounded-lg hover:bg-white/10 whitespace-nowrap"
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">Mi cuenta</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/registro"
                  className="text-white hover:text-[#F5EFFF] transition-colors duration-200 whitespace-nowrap"
                >
                  <span className="text-sm font-medium">Registrarse</span>
                </Link>
                <Link
                  href="/login"
                  className="flex items-center space-x-1 text-white hover:text-[#F5EFFF] transition-colors duration-200 px-2 py-1.5 rounded-lg hover:bg-white/10 whitespace-nowrap"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">Iniciar sesión</span>
                </Link>
              </>
            )}
            <CartIcon />
          </div>

          {/* Mobile menu button */}
          <div className="shrink-0 lg:hidden">
            <button
              type="button"
              onClick={toggleMenu}
              className="flex items-center justify-center min-h-11 min-w-11 p-2 text-white hover:text-[#F5EFFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg"
              aria-label={isMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden" id="mobile-nav-menu">
            <div className="px-2 pt-2 pb-3 space-y-0.5 sm:px-3 bg-[#6B5BB6] border-t border-[#7B6BC7]">
              <Link
                href="/"
                className="block px-3 py-2.5 min-h-11 text-sm font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileShopOpen((v) => !v)}
                aria-expanded={isMobileShopOpen}
                aria-controls="mobile-shop-menu"
                className="flex w-full items-center justify-between px-3 py-2.5 min-h-11 text-left text-sm font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
              >
                Tienda Online
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${isMobileShopOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isMobileShopOpen && (
                <div id="mobile-shop-menu" className="ml-3 mt-1 mb-1 space-y-0.5 border-l border-[#8a7ad0] pl-3">
                  <Link
                    href="/tienda-online"
                    className="block px-2 py-1.5 text-sm font-medium text-white/95 hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Ver tienda
                  </Link>
                  <Link
                    href="/buscar"
                    className="block px-2 py-1.5 text-sm font-medium text-white/95 hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Buscar productos
                  </Link>
                  {topCategories.map((category) => (
                    <div key={category.id}>
                      <Link
                        href={`/categorias/${category.slug}`}
                        className="block px-2 py-1.5 text-sm font-medium text-white/95 hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                      {(subcategoriesByParentId[category.id] || []).map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/categorias/${category.slug}?sub=${encodeURIComponent(sub.slug)}`}
                          className="ml-2 block px-2 py-1.5 text-xs font-medium text-white/80 hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          - {sub.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <Link
                href="/equipo"
                className="block px-3 py-1.5 text-sm font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
              >
                Equipo
              </Link>
              <a
                href="/#historia"
                className="block px-3 py-1.5 text-sm font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Historia
              </a>
              <Link
                href="/politicas"
                className="block px-3 py-1.5 text-sm font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
              >
                Políticas
              </Link>
              <Link
                href="/blog"
                className="block px-3 py-1.5 text-sm font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <a
                href="https://instagram.com/amarusdesign"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 min-h-11 text-sm font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Instagram className="h-5 w-5 shrink-0" aria-hidden />
                Instagram
              </a>
              <Link
                href="/contacto"
                className="block px-3 py-1.5 text-sm font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
              >
                Contacto
              </Link>
              <Link
                href="/carrito"
                className="flex items-center px-3 py-1.5 text-sm font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
              >
                Carrito
              </Link>
              {user ? (
                <Link
                  href="/mi-cuenta"
                  className="block px-3 py-1.5 text-sm font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mi cuenta
                </Link>
              ) : (
                <>
                  <Link
                    href="/registro"
                    className="block px-3 py-1.5 text-sm font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                  <Link
                    href="/login"
                    className="block px-3 py-1.5 text-sm font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
