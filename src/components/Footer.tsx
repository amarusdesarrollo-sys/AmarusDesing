import Link from "next/link";
import { Instagram, Mail, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="py-3 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Brand */}
            <div className="text-center md:text-left">
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">
                AmarusDesign
              </h3>

              {/* Contacto de AmarusDesign */}
              <div className="mb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <Mail className="h-3 w-3 md:h-4 md:w-4 text-[#6b5bb6]" />
                    <a
                      href="mailto:amarusdesign2014@gmail.com"
                      className="text-gray-300 hover:text-white transition-colors text-sm md:text-base"
                    >
                      amarusdesign2014@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <Instagram className="h-4 w-4 md:h-5 md:w-5 text-[#6b5bb6]" />
                    <Link
                      href="https://instagram.com/amarusdesign"
                      target="_blank"
                      className="text-gray-300 hover:text-white transition-colors text-sm md:text-base"
                    >
                      @amarusdesign
                    </Link>
                  </div>
                </div>
              </div>

              {/* Mis créditos y contacto */}
              <div className="border-t border-gray-700 pt-4">
                <p className="text-gray-300 mb-3 text-sm md:text-base">
                  Desarrollo web realizado por{" "}
                  <a
                    href="https://www.iarabaudinodev.com.ar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6b5bb6] hover:text-white transition-colors font-medium"
                  >
                    Iara Baudino
                  </a>
                </p>
                <div className="flex justify-center md:justify-start space-x-3">
                  <Link
                    href="https://instagram.com/iar.web"
                    target="_blank"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Espacio vacío para mantener el grid de 2 columnas */}
            <div></div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-2 md:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 AmarusDesign. Todos los derechos reservados.
            </p>
            <div className="flex items-center space-x-1 mt-2 md:mt-0">
              <span className="text-gray-400 text-sm">Hecho con</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-gray-400 text-sm">para artesanos</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
