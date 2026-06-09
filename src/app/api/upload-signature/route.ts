import { NextResponse } from "next/server";

/** @deprecated Cloudinary eliminado — usar /api/storage/signed-upload */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Las subidas ya usan Supabase Storage. Actualiza el admin o usa /api/storage/signed-upload.",
    },
    { status: 410 }
  );
}
