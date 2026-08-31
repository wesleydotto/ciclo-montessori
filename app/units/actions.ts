"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createUnit(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();

  if (!name) {
    throw new Error("Nome da unidade é obrigatório.");
  }

  const unit = await prisma.unit.create({
    data: { name, grade: grade || null },
  });

  redirect(`/units/${unit.id}`);
}

export async function addObjective(unitId: string, formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const count = await prisma.objective.count({ where: { unitId } });
  await prisma.objective.create({
    data: { unitId, text, order: count },
  });

  revalidatePath(`/units/${unitId}`);
}

export async function deleteObjective(unitId: string, objectiveId: string) {
  await prisma.objective.delete({ where: { id: objectiveId } });
  revalidatePath(`/units/${unitId}`);
}

export async function addTopic(unitId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const pageRange = String(formData.get("pageRange") ?? "").trim();
  if (!title) return;

  const count = await prisma.topic.count({ where: { unitId } });
  await prisma.topic.create({
    data: { unitId, title, pageRange: pageRange || null, order: count },
  });

  revalidatePath(`/units/${unitId}`);
}

export async function deleteTopic(unitId: string, topicId: string) {
  await prisma.topic.delete({ where: { id: topicId } });
  revalidatePath(`/units/${unitId}`);
}

export async function addSource(unitId: string, formData: FormData) {
  const publisher = String(formData.get("publisher") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!publisher) return;

  await prisma.source.create({
    data: { unitId, publisher, note: note || null },
  });

  revalidatePath(`/units/${unitId}`);
}

export async function deleteSource(unitId: string, sourceId: string) {
  await prisma.source.delete({ where: { id: sourceId } });
  revalidatePath(`/units/${unitId}`);
}

export async function setSourceTopicCoverage(
  unitId: string,
  formData: FormData,
) {
  const sourceId = String(formData.get("sourceId") ?? "");
  const topicId = String(formData.get("topicId") ?? "");
  const pageRange = String(formData.get("pageRange") ?? "").trim();
  const hasExercises = formData.get("hasExercises") === "on";

  if (!sourceId || !topicId) return;

  await prisma.sourceTopic.upsert({
    where: { sourceId_topicId: { sourceId, topicId } },
    create: {
      sourceId,
      topicId,
      pageRange: pageRange || null,
      hasExercises,
    },
    update: {
      pageRange: pageRange || null,
      hasExercises,
    },
  });

  revalidatePath(`/units/${unitId}`);
}

export async function clearSourceTopicCoverage(
  unitId: string,
  sourceId: string,
  topicId: string,
) {
  await prisma.sourceTopic
    .delete({ where: { sourceId_topicId: { sourceId, topicId } } })
    .catch(() => {
      // já não existia cobertura cadastrada, ignora
    });
  revalidatePath(`/units/${unitId}`);
}

export type ExtractedTopicToSave = {
  title: string;
  pageRange: string | null;
  hasExercises: boolean;
};

/**
 * Salva os tópicos revisados pelo usuário após a leitura por IA das fotos.
 * Reaproveita um Topic já existente na unidade com o mesmo título (evita
 * duplicar tópicos quando a mesma editora é reanalisada), e sempre cria/
 * atualiza a cobertura (SourceTopic) para a fonte informada.
 */
export async function saveExtractedTopics(
  unitId: string,
  sourceId: string,
  items: ExtractedTopicToSave[],
) {
  if (items.length === 0) return;

  const existingTopics = await prisma.topic.findMany({ where: { unitId } });
  let nextOrder = existingTopics.length;

  for (const item of items) {
    const title = item.title.trim();
    if (!title) continue;

    const match = existingTopics.find(
      (t) => t.title.trim().toLowerCase() === title.toLowerCase(),
    );

    const topic = match
      ? match
      : await prisma.topic.create({
          data: {
            unitId,
            title,
            pageRange: item.pageRange,
            order: nextOrder++,
          },
        });

    if (!match) existingTopics.push(topic);

    await prisma.sourceTopic.upsert({
      where: { sourceId_topicId: { sourceId, topicId: topic.id } },
      create: {
        sourceId,
        topicId: topic.id,
        pageRange: item.pageRange,
        hasExercises: item.hasExercises,
      },
      update: {
        pageRange: item.pageRange,
        hasExercises: item.hasExercises,
      },
    });
  }

  revalidatePath(`/units/${unitId}`);
}
