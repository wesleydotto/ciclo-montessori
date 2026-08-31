"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveExtractedTopics } from "@/app/units/actions";

type Source = { id: string; publisher: string };

type ReviewItem = {
  title: string;
  pageRange: string;
  hasExercises: boolean;
  include: boolean;
};

export default function ExtractClient({
  unitId,
  sources,
}: {
  unitId: string;
  sources: Source[];
}) {
  const router = useRouter();
  const [sourceId, setSourceId] = useState(sources[0]?.id ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ReviewItem[] | null>(null);

  const previews = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files],
  );

  async function handleAnalyze() {
    if (files.length === 0) {
      setError("Selecione pelo menos uma foto.");
      return;
    }
    setError(null);
    setAnalyzing(true);
    setResults(null);
    try {
      const formData = new FormData();
      for (const file of files) formData.append("images", file);

      const res = await fetch(`/units/${unitId}/extract/analyze`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao analisar as imagens.");
        return;
      }

      setResults(
        (data.topics as {
          title: string;
          pageRange: string | null;
          hasExercises: boolean;
        }[]).map((t) => ({
          title: t.title,
          pageRange: t.pageRange ?? "",
          hasExercises: t.hasExercises,
          include: true,
        })),
      );
    } catch {
      setError("Erro de conexão ao chamar a IA.");
    } finally {
      setAnalyzing(false);
    }
  }

  function updateResult(index: number, patch: Partial<ReviewItem>) {
    setResults((prev) =>
      prev ? prev.map((r, i) => (i === index ? { ...r, ...patch } : r)) : prev,
    );
  }

  async function handleSave() {
    if (!results || !sourceId) return;
    const selected = results.filter((r) => r.include && r.title.trim());
    if (selected.length === 0) {
      setError("Selecione ao menos um tópico para salvar.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveExtractedTopics(
        unitId,
        sourceId,
        selected.map((r) => ({
          title: r.title.trim(),
          pageRange: r.pageRange.trim() || null,
          hasExercises: r.hasExercises,
        })),
      );
      router.push(`/units/${unitId}`);
    } catch {
      setError("Erro ao salvar os tópicos.");
      setSaving(false);
    }
  }

  if (sources.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        Cadastre pelo menos uma fonte (editora) na unidade antes de analisar
        fotos.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-sm font-medium">Fonte (editora)</label>
        <select
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.publisher}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Fotos das páginas</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="mt-1 block text-sm"
        />
        {previews.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="h-20 w-16 rounded border border-neutral-200 object-cover"
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        onClick={handleAnalyze}
        disabled={analyzing || files.length === 0}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {analyzing ? "Analisando..." : "Analisar com IA"}
      </button>

      {results && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">
            Revise antes de salvar ({results.length} tópicos encontrados)
          </h2>
          {results.length === 0 && (
            <p className="text-sm text-neutral-500">
              Nenhum tópico identificado nessas fotos.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-neutral-200 px-2 py-2 text-left">
                    Incluir
                  </th>
                  <th className="border-b border-neutral-200 px-2 py-2 text-left">
                    Tópico
                  </th>
                  <th className="border-b border-neutral-200 px-2 py-2 text-left">
                    Páginas
                  </th>
                  <th className="border-b border-neutral-200 px-2 py-2 text-left">
                    Tem exercícios
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="border-b border-neutral-100 px-2 py-2">
                      <input
                        type="checkbox"
                        checked={r.include}
                        onChange={(e) =>
                          updateResult(i, { include: e.target.checked })
                        }
                      />
                    </td>
                    <td className="border-b border-neutral-100 px-2 py-2">
                      <input
                        value={r.title}
                        onChange={(e) => updateResult(i, { title: e.target.value })}
                        className="w-64 rounded border border-neutral-300 px-2 py-1"
                      />
                    </td>
                    <td className="border-b border-neutral-100 px-2 py-2">
                      <input
                        value={r.pageRange}
                        onChange={(e) =>
                          updateResult(i, { pageRange: e.target.value })
                        }
                        className="w-24 rounded border border-neutral-300 px-2 py-1"
                      />
                    </td>
                    <td className="border-b border-neutral-100 px-2 py-2">
                      <input
                        type="checkbox"
                        checked={r.hasExercises}
                        onChange={(e) =>
                          updateResult(i, { hasExercises: e.target.checked })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || results.length === 0}
            className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar tópicos selecionados"}
          </button>
        </div>
      )}
    </div>
  );
}
