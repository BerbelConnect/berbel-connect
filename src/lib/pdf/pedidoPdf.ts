import jsPDF from "jspdf";

function formatarMoeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string | null) {
  if (!data) return "-";

  try {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

function texto(valor: any) {
  if (valor === null || valor === undefined || valor === "") return "-";
  return String(valor);
}

function enderecoCliente(cliente: any) {
  return [
    cliente?.endereco,
    cliente?.numero,
    cliente?.bairro,
    cliente?.cidade,
    cliente?.estado,
  ]
    .filter(Boolean)
    .join(", ");
}

function escreverInfo(
  doc: jsPDF,
  label: string,
  valor: string,
  x: number,
  y: number,
  larguraValor = 58
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(label, x, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);

  const linhas = doc.splitTextToSize(valor || "-", larguraValor);
  doc.text(linhas, x + 24, y);

  return linhas.length > 1 ? y + linhas.length * 4 : y;
}

function novaPaginaSePreciso(doc: jsPDF, y: number) {
  if (y > 260) {
    doc.addPage();
    return 18;
  }

  return y;
}

export function gerarPedidoPDF(pedido: any) {
  const doc = new jsPDF("p", "mm", "a4");

  const cliente = pedido?.clientes || {};
  const itens = pedido?.pedido_itens || pedido?.itens || [];

  let y = 12;

  // =========================
  // CABEÇALHO
  // =========================
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 34, "F");

  try {
    doc.addImage("/logo-berbel.png", "PNG", 12, 6, 24, 24);
  } catch {
    // Se a logo não carregar, o PDF continua normal.
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text("BERBEL CONNECT", 42, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Pedido comercial | CRM para representantes", 42, 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Pedido Nº ${texto(pedido?.numero || pedido?.id)}`, 145, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Emitido em ${new Date().toLocaleDateString("pt-BR")}`, 145, 21);

  y = 45;

  // =========================
  // RESUMO DO PEDIDO
  // =========================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("RESUMO DO PEDIDO", 12, y);

  y += 6;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, y, 88, 42, 2, 2, "FD");
  doc.roundedRect(110, y, 88, 42, 2, 2, "FD");

  escreverInfo(doc, "Número:", texto(pedido?.numero), 17, y + 8);
  escreverInfo(doc, "Data:", formatarData(pedido?.data_pedido), 17, y + 15);
  escreverInfo(doc, "Tipo:", texto(pedido?.tipo), 17, y + 22);
  escreverInfo(doc, "Status:", texto(pedido?.status), 17, y + 29);
  escreverInfo(doc, "Vendedor:", texto(pedido?.vendedor || "Berbel Connect"), 17, y + 36);

  escreverInfo(doc, "Previsão:", formatarData(pedido?.data_entrega_prevista), 115, y + 8);
  escreverInfo(doc, "Entrega:", formatarData(pedido?.data_entrega_real), 115, y + 15);
  escreverInfo(doc, "Total:", formatarMoeda(pedido?.valor_total), 115, y + 22);
  escreverInfo(doc, "Comissão:", formatarMoeda(pedido?.valor_comissao), 115, y + 29);

  y += 55;

  // =========================
  // CLIENTE
  // =========================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("DADOS DO CLIENTE", 12, y);

  y += 6;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, y, 186, 48, 2, 2, "FD");

  escreverInfo(doc, "Razão:", texto(cliente?.razao_social), 17, y + 8, 145);
  escreverInfo(doc, "Fantasia:", texto(cliente?.nome_fantasia), 17, y + 15, 145);
  escreverInfo(doc, "CNPJ:", texto(cliente?.cnpj), 17, y + 22, 145);
  escreverInfo(doc, "Endereço:", enderecoCliente(cliente) || "-", 17, y + 29, 145);
  escreverInfo(
    doc,
    "Contato:",
    `Tel: ${texto(cliente?.telefone)} | WhatsApp: ${texto(cliente?.whatsapp)}`,
    17,
    y + 36,
    145
  );
  escreverInfo(doc, "E-mail:", texto(cliente?.email), 17, y + 43, 145);

  y += 61;

  // =========================
  // ITENS
  // =========================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("ITENS DO PEDIDO", 12, y);

  y += 7;

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(12, y, 186, 8, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  doc.text("Produto", 16, y + 5.5);
  doc.text("Qtd", 92, y + 5.5);
  doc.text("Unitário", 110, y + 5.5);
  doc.text("Total", 137, y + 5.5);
  doc.text("Comissão", 166, y + 5.5);

  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  if (itens.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(12, y, 186, 9, "F");
    doc.text("Nenhum item encontrado.", 16, y + 6);
    y += 9;
  }

  itens.forEach((item: any, index: number) => {
    y = novaPaginaSePreciso(doc, y);

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(12, y, 186, 9, "F");
    }

    const nomeProduto = texto(item?.produto_nome || item?.produtos?.nome);
    const nomeLimitado =
      nomeProduto.length > 48 ? `${nomeProduto.slice(0, 48)}...` : nomeProduto;

    doc.setTextColor(15, 23, 42);
    doc.text(nomeLimitado, 16, y + 6);
    doc.text(texto(item?.quantidade), 92, y + 6);
    doc.text(formatarMoeda(item?.valor_unitario), 110, y + 6);
    doc.text(formatarMoeda(item?.valor_total), 137, y + 6);

    doc.setTextColor(22, 101, 52);
    doc.text(formatarMoeda(item?.valor_comissao), 166, y + 6);

    y += 9;
  });

  y += 8;
  y = novaPaginaSePreciso(doc, y);

  // =========================
  // TOTAIS
  // =========================
  doc.setDrawColor(219, 234, 254);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(110, y, 88, 30, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL DO PEDIDO", 116, y + 9);

  doc.setFontSize(13);
  doc.setTextColor(29, 78, 216);
  doc.text(formatarMoeda(pedido?.valor_total), 116, y + 18);

  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text(`Comissão: ${formatarMoeda(pedido?.valor_comissao)}`, 116, y + 25);

  y += 41;
  y = novaPaginaSePreciso(doc, y);

  // =========================
  // OBSERVAÇÕES
  // =========================
  const observacoes = texto(pedido?.observacoes);

  if (observacoes !== "-") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("OBSERVAÇÕES", 12, y);

    y += 6;

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(12, y, 186, 24, 2, 2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);

    const linhasObs = doc.splitTextToSize(observacoes, 176);
    doc.text(linhasObs.slice(0, 4), 17, y + 7);
  }

  // =========================
  // RODAPÉ
  // =========================
  const totalPaginas = doc.getNumberOfPages();

  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina);

    doc.setDrawColor(226, 232, 240);
    doc.line(12, 284, 198, 284);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Berbel Connect - CRM e ERP comercial para representantes", 12, 290);
    doc.text(`Página ${pagina} de ${totalPaginas}`, 174, 290);
  }

  doc.save(`pedido-${pedido?.numero || pedido?.id || "berbel-connect"}.pdf`);
}