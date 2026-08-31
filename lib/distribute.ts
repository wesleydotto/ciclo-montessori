import { $Enums } from "@/app/generated/prisma/client";
import { LEVEL_ORDER } from "@/lib/labels";

type ActivityInput = {
  id: string;
  level: $Enums.CycleLevel;
  location: $Enums.ActivityLocation;
};

export type Assignment = {
  id: string;
  lessonNumber: number | null;
};

/**
 * Distribui as atividades "em sala" pelas aulas disponíveis, respeitando a
 * ordem dos níveis (Para aquecer → Básico → Intermediário → Avançado →
 * Fazer mais) e espalhando de forma equilibrada. Atividades "em casa" não
 * ocupam aula (lessonNumber fica null).
 */
export function distributeActivities(
  activities: ActivityInput[],
  totalLessons: number,
): Assignment[] {
  const assignments: Assignment[] = [];

  const homeActivities = activities.filter((a) => a.location === "EM_CASA");
  for (const a of homeActivities) {
    assignments.push({ id: a.id, lessonNumber: null });
  }

  const classActivities = LEVEL_ORDER.flatMap((level) =>
    activities.filter((a) => a.location === "EM_SALA" && a.level === level),
  );

  if (classActivities.length === 0 || totalLessons <= 0) {
    for (const a of classActivities) {
      assignments.push({ id: a.id, lessonNumber: 1 });
    }
    return assignments;
  }

  const perLesson = Math.ceil(classActivities.length / totalLessons);

  classActivities.forEach((activity, index) => {
    const lessonNumber = Math.min(
      Math.floor(index / perLesson) + 1,
      totalLessons,
    );
    assignments.push({ id: activity.id, lessonNumber });
  });

  return assignments;
}
