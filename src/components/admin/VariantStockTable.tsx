"use client";

import type { ProductPurchaseOption } from "@/types";
import {
  allPurchaseSelections,
  describeSelection,
} from "@/lib/product-purchase-options";
import { variantSelectionKey } from "@/lib/cart-line-id";

type Props = {
  options: ProductPurchaseOption[];
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
};

export default function VariantStockTable({
  options,
  value,
  onChange,
}: Props) {
  const combos = allPurchaseSelections(options);
  if (combos.length === 0) return null;

  const setQty = (key: string, n: number) => {
    const v = Math.max(0, Math.floor(Number(n)) || 0);
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-800">
        Stock por combinación
      </h3>
      <p className="text-xs text-gray-500">
        El stock total del producto se calculará como la suma de estas celdas.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-700">
              <th className="py-2 pr-4 font-medium">Combinación</th>
              <th className="py-2 pr-2 font-medium w-28">Unidades</th>
            </tr>
          </thead>
          <tbody>
            {combos.map((sel) => {
              const key = variantSelectionKey(sel);
              const label = describeSelection(sel);
              return (
                <tr key={key} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4 text-gray-800">{label || "—"}</td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={value[key] ?? 0}
                      onChange={(e) => setQty(key, Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#6B5BB6]"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
