import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LEVEL_ORDER, LEVEL_LABELS, LEVEL_HINTS, LOCATION_LABELS } from "@/lib/labels";
import { computeTopicCoverage, uncoveredTopics } from "@/lib/gap-analysis";
import {
  updateCycleSettings,
  addActivity,
  updateActivityLocation,
  deleteActivity,
  autoDistribute,
} from "@/app/cycles/actions";

export const dynamic = "force-dynamic";

export default async function CyclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cycle = await prisma.cycle.findUnique({
    where: { id },
    include: {
      unit: {
        include: {
          sources: { orderBy: { publisher: "asc" } },
          topics: {
            orderBy: { order: "asc" },
            include: { sourceTopics: { include: { source: true } } },
          },
        },
      },
      activities: {
        orderBy: [{ level: "asc" }, { order: "asc" }],
        include: { source: true, topic: true },
      },
    },
  });

  if (!cycle) notFound();

  const totalLessons = cycle.weeks * cycle.lessonsPerWeek;
  const coverage = computeTopicCoverage(
    cycle.unit.topics,
    cycle.activities.map((a) => ({ topicId: a.topicId })),
  );
  const gaps = uncoveredTopics(coverage);

  const activitiesByLevel = Object.fromEntries(
    LEVEL_ORDER.map((level) => [
      level,
      cycle.activities.filter((a) => a.level === level),
    ]),
  ) as Record<string, typeof cycle.activities>;

  const lessons: (typeof cycle.activities)[] = Array.from(
    { length: totalLessons },
    () => [],
  );
  const homeActivities: typeof cycle.activities = [];
  for (const a of cycle.activities) {
    if (a.lessonNumber && a.lessonNumber >= 1 && a.lessonNumber <= totalLessons) {
      lessons[a.lessonNumber - 1].push(a);
    } else if (a.location === "EM_CASA") {
      homeActivities.push(a);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">
            <Link href={`/units/${cycle.unit.id}`} className="hover:underline">
              {cycle.unit.name}
            </Link>
          </p>
          <h1 className="text-xl font-semibold">
            {cycle.code ? `${cycle.code} — ` : ""}
            {cycle.title}
          </h1>
        </div>
        <a
          href={`/cycles/${cycle.id}/export`}
          className="whitespace-nowrap rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Exportar .docx
        </a>
      </div>

      {/* Configurações do ciclo */}
      <details className="rounded-lg border border-neutral-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-medium">
          Configurações do ciclo ({cycle.weeks} semanas × {cycle.lessonsPerWeek}{" "}
          aulas/semana = {totalLessons} aulas)
        </summary>
        <form
          action={updateCycleSettings.bind(null, cycle.id)}
          className="mt-4 flex flex-wrap items-end gap-4"
        >
          <div>
            <label className="block text-xs font-medium">Código</label>
            <input
              name="code"
              defaultValue={cycle.code ?? ""}
              className="mt-1 w-28 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Título</label>
            <input
              name="title"
              defaultValue={cycle.title}
              required
              className="mt-1 w-64 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Semanas</label>
            <input
              name="weeks"
              type="number"
              min={1}
              defaultValue={cycle.weeks}
              className="mt-1 w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Aulas/semana</label>
            <input
              name="lessonsPerWeek"
              type="number"
              min={1}
              defaultValue={cycle.lessonsPerWeek}
              className="mt-1 w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
            Salvar
          </button>
        </form>
      </details>

      {/* Diagnóstico do ciclo */}
      {gaps.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">
            Diagnóstico rápido deste ciclo
          </h2>
          <p className="mt-1 text-sm text-amber-800">
            Tópicos do sumário sem nenhuma atividade neste ciclo:{" "}
            {gaps.map((t) => t.title).join(", ")}
          </p>
        </section>
      )}

      {/* Níveis */}
      {LEVEL_ORDER.map((level) => (
        <section key={level} className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">{LEVEL_LABELS[level]}</h2>
          <p className="mt-1 text-xs text-neutral-500">{LEVEL_HINTS[level]}</p>

          <ol className="mt-3 flex flex-col gap-3">
            {activitiesByLevel[level].map((activity, index) => (
              <li
                key={activity.id}
                className="rounded-md border border-neutral-200 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p>
                    <span className="font-medium">{index + 1}. </span>
                    {activity.description}
                  </p>
                  <form action={deleteActivity.bind(null, cycle.id, activity.id)}>
                    <button className="whitespace-nowrap text-xs text-neutral-400 hover:text-red-600">
                      remover
                    </button>
                  </form>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
                  {activity.source && <span>Fonte: {activity.source.publisher}</span>}
                  {activity.topic && <span>Tópico: {activity.topic.title}</span>}
                  {activity.pageRef && <span>Págs: {activity.pageRef}</span>}
                  {activity.lessonNumber && <span>Aula {activity.lessonNumber}</span>}
                </div>
                <form
                  action={updateActivityLocation.bind(null, cycle.id, activity.id)}
                  className="mt-2 flex items-center gap-2"
                >
                  <select
                    name="location"
                    defaultValue={activity.location}
                    className="rounded border border-neutral-300 px-2 py-1 text-xs"
                  >
                    {Object.entries(LOCATION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button className="text-xs text-neutral-500 hover:text-neutral-900">
                    salvar
                  </button>
                </form>
              </li>
            ))}
            {activitiesByLevel[level].length === 0 && (
              <li className="text-sm text-neutral-400">Nenhuma atividade ainda.</li>
            )}
          </ol>

          <form
            action={addActivity.bind(null, cycle.id)}
            className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-3"
          >
            <input type="hidden" name="level" value={level} />
            <textarea
              name="description"
              required
              rows={2}
              placeholder="Descrição da atividade"
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <select
                name="sourceId"
                className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                defaultValue=""
              >
                <option value="">Fonte (opcional)</option>
                {cycle.unit.sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.publisher}
                  </option>
                ))}
              </select>
              <select
                name="topicId"
                className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                defaultValue=""
              >
                <option value="">Tópico do sumário (opcional)</option>
                {cycle.unit.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <input
                name="pageRef"
                placeholder="Páginas"
                className="w-28 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
              />
              <select
                name="location"
                defaultValue="EM_SALA"
                className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
              >
                {Object.entries(LOCATION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700">
                Adicionar
              </button>
            </div>
          </form>
        </section>
      ))}

      {/* Distribuição por aula */}
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Distribuição por aula</h2>
          <form action={autoDistribute.bind(null, cycle.id)}>
            <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
              Distribuir automaticamente
            </button>
          </form>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {lessons.map((lessonActivities, index) => (
            <div key={index} className="rounded-md border border-neutral-200 p-3">
              <p className="text-sm font-medium">Aula {index + 1}</p>
              <ul className="mt-1 flex flex-col gap-1 text-xs text-neutral-600">
                {lessonActivities.map((a) => (
                  <li key={a.id}>
                    [{LEVEL_LABELS[a.level]}] {a.description}
                  </li>
                ))}
                {lessonActivities.length === 0 && (
                  <li className="text-neutral-400">—</li>
                )}
              </ul>
            </div>
          ))}
        </div>
        {homeActivities.length > 0 && (
          <div className="mt-3 rounded-md border border-neutral-200 p-3">
            <p className="text-sm font-medium">Em casa</p>
            <ul className="mt-1 flex flex-col gap-1 text-xs text-neutral-600">
              {homeActivities.map((a) => (
                <li key={a.id}>
                  [{LEVEL_LABELS[a.level]}] {a.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
