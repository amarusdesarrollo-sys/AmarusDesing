"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, setUserProfile } from "@/lib/firebase/users";
import { profileSchema, type ProfileFormData } from "@/lib/validations/schemas";

/**
 * Mi perfil: firstName, lastName (requeridos), email editable, phone (opcional), cambiar contraseña.
 */
export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"ok" | "error" | null>(null);
  const [emailEditable, setEmailEditable] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<"ok" | "error" | null>(null);
  const [emailMessage, setEmailMessage] = useState<"ok" | "error" | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", phone: "" },
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getUserProfile(user.uid)
      .then((profile) => {
        if (profile) {
          setValue("firstName", profile.firstName);
          setValue("lastName", profile.lastName);
          setValue("phone", profile.phone ?? "");
        } else {
          const parts = user.displayName?.trim().split(/\s+/) ?? [];
          setValue("firstName", parts[0] ?? "");
          setValue("lastName", parts.slice(1).join(" ") ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await setUserProfile(user.uid, {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() ?? "",
      });
      setMessage("ok");
    } catch {
      setMessage("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#6B5BB6]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi perfil</h1>
      <p className="text-sm text-gray-500 mb-6">
        Datos utilizados para el checkout y compatibles con Klarna (nombre, apellidos, teléfono).
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={auth.currentUser?.email ?? ""}
            disabled
            readOnly
            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">Para cambiar el email, usa la sección de abajo.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            {...register("firstName")}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
            placeholder="Juan"
          />
          {errors.firstName && (
            <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
          <input
            {...register("lastName")}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
            placeholder="García López"
          />
          {errors.lastName && (
            <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
          <input
            {...register("phone")}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
            placeholder="+34 600 111 222"
          />
          <p className="text-xs text-gray-400 mt-1">Recomendado con prefijo (ej. +34) para Klarna.</p>
        </div>
        {message === "ok" && (
          <p className="text-sm text-green-600">Perfil actualizado correctamente.</p>
        )}
        {message === "error" && (
          <p className="text-sm text-red-600">Error al guardar. Inténtalo de nuevo.</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="bg-[#6B5BB6] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#5B4BA5] transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      {/* Cambiar email */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Cambiar email</h2>
        {emailEditable ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const user = auth.currentUser;
              if (!user || !emailPassword.trim() || !newEmail.trim()) return;
              setEmailMessage(null);
              try {
                const cred = EmailAuthProvider.credential(user.email!, emailPassword.trim());
                await reauthenticateWithCredential(user, cred);
                await updateEmail(user, newEmail.trim());
                await setUserProfile(user.uid, { email: newEmail.trim() });
                setEmailMessage("ok");
                setEmailEditable(false);
                setEmailPassword("");
                setNewEmail("");
              } catch (err: unknown) {
                setEmailMessage("error");
                console.error("Error cambiando email:", err);
              }
            }}
            className="space-y-3 max-w-md"
          >
            <input
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="Contraseña actual"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Nuevo email"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-[#6B5BB6] text-white px-4 py-2 rounded-lg text-sm font-medium">
                Guardar
              </button>
              <button
                type="button"
                onClick={() => { setEmailEditable(false); setEmailPassword(""); setNewEmail(""); setEmailMessage(null); }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm"
              >
                Cancelar
              </button>
            </div>
            {emailMessage === "ok" && <p className="text-sm text-green-600">Email actualizado.</p>}
            {emailMessage === "error" && <p className="text-sm text-red-600">Error. Verifica la contraseña.</p>}
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-gray-600">{auth.currentUser?.email ?? "—"}</span>
            <button
              type="button"
              onClick={() => { setEmailEditable(true); setNewEmail(auth.currentUser?.email ?? ""); setEmailMessage(null); }}
              className="text-sm text-[#6B5BB6] hover:underline"
            >
              Cambiar email
            </button>
          </div>
        )}
      </div>

      {/* Cambiar contraseña */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Cambiar contraseña</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user || !passwordCurrent.trim() || !passwordNew.trim()) return;
            if (passwordNew.length < 6) {
              setPasswordMessage("error");
              return;
            }
            setPasswordMessage(null);
            try {
              const cred = EmailAuthProvider.credential(user.email!, passwordCurrent.trim());
              await reauthenticateWithCredential(user, cred);
              await updatePassword(user, passwordNew.trim());
              setPasswordMessage("ok");
              setPasswordCurrent("");
              setPasswordNew("");
              (e.target as HTMLFormElement).reset();
            } catch (err: unknown) {
              setPasswordMessage("error");
              console.error("Error cambiando contraseña:", err);
            }
          }}
          className="space-y-3 max-w-md"
        >
          <input
            type="password"
            name="currentPassword"
            value={passwordCurrent}
            onChange={(e) => setPasswordCurrent(e.target.value)}
            placeholder="Contraseña actual"
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          />
          <input
            type="password"
            name="newPassword"
            value={passwordNew}
            onChange={(e) => setPasswordNew(e.target.value)}
            placeholder="Nueva contraseña (mín. 6 caracteres)"
            required
            minLength={6}
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          />
          <button type="submit" className="bg-[#6B5BB6] text-white px-4 py-2 rounded-lg text-sm font-medium">
            Cambiar contraseña
          </button>
          {passwordMessage === "ok" && <p className="text-sm text-green-600">Contraseña actualizada.</p>}
          {passwordMessage === "error" && <p className="text-sm text-red-600">Error. Verifica la contraseña actual.</p>}
        </form>
      </div>
    </div>
  );
}
