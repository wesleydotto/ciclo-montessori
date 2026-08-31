import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExtractClient from "./ExtractClient";

export const dynamic = "force-dynamic";

export default async function ExtractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const unit = await prisma.unit.findUnique({
    where: { id },
    include: { sources: { orderBy: { publisher: "asc" } } },
  });

  if (!unit) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-neutral-500">
          <Link href={`/units/${unit.id}`} className="hover:underline">
            {unit.name}
          </Link>
        </p>
        <h1 className="text-xl font-semibold">Analisar fotos com IA</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Anexe fotos das páginas do livro. A IA identifica os tópicos, as
          páginas e se já tem exercícios prontos — você revisa antes de
          salvar.
        </p>
      </div>

      <ExtractClient
        unitId={unit.id}
        sources={unit.sources.map((s) => ({ id: s.id, publisher: s.publisher }))}
      />
    </div>
  );
}
