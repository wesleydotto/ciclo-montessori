import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic } from "@/lib/anthropic";

// Sonnet 5: bom equilíbrio de custo/qualidade para leitura de páginas de
// livro didático (ver conversa sobre custo — poucos centavos por leva de
// fotos). Troque para "claude-opus-5" se quiser mais precisão.
const MODEL = "claude-sonnet-5";

const ExtractedTopicSchema = z.object({
  title: z
    .string()
    .describe(
      "Nome do tópico/assunto como aparece no sumário ou título da seção do livro (em português, curto e direto)",
    ),
  pageRange: z
    .string()
    .nullable()
    .describe(
      "Página ou intervalo de páginas onde o tópico aparece, como impresso na página (ex: '208-209' ou '42'). null se não for possível identificar",
    ),
  hasExercises: z
    .boolean()
    .describe(
      "true se a página mostrar exercícios fechados prontos (múltipla escolha, verdadeiro/falso, complete, questionário numerado), false se for só texto/imagem explicativa",
    ),
});

const ExtractionResultSchema = z.object({
  topics: z.array(ExtractedTopicSchema),
});

export type ExtractedTopic = z.infer<typeof ExtractedTopicSchema>;

export type ImageInput = {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
};

const INSTRUCTIONS = `Você está olhando fotos de páginas de um livro didático de
Ciências do ensino fundamental (Brasil). Identifique os tópicos/assuntos
distintos que aparecem nessas páginas (cada seção com título próprio é um
tópico). Para cada tópico, informe o número de página (ou intervalo) exatamente
como impresso na página, e se a própria página já traz exercícios fechados
prontos (múltipla escolha, verdadeiro/falso, complete a frase, questionário
numerado) — não conte atividades de "para casa" livres ou redação como
exercício fechado. Se várias fotos mostrarem o mesmo tópico continuando, junte
em um único item com o intervalo de páginas completo. Se não conseguir ler a
página com confiança, não invente — apenas não inclua esse trecho.`;

export async function extractTopicsFromImages(
  images: ImageInput[],
): Promise<ExtractedTopic[]> {
  if (images.length === 0) return [];

  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: INSTRUCTIONS,
    messages: [
      {
        role: "user",
        content: [
          ...images.map((image) => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: image.mediaType,
              data: image.base64,
            },
          })),
          {
            type: "text" as const,
            text: "Liste os tópicos dessas páginas.",
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(ExtractionResultSchema),
    },
  });

  return response.parsed_output?.topics ?? [];
}
