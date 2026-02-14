import LoadingSpinner from "@/components/LoadingSpinner";

export default function ConfirmacionLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white flex items-center justify-center">
      <LoadingSpinner className="h-12 w-12" />
    </div>
  );
}
