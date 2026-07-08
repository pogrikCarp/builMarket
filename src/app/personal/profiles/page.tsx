import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "../PageHeader";

export default async function ProfilesPage() {
  const session = await auth();
  const profiles = session?.user?.id
    ? await prisma.orderProfile.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <>
      <PageHeader title="Профили" crumb="Список профилей пользователей" />

      {profiles.length === 0 ? (
        <p className="text-lg text-slate-500">Список профилей пуст</p>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="rounded-lg border border-slate-200 bg-white px-5 py-4"
            >
              <p className="font-semibold text-slate-900">{profile.title}</p>
              <p className="text-sm text-slate-500">{profile.fullName}</p>
              <p className="text-sm text-slate-500">{profile.phone}</p>
              {profile.address && (
                <p className="text-sm text-slate-500">{profile.address}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
