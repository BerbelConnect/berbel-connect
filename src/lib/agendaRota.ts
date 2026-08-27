export type RotaCliente = {
  razao_social?: string | null;
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
};

export type RotaVisita = {
  id: string;
  cliente_id?: string | null;
  contato_avulso_nome?: string | null;
  contato_avulso_empresa?: string | null;
  contato_avulso_endereco?: string | null;
  data_visita: string;
  hora_visita?: string | null;
  tipo_contato?: string | null;
  status?: string | null;
  ordem_rota?: number | null;
  clientes?: RotaCliente | null;
};

export function enderecoVisita(visita: RotaVisita) {
  if (visita.contato_avulso_endereco?.trim()) return visita.contato_avulso_endereco.trim();
  const cliente = visita.clientes;
  if (!cliente) return "";
  return [cliente.endereco, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado]
    .map((parte) => parte?.trim())
    .filter(Boolean)
    .join(", ");
}

export function ordenarVisitasRota(visitas: RotaVisita[]) {
  return [...visitas].sort((a, b) => {
    const ordemA = a.ordem_rota ?? Number.MAX_SAFE_INTEGER;
    const ordemB = b.ordem_rota ?? Number.MAX_SAFE_INTEGER;
    if (ordemA !== ordemB) return ordemA - ordemB;
    return (a.hora_visita || "99:99").localeCompare(b.hora_visita || "99:99");
  });
}

export function urlRotaGoogleMaps(enderecos: string[]) {
  const pontos = enderecos.map((item) => item.trim()).filter(Boolean);
  if (!pontos.length) return "";
  if (pontos.length === 1) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pontos[0])}`;
  const origem = pontos[0];
  const destino = pontos[pontos.length - 1];
  const paradas = pontos.slice(1, -1);
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origem)}&destination=${encodeURIComponent(destino)}${paradas.length ? `&waypoints=${encodeURIComponent(paradas.join("|"))}` : ""}&travelmode=driving`;
}
