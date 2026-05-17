export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-product w-full rounded-xl skeleton" />
      <div className="space-y-1.5">
        <div className="h-3 w-16 rounded skeleton" />
        <div className="h-4 w-full rounded skeleton" />
        <div className="h-4 w-2/3 rounded skeleton" />
        <div className="h-5 w-20 rounded skeleton" />
      </div>
    </div>
  );
}
