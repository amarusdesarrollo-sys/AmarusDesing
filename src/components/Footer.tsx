"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Instagram, Mail, Heart, Settings } from "lucide-react";
import { getSiteConfig } from "@/lib/firebase/site-config";
import type { SiteConfig } from "@/types";
import { instagramProfileUrl, normalizeInstagramHandle } from "@/lib/instagram";

export default function Footer() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    getSiteConfig()
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  const email =
    config?.contact?.email ||
    config?.socialMedia?.email ||
    "amarusdesign2014@gmail.com";
  const instagramRaw = config?.socialMedia?.instagram || "amarusdesign";
  const instagramHandle = normalizeInstagramHandle(instagramRaw);
  const instagramUrl = instagramProfileUrl(instagramRaw);

  return (
    <footer className="bg-gray-900 text-white mt-auto border-t border-gray-800/80">
      <div className="pt-10 pb-8 md:pt-12 md:pb-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">
                AmarusDesign
              </h3>

              <div className="mb-4 md:mb-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <Mail className="h-3 w-3 md:h-4 md:w-4 text-[#6b5bb6]" />
                    <a
                      href={`mailto:${email}`}
                      className="text-gray-300 hover:text-white transition-colors text-xs md:text-sm"
                    >
                      {email}
                    </a>
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <Instagram className="h-4 w-4 md:h-5 md:w-5 text-[#6b5bb6]" />
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-white transition-colors text-xs md:text-sm"
                    >
                      <span className="inline-flex items-center gap-2">
                        Amarus Design
                      </span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 md:pt-5">
                <p className="text-gray-300 mb-1 md:mb-2 text-xs md:text-sm">
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

            <div></div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 md:py-5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 AmarusDesign. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 mt-2 md:mt-0">
              <Link
                href="/admin/categorias"
                className="flex items-center gap-1 text-gray-400 hover:text-[#6b5bb6] transition-colors text-sm"
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Link>
              <div className="flex items-center space-x-1">
                <span className="text-gray-400 text-sm">Hecho con</span>
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-gray-400 text-sm">para artesanos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
