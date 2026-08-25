"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { AgendaCalendar, AgendaCards, AgendaFilters, AgendaForm, AgendaResultadoPanel, AgendaTable, AgendaViewSelector } from "@/components/agenda";
import type {
  AgendaCliente,
  AgendaVisita,
  AgendaVisitaFormData,
  AgendaResultadoFormData,
  AgendaVisualizacao,
} from "@/types/agenda";
import {
  carregarClientes,
  carregarVisitas,
  atualizarCacheAgenda,
  iniciarVisita,
  registrarResultadoVisita,
  alterarCancelamentoVisita,
  salvarVisita as salvarVisitaService,
  filtrarVisitas,
  gerarResumo,
} from "@/services/agenda";
import { hojeISO } from "@/lib/agendaHelpers";
import { filtrarPorPeriodo } from "@/lib/agendaPeriodo";

const inicial: AgendaVisitaFormData = {
  cliente_id: "",
  contato_avulso: false,
  contato_avulso_nome: "",
  contato_avulso_empresa: "",
  contato_avulso_telefone: "",
  contato_avulso_endereco: "",
  data_visita: hojeISO(),
  hora_visita: "",
  tipo_contato: "Presencial",
  bairro: "",
  status: "Agendada",
  resultado: "",
  oportunidade: "",
  valor_potencial: "",
  observacoes: "",
  alerta_retorno: false,
  pessoa_atendida: "",
  proxima_acao: "",
  data_retorno: "",
  lembrete_em: "",
};

export default function AgendaPage() {
  const [clientes, setClientes] = useState<AgendaCliente[]>([]);
  const [visitas, setVisitas] = useState<AgendaVisita[]>([]);
  const [form, setForm] = useState<AgendaVisitaFormData>(inicial);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [visualizacao, setVisualizacao] = useState<AgendaVisualizacao>("semana");
  const [referencia, setReferencia] = useState(hojeISO());
  const [visitaEmAtendimento, setVisitaEmAtendimento] = useState<AgendaVisita | null>(null);

  async function carregarDados() {
    let clientesData: AgendaCliente[] = [];
    try {
      clientesData = await carregarClientes();
      setClientes(clientesData);
    } catch (error) {
      alert((error as Error).message || "Erro ao carregar clientes.");
      return;
    }

    try {
      const visitasData = await carregarVisitas();
      setVisitas(visitasData);
      atualizarCacheAgenda(clientesData, visitasData);
    } catch (error) {
      alert((error as Error).message || "Erro ao carregar visitas.");
    }
  }

  useEffect(() => {
    async function carregarDadosEffect() {
      await carregarDados();
    }

    carregarDadosEffect();
  }, []);

  async function handleSalvarVisita() {
    if (!form.contato_avulso && !form.cliente_id) return alert("Selecione o cliente.");
    if (form.contato_avulso && !form.contato_avulso_nome.trim()) return alert("Informe o nome do contato.");
    if (!form.data_visita) return alert("Informe a data da visita.");

    setCarregando(true);
    const error = await salvarVisitaService(form);
    setCarregando(false);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarDados();
  }

  function handleEditarVisita(visita: AgendaVisita) {
    setForm({
      id: visita.id,
      cliente_id: visita.cliente_id || "",
      contato_avulso: !visita.cliente_id,
      contato_avulso_nome: visita.contato_avulso_nome || "",
      contato_avulso_empresa: visita.contato_avulso_empresa || "",
      contato_avulso_telefone: visita.contato_avulso_telefone || "",
      contato_avulso_endereco: visita.contato_avulso_endereco || "",
      data_visita: visita.data_visita || hojeISO(),
      hora_visita: visita.hora_visita || "",
      tipo_contato: visita.tipo_contato || "Presencial",
      bairro: visita.bairro || "",
      status: visita.status || "Agendada",
      resultado: visita.resultado || "",
      oportunidade: visita.oportunidade || "",
      valor_potencial: String(visita.valor_potencial || ""),
      observacoes: visita.observacoes || "",
      alerta_retorno: visita.alerta_retorno || false,
      pessoa_atendida: visita.pessoa_atendida || "",
      proxima_acao: visita.proxima_acao || "",
      data_retorno: visita.data_retorno || "",
      lembrete_em: visita.lembrete_em?.slice(0, 16) || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleRegistrarResultado(formResultado: AgendaResultadoFormData) {
    if (!visitaEmAtendimento) return;
    setCarregando(true);
    const error = await registrarResultadoVisita(visitaEmAtendimento, formResultado);
    setCarregando(false);
    if (error) return alert(error.message);
    setVisitaEmAtendimento(null);
    carregarDados();
  }

  async function handleAlterarCancelamento(visita: AgendaVisita) {
    const cancelar = visita.status !== "Cancelada";
    const motivo = prompt(cancelar ? "Informe o motivo do cancelamento:" : "Informe o motivo da reabertura:");
    if (motivo === null) return;
    const error = await alterarCancelamentoVisita(visita.id, motivo, cancelar);
    if (error) return alert(error.message);

    carregarDados();
  }

  async function handleIniciarVisita(visita: AgendaVisita) {
    const error = await iniciarVisita(visita.id);
    if (error) return alert(error.message);
    setVisitaEmAtendimento({ ...visita, status: "Em andamento", iniciada_em: new Date().toISOString() });
  }

  const visitasPorBusca = useMemo(
    () => filtrarVisitas(visitas, busca),
    [visitas, busca]
  );

  const visitasFiltradas = useMemo(
    () => filtrarPorPeriodo(visitasPorBusca, referencia, visualizacao),
    [visitasPorBusca, referencia, visualizacao]
  );

  const resumo = useMemo(() => gerarResumo(visitasFiltradas), [visitasFiltradas]);

  const hoje = hojeISO();

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Agenda e Visitas" subtitulo="Planeje, realize e registre cada atendimento" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
              <AgendaCards
                hojeCount={resumo.hojeCount}
                atrasadasCount={resumo.atrasadasCount}
                proximasCount={resumo.proximasCount}
                concluidasCount={resumo.concluidasCount}
                potencialTotal={resumo.potencialTotal}
              />
            </div>

            <AgendaForm
              clientes={clientes}
              form={form}
              carregando={carregando}
              onChange={setForm}
              onSubmit={handleSalvarVisita}
              onClear={() => setForm(inicial)}
            />

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <AgendaFilters busca={busca} onBuscaChange={setBusca} />

              <AgendaViewSelector visualizacao={visualizacao} referencia={referencia} onVisualizacao={setVisualizacao} onReferencia={setReferencia} />

              {visualizacao === "mes" && <AgendaCalendar referencia={referencia} visitas={visitasFiltradas} />}

              <AgendaTable
                visitas={visitasFiltradas}
                hoje={hoje}
                onEdit={handleEditarVisita}
                onConcluir={setVisitaEmAtendimento}
                onIniciar={handleIniciarVisita}
                onArchive={handleAlterarCancelamento}
              />
            </section>
          </div>
        </section>
      </div>
      {visitaEmAtendimento && <AgendaResultadoPanel visita={visitaEmAtendimento} salvando={carregando} onClose={() => setVisitaEmAtendimento(null)} onSave={handleRegistrarResultado} />}
    </main>
  );
}
