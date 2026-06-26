"use client";

import Link from "next/link";
import { Instagram, Mail, Heart, Settings } from "lucide-react";
import type { SiteConfig } from "@/types";
import { instagramProfileUrl, normalizeInstagramHandle } from "@/lib/instagram";

const DEFAULT_EMAIL = "amarusdesign2014@gmail.com";
const DEFAULT_INSTAGRAM = "amarusdesign";

export default function Footer({
  initialSiteConfig = null,
}: {
  initialSiteConfig?: SiteConfig | null;
}) {
  const email =
    initialSiteConfig?.contact?.email ||
    initialSiteConfig?.socialMedia?.email ||
    DEFAULT_EMAIL;
  const instagramRaw =
    initialSiteConfig?.socialMedia?.instagram || DEFAULT_INSTAGRAM;
  const instagramUrl = instagramProfileUrl(instagramRaw);
  const instagramHandle = normalizeInstagramHandle(instagramRaw);

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
                    <Mail className="h-4 w-4 text-[#a899e0] shrink-0" aria-hidden />
                    <a
                      href={`mailto:${email}`}
                      className="text-gray-200 hover:text-white transition-colors text-sm md:text-base"
                    >
                      {email}
                    </a>
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <Instagram className="h-4 w-4 text-[#a899e0] shrink-0" aria-hidden />
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-200 hover:text-white transition-colors text-sm md:text-base"
                    >
                      @{instagramHandle} en Instagram
                    </a>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 md:pt-5">
                <p className="text-gray-200 mb-1 md:mb-2 text-sm md:text-base">
                  Desarrollo web realizado por{" "}
                  <a
                    href="https://www.iarabaudinodev.com.ar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#c4b8f0] hover:text-white transition-colors font-medium underline-offset-2 hover:underline"
                  >
                    Iara Baudino
                  </a>
                </p>
                <div className="flex justify-center md:justify-start">
                  <a
                    href="https://instagram.com/iar.web"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 min-h-11 min-w-11 px-3 text-gray-200 hover:text-white transition-colors rounded-lg"
                    aria-label="Instagram de Iara Baudino (@iar.web)"
                  >
                    <Instagram className="h-5 w-5" aria-hidden />
                    <span className="text-sm">@iar.web</span>
                  </a>
                </div>
              </div>
            </div>

            <div />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 md:py-5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-gray-300 text-sm">
              © 2024 AmarusDesign. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/categorias"
                className="flex items-center gap-2 min-h-11 px-2 text-gray-300 hover:text-[#c4b8f0] transition-colors text-sm"
              >
                <Settings className="h-4 w-4" aria-hidden />
                <span>Admin</span>
              </Link>
              <div className="flex items-center space-x-1 text-gray-300 text-sm">
                <span>Hecho con</span>
                <Heart className="h-4 w-4 text-red-400" aria-hidden />
                <span>para artesanos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
