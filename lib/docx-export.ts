import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { LEVEL_ORDER, LEVEL_LABELS } from "@/lib/labels";
import { $Enums } from "@/app/generated/prisma/client";

type ExportActivity = {
  id: string;
  level: $Enums.CycleLevel;
  description: string;
  location: $Enums.ActivityLocation;
  lessonNumber: number | null;
  pageRef: string | null;
  source: { publisher: string } | null;
  topic: { title: string } | null;
};

type ExportCycle = {
  code: string | null;
  title: string;
  weeks: number;
  lessonsPerWeek: number;
  unit: {
    name: string;
    grade: string | null;
    objectives: { text: string }[];
  };
  activities: ExportActivity[];
};

function activitySourceLabel(activity: ExportActivity): string {
  const parts: string[] = [];
  if (activity.source) parts.push(activity.source.publisher);
  if (activity.pageRef) parts.push(`p. ${activity.pageRef}`);
  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}

export async function buildCycleDocx(cycle: ExportCycle): Promise<Buffer> {
  const totalLessons = cycle.weeks * cycle.lessonsPerWeek;

  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun(
          `Ciclo de Trabalho${cycle.code ? ` ${cycle.code}` : ""} — ${cycle.title}`,
        ),
      ],
    }),
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${cycle.unit.name}${cycle.unit.grade ? ` — ${cycle.unit.grade}` : ""}`,
          italics: true,
        }),
      ],
    }),
  );

  if (cycle.unit.objectives.length > 0) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, text: "Objetivos" }),
    );
    for (const objective of cycle.unit.objectives) {
      children.push(
        new Paragraph({ text: objective.text, bullet: { level: 0 } }),
      );
    }
  }

  // Tabela de distribuição por aula
  const lessons: ExportActivity[][] = Array.from(
    { length: totalLessons },
    () => [],
  );
  const homeActivities: ExportActivity[] = [];
  for (const activity of cycle.activities) {
    if (
      activity.lessonNumber &&
      activity.lessonNumber >= 1 &&
      activity.lessonNumber <= totalLessons
    ) {
      lessons[activity.lessonNumber - 1].push(activity);
    } else if (activity.location === "EM_CASA") {
      homeActivities.push(activity);
    }
  }

  if (cycle.activities.some((a) => a.lessonNumber)) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        text: `Distribuição sugerida (${cycle.weeks} semanas × ${cycle.lessonsPerWeek} aulas/semana)`,
      }),
    );

    const headerRow = new TableRow({
      children: ["Aula", "Em sala"].map(
        (text) =>
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text, bold: true })] }),
            ],
          }),
      ),
    });

    const rows = lessons.map(
      (lessonActivities, index) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(`Aula ${index + 1}`)],
            }),
            new TableCell({
              children:
                lessonActivities.length > 0
                  ? lessonActivities.map(
                      (a) =>
                        new Paragraph(
                          `[${LEVEL_LABELS[a.level]}] ${a.description}`,
                        ),
                    )
                  : [new Paragraph("—")],
            }),
          ],
        }),
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...rows],
      }),
    );

    if (homeActivities.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({ text: "Em casa:", bold: true })],
        }),
      );
      for (const activity of homeActivities) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: `[${LEVEL_LABELS[activity.level]}] ${activity.description}`,
                italics: true,
              }),
            ],
          }),
        );
      }
    }
  }

  // Atividades por nível
  let globalIndex = 0;
  for (const level of LEVEL_ORDER) {
    const levelActivities = cycle.activities.filter((a) => a.level === level);
    if (levelActivities.length === 0) continue;

    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, text: LEVEL_LABELS[level] }),
    );

    for (const activity of levelActivities) {
      globalIndex += 1;
      const topicSuffix = activity.topic ? ` [${activity.topic.title}]` : "";
      const isHome = activity.location === "EM_CASA";
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${globalIndex}. ${isHome ? "(Em casa) " : ""}${activity.description}${activitySourceLabel(activity)}${topicSuffix}`,
              italics: isHome,
            }),
          ],
        }),
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
