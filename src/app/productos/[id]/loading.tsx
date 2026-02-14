import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProductLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16">
      <LoadingSpinner className="h-12 w-12" />
    </div>
  );
}
