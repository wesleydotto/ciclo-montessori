import { createUnit } from "@/app/units/actions";

export default function NewUnitPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold">Nova unidade</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Cadastre a unidade do currículo. Depois você adiciona os objetivos, o
        sumário e as fontes (livros/editoras) usadas nela.
      </p>

      <form action={createUnit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Nome da unidade
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Ex: Unidade 10 — Diversidade dos seres vivos"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="grade" className="block text-sm font-medium">
            Série (opcional)
          </label>
          <input
            id="grade"
            name="grade"
            placeholder="Ex: 6º ano"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="mt-2 self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Criar unidade
        </button>
      </form>
    </div>
  );
}
