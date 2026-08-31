import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  addObjective,
  deleteObjective,
  addTopic,
  deleteTopic,
  addSource,
  deleteSource,
  setSourceTopicCoverage,
  clearSourceTopicCoverage,
} from "@/app/units/actions";
import {
  computeTopicCoverage,
  topicsWithoutAnySource,
  uncoveredTopics,
} from "@/lib/gap-analysis";

export const dynamic = "force-dynamic";

export default async function UnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const unit = await prisma.unit.findUnique({
    where: { id },
    include: {
      objectives: { orderBy: { order: "asc" } },
      topics: {
        orderBy: { order: "asc" },
        include: { sourceTopics: { include: { source: true } } },
      },
      sources: { orderBy: { publisher: "asc" } },
      cycles: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!unit) notFound();

  const allActivities = await prisma.activity.findMany({
    where: { cycle: { unitId: unit.id } },
    select: { topicId: true },
  });

  const coverage = computeTopicCoverage(unit.topics, allActivities);
  const noSource = topicsWithoutAnySource(coverage);
  const noActivity = uncoveredTopics(coverage);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">{unit.name}</h1>
        {unit.grade && <p className="text-sm text-neutral-500">{unit.grade}</p>}
      </div>

      {/* Diagnóstico de buracos */}
      {unit.topics.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">Diagnóstico rápido</h2>
          {noActivity.length === 0 && noSource.length === 0 ? (
            <p className="mt-1 text-sm text-amber-800">
              Todos os tópicos do sumário já têm ao menos uma fonte e uma
              atividade em algum ciclo. 🎉
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-2 text-sm text-amber-900">
              {noActivity.length > 0 && (
                <p>
                  <strong>Sem nenhuma atividade em nenhum ciclo:</strong>{" "}
                  {noActivity.map((t) => t.title).join(", ")}
                </p>
              )}
              {noSource.length > 0 && (
                <p>
                  <strong>Sem nenhuma fonte cadastrada cobrindo:</strong>{" "}
                  {noSource.map((t) => t.title).join(", ")}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Objetivos */}
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold">Objetivos</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {unit.objectives.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{o.text}</span>
              <form action={deleteObjective.bind(null, unit.id, o.id)}>
                <button className="text-xs text-neutral-400 hover:text-red-600">
                  remover
                </button>
              </form>
            </li>
          ))}
          {unit.objectives.length === 0 && (
            <li className="text-sm text-neutral-400">Nenhum objetivo ainda.</li>
          )}
        </ul>
        <form
          action={addObjective.bind(null, unit.id)}
          className="mt-3 flex gap-2"
        >
          <input
            name="text"
            required
            placeholder="Ex: Compreender a diversidade e classificação dos seres vivos"
            className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
            Adicionar
          </button>
        </form>
      </section>

      {/* Sumário / Tópicos */}
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold">Sumário da unidade</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Os tópicos do sumário do livro-base — servem para o diagnóstico de
          buracos.
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {unit.topics.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {t.title}
                {t.pageRange && (
                  <span className="text-neutral-400"> (p. {t.pageRange})</span>
                )}
              </span>
              <form action={deleteTopic.bind(null, unit.id, t.id)}>
                <button className="text-xs text-neutral-400 hover:text-red-600">
                  remover
                </button>
              </form>
            </li>
          ))}
          {unit.topics.length === 0 && (
            <li className="text-sm text-neutral-400">Nenhum tópico ainda.</li>
          )}
        </ul>
        <form
          action={addTopic.bind(null, unit.id)}
          className="mt-3 flex flex-wrap gap-2"
        >
          <input
            name="title"
            required
            placeholder="Ex: Protozoários e algas"
            className="flex-1 min-w-[200px] rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <input
            name="pageRange"
            placeholder="Páginas (ex: 208-209)"
            className="w-40 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
            Adicionar
          </button>
        </form>
      </section>

      {/* Fontes / editoras */}
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold">Fontes (livros/editoras)</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {unit.sources.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {s.publisher}
                {s.note && <span className="text-neutral-400"> — {s.note}</span>}
              </span>
              <form action={deleteSource.bind(null, unit.id, s.id)}>
                <button className="text-xs text-neutral-400 hover:text-red-600">
                  remover
                </button>
              </form>
            </li>
          ))}
          {unit.sources.length === 0 && (
            <li className="text-sm text-neutral-400">Nenhuma fonte ainda.</li>
          )}
        </ul>
        <form
          action={addSource.bind(null, unit.id)}
          className="mt-3 flex flex-wrap gap-2"
        >
          <input
            name="publisher"
            required
            placeholder="Ex: Saber+, Telaris, Panoramas..."
            className="flex-1 min-w-[160px] rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <input
            name="note"
            placeholder="Nota (opcional)"
            className="w-48 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
            Adicionar
          </button>
        </form>
      </section>

      {/* Matriz de cobertura: tópico x fonte */}
      {unit.topics.length > 0 && unit.sources.length > 0 && (
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">Cobertura por fonte</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Para cada tópico, informe a página em que cada editora cobre o
            assunto (deixe em branco se essa editora não cobre) e marque se já
            traz exercícios fechados prontos.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-neutral-200 px-2 py-2 text-left">
                    Tópico
                  </th>
                  {unit.sources.map((s) => (
                    <th
                      key={s.id}
                      className="border-b border-neutral-200 px-2 py-2 text-left"
                    >
                      {s.publisher}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unit.topics.map((topic) => (
                  <tr key={topic.id} className="align-top">
                    <td className="border-b border-neutral-100 px-2 py-2 font-medium">
                      {topic.title}
                    </td>
                    {unit.sources.map((source) => {
                      const existing = topic.sourceTopics.find(
                        (st) => st.source.id === source.id,
                      );
                      return (
                        <td
                          key={source.id}
                          className="border-b border-neutral-100 px-2 py-2"
                        >
                          <form
                            action={setSourceTopicCoverage.bind(null, unit.id)}
                            className="flex flex-col gap-1"
                          >
                            <input type="hidden" name="sourceId" value={source.id} />
                            <input type="hidden" name="topicId" value={topic.id} />
                            <input
                              name="pageRange"
                              defaultValue={existing?.pageRange ?? ""}
                              placeholder="páginas"
                              className="w-24 rounded border border-neutral-300 px-1.5 py-1 text-xs"
                            />
                            <label className="flex items-center gap-1 text-xs text-neutral-600">
                              <input
                                type="checkbox"
                                name="hasExercises"
                                defaultChecked={existing?.hasExercises ?? false}
                              />
                              exercícios
                            </label>
                            <div className="flex gap-2">
                              <button className="text-xs text-neutral-500 hover:text-neutral-900">
                                salvar
                              </button>
                              {existing && (
                                <button
                                  type="submit"
                                  formAction={clearSourceTopicCoverage.bind(
                                    null,
                                    unit.id,
                                    source.id,
                                    topic.id,
                                  )}
                                  className="text-xs text-neutral-400 hover:text-red-600"
                                >
                                  limpar
                                </button>
                              )}
                            </div>
                          </form>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Ciclos */}
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Ciclos de trabalho</h2>
          <Link
            href={`/units/${unit.id}/cycles/new`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            + Novo ciclo
          </Link>
        </div>
        <ul className="mt-2 flex flex-col gap-1">
          {unit.cycles.map((c) => (
            <li key={c.id}>
              <Link href={`/cycles/${c.id}`} className="text-sm hover:underline">
                {c.code ? `${c.code} — ` : ""}
                {c.title}
              </Link>
            </li>
          ))}
          {unit.cycles.length === 0 && (
            <li className="text-sm text-neutral-400">Nenhum ciclo ainda.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
