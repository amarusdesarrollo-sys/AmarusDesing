import LoadingSpinner from "@/components/LoadingSpinner";

export default function CarritoLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center py-16">
      <LoadingSpinner className="h-12 w-12" />
    </div>
  );
}
