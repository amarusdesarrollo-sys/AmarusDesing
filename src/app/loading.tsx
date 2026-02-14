import LoadingSpinner from "@/components/LoadingSpinner";

export default function Loading() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <LoadingSpinner className="h-12 w-12" />
    </div>
  );
}
