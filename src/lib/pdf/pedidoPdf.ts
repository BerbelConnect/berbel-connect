import jsPDF from "jspdf";

const empresa = {
  nome: "BERBEL",
  sobrenome: "CONNECT",
  slogan: "Conectando relações, gerando resultados",
  representante: "Marcelo Henrique Berbel",
  telefone: "16 98806-9279",
  email: "berbelm@icloud.com",
  cidade: "Franca - SP",
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

function enderecoCliente(cliente: any) {
  if (!cliente) return "-";

  const partes = [
    cliente.endereco,
    cliente.numero,
    cliente.bairro,
    cliente.cidade,
    cliente.estado,
  ].filter(Boolean);

  return partes.length ? partes.join(", ") : "-";
}

async function carregarLogo() {
  try {
    const response = await fetch("/logo-berbel.png");
    const blob = await response.blob();

    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function gerarPedidoPDF(pedido: any) {
  const doc = new jsPDF("p", "mm", "a4");
  const cinzaFundo = [245, 247, 250];

  const logo = await carregarLogo();

  if (logo) {
    doc.addImage(logo, "PNG", 14, 12, 42, 22);
  } else {
    doc.setTextColor(0, 63, 135);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(empresa.nome, 14, 20);
    doc.setTextColor(21, 101, 192);
    doc.setFontSize(14);
    doc.text(empresa.sobrenome, 14, 28);
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.text(empresa.slogan, 14, 39);

  doc.setDrawColor(0, 63, 135);
  doc.line(69, 13, 69, 44);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(0, 63, 135);
  doc.text("REPRESENTANTE COMERCIAL", 74, 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(empresa.representante, 74, 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Tel.: ${empresa.telefone}`, 74, 31);
  doc.text(`E-mail: ${empresa.email}`, 74, 37);
  doc.text(empresa.cidade, 74, 43);

  doc.setFillColor(0, 63, 135);
  doc.roundedRect(128, 13, 62, 15, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("PEDIDO DE VENDA", 143, 23);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  doc.text("Pedido Nº:", 130, 39);
  doc.text(texto(pedido.numero), 175, 39);

  doc.text("Data do Pedido:", 130, 48);
  doc.text(texto(pedido.data_pedido), 175, 48);

  doc.text("Status:", 130, 57);
  doc.setTextColor(0, 120, 40);
  doc.text(texto(pedido.status), 175, 57);

  doc.setTextColor(0, 0, 0);
  doc.text("Vendedor:", 130, 66);
  doc.text(empresa.representante, 175, 66);

  doc.setDrawColor(0, 63, 135);
  doc.line(14, 75, 196, 75);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 63, 135);
  doc.text("DADOS DO CLIENTE", 14, 86);
  doc.text("RESUMO DO PEDIDO", 116, 86);

  doc.setFillColor(cinzaFundo[0], cinzaFundo[1], cinzaFundo[2]);
  doc.roundedRect(14, 91, 84, 55, 2, 2, "F");
  doc.roundedRect(116, 91, 80, 55, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);

  doc.text("Razão Social:", 18, 101);
  doc.text(texto(pedido.clientes?.razao_social), 49, 101, { maxWidth: 45 });

  doc.text("CNPJ:", 18, 111);
  doc.text(texto(pedido.clientes?.cnpj), 49, 111);

  doc.text("Endereço:", 18, 121);
  doc.text(enderecoCliente(pedido.clientes), 49, 121, { maxWidth: 45 });

  doc.text("Telefone:", 18, 134);
  doc.text(texto(pedido.clientes?.telefone), 49, 134);

  doc.text("WhatsApp:", 18, 143);
  doc.text(texto(pedido.clientes?.whatsapp), 49, 143);

  doc.text("Total dos Produtos:", 121, 101);
  doc.text(moeda(pedido.valor_total), 174, 101);

  doc.text("Desconto:", 121, 111);
  doc.text(moeda(0), 174, 111);

  doc.text("Pagamento:", 121, 121);
  doc.text(texto(pedido.condicao_pagamento), 151, 121, { maxWidth: 42 });

  doc.text("Tipo:", 121, 131);
  doc.text(texto(pedido.tipo_operacao || pedido.tipo), 174, 131);

  doc.setFillColor(0, 63, 135);
  doc.roundedRect(116, 137, 80, 13, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL DO PEDIDO:", 121, 146);
  doc.setFontSize(10);
  doc.text(moeda(pedido.valor_total), 164, 146);

  let y = 164;

  doc.setTextColor(0, 63, 135);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ITENS DO PEDIDO", 14, y);

  y += 6;

  doc.setFillColor(0, 63, 135);
  doc.rect(14, y, 182, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.text("ITEM", 17, y + 5);
  doc.text("PRODUTO", 31, y + 5);
  doc.text("REPRESENTADA", 84, y + 5);
  doc.text("QTD.", 127, y + 5);
  doc.text("VALOR UNIT.", 145, y + 5);
  doc.text("VALOR TOTAL", 174, y + 5);

  y += 8;

  const itens = pedido.pedido_itens || [];

  itens.forEach((item: any, index: number) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 8, "F");
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);

    doc.text(String(index + 1), 18, y + 5);

    doc.text(
      texto(item.produto_nome || item.produtos?.nome).substring(0, 32),
      31,
      y + 5
    );

    doc.text(
      texto(
        item.representada_nome || item.representadas?.nome_fantasia
      ).substring(0, 24),
      84,
      y + 5
    );

    doc.text(String(item.quantidade || 0), 130, y + 5);
    doc.text(moeda(item.valor_unitario), 145, y + 5);
    doc.text(moeda(item.valor_total), 174, y + 5);

    y += 8;
  });

  y += 8;

  doc.setDrawColor(0, 63, 135);
  doc.line(14, y, 196, y);

  y += 10;

  doc.setFillColor(cinzaFundo[0], cinzaFundo[1], cinzaFundo[2]);
  doc.roundedRect(14, y, 84, 36, 2, 2, "F");
  doc.roundedRect(112, y, 84, 36, 2, 2, "F");

  doc.setTextColor(0, 63, 135);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("OBSERVAÇÕES", 18, y + 8);
  doc.text("CONTATOS", 116, y + 8);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  doc.text(String(pedido.observacoes || "-"), 18, y + 17, {
    maxWidth: 76,
  });

  doc.text(empresa.telefone, 116, y + 17);
  doc.text(empresa.email, 116, y + 25);
  doc.text(empresa.cidade, 116, y + 33);

  doc.setFillColor(0, 36, 90);
  doc.rect(0, 286, 210, 11, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.text(
    "Documento gerado eletronicamente pelo sistema Berbel Connect",
    14,
    293
  );

  const dataAtual = new Date().toLocaleString("pt-BR");
  doc.text(dataAtual, 170, 293);

  doc.save(`pedido-${pedido.numero || pedido.id}.pdf`);
}