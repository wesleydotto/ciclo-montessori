import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createCycle } from "@/app/cycles/actions";

export const dynamic = "force-dynamic";

export default async function NewCyclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold">Novo ciclo — {unit.name}</h1>

      <form
        action={createCycle.bind(null, unit.id)}
        className="mt-6 flex flex-col gap-4"
      >
        <div>
          <label htmlFor="code" className="block text-sm font-medium">
            Código (opcional)
          </label>
          <input
            id="code"
            name="code"
            placeholder="Ex: 8.3.2"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Título do ciclo
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="Ex: Diversidade dos seres vivos"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-4">
          <div>
            <label htmlFor="weeks" className="block text-sm font-medium">
              Semanas
            </label>
            <input
              id="weeks"
              name="weeks"
              type="number"
              min={1}
              defaultValue={2}
              className="mt-1 w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="lessonsPerWeek" className="block text-sm font-medium">
              Aulas/semana
            </label>
            <input
              id="lessonsPerWeek"
              name="lessonsPerWeek"
              type="number"
              min={1}
              defaultValue={3}
              className="mt-1 w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Criar ciclo
        </button>
      </form>
    </div>
  );
}
