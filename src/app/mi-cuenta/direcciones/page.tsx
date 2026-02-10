"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getUserProfile, setUserProfile } from "@/lib/firebase/users";
import { addressSchema } from "@/lib/validations/schemas";
import type { SavedAddress } from "@/types";
import { Plus, Pencil, Trash2, Package, CreditCard } from "lucide-react";

/** Países ISO-2 compatibles con Klarna (lista reducida; se puede ampliar). */
const COUNTRY_OPTIONS: { code: string; label: string }[] = [
  { code: "ES", label: "España" },
  { code: "PT", label: "Portugal" },
  { code: "FR", label: "Francia" },
  { code: "DE", label: "Alemania" },
  { code: "IT", label: "Italia" },
  { code: "GB", label: "Reino Unido" },
  { code: "AD", label: "Andorra" },
];

/**
 * Direcciones de envío y facturación. Opción "usar la misma dirección".
 * Guarda defaults en Firestore. Formato compatible con Klarna (ISO-2).
 */
export default function DireccionesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [useSameAddressForBilling, setUseSameAddressForBilling] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<SavedAddress>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"ok" | "error" | "validation" | null>(null);

  const loadProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const profile = await getUserProfile(user.uid);
    setAddresses(profile?.addresses ?? []);
    setUseSameAddressForBilling(profile?.useSameAddressForBilling ?? true);
  };

  useEffect(() => {
    loadProfile().finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const parsed = addressSchema.safeParse({
      street: (form.street ?? "").trim(),
      street2: (form.street2 ?? "").trim() || undefined,
      postalCode: (form.postalCode ?? "").trim(),
      city: (form.city ?? "").trim(),
      region: (form.region ?? "").trim() || undefined,
      country: (form.country ?? "ES").toString().toUpperCase().slice(0, 2),
    });
    if (!parsed.success) {
      setMessage("validation");
      return;
    }

    const { street, street2, postalCode, city, region, country } = parsed.data;
    setMessage(null);
    setSaving(true);
    const addrType = form.type ?? "shipping";
    const newAddr: SavedAddress = {
      id: form.id ?? `addr-${Date.now()}`,
      type: addrType,
      street,
      street2: street2 || undefined,
      postalCode,
      city,
      region: region || undefined,
      country,
      isDefault: form.isDefault ?? false,
    };
    let next = addresses;
    if (editingId && editingId !== "new") {
      next = addresses.map((a) => (a.id === editingId ? newAddr : a));
    } else {
      next = [...addresses, newAddr];
    }
    if (newAddr.isDefault) {
      next = next.map((a) => ({
        ...a,
        isDefault: a.type === newAddr.type ? a.id === newAddr.id : a.isDefault,
      }));
    }
    try {
      await setUserProfile(user.uid, { addresses: next });
      setAddresses(next);
      setEditingId(null);
      setForm({});
      setMessage("ok");
    } catch {
      setMessage("error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    setMessage(null);
    try {
      const next = addresses.filter((a) => a.id !== id);
      await setUserProfile(user.uid, { addresses: next });
      setAddresses(next);
      setEditingId(null);
      setForm({});
      setMessage("ok");
    } catch {
      setMessage("error");
    }
  };

  const handleUseSameAddressChange = async (checked: boolean) => {
    const user = auth.currentUser;
    if (!user) return;
    setUseSameAddressForBilling(checked);
    try {
      await setUserProfile(user.uid, { useSameAddressForBilling: checked });
      setMessage("ok");
    } catch {
      setMessage("error");
    }
  };

  const startEdit = (a: SavedAddress) => {
    setEditingId(a.id);
    setForm({ ...a });
  };

  const startNew = (type: "shipping" | "billing") => {
    setEditingId("new");
    const ofType = addresses.filter((x) => x.type === type);
    setForm({
      type,
      street: "",
      street2: "",
      postalCode: "",
      city: "",
      region: "",
      country: "ES",
      isDefault: ofType.length === 0,
    });
  };

  const shippingAddresses = addresses.filter((a) => a.type === "shipping");
  const billingAddresses = addresses.filter((a) => a.type === "billing");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#6B5BB6]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Direcciones</h1>
      <p className="text-gray-500 text-sm mb-6">
        Dirección de envío y de facturación. Formato compatible con Klarna (país ISO-2).
      </p>

      {message === "validation" && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          Completa calle, ciudad, código postal y país (código de 2 letras, ej. ES).
        </div>
      )}
      {message === "ok" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          Cambios guardados correctamente.
        </div>
      )}
      {message === "error" && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          Error al guardar. Comprueba la conexión e inténtalo de nuevo.
        </div>
      )}

      {/* Opción: usar la misma dirección para facturación */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useSameAddressForBilling}
            onChange={(e) => handleUseSameAddressChange(e.target.checked)}
            className="rounded border-gray-300 text-[#6B5BB6]"
          />
          <span className="font-medium text-gray-800">Usar la misma dirección para envío y facturación</span>
        </label>
        <p className="text-sm text-gray-500 mt-1 ml-6">
          Si lo desmarcas, podrás guardar una dirección de facturación distinta.
        </p>
      </div>

      {/* Dirección de envío */}
      <section className="mb-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
          <Package className="h-5 w-5 text-[#6B5BB6]" />
          Dirección de envío
        </h2>
        {shippingAddresses.map((a) => (
          <AddressCard
            key={a.id}
            address={a}
            editingId={editingId}
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={() => { setEditingId(null); setForm({}); setMessage(null); }}
            onEdit={startEdit}
            onDelete={handleDelete}
            saving={saving}
          />
        ))}
        {editingId === "new" && form.type === "shipping" && (
          <div className="border border-dashed border-gray-300 rounded-lg p-4 mb-4">
            <AddressForm
              form={form}
              setForm={setForm}
              onSave={handleSave}
              onCancel={() => { setEditingId(null); setForm({}); setMessage(null); }}
              saving={saving}
            />
          </div>
        )}
        {(editingId !== "new" || form.type !== "shipping") && (
          <button
            type="button"
            onClick={() => startNew("shipping")}
            className="flex items-center gap-2 text-[#6B5BB6] font-medium hover:underline"
          >
            <Plus className="h-5 w-5" />
            Añadir dirección de envío
          </button>
        )}
      </section>

      {/* Dirección de facturación (solo si no usa la misma) */}
      {!useSameAddressForBilling && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
            <CreditCard className="h-5 w-5 text-[#6B5BB6]" />
            Dirección de facturación
          </h2>
          {billingAddresses.map((a) => (
            <AddressCard
              key={a.id}
              address={a}
              editingId={editingId}
              form={form}
              setForm={setForm}
              onSave={handleSave}
              onCancel={() => { setEditingId(null); setForm({}); setMessage(null); }}
              onEdit={startEdit}
              onDelete={handleDelete}
              saving={saving}
            />
          ))}
          {editingId === "new" && form.type === "billing" && (
            <div className="border border-dashed border-gray-300 rounded-lg p-4 mb-4">
              <AddressForm
                form={form}
                setForm={setForm}
                onSave={handleSave}
                onCancel={() => { setEditingId(null); setForm({}); setMessage(null); }}
                saving={saving}
              />
            </div>
          )}
          {(editingId !== "new" || form.type !== "billing") && (
            <button
              type="button"
              onClick={() => startNew("billing")}
              className="flex items-center gap-2 text-[#6B5BB6] font-medium hover:underline"
            >
              <Plus className="h-5 w-5" />
              Añadir dirección de facturación
            </button>
          )}
        </section>
      )}
    </div>
  );
}

function AddressCard({
  address,
  editingId,
  form,
  setForm,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  saving,
}: {
  address: SavedAddress;
  editingId: string | null;
  form: Partial<SavedAddress>;
  setForm: (f: Partial<SavedAddress>) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: (a: SavedAddress) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  if (editingId === address.id) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <AddressForm form={form} setForm={setForm} onSave={onSave} onCancel={onCancel} saving={saving} />
      </div>
    );
  }
  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="font-medium text-gray-800">
          {address.street}
          {address.street2 ? `, ${address.street2}` : ""}
        </p>
        <p className="text-gray-600">
          {address.postalCode} {address.city}
          {address.region ? `, ${address.region}` : ""} — {address.country}
        </p>
        {address.isDefault && (
          <span className="text-xs text-[#6B5BB6] font-medium">Por defecto</span>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => onEdit(address)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" aria-label="Editar">
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onDelete(address.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="Eliminar">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AddressForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving = false,
}: {
  form: Partial<SavedAddress>;
  setForm: (f: Partial<SavedAddress>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  return (
    <div className="space-y-3 w-full">
      <input
        value={form.street ?? ""}
        onChange={(e) => setForm({ ...form, street: e.target.value })}
        placeholder="Calle y número *"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
      />
      <input
        value={form.street2 ?? ""}
        onChange={(e) => setForm({ ...form, street2: e.target.value })}
        placeholder="Piso, puerta (opcional)"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={form.postalCode ?? ""}
          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
          placeholder="Código postal *"
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
        />
        <input
          value={form.city ?? ""}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          placeholder="Ciudad *"
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
        />
      </div>
      <input
        value={form.region ?? ""}
        onChange={(e) => setForm({ ...form, region: e.target.value })}
        placeholder="Provincia (opcional)"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
      />
      <select
        value={(form.country ?? "ES").toString().toUpperCase().slice(0, 2)}
        onChange={(e) => setForm({ ...form, country: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white"
      >
        {COUNTRY_OPTIONS.map(({ code, label }) => (
          <option key={code} value={code}>{label} ({code})</option>
        ))}
      </select>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isDefault ?? false}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          className="rounded border-gray-300 text-[#6B5BB6]"
        />
        <span className="text-sm text-gray-700">Usar como dirección por defecto</span>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="bg-[#6B5BB6] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5B4BA5] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
