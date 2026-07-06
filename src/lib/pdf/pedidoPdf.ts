import jsPDF from "jspdf";

const empresa = {
  representante: "Marcelo Henrique Berbel",
  telefone: "16 98806-9279",
  email: "berbelm@icloud.com",
  cidade: "Franca - SP",
  slogan: "Conectando relações, gerando resultados",
};

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function texto(valor: any) {
  return valor || "-";
}

async function carregarImagemBase64(caminho: string) {
  const resposta = await fetch(caminho);
  const blob = await resposta.blob();

  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function gerarPedidoPDF(pedido: any) {
  const doc = new jsPDF("p", "mm", "a4");

  const azul = "#003B88";
  const azulEscuro = "#00245A";
  const azulClaro = "#0B74FF";
  const cinza = "#F4F7FB";
  const preto = "#111827";

  const cliente = pedido.clientes || {};
  const itens = pedido.pedido_itens || [];
  const total = Number(pedido.valor_total || 0);
  const dataAtual = new Date().toLocaleString("pt-BR");

  let logo: string | null = null;

  try {
    logo = await carregarImagemBase64("/logo-berbel.png");
  } catch {
    logo = null;
  }

  function cabecalho() {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, "F");

    if (logo) {
      doc.addImage(logo, "PNG", 10, 8, 70, 32);
    } else {
      doc.setTextColor(azulEscuro);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text("BERBEL", 12, 22);

      doc.setTextColor(azulClaro);
      doc.setFontSize(15);
      doc.text("CONNECT", 12, 32);
    }

    doc.setTextColor(preto);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(empresa.slogan, 14, 44);

    doc.setDrawColor(0, 59, 136);
    doc.line(86, 10, 86, 52);

    doc.setTextColor(azul);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("REPRESENTANTE COMERCIAL", 92, 14);

    doc.setTextColor(azulEscuro);
    doc.setFontSize(9);
    doc.text(empresa.representante, 92, 22);

    doc.setTextColor(preto);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Tel.: ${empresa.telefone}`, 92, 31);
    doc.text(`E-mail: ${empresa.email}`, 92, 39);
    doc.text(empresa.cidade, 92, 47);

    doc.setFillColor(0, 59, 136);
    doc.roundedRect(128, 9, 70, 16, 2, 2, "F");

    doc.setTextColor("#FFFFFF");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("PEDIDO DE VENDA", 137, 19);

    doc.setTextColor(preto);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text("Pedido Nº:", 130, 34);
    doc.setFont("helvetica", "bold");
    doc.text(String(pedido.numero || pedido.id || "-").slice(0, 16), 176, 34);

    doc.setFont("helvetica", "normal");
    doc.text("Data do Pedido:", 130, 42);
    doc.text(texto(pedido.data_pedido), 176, 42);

    doc.text("Status:", 130, 50);
    doc.setTextColor("#16A34A");
    doc.setFont("helvetica", "bold");
    doc.text(texto(pedido.status), 176, 50);

    doc.setTextColor(preto);
    doc.setFont("helvetica", "normal");
    doc.text("Vendedor:", 130, 58);
    doc.text(empresa.representante, 176, 58);

    doc.setDrawColor(0, 59, 136);
    doc.line(10, 68, 200, 68);
  }

  function rodape() {
    doc.setFillColor(0, 36, 90);
    doc.rect(0, 285, 210, 12, "F");

    doc.setTextColor("#FFFFFF");
    doc.setFontSize(7);
    doc.text("Documento gerado eletronicamente pelo sistema Berbel Connect", 12, 292);
    doc.text(dataAtual, 158, 292);
  }

  cabecalho();

  doc.setTextColor(azulEscuro);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DADOS DO CLIENTE", 12, 80);

  doc.setFillColor(244, 247, 251);
  doc.roundedRect(12, 86, 90, 52, 2, 2, "F");

  doc.setTextColor(preto);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  doc.text("Razão Social:", 18, 96);
  doc.setFont("helvetica", "bold");
  doc.text(texto(cliente.razao_social), 48, 96, { maxWidth: 48 });

  doc.setFont("helvetica", "normal");
  doc.text("CNPJ:", 18, 106);
  doc.text(texto(cliente.cnpj), 48, 106);

  doc.text("Endereço:", 18, 116);
  doc.text(texto(cliente.endereco), 48, 116, { maxWidth: 48 });

  doc.text("Telefone:", 18, 128);
  doc.text(texto(cliente.telefone), 48, 128);

  doc.text("WhatsApp:", 18, 135);
  doc.text(texto(cliente.whatsapp), 48, 135);

  doc.setTextColor(azulEscuro);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("RESUMO DO PEDIDO", 108, 80);

  doc.setFillColor(244, 247, 251);
  doc.roundedRect(108, 86, 90, 52, 2, 2, "F");

  doc.setTextColor(preto);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  doc.text("Total dos Produtos:", 114, 98);
  doc.text(moeda(total), 166, 98);

  doc.text("Desconto:", 114, 110);
  doc.text(moeda(0), 166, 110);

  doc.text("Frete:", 114, 122);
  doc.text(moeda(0), 166, 122);

  doc.setFillColor(0, 59, 136);
  doc.roundedRect(108, 130, 90, 14, 2, 2, "F");

  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTAL DO PEDIDO:", 114, 139);

  doc.setFontSize(13);
  doc.text(moeda(total), 158, 139);

  let y = 158;

  doc.setTextColor(azulEscuro);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ITENS DO PEDIDO", 12, y);

  y += 7;

  function cabecalhoTabela() {
    doc.setFillColor(0, 59, 136);
    doc.rect(10, y, 190, 9, "F");

    doc.setTextColor("#FFFFFF");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);

    doc.text("ITEM", 14, y + 6);
    doc.text("PRODUTO", 30, y + 6);
    doc.text("UNID.", 112, y + 6);
    doc.text("QTD.", 130, y + 6);
    doc.text("VALOR UNIT.", 150, y + 6);
    doc.text("VALOR TOTAL", 176, y + 6);

    y += 9;
  }

  cabecalhoTabela();

  itens.forEach((item: any, index: number) => {
    if (y > 246) {
      rodape();
      doc.addPage();
      cabecalho();
      y = 82;

      doc.setTextColor(azulEscuro);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("ITENS DO PEDIDO - CONTINUAÇÃO", 12, y);

      y += 7;
      cabecalhoTabela();
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, y, 190, 11, "F");
    }

    doc.setTextColor(preto);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    doc.text(String(index + 1), 16, y + 7);
    doc.text(texto(item.produtos?.nome), 30, y + 7, { maxWidth: 75 });
    doc.text(texto(item.produtos?.unidade || "UN"), 114, y + 7);
    doc.text(String(item.quantidade || 0), 132, y + 7);
    doc.text(moeda(item.valor_unitario), 150, y + 7);
    doc.text(moeda(item.valor_total), 176, y + 7);

    y += 11;
  });

  y += 8;

  if (y > 248) {
    rodape();
    doc.addPage();
    cabecalho();
    y = 82;
  }

  doc.setDrawColor(0, 59, 136);
  doc.line(10, y, 200, y);

  y += 8;

  doc.setFillColor(244, 247, 251);
  doc.roundedRect(10, y, 95, 36, 2, 2, "F");

  doc.setTextColor(azulEscuro);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("OBSERVAÇÕES", 15, y + 8);

  doc.setTextColor(preto);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    pedido.observacoes ||
      "Agradecemos a preferência. Qualquer dúvida, estamos à disposição.",
    15,
    y + 17,
    { maxWidth: 82 }
  );

  doc.setFillColor(244, 247, 251);
  doc.roundedRect(110, y, 90, 36, 2, 2, "F");

  doc.setTextColor(azulEscuro);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CONTATOS", 115, y + 8);

  doc.setTextColor(preto);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(empresa.telefone, 115, y + 17);
  doc.text(empresa.email, 115, y + 25);
  doc.text(empresa.cidade, 115, y + 33);

  rodape();

  doc.save(`pedido-${pedido.numero || pedido.id}.pdf`);
}