"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  alterarEstadoRegra,
  listarRegrasConciliacao,
  RegraConciliacao,
  RegraConciliacaoInput,
  salvarRegraConciliacao,
  TipoMovimentoRegra,
} from "@/lib/financeiro/regrasConciliacao";

const vazio: RegraConciliacaoInput = {
  nome: "",
  termo_descricao: "",
  tipo_movimento: "qualquer",
  tolerancia_valor: 0,
  tolerancia_dias: 0,
  prioridade: 100,
  ativo: true,
};

export default function RegrasConciliacaoPage() {
  const [regras, setRegras] = useState<RegraConciliacao[]>([]);
  const [form, setForm] = useState<RegraConciliacaoInput>(vazio);
  const [editando, setEditando] = useState<string>();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setRegras(await listarRegrasConciliacao());
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar as regras.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function editar(regra: RegraConciliacao) {
    setEditando(regra.id);
    setForm({
      nome: regra.nome,
      termo_descricao: regra.termo_descricao ?? "",
      tipo_movimento: regra.tipo_movimento,
      tolerancia_valor: Number(regra.tolerancia_valor),
      tolerancia_dias: regra.tolerancia_dias,
      prioridade: regra.prioridade,
      ativo: regra.ativo,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limpar() {
    setEditando(undefined);
    setForm(vazio);
    setErro("");
  }

  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (form.nome.trim().length < 3) {
      setErro("Informe um nome com pelo menos 3 caracteres.");
      return;
    }

    setSalvando(true);
    setErro("");
    try {
      await salvarRegraConciliacao(form, editando);
      limpar();
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar a regra.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternar(regra: RegraConciliacao) {
    setErro("");
    try {
      await alterarEstadoRegra(regra.id, !regra.ativo);
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível alterar a regra.");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1 p-6 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <header>
            <p className="text-sm text-blue-700">Financeiro</p>
            <h1 className="text-3xl font-bold text-slate-950">
              Regras de Conciliação
            </h1>
            <p className="mt-1 text-slate-600">
              Configure prioridades e tolerâncias para melhorar as sugestões. A aprovação continua manual.
            </p>
          </header>

          <form onSubmit={enviar} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold">
              {editando ? "Editar regra" : "Nova regra"}
            </h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Campo label="Nome">
                <input
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="input"
                  placeholder="Ex.: Recebimentos PIX"
                />
              </Campo>
              <Campo label="Termo na descrição">
                <input
                  value={form.termo_descricao ?? ""}
                  onChange={(e) => setForm({ ...form, termo_descricao: e.target.value })}
                  className="input"
                  placeholder="Opcional"
                />
              </Campo>
              <Campo label="Tipo de movimento">
                <select
                  value={form.tipo_movimento}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tipo_movimento: e.target.value as TipoMovimentoRegra,
                    })
                  }
                  className="input"
                >
                  <option value="qualquer">Qualquer</option>
                  <option value="contas_pagar">Conta a pagar</option>
                  <option value="contas_receber">Conta a receber</option>
                </select>
              </Campo>
              <Campo label="Tolerância de valor (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tolerancia_valor}
                  onChange={(e) =>
                    setForm({ ...form, tolerancia_valor: Number(e.target.value) })
                  }
                  className="input"
                />
              </Campo>
              <Campo label="Tolerância de dias">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.tolerancia_dias}
                  onChange={(e) =>
                    setForm({ ...form, tolerancia_dias: Number(e.target.value) })
                  }
                  className="input"
                />
              </Campo>
              <Campo label="Prioridade">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.prioridade}
                  onChange={(e) =>
                    setForm({ ...form, prioridade: Number(e.target.value) })
                  }
                  className="input"
                />
              </Campo>
            </div>

            {erro && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-red-700">
                {erro}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar regra"}
              </button>
              {editando && (
                <button
                  type="button"
                  onClick={limpar}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold"
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </form>

          <section className="overflow-hidden rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Regras cadastradas</h2>
              <button onClick={() => void carregar()} className="rounded-xl bg-slate-900 px-4 py-2 text-white">
                Atualizar
              </button>
            </div>

            {carregando ? (
              <p>Carregando...</p>
            ) : regras.length === 0 ? (
              <p className="py-8 text-center text-slate-500">Nenhuma regra cadastrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <Th>Nome</Th><Th>Tipo</Th><Th>Termo</Th><Th>Valor</Th>
                      <Th>Dias</Th><Th>Prioridade</Th><Th>Status</Th><Th>Ações</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {regras.map((regra) => (
                      <tr key={regra.id} className="border-t">
                        <Td>{regra.nome}</Td>
                        <Td>{rotuloTipo(regra.tipo_movimento)}</Td>
                        <Td>{regra.termo_descricao || "—"}</Td>
                        <Td>R$ {Number(regra.tolerancia_valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</Td>
                        <Td>{regra.tolerancia_dias}</Td>
                        <Td>{regra.prioridade}</Td>
                        <Td>
                          <span className={`rounded-full px-3 py-1 ${regra.ativo ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                            {regra.ativo ? "Ativa" : "Inativa"}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex gap-2">
                            <button onClick={() => editar(regra)} className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700">Editar</button>
                            <button onClick={() => void alternar(regra)} className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                              {regra.ativo ? "Desativar" : "Ativar"}
                            </button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          outline: none;
        }
        .input:focus { border-color: #2563eb; }
      `}</style>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="block font-medium text-slate-700">{label}</span>{children}</label>;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-3 font-semibold">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-3 py-4">{children}</td>;
}
function rotuloTipo(tipo: TipoMovimentoRegra) {
  if (tipo === "contas_pagar") return "Conta a pagar";
  if (tipo === "contas_receber") return "Conta a receber";
  return "Qualquer";
}

