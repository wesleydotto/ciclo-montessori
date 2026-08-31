import { NextResponse } from "next/server";
import { extractTopicsFromImages, type ImageInput } from "@/lib/extract-topics";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY não configurada. Adicione sua chave no arquivo .env e reinicie o app.",
      },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const files = formData.getAll("images").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma imagem enviada." },
      { status: 400 },
    );
  }

  const images: ImageInput[] = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não suportado: ${file.type || file.name}` },
        { status: 400 },
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    images.push({
      base64: buffer.toString("base64"),
      mediaType: file.type as ImageInput["mediaType"],
    });
  }

  try {
    const topics = await extractTopicsFromImages(images);
    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Erro ao analisar imagens:", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido ao chamar a IA.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
