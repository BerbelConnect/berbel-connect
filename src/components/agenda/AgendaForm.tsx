import { useState } from "react";
import type { AgendaCliente, AgendaVisitaFormData } from "@/types/agenda";
import { AGENDA_PRIORIDADES, AGENDA_STATUS_OPTIONS, AGENDA_TIPOS_CONTATO } from "@/constants/agenda";

type AgendaFormProps = {
  clientes: AgendaCliente[];
  form: AgendaVisitaFormData;
  carregando: boolean;
  onChange: (form: AgendaVisitaFormData) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export function AgendaForm({
  clientes,
  form,
  carregando,
  onChange,
  onSubmit,
  onClear,
}: AgendaFormProps) {
  const [novaEtapa, setNovaEtapa] = useState("");

  function adicionarEtapa() {
    const texto = novaEtapa.trim();
    if (!texto) return;
    onChange({ ...form, checklist: [...form.checklist, { id: crypto.randomUUID(), texto, concluido: false }] });
    setNovaEtapa("");
  }
  return (
    <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-xl font-bold text-slate-800">
        {form.id ? "Editar visita" : "Nova visita"}
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 md:col-span-4">
          <input type="checkbox" checked={form.contato_avulso} onChange={(e) => onChange({ ...form, contato_avulso: e.target.checked, cliente_id: e.target.checked ? "" : form.cliente_id })} />
          Visita para contato ainda não cadastrado
        </label>
        {form.contato_avulso ? <>
          <input placeholder="Nome do contato *" value={form.contato_avulso_nome} onChange={(e) => onChange({ ...form, contato_avulso_nome: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3" />
          <input placeholder="Empresa" value={form.contato_avulso_empresa} onChange={(e) => onChange({ ...form, contato_avulso_empresa: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3" />
          <input placeholder="Telefone" value={form.contato_avulso_telefone} onChange={(e) => onChange({ ...form, contato_avulso_telefone: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3" />
          <input placeholder="Endereço" value={form.contato_avulso_endereco} onChange={(e) => onChange({ ...form, contato_avulso_endereco: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3" />
        </> : (
        <select
          value={form.cliente_id}
          onChange={(e) => onChange({ ...form, cliente_id: e.target.value })}
          className="rounded-xl border border-slate-200 px-4 py-3"
        >
          <option value="">Selecione o cliente</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {[cliente.nome_fantasia, cliente.razao_social].filter(Boolean).join(" — ")}
            </option>
          ))}
        </select>

        )}

        <label className="text-sm font-semibold text-slate-600">Prioridade
          <select value={form.prioridade} onChange={(e) => onChange({ ...form, prioridade: e.target.value as AgendaVisitaFormData["prioridade"] })} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3">
            {AGENDA_PRIORIDADES.map((prioridade) => <option key={prioridade}>{prioridade}</option>)}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-600">Prazo para resolver
          <input type="date" value={form.prazo_resolucao} onChange={(e) => onChange({ ...form, prazo_resolucao: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3" />
        </label>

        <input
          type="date"
          value={form.data_visita}
          onChange={(e) => onChange({ ...form, data_visita: e.target.value })}
          className="rounded-xl border border-slate-200 px-4 py-3"
        />

        <input
          type="time"
          value={form.hora_visita}
          onChange={(e) => onChange({ ...form, hora_visita: e.target.value })}
          className="rounded-xl border border-slate-200 px-4 py-3"
        />

        <select
          value={form.tipo_contato}
          onChange={(e) => onChange({ ...form, tipo_contato: e.target.value })}
          className="rounded-xl border border-slate-200 px-4 py-3"
        >
          {AGENDA_TIPOS_CONTATO.map((tipo) => (
            <option key={tipo}>{tipo}</option>
          ))}
        </select>

        <input
          placeholder="Bairro"
          value={form.bairro}
          onChange={(e) => onChange({ ...form, bairro: e.target.value })}
          className="rounded-xl border border-slate-200 px-4 py-3"
        />

        <select
          value={form.status}
          onChange={(e) => onChange({ ...form, status: e.target.value })}
          className="rounded-xl border border-slate-200 px-4 py-3"
        >
          {AGENDA_STATUS_OPTIONS.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <input
          placeholder="Oportunidade"
          value={form.oportunidade}
          onChange={(e) => onChange({ ...form, oportunidade: e.target.value })}
          className="rounded-xl border border-slate-200 px-4 py-3"
        />

        <input
          type="number"
          placeholder="Valor potencial"
          value={form.valor_potencial}
          onChange={(e) => onChange({ ...form, valor_potencial: e.target.value })}
          className="rounded-xl border border-slate-200 px-4 py-3"
        />

        <textarea
          placeholder="Resultado"
          value={form.resultado}
          onChange={(e) => onChange({ ...form, resultado: e.target.value })}
          className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2"
        />

        <input
          placeholder="Pessoa atendida"
          value={form.pessoa_atendida}
          onChange={(e) => onChange({ ...form, pessoa_atendida: e.target.value })}
          className="rounded-xl border border-slate-200 px-4 py-3"
        />

        <input
          placeholder="Próxima ação"
          value={form.proxima_acao}
          onChange={(e) => onChange({ ...form, proxima_acao: e.target.value })}
          className="rounded-xl border border-slate-200 px-4 py-3"
        />

        <label className="text-sm font-semibold text-slate-600">Data de retorno<input type="date" value={form.data_retorno} onChange={(e) => onChange({ ...form, data_retorno: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>

        <label className="text-sm font-semibold text-slate-600">Lembrete<input type="datetime-local" value={form.lembrete_em} onChange={(e) => onChange({ ...form, lembrete_em: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>

        <label className="text-sm font-semibold text-slate-600">Avisar antes do compromisso
          <select value={form.lembrete_antecedencia_minutos} onChange={(e) => onChange({ ...form, lembrete_antecedencia_minutos: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3">
            <option value={0}>No horário</option><option value={15}>15 minutos antes</option><option value={30}>30 minutos antes</option><option value={60}>1 hora antes</option><option value={1440}>1 dia antes</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-600">Repetir aviso
          <select value={form.lembrete_intervalo_minutos} disabled={!form.lembrete_repetir} onChange={(e) => onChange({ ...form, lembrete_intervalo_minutos: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 disabled:bg-slate-100">
            <option value={15}>A cada 15 minutos</option><option value={30}>A cada 30 minutos</option><option value={60}>A cada hora</option><option value={1440}>Uma vez por dia</option>
          </select>
        </label>

        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3"><input type="checkbox" checked={form.lembrete_repetir} onChange={(e) => onChange({ ...form, lembrete_repetir: e.target.checked })} />Lembrar novamente até resolver</label>

        <textarea
          placeholder="Observações"
          value={form.observacoes}
          onChange={(e) => onChange({ ...form, observacoes: e.target.value })}
          className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2"
        />

        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3">
          <input
            type="checkbox"
            checked={form.alerta_retorno}
            onChange={(e) =>
              onChange({ ...form, alerta_retorno: e.target.checked })
            }
          />
          Gerar alerta de retorno
        </label>

        <div className="rounded-xl border border-slate-200 p-4 md:col-span-4">
          <p className="mb-3 font-semibold text-slate-700">Checklist da visita</p>
          <div className="flex gap-2">
            <input value={novaEtapa} onChange={(e) => setNovaEtapa(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionarEtapa(); } }} placeholder="Ex.: apresentar catálogo" className="flex-1 rounded-xl border border-slate-200 px-4 py-3" />
            <button type="button" onClick={adicionarEtapa} className="rounded-xl bg-slate-800 px-4 py-3 font-semibold text-white">Adicionar</button>
          </div>
          <div className="mt-3 space-y-2">
            {form.checklist.map((etapa) => <div key={etapa.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span>{etapa.texto}</span><button type="button" onClick={() => onChange({ ...form, checklist: form.checklist.filter((item) => item.id !== etapa.id) })} className="text-sm font-semibold text-red-600">Remover</button></div>)}
            {form.checklist.length === 0 && <p className="text-sm text-slate-500">Nenhuma etapa adicionada.</p>}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={onSubmit}
          disabled={carregando}
          className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white"
        >
          {carregando ? "Salvando..." : form.id ? "Salvar alterações" : "Salvar visita"}
        </button>

        <button
          onClick={onClear}
          className="rounded-xl border px-6 py-3 font-semibold"
        >
          Limpar
        </button>
      </div>
    </section>
  );
}
