"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import CartIcon from "./CartIcon";
import { getActiveCategories } from "@/lib/firebase/categories";
import type { Category } from "@/types";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Cargar categorías activas desde Firestore
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const activeCategories = await getActiveCategories();
        setCategories(activeCategories);
      } catch (error) {
        console.error("Error loading categories:", error);
        // Fallback: usar categorías estáticas si falla Firestore
        setCategories([
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
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#6B5BB6]/70 backdrop-blur-md shadow-md"
          : "bg-[#6B5BB6] shadow-lg"
      }`}
    >
      {/* Navbar principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center group transition-transform duration-300 hover:scale-105"
          >
            <span className="text-2xl md:text-3xl font-bold text-white group-hover:text-[#F5EFFF] transition-all duration-300 whitespace-nowrap">
              AmarusDesign
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-8 flex items-baseline space-x-6">
              <Link
                href="/"
                className="text-white hover:text-[#F5EFFF] px-3 py-2.5 text-xl font-medium relative group transition-colors duration-200 whitespace-nowrap"
              >
                Inicio
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5EFFF] group-hover:w-full transition-all duration-300"></span>
              </Link>

              {/* Tienda Online Dropdown */}
              <div className="relative group">
                <Link
                  href="/tienda-online"
                  className="text-white hover:text-[#F5EFFF] px-3 py-2.5 text-xl font-medium flex items-center relative transition-colors duration-200 whitespace-nowrap"
                >
                  Tienda Online
                  <svg
                    className="ml-1.5 h-5 w-5 transition-transform duration-200 group-hover:rotate-180"
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
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5EFFF] group-hover:w-full transition-all duration-300"></span>
                </Link>
                <div className="absolute left-0 mt-2 w-72 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                  <div className="py-2">
                    <Link
                      href="/tienda-online"
                      className="block px-4 py-2.5 text-xl text-gray-700 hover:bg-[#F5EFFF] font-semibold transition-colors duration-200 rounded-md mx-1"
                    >
                      Ver todas las categorías
                    </Link>
                    {categories.length > 0 && (
                      <>
                        <div className="border-t border-gray-200 my-2"></div>
                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            href={`/categorias/${category.slug}`}
                            className="block px-4 py-2 text-xl text-gray-700 hover:bg-[#F5EFFF] transition-colors duration-200 rounded-md mx-1"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href="/equipo"
                className="text-white hover:text-[#F5EFFF] px-3 py-2.5 text-xl font-medium relative group transition-colors duration-200 whitespace-nowrap"
              >
                Equipo
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5EFFF] group-hover:w-full transition-all duration-300"></span>
              </Link>
              <a
                href="/#historia"
                className="text-white hover:text-[#F5EFFF] px-3 py-2.5 text-xl font-medium relative group transition-colors duration-200 whitespace-nowrap"
              >
                Historia
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5EFFF] group-hover:w-full transition-all duration-300"></span>
              </a>
              <Link
                href="/politicas"
                className="text-white hover:text-[#F5EFFF] px-3 py-2.5 text-xl font-medium relative group transition-colors duration-200 whitespace-nowrap"
              >
                Políticas
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F5EFFF] group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
          </div>

          {/* Right side icons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/contacto"
              className="text-white hover:text-[#F5EFFF] transition-colors duration-200 whitespace-nowrap"
            >
              <span className="text-xl font-medium">Contacto</span>
            </Link>
            <Link
              href="https://instagram.com/amarusdesign"
              target="_blank"
              className="text-white hover:text-[#F5EFFF] transition-colors duration-200 whitespace-nowrap"
            >
              <span className="text-xl font-medium">Instagram</span>
            </Link>
            {user ? (
              <Link
                href="/mi-cuenta"
                className="flex items-center space-x-1.5 text-white hover:text-[#F5EFFF] transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-white/10 whitespace-nowrap"
              >
                <User className="h-6 w-6" />
                <span className="text-xl font-medium">Mi cuenta</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/registro"
                  className="text-white hover:text-[#F5EFFF] transition-colors duration-200 whitespace-nowrap"
                >
                  <span className="text-xl font-medium">Registrarse</span>
                </Link>
                <Link
                  href="/login"
                  className="flex items-center space-x-1.5 text-white hover:text-[#F5EFFF] transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-white/10 whitespace-nowrap"
                >
                  <User className="h-6 w-6" />
                  <span className="text-xl font-medium">Iniciar sesión</span>
                </Link>
              </>
            )}
            <CartIcon />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white hover:text-[#F5EFFF] focus:outline-none focus:text-[#F5EFFF]"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#6B5BB6] border-t border-[#7B6BC7]">
              <Link
                href="/"
                className="block px-3 py-2 text-lg font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
              >
                Inicio
              </Link>
              <Link
                href="/tienda-online"
                className="block px-3 py-2 text-lg font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
              >
                Tienda Online
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categorias/${category.slug}`}
                  className="block px-3 py-2 text-lg font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              <Link
                href="/equipo"
                className="block px-3 py-2 text-lg font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
              >
                Equipo
              </Link>
              <a
                href="/#historia"
                className="block px-3 py-2 text-lg font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Historia
              </a>
              <Link
                href="/politicas"
                className="block px-3 py-2 text-lg font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
              >
                Políticas
              </Link>
              <Link
                href="/contacto"
                className="block px-3 py-2 text-lg font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
              >
                Contacto
              </Link>
              <Link
                href="/carrito"
                className="flex items-center px-3 py-2 text-lg font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
              >
                Carrito
              </Link>
              {user ? (
                <Link
                  href="/mi-cuenta"
                  className="block px-3 py-2 text-lg font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mi cuenta
                </Link>
              ) : (
                <>
                  <Link
                    href="/registro"
                    className="block px-3 py-2 text-lg font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-lg font-medium text-white hover:text-[#F5EFFF] hover:bg-white/10 rounded-md transition-colors"
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
