"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

function diasDesde(data?: string | null) {
  if (!data) return 999;

  return Math.floor(
    (new Date().getTime() - new Date(data).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function enderecoCompleto(cliente: any) {
  return [
    cliente.endereco,
    cliente.numero,
    cliente.bairro,
    cliente.cidade,
    cliente.estado,
  ]
    .filter(Boolean)
    .join(", ");
}

function adicionarMinutos(hora: string, minutos: number) {
  if (!hora) return "";

  const [h, m] = hora.split(":").map(Number);
  const data = new Date();

  data.setHours(h || 0);
  data.setMinutes((m || 0) + minutos);
  data.setSeconds(0);

  const horaFinal = String(data.getHours()).padStart(2, "0");
  const minutoFinal = String(data.getMinutes()).padStart(2, "0");

  return `${horaFinal}:${minutoFinal}`;
}

const visitaInicial = {
  cliente_id: "",
  cliente_nome: "",
  data_visita: hojeISO(),
  hora_visita: "",
  tipo_contato: "Presencial",
  bairro: "",
  status: "Agendada",
  observacoes: "",
  valor_potencial: "",
};

const loteInicial = {
  data_visita: hojeISO(),
  hora_inicio: "08:00",
  intervalo_minutos: "30",
  tipo_contato: "Presencial",
  status: "Agendada",
  observacoes: "Visita criada pelo roteirizador.",
};

export default function RotasPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [bairroFiltro, setBairroFiltro] = useState("Todos");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [formVisita, setFormVisita] = useState<any | null>(null);
  const [formLote, setFormLote] = useState(loteInicial);
  const [carregandoLote, setCarregandoLote] = useState(false);

  async function carregarDados() {
    const clientesResp = await supabase
      .from("clientes")
      .select("*")
      .order("bairro", { ascending: true });

    const visitasResp = await supabase
      .from("visitas")
      .select("cliente_id, data_visita")
      .order("data_visita", { ascending: false });

    if (clientesResp.error) return alert(clientesResp.error.message);
    if (visitasResp.error) return alert(visitasResp.error.message);

    setClientes(clientesResp.data || []);
    setVisitas(visitasResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function ultimaVisita(clienteId: string) {
    const visita = visitas.find((v) => v.cliente_id === clienteId);
    return visita?.data_visita || null;
  }

  const clientesComPrioridade = useMemo(() => {
    return clientes
      .map((cliente) => {
        const ultima = ultimaVisita(cliente.id);
        const dias = diasDesde(ultima);

        let prioridade = "Normal";

        if (dias >= 60) prioridade = "Alta";
        else if (dias >= 30) prioridade = "Média";

        return {
          ...cliente,
          ultima_visita: ultima,
          dias_sem_visita: dias,
          prioridade,
        };
      })
      .sort((a, b) => b.dias_sem_visita - a.dias_sem_visita);
  }, [clientes, visitas]);

  const bairros = useMemo(() => {
    const lista = clientes.map((cliente) => cliente.bairro).filter(Boolean);
    return ["Todos", ...Array.from(new Set(lista)).sort()];
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    if (bairroFiltro === "Todos") return clientesComPrioridade;

    return clientesComPrioridade.filter(
      (cliente) => cliente.bairro === bairroFiltro
    );
  }, [clientesComPrioridade, bairroFiltro]);

  const agrupadoPorBairro = useMemo(() => {
    const grupos: Record<string, any[]> = {};

    clientesFiltrados.forEach((cliente) => {
      const bairro = cliente.bairro || "Sem bairro";
      if (!grupos[bairro]) grupos[bairro] = [];
      grupos[bairro].push(cliente);
    });

    return grupos;
  }, [clientesFiltrados]);

  const clientesSelecionados = useMemo(() => {
    return clientesComPrioridade.filter((cliente) =>
      selecionados.includes(cliente.id)
    );
  }, [clientesComPrioridade, selecionados]);

  function alternarCliente(id: string) {
    setSelecionados((atual) =>
      atual.includes(id)
        ? atual.filter((item) => item !== id)
        : [...atual, id]
    );
  }

  function selecionarBairro(bairro: string) {
    const ids = clientesComPrioridade
      .filter((cliente) => (cliente.bairro || "Sem bairro") === bairro)
      .map((cliente) => cliente.id);

    setSelecionados((atual) => Array.from(new Set([...atual, ...ids])));
  }

  function limparSelecao() {
    setSelecionados([]);
  }
    function abrirClienteNoMaps(cliente: any) {
    const endereco = enderecoCompleto(cliente);

    if (!endereco) {
      alert("Cliente sem endereço cadastrado.");
      return;
    }

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        endereco
      )}`,
      "_blank"
    );
  }

  function abrirRotaGoogleMaps() {
    if (clientesSelecionados.length === 0) {
      alert("Selecione pelo menos um cliente para gerar a rota.");
      return;
    }

    const pontos = clientesSelecionados
      .map((cliente) => enderecoCompleto(cliente))
      .filter(Boolean);

    if (pontos.length === 0) {
      alert("Os clientes selecionados não possuem endereço completo.");
      return;
    }

    if (pontos.length === 1) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          pontos[0]
        )}`,
        "_blank"
      );
      return;
    }

    const origem = pontos[0];
    const destino = pontos[pontos.length - 1];
    const paradas = pontos.slice(1, -1);

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${encodeURIComponent(origem)}` +
      `&destination=${encodeURIComponent(destino)}` +
      (paradas.length
        ? `&waypoints=${encodeURIComponent(paradas.join("|"))}`
        : "") +
      `&travelmode=driving`;

    window.open(url, "_blank");
  }

  function abrirAgendamento(cliente: any) {
    setFormVisita({
      ...visitaInicial,
      cliente_id: cliente.id,
      cliente_nome: cliente.razao_social || "",
      bairro: cliente.bairro || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarVisita() {
    if (!formVisita?.cliente_id) return alert("Cliente não selecionado.");
    if (!formVisita.data_visita) return alert("Informe a data da visita.");

    const { error } = await supabase.from("visitas").insert({
      cliente_id: formVisita.cliente_id,
      data_visita: formVisita.data_visita,
      hora_visita: formVisita.hora_visita || null,
      tipo_contato: formVisita.tipo_contato,
      bairro: formVisita.bairro,
      status: formVisita.status,
      observacoes: formVisita.observacoes,
      valor_potencial: Number(formVisita.valor_potencial || 0),
      ordem_rota: null,
      origem_rota: "Roteirizador",
    });

    if (error) return alert(error.message);

    alert("Visita agendada com sucesso.");
    setFormVisita(null);
    carregarDados();
  }

  async function criarVisitasEmLote() {
    if (clientesSelecionados.length === 0) {
      alert("Selecione os clientes da rota antes de criar visitas em lote.");
      return;
    }

    if (!formLote.data_visita) {
      alert("Informe a data da rota.");
      return;
    }

    if (!confirm(`Criar ${clientesSelecionados.length} visitas na agenda?`)) {
      return;
    }

    setCarregandoLote(true);

    const intervalo = Number(formLote.intervalo_minutos || 30);

    const visitasPayload = clientesSelecionados.map((cliente, index) => {
      const horaCalculada = formLote.hora_inicio
        ? adicionarMinutos(formLote.hora_inicio, index * intervalo)
        : "";

      return {
        cliente_id: cliente.id,
        data_visita: formLote.data_visita,
        hora_visita: horaCalculada || null,
        tipo_contato: formLote.tipo_contato,
        bairro: cliente.bairro || "",
        status: formLote.status,
        observacoes: formLote.observacoes,
        valor_potencial: 0,
        ordem_rota: index + 1,
        origem_rota: "Roteirizador",
      };
    });

    const { error } = await supabase.from("visitas").insert(visitasPayload);

    setCarregandoLote(false);

    if (error) return alert(error.message);

    alert("Visitas da rota criadas com sucesso.");
    setSelecionados([]);
    setFormLote(loteInicial);
    carregarDados();
  }

  const altaPrioridade = clientesComPrioridade.filter(
    (cliente) => cliente.prioridade === "Alta"
  ).length;

  const mediaPrioridade = clientesComPrioridade.filter(
    (cliente) => cliente.prioridade === "Média"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader
            titulo="Roteirização Inteligente"
            subtitulo="Berbel Connect"
          />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Clientes" valor={clientes.length} />
              <Card titulo="Bairros" valor={bairros.length - 1} />
              <Card titulo="Alta prioridade" valor={altaPrioridade} />
              <Card titulo="Média prioridade" valor={mediaPrioridade} />
            </div>

            {formVisita && (
              <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-2xl font-bold text-slate-800">
                  Agendar visita individual
                </h2>

                <p className="mb-5 text-sm text-slate-500">
                  Cliente: <strong>{formVisita.cliente_nome}</strong>
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <input
                    type="date"
                    value={formVisita.data_visita}
                    onChange={(e) =>
                      setFormVisita({
                        ...formVisita,
                        data_visita: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  />

                  <input
                    type="time"
                    value={formVisita.hora_visita}
                    onChange={(e) =>
                      setFormVisita({
                        ...formVisita,
                        hora_visita: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  />

                  <select
                    value={formVisita.tipo_contato}
                    onChange={(e) =>
                      setFormVisita({
                        ...formVisita,
                        tipo_contato: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <option>Presencial</option>
                    <option>WhatsApp</option>
                    <option>Ligação</option>
                    <option>E-mail</option>
                    <option>Retorno</option>
                  </select>

                  <select
                    value={formVisita.status}
                    onChange={(e) =>
                      setFormVisita({
                        ...formVisita,
                        status: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <option>Agendada</option>
                    <option>Em andamento</option>
                    <option>Concluída</option>
                    <option>Remarcar</option>
                    <option>Cancelada</option>
                  </select>

                  <input
                    placeholder="Bairro"
                    value={formVisita.bairro}
                    onChange={(e) =>
                      setFormVisita({
                        ...formVisita,
                        bairro: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  />

                  <input
                    type="number"
                    placeholder="Valor potencial"
                    value={formVisita.valor_potencial}
                    onChange={(e) =>
                      setFormVisita({
                        ...formVisita,
                        valor_potencial: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  />

                  <textarea
                    placeholder="Observações"
                    value={formVisita.observacoes}
                    onChange={(e) =>
                      setFormVisita({
                        ...formVisita,
                        observacoes: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-4"
                  />
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={salvarVisita}
                    className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                  >
                    Salvar visita
                  </button>

                  <button
                    onClick={() => setFormVisita(null)}
                    className="rounded-xl border px-6 py-3 font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </section>
            )}
                        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Planejar rota de visitas
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Agrupe clientes por bairro, priorize quem está há mais tempo sem visita e abra a rota no Google Maps.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <select
                    value={bairroFiltro}
                    onChange={(e) => setBairroFiltro(e.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  >
                    {bairros.map((bairro) => (
                      <option key={bairro}>{bairro}</option>
                    ))}
                  </select>

                  <button
                    onClick={abrirRotaGoogleMaps}
                    className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                  >
                    Abrir rota
                  </button>

                  <button
                    onClick={limparSelecao}
                    className="rounded-xl border px-6 py-3 font-semibold"
                  >
                    Limpar seleção
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Clientes selecionados para rota:{" "}
                <strong>{selecionados.length}</strong>
              </div>
            </section>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold text-slate-800">
                Criar visitas em lote para a rota
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <input
                  type="date"
                  value={formLote.data_visita}
                  onChange={(e) =>
                    setFormLote({ ...formLote, data_visita: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <input
                  type="time"
                  value={formLote.hora_inicio}
                  onChange={(e) =>
                    setFormLote({ ...formLote, hora_inicio: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <input
                  type="number"
                  placeholder="Intervalo em minutos"
                  value={formLote.intervalo_minutos}
                  onChange={(e) =>
                    setFormLote({
                      ...formLote,
                      intervalo_minutos: e.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <select
                  value={formLote.tipo_contato}
                  onChange={(e) =>
                    setFormLote({ ...formLote, tipo_contato: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option>Presencial</option>
                  <option>WhatsApp</option>
                  <option>Ligação</option>
                  <option>E-mail</option>
                  <option>Retorno</option>
                </select>

                <select
                  value={formLote.status}
                  onChange={(e) =>
                    setFormLote({ ...formLote, status: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option>Agendada</option>
                  <option>Em andamento</option>
                  <option>Concluída</option>
                  <option>Remarcar</option>
                  <option>Cancelada</option>
                </select>

                <textarea
                  placeholder="Observações da rota"
                  value={formLote.observacoes}
                  onChange={(e) =>
                    setFormLote({ ...formLote, observacoes: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-5"
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={criarVisitasEmLote}
                  disabled={carregandoLote}
                  className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
                >
                  {carregandoLote
                    ? "Criando visitas..."
                    : "Criar visitas selecionadas"}
                </button>

                <p className="text-sm text-slate-500">
                  Serão criadas <strong>{selecionados.length}</strong> visitas na Agenda Inteligente.
                </p>
              </div>
            </section>

            <section className="space-y-6">
              {Object.entries(agrupadoPorBairro).map(([bairro, lista]) => (
                <div key={bairro} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        {bairro}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {lista.length} cliente(s) neste bairro
                      </p>
                    </div>

                    <button
                      onClick={() => selecionarBairro(bairro)}
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                    >
                      Selecionar bairro
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {lista.map((cliente) => (
                      <div key={cliente.id} className="rounded-xl border p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selecionados.includes(cliente.id)}
                                onChange={() => alternarCliente(cliente.id)}
                              />

                              <h4 className="font-bold text-slate-900">
                                {cliente.razao_social || "-"}
                              </h4>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  cliente.prioridade === "Alta"
                                    ? "bg-red-100 text-red-700"
                                    : cliente.prioridade === "Média"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {cliente.prioridade}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-600">
                              {enderecoCompleto(cliente) ||
                                "Endereço não cadastrado"}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              Última visita:{" "}
                              {cliente.ultima_visita
                                ? new Date(
                                    `${cliente.ultima_visita}T00:00:00`
                                  ).toLocaleDateString("pt-BR")
                                : "Sem visita registrada"}
                            </p>

                            <p className="text-sm text-slate-500">
                              Dias sem visita:{" "}
                              {cliente.dias_sem_visita === 999
                                ? "Sem histórico"
                                : cliente.dias_sem_visita}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => abrirClienteNoMaps(cliente)}
                              className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700"
                            >
                              Maps
                            </button>

                            <button
                              onClick={() => abrirAgendamento(cliente)}
                              className="rounded-lg bg-green-100 px-4 py-2 text-sm font-semibold text-green-700"
                            >
                              Agendar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {clientesFiltrados.length === 0 && (
                <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
                  Nenhum cliente encontrado para roteirização.
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-2xl text-slate-900">{valor}</strong>
    </div>
  );
}