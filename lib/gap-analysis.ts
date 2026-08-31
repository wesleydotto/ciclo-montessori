export type SourceCoverageInfo = {
  sourceId: string;
  publisher: string;
  pageRange: string | null;
  hasExercises: boolean;
};

export type TopicCoverage = {
  topicId: string;
  title: string;
  pageRange: string | null;
  sources: SourceCoverageInfo[];
  activityCount: number;
};

type TopicInput = {
  id: string;
  title: string;
  pageRange: string | null;
  sourceTopics: {
    pageRange: string | null;
    hasExercises: boolean;
    source: { id: string; publisher: string };
  }[];
};

type ActivityInput = {
  topicId: string | null;
};

/**
 * Cruza o sumário da unidade (topics) com o que cada fonte cobre
 * (sourceTopics) e quantas atividades do ciclo já referenciam cada tópico —
 * é a base do "diagnóstico de buracos" feito manualmente nos ciclos antigos.
 */
export function computeTopicCoverage(
  topics: TopicInput[],
  activities: ActivityInput[],
): TopicCoverage[] {
  const activityCountByTopic = new Map<string, number>();
  for (const activity of activities) {
    if (!activity.topicId) continue;
    activityCountByTopic.set(
      activity.topicId,
      (activityCountByTopic.get(activity.topicId) ?? 0) + 1,
    );
  }

  return topics.map((topic) => ({
    topicId: topic.id,
    title: topic.title,
    pageRange: topic.pageRange,
    sources: topic.sourceTopics.map((st) => ({
      sourceId: st.source.id,
      publisher: st.source.publisher,
      pageRange: st.pageRange,
      hasExercises: st.hasExercises,
    })),
    activityCount: activityCountByTopic.get(topic.id) ?? 0,
  }));
}

export function uncoveredTopics(coverage: TopicCoverage[]): TopicCoverage[] {
  return coverage.filter((topic) => topic.activityCount === 0);
}

export function topicsWithoutAnySource(
  coverage: TopicCoverage[],
): TopicCoverage[] {
  return coverage.filter((topic) => topic.sources.length === 0);
}
