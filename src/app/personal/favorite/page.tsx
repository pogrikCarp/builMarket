import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "../PageHeader";

export default async function FavoritePage() {
  const session = await auth();
  const favorites = session?.user?.id
    ? await prisma.favorite.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <>
      <PageHeader title="Избранные товары" crumb="Избранные товары" />

      {favorites.length === 0 ? (
        <div className="rounded-lg bg-green-50 px-5 py-4 text-slate-600">
          Список избранных вариантов пуст
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4"
            >
              {item.image && (
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
              )}
              <div>
                <p className="font-medium text-slate-900">{item.name}</p>
                {item.price && <p className="text-sm text-amber-600">{item.price}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
