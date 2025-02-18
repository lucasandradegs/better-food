import { Skeleton } from '@/components/ui/skeleton'

export function CheckoutSkeleton() {
  return (
    <div className="flex flex-col gap-4 pb-4 lg:mx-auto lg:w-[540px]">
      <div className="rounded-md border p-4">
        <Skeleton className="h-3 w-32" />
        <div className="mt-4 flex flex-col gap-2 border-t pt-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex flex-row items-center justify-between"
            >
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
          <div className="flex flex-row items-center justify-between border-t pt-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      <div>
        <Skeleton className="mb-4 h-3 w-24" />
        <div className="mt-4 flex flex-row items-center gap-2">
          <div className="flex h-32 w-full flex-col items-center justify-between gap-2 rounded-md border p-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-3 w-24" />
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex h-32 w-full flex-col items-center justify-between gap-2 rounded-md border p-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-3 w-16" />
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-md border p-4">
        <Skeleton className="mb-4 h-3 w-36" />
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="flex gap-2">
            <div className="w-20">
              <Skeleton className="mb-2 h-3 w-12" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="flex-1">
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="mt-6 h-8 w-full" />
    </div>
  )
}
