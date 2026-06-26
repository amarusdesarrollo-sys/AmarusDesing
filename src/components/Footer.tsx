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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex flex-col gap-3 sm:gap-2">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-x-6 sm:gap-y-2">
            <p className="text-sm font-semibold text-white text-center sm:text-left">
              AmarusDesign
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-1.5 text-sm text-gray-300">
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-[#a899e0] shrink-0" aria-hidden />
                {email}
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Instagram className="h-3.5 w-3.5 text-[#a899e0] shrink-0" aria-hidden />
                @{instagramHandle}
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 pt-2 border-t border-gray-800 text-xs text-gray-400">
            <p className="text-center sm:text-left">
              © 2024 AmarusDesign. Todos los derechos reservados.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-1">
              <Link
                href="/admin/categorias"
                className="inline-flex items-center gap-1 hover:text-[#c4b8f0] transition-colors"
              >
                <Settings className="h-3.5 w-3.5" aria-hidden />
                Admin
              </Link>
              <span className="inline-flex items-center gap-1">
                Hecho con
                <Heart className="h-3 w-3 text-red-400" aria-hidden />
                para artesanos
              </span>
              <span className="hidden sm:inline text-gray-600" aria-hidden>
                ·
              </span>
              <span className="text-center sm:text-right">
                Web:{" "}
                <a
                  href="https://www.iarabaudinodev.com.ar/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#c4b8f0] hover:text-white transition-colors"
                >
                  Iara Baudino
                </a>
                {" · "}
                <a
                  href="https://instagram.com/iar.web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#c4b8f0] hover:text-white transition-colors"
                >
                  @iar.web
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
