import { $Enums } from "@/app/generated/prisma/client";

export const LEVEL_ORDER: $Enums.CycleLevel[] = [
  "PARA_AQUECER",
  "BASICO",
  "INTERMEDIARIO",
  "AVANCADO",
  "FAZER_MAIS",
];

export const LEVEL_LABELS: Record<$Enums.CycleLevel, string> = {
  PARA_AQUECER: "Para aquecer",
  BASICO: "Básico",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
  FAZER_MAIS: "Fazer mais",
};

export const LEVEL_HINTS: Record<$Enums.CycleLevel, string> = {
  PARA_AQUECER:
    "Imagem disparadora + perguntas de observação/situação sobre o tema.",
  BASICO:
    "Acessível a todos, incluindo neurodivergência: desenho, recorte, colagem, metodologia ativa e concreta.",
  INTERMEDIARIO:
    "Uso do livro didático, exercícios de página, aplicação do conteúdo em nível mais formal.",
  AVANCADO:
    "Algo lúdico e integrador: jogo, brincadeira ou desafio que amarra tudo que foi visto.",
  FAZER_MAIS: "Atividades opcionais de aprofundamento.",
};

export const LOCATION_LABELS: Record<$Enums.ActivityLocation, string> = {
  EM_SALA: "Em sala",
  EM_CASA: "Em casa",
};
