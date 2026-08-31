"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { $Enums } from "@/app/generated/prisma/client";
import { distributeActivities } from "@/lib/distribute";

export async function createCycle(unitId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const weeks = Number(formData.get("weeks") ?? 2) || 2;
  const lessonsPerWeek = Number(formData.get("lessonsPerWeek") ?? 3) || 3;

  if (!title) {
    throw new Error("Título do ciclo é obrigatório.");
  }

  const cycle = await prisma.cycle.create({
    data: { unitId, title, code: code || null, weeks, lessonsPerWeek },
  });

  redirect(`/cycles/${cycle.id}`);
}

export async function updateCycleSettings(cycleId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const weeks = Number(formData.get("weeks") ?? 2) || 2;
  const lessonsPerWeek = Number(formData.get("lessonsPerWeek") ?? 3) || 3;

  await prisma.cycle.update({
    where: { id: cycleId },
    data: { title, code: code || null, weeks, lessonsPerWeek },
  });

  revalidatePath(`/cycles/${cycleId}`);
}

export async function addActivity(cycleId: string, formData: FormData) {
  const level = String(formData.get("level") ?? "") as $Enums.CycleLevel;
  const description = String(formData.get("description") ?? "").trim();
  const location = (String(formData.get("location") ?? "EM_SALA") ||
    "EM_SALA") as $Enums.ActivityLocation;
  const pageRef = String(formData.get("pageRef") ?? "").trim();
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "").trim();

  if (!description || !level) return;

  const count = await prisma.activity.count({ where: { cycleId, level } });

  await prisma.activity.create({
    data: {
      cycleId,
      level,
      description,
      location,
      pageRef: pageRef || null,
      sourceId: sourceId || null,
      topicId: topicId || null,
      order: count,
    },
  });

  revalidatePath(`/cycles/${cycleId}`);
}

export async function updateActivityLocation(
  cycleId: string,
  activityId: string,
  formData: FormData,
) {
  const location = String(
    formData.get("location") ?? "EM_SALA",
  ) as $Enums.ActivityLocation;

  await prisma.activity.update({
    where: { id: activityId },
    data: { location },
  });

  revalidatePath(`/cycles/${cycleId}`);
}

export async function deleteActivity(cycleId: string, activityId: string) {
  await prisma.activity.delete({ where: { id: activityId } });
  revalidatePath(`/cycles/${cycleId}`);
}

export async function autoDistribute(cycleId: string) {
  const cycle = await prisma.cycle.findUniqueOrThrow({
    where: { id: cycleId },
    include: { activities: { orderBy: [{ level: "asc" }, { order: "asc" }] } },
  });

  const assignments = distributeActivities(
    cycle.activities.map((a) => ({ id: a.id, level: a.level, location: a.location })),
    cycle.weeks * cycle.lessonsPerWeek,
  );

  await prisma.$transaction(
    assignments.map(({ id, lessonNumber }) =>
      prisma.activity.update({ where: { id }, data: { lessonNumber } }),
    ),
  );

  revalidatePath(`/cycles/${cycleId}`);
}
