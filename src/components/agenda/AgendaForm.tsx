import type { AgendaCliente, AgendaVisitaFormData } from "@/types/agenda";
import { AGENDA_STATUS_OPTIONS, AGENDA_TIPOS_CONTATO } from "@/constants/agenda";

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
