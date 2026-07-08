import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "../PageHeader";
import { PrivateForm } from "./PrivateForm";

export default async function PrivatePage() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <>
      <PageHeader title="Профиль пользователя" crumb="Персональные данные" />
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <PrivateForm
          initial={{
            name: user?.name ?? "",
            email: user?.email ?? "",
            phone: user?.phone ?? "",
            smsPhone: user?.smsPhone ?? "",
          }}
        />
      </div>
    </>
  );
}
