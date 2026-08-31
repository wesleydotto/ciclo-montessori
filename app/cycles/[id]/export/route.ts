import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCycleDocx } from "@/lib/docx-export";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const cycle = await prisma.cycle.findUnique({
    where: { id },
    include: {
      unit: { include: { objectives: { orderBy: { order: "asc" } } } },
      activities: {
        orderBy: [{ level: "asc" }, { order: "asc" }],
        include: { source: true, topic: true },
      },
    },
  });

  if (!cycle) {
    return NextResponse.json({ error: "Ciclo não encontrado" }, { status: 404 });
  }

  const buffer = await buildCycleDocx(cycle);
  const filename = `ciclo${cycle.code ? `-${cycle.code}` : ""}-${cycle.title}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}.docx"`,
    },
  });
}
