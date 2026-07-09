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

function adicionarLinhaInfo(
  doc: jsPDF,
  label: string,
  valor: string,
  x: number,
  y: number
) {
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text(label, x, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(valor || "-", x + 36, y);
}

function novaPaginaSeNecessario(doc: jsPDF, y: number) {
  if (y > 270) {
    doc.addPage();
    return 20;
  }

  return y;
}

export function gerarPedidoPDF(pedido: any) {
  const doc = new jsPDF("p", "mm", "a4");

  const cliente = pedido?.clientes || {};
  const itens = pedido?.pedido_itens || pedido?.itens || [];

  let y = 18;

  // Cabeçalho
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 34, "F");

  try {
    doc.addImage("/logo-berbel.png", "PNG", 14, 7, 22, 22);
  } catch {
    // Caso a logo não carregue, o PDF continua sendo gerado.
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BERBEL CONNECT", 42, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Pedido comercial / CRM para representantes", 42, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Pedido Nº ${texto(pedido?.numero || pedido?.id)}`, 150, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Emitido em ${new Date().toLocaleDateString("pt-BR")}`, 150, 22);

  y = 46;

  // Resumo do pedido
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("RESUMO DO PEDIDO", 14, y);

  y += 6;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 84, 55, 2, 2, "F");
  doc.roundedRect(112, y, 80, 55, 2, 2, "F");

  doc.setFontSize(9);

  adicionarLinhaInfo(doc, "Número:", texto(pedido?.numero), 18, y + 9);
  adicionarLinhaInfo(
    doc,
    "Data:",
    formatarData(pedido?.data_pedido),
    18,
    y + 17
  );
  adicionarLinhaInfo(doc, "Tipo:", texto(pedido?.tipo), 18, y + 25);
  adicionarLinhaInfo(doc, "Status:", texto(pedido?.status), 18, y + 33);
  adicionarLinhaInfo(
    doc,
    "Vendedor:",
    texto(pedido?.vendedor || pedido?.usuario || "Berbel Connect"),
    18,
    y + 41
  );

  adicionarLinhaInfo(
    doc,
    "Previsão:",
    formatarData(pedido?.data_entrega_prevista),
    116,
    y + 9
  );
  adicionarLinhaInfo(
    doc,
    "Entrega:",
    formatarData(pedido?.data_entrega_real),
    116,
    y + 17
  );
  adicionarLinhaInfo(
    doc,
    "Total:",
    formatarMoeda(pedido?.valor_total),
    116,
    y + 25
  );
  adicionarLinhaInfo(
    doc,
    "Comissão:",
    formatarMoeda(pedido?.valor_comissao),
    116,
    y + 33
  );

  y += 68;

  // Cliente
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("DADOS DO CLIENTE", 14, y);

  y += 6;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 178, 55, 2, 2, "F");

  doc.setFontSize(9);

  adicionarLinhaInfo(
    doc,
    "Razão:",
    texto(cliente?.razao_social),
    18,
    y + 9
  );
  adicionarLinhaInfo(
    doc,
    "Fantasia:",
    texto(cliente?.nome_fantasia),
    18,
    y + 17
  );
  adicionarLinhaInfo(doc, "CNPJ:", texto(cliente?.cnpj), 18, y + 25);
  adicionarLinhaInfo(
    doc,
    "Endereço:",
    enderecoCliente(cliente) || "-",
    18,
    y + 33
  );
  adicionarLinhaInfo(
    doc,
    "Contato:",
    `Tel: ${texto(cliente?.telefone)} | WhatsApp: ${texto(cliente?.whatsapp)}`,
    18,
    y + 41
  );
  adicionarLinhaInfo(doc, "E-mail:", texto(cliente?.email), 18, y + 49);

  y += 68;

  // Itens
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("ITENS DO PEDIDO", 14, y);

  y += 8;

  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 178, 9, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.text("Produto", 17, y + 6);
  doc.text("Qtd", 88, y + 6);
  doc.text("Unitário", 105, y + 6);
  doc.text("Total", 132, y + 6);
  doc.text("Comissão", 158, y + 6);

  y += 9;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");

  if (itens.length === 0) {
    doc.text("Nenhum item encontrado.", 17, y + 8);
    y += 16;
  }

  itens.forEach((item: any, index: number) => {
    y = novaPaginaSeNecessario(doc, y);

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 178, 10, "F");
    }

    const nomeProduto = texto(item?.produto_nome || item?.produtos?.nome);
    const nomeLimitado =
      nomeProduto.length > 38 ? `${nomeProduto.slice(0, 38)}...` : nomeProduto;

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    doc.text(nomeLimitado, 17, y + 7);
    doc.text(texto(item?.quantidade), 88, y + 7);
    doc.text(formatarMoeda(item?.valor_unitario), 105, y + 7);
    doc.text(formatarMoeda(item?.valor_total), 132, y + 7);
    doc.text(formatarMoeda(item?.valor_comissao), 158, y + 7);

    y += 10;
  });

  y += 8;
  y = novaPaginaSeNecessario(doc, y);

  // Totais
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(112, y, 80, 34, 2, 2, "F");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL DO PEDIDO", 118, y + 10);

  doc.setFontSize(14);
  doc.setTextColor(29, 78, 216);
  doc.text(formatarMoeda(pedido?.valor_total), 118, y + 20);

  doc.setFontSize(9);
  doc.setTextColor(22, 163, 74);
  doc.text(`Comissão: ${formatarMoeda(pedido?.valor_comissao)}`, 118, y + 28);

  y += 46;

  // Observações
  y = novaPaginaSeNecessario(doc, y);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("OBSERVAÇÕES", 14, y);

  y += 6;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 178, 30, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);

  const observacoes = texto(pedido?.observacoes);
  const linhasObs = doc.splitTextToSize(observacoes, 170);
  doc.text(linhasObs, 18, y + 8);

  // Rodapé
  const totalPaginas = doc.getNumberOfPages();

  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 285, 196, 285);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Berbel Connect - CRM e ERP comercial para representantes",
      14,
      291
    );
    doc.text(`Página ${pagina} de ${totalPaginas}`, 170, 291);
  }

  doc.save(`pedido-${pedido?.numero || pedido?.id || "berbel-connect"}.pdf`);
}