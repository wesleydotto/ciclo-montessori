import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const units = await prisma.unit.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      cycles: { orderBy: { createdAt: "desc" } },
      topics: true,
      sources: true,
    },
  });

  if (units.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
        <p className="text-neutral-600">
          Nenhuma unidade cadastrada ainda.
        </p>
        <Link
          href="/units/new"
          className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Cadastrar primeira unidade
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {units.map((unit) => (
        <div key={unit.id} className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href={`/units/${unit.id}`}
                className="text-lg font-semibold hover:underline"
              >
                {unit.name}
              </Link>
              {unit.grade && (
                <p className="text-sm text-neutral-500">{unit.grade}</p>
              )}
              <p className="mt-1 text-xs text-neutral-500">
                {unit.topics.length} tópicos no sumário · {unit.sources.length} fontes
              </p>
            </div>
            <Link
              href={`/units/${unit.id}/cycles/new`}
              className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
            >
              + Novo ciclo
            </Link>
          </div>

          {unit.cycles.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1 border-t border-neutral-100 pt-3">
              {unit.cycles.map((cycle) => (
                <li key={cycle.id}>
                  <Link
                    href={`/cycles/${cycle.id}`}
                    className="text-sm text-neutral-700 hover:underline"
                  >
                    {cycle.code ? `${cycle.code} — ` : ""}
                    {cycle.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
