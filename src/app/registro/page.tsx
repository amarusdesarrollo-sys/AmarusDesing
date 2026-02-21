"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/auth-admin";
import { setUserProfile } from "@/lib/firebase/users";

export default function RegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: `${name.trim()} ${lastName.trim()}`.trim() });
      await setUserProfile(user.uid, {
        firstName: name.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: "",
        addresses: [],
        useSameAddressForBilling: true,
      });
      if (isAdminEmail(user.email)) {
        router.replace("/admin");
      } else {
        router.replace("/mi-cuenta");
      }
      router.refresh();
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      const message =
        code === "auth/email-already-in-use"
          ? "Este correo ya está registrado."
          : code === "auth/weak-password"
            ? "La contraseña es demasiado débil."
            : (err as { message?: string })?.message ?? "Error al crear la cuenta.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#6B5BB6]">AmarusDesign</h1>
          <p className="text-gray-600 mt-2">Crear cuenta</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 space-y-5"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Registrarse
          </h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="given-name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                placeholder="Juan"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                placeholder="García"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Ocultar" : "Mostrar"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Repetir contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                placeholder="Repite la contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? "Ocultar" : "Mostrar"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6B5BB6] text-white py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>
        <p className="text-center text-gray-600 text-sm mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[#6B5BB6] font-medium hover:underline">
            Iniciar sesión
          </Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-gray-500 hover:text-[#6B5BB6] text-sm">
            Volver a la tienda
          </Link>
        </p>
      </div>
    </div>
  );
}
