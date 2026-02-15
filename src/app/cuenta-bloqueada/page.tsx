import Link from "next/link";

export default function CuentaBloqueadaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Cuenta bloqueada
          </h1>
          <p className="text-gray-600 mb-6">
            Tu cuenta ha sido bloqueada. Si crees que es un error, contacta con
            nosotros.
          </p>
          <Link
            href="/contacto"
            className="inline-block w-full py-3 px-4 bg-[#6B5BB6] text-white rounded-lg font-medium hover:bg-[#5B4BA5] transition-colors"
          >
            Contactar
          </Link>
          <Link
            href="/"
            className="block mt-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
