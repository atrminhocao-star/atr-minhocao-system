import React, { useEffect, useMemo, useState } from "react";
import { Truck, Route, Wallet, Fuel, Plus, Trash2, Save, LogOut, User, Lock, Droplets, Gauge, Building2, Filter, Pencil, X, CalendarDays } from "lucide-react";

const CHAVE_PRINCIPAL = "atr-minhocao-dados";
const CHAVES_ANTIGAS = ["atr-minhocao-dados", "atr-minhocao-v4", "atr-minhocao-v3", "atr-minhocao-v2", "atr-minhocao-v5", "atr-minhocao-v6", "atr-minhocao-v7", "atr-minhocao-v8", "atr-minhocao-v9", "atr-minhocao-v10", "atr-minhocao-v11", "atr-minhocao-v12", "atr-minhocao-v13"];

const moeda = (valor) => {
  const n = numero(valor);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const numero = (valor) => {
  if (valor === null || valor === undefined || valor === "") return 0;
  const convertido = Number(String(valor).replace(",", "."));
  return Number.isNaN(convertido) ? 0 : convertido;
};

const formatarData = (data) => {
  if (!data) return "-";
  const partes = String(data).split("-");
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const dataBRParaISO = (dataBR) => {
  if (!dataBR) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataBR)) return dataBR;
  const partes = String(dataBR).split("/");
  if (partes.length !== 3) return "";
  const [dia, mes, ano] = partes;
  if (!dia || !mes || !ano) return "";
  return `${ano.padStart(4, "0")}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
};

const normalizarFormaPagamento = (forma) => {
  if (forma === "Desconto por empresa") return "Desconto em folha";
  return forma || "-";
};

const normalizarTexto = (texto) =>
  String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const formatarValorDigitado = (valor) => {
  const digitos = String(valor || "").replace(/\D/g, "");
  if (!digitos) return "";
  const numeroFinal = Number(digitos) / 100;
  return numeroFinal.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const somarMeses = (dataISO, meses) => {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1 + meses, dia);
  return data.toISOString().slice(0, 10);
};

const freteEmAtraso = (viagem) => {
  if (!viagem || viagem.fretePago || !viagem.previsaoPagamento) return false;
  return viagem.previsaoPagamento < hojeISO();
};

const statusPrazoFrete = (viagem) => {
  if (freteEmAtraso(viagem)) return "Em atraso";
  return "Dentro do prazo";
};

const juntarPorId = (listas = []) => {
  const mapa = new Map();

  listas.flat().filter(Boolean).forEach((item) => {
    const id = item.id || crypto.randomUUID();
    mapa.set(id, { ...item, id });
  });

  return Array.from(mapa.values());
};

const carregarTodosDadosSalvos = () => {
  const chaves = [
    "atr-minhocao-dados",
    "atr-minhocao-v13",
    "atr-minhocao-v12",
    "atr-minhocao-v11",
    "atr-minhocao-v10",
    "atr-minhocao-v9",
    "atr-minhocao-v8",
    "atr-minhocao-v7",
    "atr-minhocao-v6",
    "atr-minhocao-v5",
    "atr-minhocao-v4",
    "atr-minhocao-v3",
    "atr-minhocao-v2",
  ];

  const dados = [];

  chaves.forEach((chave) => {
    try {
      const bruto = localStorage.getItem(chave);
      if (bruto) dados.push(JSON.parse(bruto));
    } catch (e) {
      console.warn("Erro lendo chave", chave, e);
    }
  });

  if (!dados.length) return null;

  return {
    usuarios: juntarPorId(dados.map((d) => d.usuarios || [])),
    clientes: juntarPorId(dados.map((d) => d.clientes || [])),
    materiais: juntarPorId(dados.map((d) => d.materiais || [])),
    caminhoes: juntarPorId(dados.map((d) => d.caminhoes || [])),
    viagens: juntarPorId(dados.map((d) => d.viagens || [])),
    despesas: juntarPorId(dados.map((d) => d.despesas || [])),
    entradasCaixa: juntarPorId(dados.map((d) => d.entradasCaixa || [])),
    saidasManuais: juntarPorId(dados.map((d) => d.saidasManuais || [])),
    contasReceberFixas: juntarPorId(dados.map((d) => d.contasReceberFixas || [])),
  };
};

const hojeISO = () => new Date().toISOString().slice(0, 10);

const statusConta = (despesa) => {
  if (despesa.statusPagamento === "Pago" || despesa.dataPagamento) return "Pago";
  if (despesa.dataVencimento && despesa.dataVencimento < hojeISO()) return "Atrasada";
  return "Em aberto";
};

const dadosIniciais = {
  usuarios: [
    { id: "1", nome: "Administrador", usuario: "admin", senha: "1234", perfil: "Administrador" },
  ],
  clientes: [
    { id: crypto.randomUUID(), nome: "Cliente exemplo", contato: "", telefone: "", cidade: "Criciúma/SC" },
  ],
  materiais: [
    { id: crypto.randomUUID(), nome: "Brita", origem: "", destino: "", valor: "0" },
    { id: crypto.randomUUID(), nome: "Areia", origem: "", destino: "", valor: "0" },
  ],
  caminhoes: [
    { id: crypto.randomUUID(), placa: "ATR-0001", modelo: "Scania Basculante", motorista: "Motorista 1" },
    { id: crypto.randomUUID(), placa: "ATR-0002", modelo: "Volvo FH", motorista: "Motorista 2" },
    { id: crypto.randomUUID(), placa: "ATR-0003", modelo: "Mercedes Actros", motorista: "Motorista 3" },
  ],
  viagens: [],
  despesas: [],
};

const despesaVazia = {
  data: "",
  caminhao: "",
  tipo: "Combustível",
  litros: "",
  valorLitro: "",
  kmPainel: "",
  postoEmpresa: "",
  formaPagamento: "Pix",
  pagamentoPrazoComo: "",
  dataVencimento: "",
  dataPagamento: "",
  responsavelPagamento: "",
  descricao: "",
  valor: "",
  statusPagamento: "Pago",
};

export default function App() {
  const [aba, setAba] = useState("dashboard");
  const [logado, setLogado] = useState(null);

  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [caminhoes, setCaminhoes] = useState([]);
  const [viagens, setViagens] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [entradasCaixa, setEntradasCaixa] = useState([]);
  const [saidasManuais, setSaidasManuais] = useState([]);
  const [contasReceberFixas, setContasReceberFixas] = useState([]);

  const [loginForm, setLoginForm] = useState({ usuario: "", senha: "" });
  const [filtros, setFiltros] = useState({ cliente: "", caminhao: "" });

  const [usuarioForm, setUsuarioForm] = useState({ nome: "", usuario: "", senha: "", perfil: "Operacional" });
  const [materialForm, setMaterialForm] = useState({ nome: "", origem: "", destino: "", valor: "" });
  const [materialEditandoId, setMaterialEditandoId] = useState(null);
  const [clienteForm, setClienteForm] = useState({ nome: "", contato: "", telefone: "", cidade: "" });
  const [clienteEditandoId, setClienteEditandoId] = useState(null);
  const [caminhaoForm, setCaminhaoForm] = useState({ placa: "", modelo: "", motorista: "" });
  const [caminhaoEditandoId, setCaminhaoEditandoId] = useState(null);

  const [viagemForm, setViagemForm] = useState({
    data: "",
    numeroPedido: "",
    caminhao: "",
    origem: "",
    destino: "",
    material: "",
    cliente: "",
    quantidade: "",
    unidade: "Toneladas",
    valorUnitario: "",
    frete: "",
    previsaoPagamento: "",
    status: "Programada",
  });
  const [viagemEditandoId, setViagemEditandoId] = useState(null);

  const [filtroRecebimentos, setFiltroRecebimentos] = useState({
    inicio: "",
    fim: "",
    cliente: "",
    prazo: "",
  });

  const [filtroRelatorio, setFiltroRelatorio] = useState({
    inicio: "",
    fim: "",
    cliente: "",
    caminhao: "",
    material: "",
    status: "",
  });

  const [entradaForm, setEntradaForm] = useState({
    data: "",
    valor: "",
    descricao: "",
    cliente: "",
    caminhao: "",
    origem: "Manual",
  });
  const [entradaEditandoId, setEntradaEditandoId] = useState(null);

  const [saidaForm, setSaidaForm] = useState({
    data: "",
    valor: "",
    descricao: "",
    cliente: "",
    caminhao: "",
    origem: "Manual",
  });
  const [saidaEditandoId, setSaidaEditandoId] = useState(null);

  const [contaReceberForm, setContaReceberForm] = useState({
    cliente: "",
    descricao: "",
    valorParcela: "",
    quantidadeParcelas: "",
    dataPrimeiraParcela: "",
  });

  const [contaPagarRecorrenteForm, setContaPagarRecorrenteForm] = useState({
    responsavelPagamento: "",
    descricao: "",
    tipo: "Salário",
    caminhao: "",
    valorParcela: "",
    quantidadeParcelas: "",
    dataPrimeiraParcela: "",
    formaPagamento: "Pix",
  });

  const [despesaForm, setDespesaForm] = useState(despesaVazia);
  const [despesaEditandoId, setDespesaEditandoId] = useState(null);
  const [aplicarRecorrencia, setAplicarRecorrencia] = useState(false);

  useEffect(() => {
    let dadosEncontrados = null;

    dadosEncontrados = carregarTodosDadosSalvos();

    if (!dadosEncontrados) {
      const principal = localStorage.getItem(CHAVE_PRINCIPAL);
      if (principal) {
        dadosEncontrados = JSON.parse(principal);
      } else {
        for (const chave of CHAVES_ANTIGAS) {
          const antigo = localStorage.getItem(chave);
          if (antigo) {
            dadosEncontrados = JSON.parse(antigo);
            break;
          }
        }
      }
    }

    const sessao = localStorage.getItem("atr-minhocao-login");

    if (dadosEncontrados) {
      setUsuarios(dadosEncontrados.usuarios || dadosIniciais.usuarios);
      setClientes(dadosEncontrados.clientes || []);
      setMateriais(dadosEncontrados.materiais || []);
      setCaminhoes(dadosEncontrados.caminhoes || dadosIniciais.caminhoes);
      setViagens(dadosEncontrados.viagens || []);
      setDespesas((dadosEncontrados.despesas || []).map((d) => ({
        ...d,
        formaPagamento: normalizarFormaPagamento(d.formaPagamento),
      })));
      setEntradasCaixa(dadosEncontrados.entradasCaixa || []);
      setSaidasManuais(dadosEncontrados.saidasManuais || []);
      setContasReceberFixas(dadosEncontrados.contasReceberFixas || []);
    } else {
      setUsuarios(dadosIniciais.usuarios);
      setClientes(dadosIniciais.clientes);
      setMateriais(dadosIniciais.materiais || []);
      setCaminhoes(dadosIniciais.caminhoes);
      setViagens(dadosIniciais.viagens);
      setDespesas(dadosIniciais.despesas.map((d) => ({
        ...d,
        formaPagamento: normalizarFormaPagamento(d.formaPagamento),
      })));
      setEntradasCaixa([]);
      setSaidasManuais([]);
      setContasReceberFixas([]);
    }

    if (sessao) setLogado(JSON.parse(sessao));
  }, []);


  useEffect(() => {
    if (!clientes.length) return;

    const encontrarNomePadrao = (nomeAtual) => {
      const atualNorm = normalizarTexto(nomeAtual);
      if (!atualNorm) return nomeAtual;

      const exato = clientes.find((c) => normalizarTexto(c.nome) === atualNorm);
      if (exato) return exato.nome;

      const parecido = clientes.find((c) => {
        const clienteNorm = normalizarTexto(c.nome);
        if (clienteNorm.length < 3) return false;
        return atualNorm.includes(clienteNorm) || clienteNorm.includes(atualNorm);
      });

      return parecido ? parecido.nome : nomeAtual;
    };

    setViagens((lista) =>
      lista.map((v) => ({
        ...v,
        cliente: encontrarNomePadrao(v.cliente),
      }))
    );

    setDespesas((lista) =>
      lista.map((d) => ({
        ...d,
        responsavelPagamento: encontrarNomePadrao(d.responsavelPagamento),
      }))
    );

    setEntradasCaixa((lista) =>
      lista.map((e) => ({
        ...e,
        cliente: encontrarNomePadrao(e.cliente),
      }))
    );

    setSaidasManuais((lista) =>
      lista.map((s) => ({
        ...s,
        cliente: encontrarNomePadrao(s.cliente),
      }))
    );

    setContasReceberFixas((lista) =>
      lista.map((c) => ({
        ...c,
        cliente: encontrarNomePadrao(c.cliente),
      }))
    );
  }, [clientes.length]);

  useEffect(() => {
    const dados = { usuarios, clientes, materiais, caminhoes, viagens, despesas, entradasCaixa, saidasManuais, contasReceberFixas };
    localStorage.setItem(CHAVE_PRINCIPAL, JSON.stringify(dados));
    localStorage.setItem("atr-minhocao-v13", JSON.stringify(dados));
    localStorage.setItem("atr-minhocao-v4", JSON.stringify(dados));
  }, [usuarios, clientes, materiais, caminhoes, viagens, despesas, entradasCaixa, saidasManuais, contasReceberFixas]);

  const viagensFiltradas = useMemo(() => {
    return viagens.filter((v) => {
      const okCliente = !filtros.cliente || v.cliente === filtros.cliente;
      const okCaminhao = !filtros.caminhao || v.caminhao === filtros.caminhao;
      return okCliente && okCaminhao;
    });
  }, [viagens, filtros]);

  const fretesAReceber = useMemo(() => {
    return viagens
      .filter((v) => {
        const okInicio = !filtroRecebimentos.inicio || v.previsaoPagamento >= filtroRecebimentos.inicio;
        const okFim = !filtroRecebimentos.fim || v.previsaoPagamento <= filtroRecebimentos.fim;
        const okCliente = !filtroRecebimentos.cliente || v.cliente === filtroRecebimentos.cliente;
        const okPrazo = !filtroRecebimentos.prazo || statusPrazoFrete(v) === filtroRecebimentos.prazo;
        const naoPago = !v.fretePago;
        return okInicio && okFim && okCliente && okPrazo && naoPago;
      })
      .sort((a, b) => String(a.previsaoPagamento || "9999-12-31").localeCompare(String(b.previsaoPagamento || "9999-12-31")));
  }, [viagens, filtroRecebimentos]);

  const totalFretesAReceber = useMemo(() => {
    return fretesAReceber.reduce((s, v) => s + numero(v.frete), 0);
  }, [fretesAReceber]);

  const fretesEmAtrasoDashboard = useMemo(() => {
    return viagens
      .filter((v) => numero(v.frete) > 0 && freteEmAtraso(v))
      .sort((a, b) => String(a.previsaoPagamento || "9999-12-31").localeCompare(String(b.previsaoPagamento || "9999-12-31")));
  }, [viagens]);

  const totalFretesEmAtraso = useMemo(() => {
    return fretesEmAtrasoDashboard.reduce((s, v) => s + numero(v.frete), 0);
  }, [fretesEmAtrasoDashboard]);

  const viagensRelatorio = useMemo(() => {
    return viagens
      .filter((v) => {
        const okInicio = !filtroRelatorio.inicio || v.data >= filtroRelatorio.inicio;
        const okFim = !filtroRelatorio.fim || v.data <= filtroRelatorio.fim;
        const okCliente = !filtroRelatorio.cliente || v.cliente === filtroRelatorio.cliente;
        const okCaminhao = !filtroRelatorio.caminhao || v.caminhao === filtroRelatorio.caminhao;
        const okMaterial = !filtroRelatorio.material || v.material === filtroRelatorio.material;
        const okStatus = !filtroRelatorio.status || v.status === filtroRelatorio.status;
        return okInicio && okFim && okCliente && okCaminhao && okMaterial && okStatus;
      })
      .sort((a, b) => String(a.data || "").localeCompare(String(b.data || "")));
  }, [viagens, filtroRelatorio]);

  const totalRelatorioViagens = useMemo(() => {
    return viagensRelatorio.reduce((s, v) => s + numero(v.frete), 0);
  }, [viagensRelatorio]);

  const gerarPdfRelatorioViagens = () => {
    const linhas = viagensRelatorio.map((v) => `
      <tr>
        <td>${formatarData(v.data)}</td>
        <td>${v.numeroPedido || "-"}</td>
        <td>${v.cliente || "-"}</td>
        <td>${v.caminhao || "-"}</td>
        <td>${v.material || "-"}</td>
        <td>${v.origem || "-"}</td>
        <td>${v.destino || "-"}</td>
        <td>${v.quantidade ? `${v.quantidade} ${v.unidade || ""}` : "-"}</td>
        <td>${moeda(v.valorUnitario)}</td>
        <td>${moeda(v.frete)}</td>
        <td>${formatarData(v.previsaoPagamento)}</td>
        <td>${v.status || "-"}</td>
      </tr>
    `).join("");

    const filtrosAplicados = [
      filtroRelatorio.inicio ? `Data inicial: ${formatarData(filtroRelatorio.inicio)}` : null,
      filtroRelatorio.fim ? `Data final: ${formatarData(filtroRelatorio.fim)}` : null,
      filtroRelatorio.cliente ? `Cliente: ${filtroRelatorio.cliente}` : null,
      filtroRelatorio.caminhao ? `Caminhão: ${filtroRelatorio.caminhao}` : null,
      filtroRelatorio.material ? `Material: ${filtroRelatorio.material}` : null,
      filtroRelatorio.status ? `Status: ${filtroRelatorio.status}` : null,
    ].filter(Boolean).join(" | ") || "Sem filtros aplicados";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Viagens - ATR MINHOCÃO</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
            h1 { color: #d71920; margin-bottom: 4px; }
            h2 { margin-top: 0; font-size: 16px; color: #333; font-weight: normal; }
            .info { margin: 18px 0; font-size: 12px; color: #444; }
            .resumo { display: flex; gap: 16px; margin: 18px 0; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; }
            .card strong { display: block; font-size: 18px; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 10px; }
            th { background: #d71920; color: white; text-align: left; padding: 7px; }
            td { border-bottom: 1px solid #ddd; padding: 7px; vertical-align: top; }
            tfoot td { font-weight: bold; border-top: 2px solid #111; }
            @media print {
              button { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="padding:10px 16px;margin-bottom:20px;background:#d71920;color:white;border:0;border-radius:8px;font-weight:bold;cursor:pointer;">
            Salvar/imprimir PDF
          </button>

          <h1>ATR MINHOCÃO</h1>
          <h2>Relatório de viagens realizadas</h2>

          <div class="info">
            <strong>Filtros:</strong> ${filtrosAplicados}<br/>
            <strong>Emitido em:</strong> ${new Date().toLocaleString("pt-BR")}
          </div>

          <div class="resumo">
            <div class="card">Viagens encontradas<strong>${viagensRelatorio.length}</strong></div>
            <div class="card">Total de fretes<strong>${moeda(totalRelatorioViagens)}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Caminhão</th>
                <th>Material</th>
                <th>Origem</th>
                <th>Destino</th>
                <th>Quantidade</th>
                <th>Valor unit.</th>
                <th>Frete</th>
                <th>Prev. pag.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${linhas || `<tr><td colspan="12">Nenhuma viagem encontrada para os filtros selecionados.</td></tr>`}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="9">TOTAL</td>
                <td>${moeda(totalRelatorioViagens)}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;

    const janela = window.open("", "_blank");
    janela.document.write(html);
    janela.document.close();
    janela.focus();
  };

  const saidasCaixa = useMemo(() => {
    const saidasDasDespesas = despesas.map((d) => ({
      id: d.id,
      data: d.dataPagamento || d.data || d.dataVencimento || "",
      valor: numero(d.valor),
      descricao: d.descricao || d.tipo || "Despesa",
      cliente: d.responsavelPagamento || d.postoEmpresa || "",
      caminhao: d.caminhao || "",
      tipo: "Saída",
      origem: "Despesa",
    }));

    const saidasLancadas = saidasManuais.map((s) => ({
      ...s,
      valor: numero(s.valor),
      tipo: "Saída",
      origem: s.origem || "Manual",
    }));

    return [...saidasDasDespesas, ...saidasLancadas];
  }, [despesas, saidasManuais]);

  const fluxoCaixa = useMemo(() => {
    const entradas = entradasCaixa.map((e) => ({
      ...e,
      valor: numero(e.valor),
      tipo: "Entrada",
    }));

    return [...entradas, ...saidasCaixa]
      .sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));
  }, [entradasCaixa, saidasCaixa]);

  const resumoFluxo = useMemo(() => {
    const entradas = entradasCaixa.reduce((s, e) => s + numero(e.valor), 0);
    const saidas = saidasCaixa.reduce((s, sda) => s + numero(sda.valor), 0);
    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }, [entradasCaixa, saidasCaixa]);

  const limparEntradaForm = () => {
    setEntradaForm({
      data: "",
      valor: "",
      descricao: "",
      cliente: "",
      caminhao: "",
      origem: "Manual",
    });
    setEntradaEditandoId(null);
  };

  const limparSaidaForm = () => {
    setSaidaForm({
      data: "",
      valor: "",
      descricao: "",
      cliente: "",
      caminhao: "",
      origem: "Manual",
    });
    setSaidaEditandoId(null);
  };

  const salvarEntradaCaixa = () => {
    if (!entradaForm.data || !entradaForm.valor) {
      return alert("Informe data e valor da entrada.");
    }

    if (entradaEditandoId) {
      setEntradasCaixa(entradasCaixa.map((e) =>
        e.id === entradaEditandoId
          ? { ...e, ...entradaForm, valor: numero(entradaForm.valor) }
          : e
      ));
    } else {
      setEntradasCaixa([
        ...entradasCaixa,
        {
          id: crypto.randomUUID(),
          ...entradaForm,
          valor: numero(entradaForm.valor),
        },
      ]);
    }

    limparEntradaForm();
  };

  const salvarSaidaCaixa = () => {
    if (!saidaForm.data || !saidaForm.valor) {
      return alert("Informe data e valor da saída.");
    }

    if (saidaEditandoId) {
      setSaidasManuais(saidasManuais.map((s) =>
        s.id === saidaEditandoId
          ? { ...s, ...saidaForm, valor: numero(saidaForm.valor) }
          : s
      ));
    } else {
      setSaidasManuais([
        ...saidasManuais,
        {
          id: crypto.randomUUID(),
          ...saidaForm,
          valor: numero(saidaForm.valor),
        },
      ]);
    }

    limparSaidaForm();
  };

  const editarEntradaCaixa = (entrada) => {
    setEntradaEditandoId(entrada.id);
    setEntradaForm({
      data: entrada.data || "",
      valor: String(entrada.valor || ""),
      descricao: entrada.descricao || "",
      cliente: entrada.cliente || "",
      caminhao: entrada.caminhao || "",
      origem: "Manual",
    });
    setAba("fluxo");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editarSaidaCaixa = (saida) => {
    setSaidaEditandoId(saida.id);
    setSaidaForm({
      data: saida.data || "",
      valor: String(saida.valor || ""),
      descricao: saida.descricao || "",
      cliente: saida.cliente || "",
      caminhao: saida.caminhao || "",
      origem: "Manual",
    });
    setAba("fluxo");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const marcarFretePago = (viagem) => {
    const dataPadrao = viagem.dataPagamentoFrete ? formatarData(viagem.dataPagamentoFrete) : formatarData(hojeISO());
    const dataDigitada = prompt("Informe a data de pagamento no formato DD/MM/AAAA:", dataPadrao);
    if (!dataDigitada) return;

    const dataPagamento = dataBRParaISO(dataDigitada);
    if (!dataPagamento) {
      return alert("Data inválida. Use o formato DD/MM/AAAA.");
    }

    const entradaExistente = entradasCaixa.find((e) => e.viagemId === viagem.id);

    setViagens(viagens.map((v) =>
      v.id === viagem.id
        ? { ...v, fretePago: true, dataPagamentoFrete: dataPagamento, previsaoPagamento: "" }
        : v
    ));

    if (entradaExistente) {
      setEntradasCaixa(entradasCaixa.map((e) =>
        e.viagemId === viagem.id
          ? {
              ...e,
              data: dataPagamento,
              valor: numero(viagem.frete),
              descricao: `Frete recebido (${formatarData(viagem.data)}) - Pedido ${viagem.numeroPedido || "-"}`,
              cliente: viagem.cliente || "",
              caminhao: viagem.caminhao || "",
            }
          : e
      ));
    } else {
      setEntradasCaixa([
        ...entradasCaixa,
        {
          id: crypto.randomUUID(),
          viagemId: viagem.id,
          data: dataPagamento,
          valor: numero(viagem.frete),
          descricao: `Frete recebido (${formatarData(viagem.data)}) - Pedido ${viagem.numeroPedido || "-"}`,
          cliente: viagem.cliente || "",
          caminhao: viagem.caminhao || "",
          origem: "Frete",
        },
      ]);
    }
  };

  const desfazerPagamentoFrete = (viagem) => {
    if (!window.confirm("Deseja desfazer o pagamento deste frete? Ele voltará para Fretes a receber.")) return;

    setViagens(viagens.map((v) =>
      v.id === viagem.id
        ? { ...v, fretePago: false, dataPagamentoFrete: "" }
        : v
    ));

    setEntradasCaixa(entradasCaixa.filter((e) => e.viagemId !== viagem.id));
  };

  const resumoContasReceber = useMemo(() => {
    const abertas = contasReceberFixas.filter((c) => c.status !== "Pago");
    const pagas = contasReceberFixas.filter((c) => c.status === "Pago");
    return {
      abertas: abertas.length,
      pagas: pagas.length,
      valorAberto: abertas.reduce((s, c) => s + numero(c.valor), 0),
      valorPago: pagas.reduce((s, c) => s + numero(c.valor), 0),
    };
  }, [contasReceberFixas]);

  const salvarContaReceberFixa = () => {
    if (!contaReceberForm.cliente || !contaReceberForm.valorParcela || !contaReceberForm.quantidadeParcelas || !contaReceberForm.dataPrimeiraParcela) {
      return alert("Informe cliente, valor, quantidade de parcelas e data da primeira parcela.");
    }

    const quantidade = Number(contaReceberForm.quantidadeParcelas || 0);
    const novasParcelas = [];

    for (let i = 0; i < quantidade; i++) {
      novasParcelas.push({
        id: crypto.randomUUID(),
        grupoId: crypto.randomUUID(),
        cliente: contaReceberForm.cliente,
        descricao: contaReceberForm.descricao || "Conta fixa a receber",
        valor: numero(contaReceberForm.valorParcela),
        parcela: i + 1,
        totalParcelas: quantidade,
        dataVencimento: somarMeses(contaReceberForm.dataPrimeiraParcela, i),
        status: "Em aberto",
        dataPagamento: "",
      });
    }

    setContasReceberFixas([...contasReceberFixas, ...novasParcelas]);
    setContaReceberForm({
      cliente: "",
      descricao: "",
      valorParcela: "",
      quantidadeParcelas: "",
      dataPrimeiraParcela: "",
    });
  };

  const marcarContaReceberPaga = (conta) => {
    const dataPagamento = prompt("Informe a data de pagamento no formato AAAA-MM-DD:", hojeISO());
    if (!dataPagamento) return;

    setContasReceberFixas(contasReceberFixas.map((c) =>
      c.id === conta.id ? { ...c, status: "Pago", dataPagamento } : c
    ));

    const entradaExistente = entradasCaixa.some((e) => e.contaReceberId === conta.id);
    if (!entradaExistente) {
      setEntradasCaixa([
        ...entradasCaixa,
        {
          id: crypto.randomUUID(),
          contaReceberId: conta.id,
          data: dataPagamento,
          valor: numero(conta.valor),
          descricao: `${conta.descricao} - Parcela ${conta.parcela}/${conta.totalParcelas}`,
          cliente: conta.cliente,
          caminhao: "",
          origem: "Conta fixa a receber",
        },
      ]);
    }
  };

  const emitirPdfFluxoCaixa = () => {
    const linhas = fluxoCaixa.map((item) => `
      <tr>
        <td>${formatarData(item.data)}</td>
        <td>${item.tipo}</td>
        <td>${item.cliente || "-"}</td>
        <td>${item.caminhao || "-"}</td>
        <td>${item.descricao || "-"}</td>
        <td>${moeda(item.valor)}</td>
      </tr>
    `).join("");

    const html = `
      <html>
        <head>
          <title>Fluxo de caixa - ATR MINHOCÃO</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            h1 { color: #d71920; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
            th { background: #d71920; color: white; padding: 8px; text-align: left; }
            td { border-bottom: 1px solid #ddd; padding: 8px; }
            .resumo { margin: 12px 0; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="padding:10px 16px;background:#d71920;color:white;border:0;border-radius:8px;font-weight:bold;">
            Salvar PDF
          </button>
          <h1>ATR MINHOCÃO</h1>
          <h2>Fluxo de caixa</h2>
          <div class="resumo">
            <strong>Entradas:</strong> ${moeda(resumoFluxo.entradas)} |
            <strong>Saídas:</strong> ${moeda(resumoFluxo.saidas)} |
            <strong>Saldo:</strong> ${moeda(resumoFluxo.saldo)}
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Empresa</th>
                <th>Caminhão</th>
                <th>Descrição</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>
        </body>
      </html>
    `;

    const janela = window.open("", "_blank");
    janela.document.write(html);
    janela.document.close();
    janela.focus();
  };

  const contasAPagar = useMemo(() => {
    return despesas
      .filter((d) => d.statusPagamento === "A prazo" || d.statusPagamento === "Pendente" || d.statusPagamento === "Pago" || d.dataVencimento || d.dataPagamento)
      .sort((a, b) => String(a.dataVencimento || "9999-12-31").localeCompare(String(b.dataVencimento || "9999-12-31")));
  }, [despesas]);

  const resumoContas = useMemo(() => {
    const abertas = contasAPagar.filter((d) => statusConta(d) === "Em aberto");
    const atrasadas = contasAPagar.filter((d) => statusConta(d) === "Atrasada");
    const pagas = contasAPagar.filter((d) => statusConta(d) === "Pago");
    return {
      abertas: abertas.length,
      atrasadas: atrasadas.length,
      pagas: pagas.length,
      valorAberto: abertas.reduce((s, d) => s + numero(d.valor), 0),
      valorAtrasado: atrasadas.reduce((s, d) => s + numero(d.valor), 0),
      valorPago: pagas.reduce((s, d) => s + numero(d.valor), 0),
    };
  }, [contasAPagar]);

  const totais = useMemo(() => {
    const frete = viagensFiltradas.reduce((s, v) => s + numero(v.frete), 0);
    const despesasTotal = despesas.reduce((s, d) => s + numero(d.valor), 0);
    const litros = despesas.reduce((s, d) => s + numero(d.litros), 0);
    const pendente = contasAPagar.filter((d) => statusConta(d) !== "Pago").reduce((s, d) => s + numero(d.valor), 0);
    return { frete, despesasTotal, lucro: frete - despesasTotal, litros, pendente };
  }, [viagensFiltradas, despesas, contasAPagar]);

  const viagensPorCliente = useMemo(() => {
    return clientes.map((c) => {
      const lista = viagens.filter((v) => v.cliente === c.nome);
      const frete = lista.reduce((s, v) => s + numero(v.frete), 0);
      return { ...c, quantidade: lista.length, frete };
    });
  }, [clientes, viagens]);

  const despesasPorCaminhao = useMemo(() => {
    return caminhoes.map((c) => {
      const lista = despesas.filter((d) => d.caminhao === c.placa);
      const total = lista.reduce((s, d) => s + numero(d.valor), 0);
      const litros = lista.reduce((s, d) => s + numero(d.litros), 0);
      const pendente = lista.filter(d => d.statusPagamento === "A prazo" || d.statusPagamento === "Pendente").reduce((s, d) => s + numero(d.valor), 0);
      return { ...c, total, litros, pendente, qtd: lista.length };
    });
  }, [caminhoes, despesas]);

  const fazerLogin = () => {
    const encontrado = usuarios.find((u) => u.usuario === loginForm.usuario && u.senha === loginForm.senha);
    if (!encontrado) return alert("Usuário ou senha inválidos.");

    const sessao = { id: encontrado.id, nome: encontrado.nome, usuario: encontrado.usuario, perfil: encontrado.perfil };
    setLogado(sessao);
    localStorage.setItem("atr-minhocao-login", JSON.stringify(sessao));
  };

  const sair = () => {
    setLogado(null);
    localStorage.removeItem("atr-minhocao-login");
  };

  const adicionarUsuario = () => {
    if (!usuarioForm.nome || !usuarioForm.usuario || !usuarioForm.senha) return alert("Preencha nome, usuário e senha.");
    if (usuarios.some((u) => u.usuario === usuarioForm.usuario)) return alert("Esse usuário já existe.");
    setUsuarios([...usuarios, { id: crypto.randomUUID(), ...usuarioForm }]);
    setUsuarioForm({ nome: "", usuario: "", senha: "", perfil: "Operacional" });
  };

  const salvarCliente = () => {
    if (!clienteForm.nome) return alert("Informe o nome do cliente/empresa.");

    if (!clienteEditandoId && clientes.some((c) => c.nome.toLowerCase() === clienteForm.nome.toLowerCase())) {
      return alert("Esse cliente/empresa já existe.");
    }

    if (clienteEditandoId) {
      const clienteAntigo = clientes.find((c) => c.id === clienteEditandoId);
      const nomeAntigo = clienteAntigo?.nome;
      const nomeNovo = clienteForm.nome;

      setClientes(clientes.map((c) =>
        c.id === clienteEditandoId ? { ...c, ...clienteForm } : c
      ));

      if (nomeAntigo && nomeAntigo !== nomeNovo) {
        setViagens(viagens.map((v) =>
          v.cliente === nomeAntigo ? { ...v, cliente: nomeNovo } : v
        ));

        setDespesas(despesas.map((d) => ({
          ...d,
          responsavelPagamento: d.responsavelPagamento === nomeAntigo ? nomeNovo : d.responsavelPagamento,
        })));

        setEntradasCaixa(entradasCaixa.map((e) =>
          e.cliente === nomeAntigo ? { ...e, cliente: nomeNovo } : e
        ));

        setSaidasManuais(saidasManuais.map((s) =>
          s.cliente === nomeAntigo ? { ...s, cliente: nomeNovo } : s
        ));

        setContasReceberFixas(contasReceberFixas.map((c) =>
          c.cliente === nomeAntigo ? { ...c, cliente: nomeNovo } : c
        ));
      }

      setClienteEditandoId(null);
    } else {
      setClientes([...clientes, { id: crypto.randomUUID(), ...clienteForm }]);
    }

    setClienteForm({ nome: "", contato: "", telefone: "", cidade: "" });
  };

  const editarCliente = (cliente) => {
    setClienteEditandoId(cliente.id);
    setClienteForm({
      nome: cliente.nome || "",
      contato: cliente.contato || "",
      telefone: cliente.telefone || "",
      cidade: cliente.cidade || "",
    });
    setAba("clientes");
  };

  const cancelarEdicaoCliente = () => {
    setClienteEditandoId(null);
    setClienteForm({ nome: "", contato: "", telefone: "", cidade: "" });
  };

  const salvarCaminhao = () => {
    if (!caminhaoForm.placa) return alert("Informe a placa do caminhão.");

    if (caminhaoEditandoId) {
      const caminhaoAntigo = caminhoes.find((c) => c.id === caminhaoEditandoId);
      const placaAntiga = caminhaoAntigo?.placa;

      setCaminhoes(caminhoes.map((c) =>
        c.id === caminhaoEditandoId ? { ...c, ...caminhaoForm } : c
      ));

      if (placaAntiga && placaAntiga !== caminhaoForm.placa) {
        setViagens(viagens.map((v) =>
          v.caminhao === placaAntiga ? { ...v, caminhao: caminhaoForm.placa } : v
        ));

        setDespesas(despesas.map((d) =>
          d.caminhao === placaAntiga ? { ...d, caminhao: caminhaoForm.placa } : d
        ));
      }

      setCaminhaoEditandoId(null);
    } else {
      setCaminhoes([...caminhoes, { id: crypto.randomUUID(), ...caminhaoForm }]);
    }

    setCaminhaoForm({ placa: "", modelo: "", motorista: "" });
  };

  const editarCaminhao = (caminhao) => {
    setCaminhaoEditandoId(caminhao.id);
    setCaminhaoForm({
      placa: caminhao.placa || "",
      modelo: caminhao.modelo || "",
      motorista: caminhao.motorista || "",
    });
    setAba("caminhoes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicaoCaminhao = () => {
    setCaminhaoEditandoId(null);
    setCaminhaoForm({ placa: "", modelo: "", motorista: "" });
  };

  
  const calcularFrete = (quantidade, valorUnitario) => {
    const qtd = numero(quantidade);
    const unit = numero(valorUnitario);
    const total = qtd * unit;
    return total ? String(total.toFixed(2)) : "";
  };

  const selecionarMaterial = (nomeMaterial) => {
    const material = materiais.find((m) => m.nome === nomeMaterial);

    if (!material) {
      setViagemForm({
        ...viagemForm,
        material: nomeMaterial,
      });
      return;
    }

    const valorUnitario = String(material.valor ?? material.valorUnitario ?? "");
    const quantidade = viagemForm.quantidade;
    const freteCalculado = calcularFrete(quantidade, valorUnitario);

    setViagemForm((atual) => ({
      ...atual,
      material: nomeMaterial,
      origem: material.origem || "",
      destino: material.destino || "",
      valorUnitario,
      frete: freteCalculado,
    }));
  };

  const atualizarQuantidadeViagem = (quantidade) => {
    setViagemForm({
      ...viagemForm,
      quantidade,
      frete: calcularFrete(quantidade, viagemForm.valorUnitario),
    });
  };

  const atualizarValorUnitarioViagem = (valorUnitario) => {
    setViagemForm({
      ...viagemForm,
      valorUnitario,
      frete: calcularFrete(viagemForm.quantidade, valorUnitario),
    });
  };

  const salvarMaterial = () => {
    if (!materialForm.nome) return alert("Informe o nome do material.");

    if (materialEditandoId) {
      setMateriais(materiais.map((m) => m.id === materialEditandoId ? { ...m, ...materialForm } : m));
      setMaterialEditandoId(null);
    } else {
      setMateriais([...materiais, { id: crypto.randomUUID(), ...materialForm }]);
    }

    setMaterialForm({ nome: "", origem: "", destino: "", valor: "" });
  };

  const editarMaterial = (material) => {
    setMaterialEditandoId(material.id);
    setMaterialForm({
      nome: material.nome || "",
      origem: material.origem || "",
      destino: material.destino || "",
      valor: material.valor || "",
    });
    setAba("materiais");
  };

  const cancelarEdicaoMaterial = () => {
    setMaterialEditandoId(null);
    setMaterialForm({ nome: "", origem: "", destino: "", valor: "" });
  };

  const limparViagemForm = () => {
    setViagemForm({
      data: "",
      numeroPedido: "",
      caminhao: "",
      origem: "",
      destino: "",
      material: "",
      cliente: "",
      quantidade: "",
      unidade: "Toneladas",
      valorUnitario: "",
      frete: "",
      previsaoPagamento: "",
      status: "Programada",
    });
  };

  const salvarViagem = () => {
    if (!viagemForm.origem || !viagemForm.destino || !viagemForm.frete || !viagemForm.cliente) {
      return alert("Informe cliente, origem, destino e frete.");
    }

    if (viagemEditandoId) {
      setViagens(viagens.map((v) =>
        v.id === viagemEditandoId ? { ...v, ...viagemForm, createdAt: v.createdAt || hojeISO() } : v
      ));
      setViagemEditandoId(null);
    } else {
      setViagens([...viagens, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...viagemForm }]);
    }

    limparViagemForm();
  };

  const editarViagem = (viagem) => {
    setViagemEditandoId(viagem.id);
    setViagemForm({
      data: viagem.data || "",
      numeroPedido: viagem.numeroPedido || "",
      caminhao: viagem.caminhao || "",
      origem: viagem.origem || "",
      destino: viagem.destino || "",
      material: viagem.material || "",
      cliente: viagem.cliente || "",
      quantidade: viagem.quantidade || "",
      unidade: viagem.unidade || "Toneladas",
      valorUnitario: viagem.valorUnitario || "",
      frete: viagem.frete || "",
      previsaoPagamento: viagem.previsaoPagamento || "",
      status: viagem.status || "Programada",
    });
    setAba("viagens");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicaoViagem = () => {
    setViagemEditandoId(null);
    limparViagemForm();
  };

  const apagarViagemComConfirmacao = (id) => {
    const viagem = viagens.find((v) => v.id === id);
    const identificacao = viagem?.numeroPedido ? `pedido ${viagem.numeroPedido}` : "esta viagem/frete";

    if (!window.confirm(`Tem certeza que deseja excluir ${identificacao}? Essa ação não pode ser desfeita.`)) {
      return;
    }

    setViagens(viagens.filter((v) => v.id !== id));
  };


  const salvarContaPagarRecorrente = () => {
    if (!contaPagarRecorrenteForm.responsavelPagamento || !contaPagarRecorrenteForm.valorParcela || !contaPagarRecorrenteForm.quantidadeParcelas || !contaPagarRecorrenteForm.dataPrimeiraParcela) {
      return alert("Informe empresa/pessoa, valor, quantidade de parcelas e data da primeira parcela.");
    }

    const quantidade = Number(contaPagarRecorrenteForm.quantidadeParcelas);
    if (!quantidade || quantidade < 1) {
      return alert("Quantidade de parcelas inválida.");
    }

    const grupoId = crypto.randomUUID();
    const valorParcelaRecorrente = numero(contaPagarRecorrenteForm.valorParcela);

    const novasContas = Array.from({ length: quantidade }, (_, index) => {
      const parcela = index + 1;
      const dataVencimento = somarMeses(contaPagarRecorrenteForm.dataPrimeiraParcela, index);

      return {
        id: crypto.randomUUID(),
        recorrenciaGrupoId: grupoId,
        recorrente: true,
        parcelaAtual: parcela,
        parcelaTotal: quantidade,
        data: hojeISO(),
        caminhao: contaPagarRecorrenteForm.caminhao || "",
        tipo: contaPagarRecorrenteForm.tipo || "Outros",
        litros: "",
        valorLitro: "",
        kmPainel: "",
        postoEmpresa: contaPagarRecorrenteForm.responsavelPagamento || "",
        formaPagamento: contaPagarRecorrenteForm.formaPagamento || "Pix",
        pagamentoPrazoComo: "Recorrência",
        dataVencimento,
        dataPagamento: "",
        responsavelPagamento: contaPagarRecorrenteForm.responsavelPagamento,
        descricao: `${contaPagarRecorrenteForm.descricao || contaPagarRecorrenteForm.tipo || "Conta recorrente"} - Parcela ${parcela}/${quantidade}`,
        valor: valorParcelaRecorrente,
        statusPagamento: "A prazo",
      };
    });

    setDespesas([...despesas, ...novasContas]);

    setContaPagarRecorrenteForm({
      responsavelPagamento: "",
      descricao: "",
      tipo: "Salário",
      caminhao: "",
      valorParcela: "",
      quantidadeParcelas: "",
      dataPrimeiraParcela: "",
      formaPagamento: "Pix",
    });
  };

  const salvarDespesa = () => {
    if (!despesaForm.data || !despesaForm.tipo) return alert("Informe data e tipo da despesa.");

    let valorFinal = numero(despesaForm.valor);

    if (despesaForm.tipo === "Combustível" && despesaForm.litros && despesaForm.valorLitro) {
      valorFinal = numero(despesaForm.litros) * numero(despesaForm.valorLitro);
    }

    if (despesaForm.statusPagamento === "A prazo" || despesaForm.formaPagamento === "A prazo" || despesaForm.formaPagamento === "Desconto em folha") {
      if (!despesaForm.responsavelPagamento) {
        return alert("Para lançamento a prazo/desconto, selecione a empresa/cliente responsável pelo pagamento.");
      }
    }

    const despesaSalva = { ...despesaForm, valor: valorFinal };

    if (despesaEditandoId) {
      const despesaOriginal = despesas.find((d) => d.id === despesaEditandoId);

      if (aplicarRecorrencia && despesaOriginal?.recorrenciaGrupoId) {
        const descricaoBase = String(despesaSalva.descricao || despesaOriginal.descricao || "")
          .replace(/\s*-\s*Parcela\s+\d+\s*\/\s*\d+\s*$/i, "");

        setDespesas(despesas.map((d) => {
          if (d.recorrenciaGrupoId !== despesaOriginal.recorrenciaGrupoId) return d;

          return {
            ...d,
            caminhao: despesaSalva.caminhao,
            tipo: despesaSalva.tipo,
            postoEmpresa: despesaSalva.postoEmpresa,
            formaPagamento: despesaSalva.formaPagamento,
            pagamentoPrazoComo: despesaSalva.pagamentoPrazoComo,
            responsavelPagamento: despesaSalva.responsavelPagamento,
            valor: despesaSalva.valor,
            descricao: `${descricaoBase || despesaSalva.tipo || "Conta recorrente"} - Parcela ${d.parcelaAtual || "-"} / ${d.parcelaTotal || "-"}`,
          };
        }));
      } else {
        setDespesas(despesas.map((d) => d.id === despesaEditandoId ? { ...d, ...despesaSalva } : d));
      }

      if (despesaSalva.statusPagamento !== "Pago") {
        setSaidasManuais(saidasManuais.filter((s) => s.origemDespesaId !== despesaEditandoId));
      }

      setDespesaEditandoId(null);
      setAplicarRecorrencia(false);
    } else {
      setDespesas([...despesas, { id: crypto.randomUUID(), ...despesaSalva }]);
    }

    setDespesaForm(despesaVazia);
  };

  const editarDespesa = (despesa) => {
    setDespesaEditandoId(despesa.id);
    setAplicarRecorrencia(false);
    setDespesaForm({
      data: despesa.data || "",
      caminhao: despesa.caminhao || "",
      tipo: despesa.tipo || "Combustível",
      litros: despesa.litros || "",
      valorLitro: despesa.valorLitro || "",
      kmPainel: despesa.kmPainel || "",
      postoEmpresa: despesa.postoEmpresa || "",
      formaPagamento: despesa.formaPagamento || "Pix",
      pagamentoPrazoComo: despesa.pagamentoPrazoComo || "",
      dataVencimento: despesa.dataVencimento || "",
      dataPagamento: despesa.dataPagamento || "",
      responsavelPagamento: despesa.responsavelPagamento || "",
      descricao: despesa.descricao || "",
      valor: despesa.valor || "",
      statusPagamento: despesa.statusPagamento || "Pago",
    });
    setAba("contas");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicaoDespesa = () => {
    setDespesaEditandoId(null);
    setAplicarRecorrencia(false);
    setDespesaForm(despesaVazia);
  };

  if (!logado) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h1 className="text-4xl font-black text-red-500">ATR MINHOCÃO</h1>
          <p className="text-zinc-400 mt-2 mb-8">Acesso restrito ao sistema</p>
          <Input label="Usuário" value={loginForm.usuario} onChange={(v) => setLoginForm({ ...loginForm, usuario: v })} icon={User} />
          <Input label="Senha" type="password" value={loginForm.senha} onChange={(v) => setLoginForm({ ...loginForm, senha: v })} icon={Lock} />
          <button onClick={fazerLogin} className="w-full bg-red-600 hover:bg-red-700 rounded-2xl p-3 font-bold mt-3">Entrar</button>
          <p className="text-xs text-zinc-500 mt-5">Usuário inicial: admin | Senha inicial: 1234</p>
        </div>
      </div>
    );
  }

  const exportarBackupDados = () => {
    const dados = {
      usuarios,
      clientes,
      materiais,
      caminhoes,
      viagens,
      despesas,
      entradasCaixa,
      saidasManuais,
      contasReceberFixas,
      exportadoEm: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-atr-minhocao.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const menu = [
    { id: "dashboard", nome: "Dashboard" },
    { id: "clientes", nome: "Clientes/Empresas" },
    { id: "materiais", nome: "Materiais" },
    { id: "caminhoes", nome: "Caminhões" },
    { id: "viagens", nome: "Viagens" },
    { id: "fluxo", nome: "Fluxo de caixa" },
    { id: "receberfixo", nome: "Contas fixas a receber" },
    { id: "contas", nome: "Contas a pagar" },
    { id: "usuarios", nome: "Usuários" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto p-5">
        <header className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-red-500">ATR MINHOCÃO</h1>
              <p className="text-zinc-400">Sistema de gestão de transportes</p>
            </div>
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
              <div>
                <p className="font-bold">{logado.nome}</p>
                <p className="text-xs text-zinc-400">{logado.perfil}</p>
              </div>
              <button onClick={exportarBackupDados} className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-3 py-2 text-xs font-bold">
                Backup
              </button>
              <button onClick={sair} className="text-red-400"><LogOut /></button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {menu.map((item) => (
              <button key={item.id} onClick={() => setAba(item.id)} className={`px-5 py-3 rounded-2xl font-bold ${aba === item.id ? "bg-red-600" : "bg-zinc-900 border border-zinc-800"}`}>
                {item.nome}
              </button>
            ))}
          </div>
        </header>

        {aba === "dashboard" && (
          <div className="space-y-6">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="text-red-500" />
                <h2 className="text-2xl font-black">Filtros</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <Select label="Filtrar por cliente" value={filtros.cliente} onChange={(v) => setFiltros({ ...filtros, cliente: v })} options={clientes.map(c => c.nome)} />
                <Select label="Filtrar por caminhão" value={filtros.caminhao} onChange={(v) => setFiltros({ ...filtros, caminhao: v })} options={caminhoes.map(c => c.placa)} />
                <button onClick={() => setFiltros({ cliente: "", caminhao: "" })} className="mt-6 bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-3 font-bold">Limpar filtros</button>
              </div>
            </section>

            <div className="grid md:grid-cols-4 gap-4">
              <Card titulo="Viagens filtradas" valor={viagensFiltradas.length} icone={Route} />
              <Card titulo="Fretes filtrados" valor={moeda(totais.frete)} icone={Wallet} />
              <Card titulo="Despesas totais" valor={moeda(totais.despesasTotal)} icone={Fuel} />
              <Card titulo="Contas a pagar" valor={moeda(totais.pendente)} icone={CalendarDays} destaque />
            </div>

            <section className={`border rounded-3xl p-5 ${fretesEmAtrasoDashboard.length ? "bg-red-950/40 border-red-800" : "bg-zinc-900 border-zinc-800"}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-2xl font-black">Mural de pagamentos em atraso</h2>
                  <p className="text-zinc-400">Fretes que passaram da previsão de pagamento e ainda não foram marcados como pagos.</p>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 min-w-[190px]">
                  <p className="text-xs text-zinc-500">Total em atraso</p>
                  <p className="text-red-400 font-black text-xl">{moeda(totalFretesEmAtraso)}</p>
                </div>
              </div>

              {fretesEmAtrasoDashboard.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {fretesEmAtrasoDashboard.slice(0, 6).map((v) => (
                    <div key={v.id} className="bg-red-950/50 border border-red-800 rounded-2xl p-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="bg-red-600 rounded-full px-3 py-1 text-xs font-bold">EM ATRASO</span>
                        <span className="bg-zinc-900 rounded-full px-3 py-1 text-xs">Prev.: {formatarData(v.previsaoPagamento)}</span>
                      </div>
                      <p className="font-black">{v.cliente || "-"}</p>
                      <p className="text-zinc-300 text-sm">Pedido: {v.numeroPedido || "Não informado"} • {v.caminhao || "-"}</p>
                      <p className="text-red-300 font-bold mt-1">{moeda(v.frete)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-green-400 font-bold">Nenhum frete em atraso no momento.</p>
              )}
            </section>

            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Resumo por cliente</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {viagensPorCliente.map((c) => (
                  <div key={c.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-xl font-black">{c.nome}</p>
                    <p className="text-zinc-400">{c.cidade || "Cidade não informada"}</p>
                    <div className="mt-4 space-y-1 text-sm">
                      <p>Viagens feitas: {c.quantidade}</p>
                      <p className="text-red-400 font-bold">Fretes: {moeda(c.frete)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Resumo por caminhão</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {despesasPorCaminhao.map((c) => (
                  <div key={c.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-xl font-black">{c.placa}</p>
                    <p className="text-zinc-400">{c.modelo}</p>
                    <div className="mt-4 space-y-1 text-sm">
                      <p>Lançamentos: {c.qtd}</p>
                      <p>Litros: {c.litros.toLocaleString("pt-BR")} L</p>
                      <p>Total: {moeda(c.total)}</p>
                      <p className="text-red-400 font-bold">A prazo/pendente: {moeda(c.pendente)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <ListaViagens viagens={viagensFiltradas} apagarViagem={apagarViagemComConfirmacao} editarViagem={editarViagem} />
          </div>
        )}

        {aba === "clientes" && (
          <div className="grid md:grid-cols-3 gap-5">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">{clienteEditandoId ? "Editar cliente/empresa" : "Novo cliente/empresa"}</h2>
              <Input label="Nome do cliente/empresa" value={clienteForm.nome} onChange={(v) => setClienteForm({ ...clienteForm, nome: v })} icon={Building2} />
              <Input label="Contato" value={clienteForm.contato} onChange={(v) => setClienteForm({ ...clienteForm, contato: v })} />
              <Input label="Telefone" value={clienteForm.telefone} onChange={(v) => setClienteForm({ ...clienteForm, telefone: v })} />
              <Input label="Cidade/UF" value={clienteForm.cidade} onChange={(v) => setClienteForm({ ...clienteForm, cidade: v })} />
              <button onClick={salvarCliente} className="w-full mt-3 bg-red-600 hover:bg-red-700 rounded-2xl p-3 font-bold flex items-center justify-center gap-2"><Save size={18} /> {clienteEditandoId ? "Salvar alterações" : "Adicionar cliente"}</button>
              {clienteEditandoId && <button onClick={cancelarEdicaoCliente} className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-3 font-bold flex items-center justify-center gap-2"><X size={18} /> Cancelar edição</button>}
            </section>

            <section className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Clientes/empresas cadastrados</h2>
              <div className="space-y-3">
                {clientes.map((c) => (
                  <div key={c.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between gap-3">
                    <div>
                      <p className="font-black text-lg">{c.nome}</p>
                      <p className="text-zinc-400">Contato: {c.contato || "-"}</p>
                      <p className="text-zinc-400">Telefone: {c.telefone || "-"}</p>
                      <p className="text-zinc-400">Cidade: {c.cidade || "-"}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => editarCliente(c)} className="text-zinc-200"><Pencil /></button>
                      <button onClick={() => setClientes(clientes.filter(item => item.id !== c.id))} className="text-red-400"><Trash2 /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}


        {aba === "materiais" && (
          <div className="grid md:grid-cols-3 gap-5">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">
                {materialEditandoId ? "Editar material" : "Novo material"}
              </h2>

              <Input
                label="Nome do material"
                value={materialForm.nome}
                onChange={(v) => setMaterialForm({ ...materialForm, nome: v })}
              />

              <Input
                label="Origem padrão"
                value={materialForm.origem}
                onChange={(v) => setMaterialForm({ ...materialForm, origem: v })}
              />

              <Input
                label="Destino padrão"
                value={materialForm.destino}
                onChange={(v) => setMaterialForm({ ...materialForm, destino: v })}
              />

              <Input
                label="Valor unitário padrão R$"
                value={materialForm.valor}
                onChange={(v) => setMaterialForm({ ...materialForm, valor: formatarValorDigitado(v) })}
              />

              <button
                onClick={salvarMaterial}
                className="w-full mt-3 bg-red-600 hover:bg-red-700 rounded-2xl p-3 font-bold flex items-center justify-center gap-2"
              >
                <Save size={18} /> {materialEditandoId ? "Salvar alterações" : "Adicionar material"}
              </button>

              {materialEditandoId && (
                <button
                  onClick={cancelarEdicaoMaterial}
                  className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-3 font-bold flex items-center justify-center gap-2"
                >
                  <X size={18} /> Cancelar edição
                </button>
              )}
            </section>

            <section className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Materiais cadastrados</h2>

              <div className="space-y-3">
                {materiais.map((m) => (
                  <div key={m.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between gap-3">
                    <div>
                      <p className="font-black text-lg">{m.nome}</p>
                      <p className="text-zinc-400">Origem: {m.origem || "-"}</p>
                      <p className="text-zinc-400">Destino: {m.destino || "-"}</p>
                      <p className="text-zinc-400">Valor unitário padrão: {moeda(m.valor ?? m.valorUnitario)}</p>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => editarMaterial(m)} className="text-zinc-200">
                        <Pencil />
                      </button>
                      <button onClick={() => setMateriais(materiais.filter(item => item.id !== m.id))} className="text-red-400">
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                ))}

                {materiais.length === 0 && (
                  <p className="text-zinc-400">Nenhum material cadastrado ainda.</p>
                )}
              </div>
            </section>
          </div>
        )}

        {aba === "caminhoes" && (
          <div className="grid md:grid-cols-3 gap-5">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">{caminhaoEditandoId ? "Editar caminhão" : "Novo caminhão"}</h2>
              <Input label="Placa" value={caminhaoForm.placa} onChange={(v) => setCaminhaoForm({ ...caminhaoForm, placa: v })} />
              <Input label="Modelo" value={caminhaoForm.modelo} onChange={(v) => setCaminhaoForm({ ...caminhaoForm, modelo: v })} />
              <Input label="Motorista" value={caminhaoForm.motorista} onChange={(v) => setCaminhaoForm({ ...caminhaoForm, motorista: v })} />
              <button onClick={salvarCaminhao} className="w-full mt-3 bg-red-600 hover:bg-red-700 rounded-2xl p-3 font-bold flex items-center justify-center gap-2">
                <Save size={18} /> {caminhaoEditandoId ? "Salvar alterações" : "Adicionar"}
              </button>
              {caminhaoEditandoId && (
                <button onClick={cancelarEdicaoCaminhao} className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-3 font-bold flex items-center justify-center gap-2">
                  <X size={18} /> Cancelar edição
                </button>
              )}
            </section>

            <section className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Frota cadastrada</h2>
              <div className="space-y-3">
                {caminhoes.map((c) => (
                  <div key={c.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between">
                    <div>
                      <p className="font-black text-lg">{c.placa}</p>
                      <p className="text-zinc-400">{c.modelo}</p>
                      <p className="text-zinc-400">Motorista: {c.motorista}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => editarCaminhao(c)} className="text-zinc-200"><Pencil /></button>
                      <button onClick={() => setCaminhoes(caminhoes.filter(item => item.id !== c.id))} className="text-red-400"><Trash2 /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {aba === "viagens" && (
          <div className="space-y-5">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">{viagemEditandoId ? "Editar viagem" : "Nova viagem"}</h2>
              <p className="text-zinc-400 mb-4">O diesel fica apenas na aba de abastecimentos/despesas por caminhão. Ao selecionar o material, origem, destino e valor unitário são puxados automaticamente, mas podem ser ajustados se necessário.</p>
              <div className="grid md:grid-cols-4 gap-3">
                <Input label="Data da viagem" type="date" value={viagemForm.data} onChange={(v) => setViagemForm({ ...viagemForm, data: v })} />
                <Input label="Número do pedido" value={viagemForm.numeroPedido} onChange={(v) => setViagemForm({ ...viagemForm, numeroPedido: v })} />
                <Select label="Cliente" value={viagemForm.cliente} onChange={(v) => setViagemForm({ ...viagemForm, cliente: v })} options={clientes.map(c => c.nome)} />
                <Select label="Caminhão" value={viagemForm.caminhao} onChange={(v) => setViagemForm({ ...viagemForm, caminhao: v })} options={caminhoes.map(c => c.placa)} />
                <Select label="Material" value={viagemForm.material} onChange={selecionarMaterial} options={materiais.map(m => m.nome)} />
                <Input label="Origem" value={viagemForm.origem} onChange={(v) => setViagemForm({ ...viagemForm, origem: v })} />
                <Input label="Destino" value={viagemForm.destino} onChange={(v) => setViagemForm({ ...viagemForm, destino: v })} />
                <Input label="Quantidade" value={viagemForm.quantidade} onChange={atualizarQuantidadeViagem} />
                <Select label="Unidade" value={viagemForm.unidade} onChange={(v) => setViagemForm({ ...viagemForm, unidade: v })} options={["Toneladas", "Quilos", "Viagem", "Carga", "Outro"]} />
                <Input label="Valor unitário R$" value={viagemForm.valorUnitario} onChange={(v) => atualizarValorUnitarioViagem(formatarValorDigitado(v))} />
                <Input label="Frete total a receber R$" value={viagemForm.frete} onChange={(v) => setViagemForm({ ...viagemForm, frete: formatarValorDigitado(v) })} />
                <Input label="Previsão de pagamento" type="date" value={viagemForm.previsaoPagamento} onChange={(v) => setViagemForm({ ...viagemForm, previsaoPagamento: v })} />
                <Select label="Status" value={viagemForm.status} onChange={(v) => setViagemForm({ ...viagemForm, status: v })} options={["Programada", "Em andamento", "Finalizada"]} />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={salvarViagem} className="bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-3 font-bold inline-flex items-center gap-2">
                  <Save size={18} /> {viagemEditandoId ? "Salvar alterações" : "Salvar viagem"}
                </button>
                {viagemEditandoId && (
                  <button onClick={cancelarEdicaoViagem} className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-6 py-3 font-bold inline-flex items-center gap-2">
                    <X size={18} /> Cancelar edição
                  </button>
                )}
              </div>
            </section>

            <ListaViagens
              viagens={viagens}
              apagarViagem={apagarViagemComConfirmacao}
              editarViagem={editarViagem}
              marcarFretePago={marcarFretePago}
              desfazerPagamentoFrete={desfazerPagamentoFrete}
              filtrosAvancados
            />
          </div>
        )}


        {aba === "recebimentos" && (
          <div className="space-y-5">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="text-red-500" />
                <h2 className="text-2xl font-black">Filtros de fretes a receber</h2>
              </div>
              <div className="grid md:grid-cols-5 gap-3">
                <Input label="Data inicial" type="date" value={filtroRecebimentos.inicio} onChange={(v) => setFiltroRecebimentos({ ...filtroRecebimentos, inicio: v })} />
                <Input label="Data final" type="date" value={filtroRecebimentos.fim} onChange={(v) => setFiltroRecebimentos({ ...filtroRecebimentos, fim: v })} />
                <Select label="Cliente" value={filtroRecebimentos.cliente} onChange={(v) => setFiltroRecebimentos({ ...filtroRecebimentos, cliente: v })} options={clientes.map(c => c.nome)} />
                <Select label="Status do prazo" value={filtroRecebimentos.prazo} onChange={(v) => setFiltroRecebimentos({ ...filtroRecebimentos, prazo: v })} options={["Em atraso", "Dentro do prazo"]} />
                <button onClick={() => setFiltroRecebimentos({ inicio: "", fim: "", cliente: "", prazo: "" })} className="mt-6 bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-3 font-bold">Limpar filtros</button>
              </div>
            </section>

            <div className="grid md:grid-cols-4 gap-4">
              <Card titulo="Fretes encontrados" valor={fretesAReceber.length} icone={Route} />
              <Card titulo="Total a receber" valor={moeda(totalFretesAReceber)} icone={Wallet} destaque />
              <Card titulo="Em atraso" valor={fretesAReceber.filter(freteEmAtraso).length} icone={CalendarDays} />
              <Card titulo="Clientes filtrados" valor={filtroRecebimentos.cliente || "Todos"} icone={Building2} />
            </div>

            <ListaViagens viagens={fretesAReceber} apagarViagem={apagarViagemComConfirmacao} editarViagem={editarViagem} marcarFretePago={marcarFretePago} desfazerPagamentoFrete={desfazerPagamentoFrete} />
          </div>
        )}


        {aba === "relatorios" && (
          <div className="space-y-5">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="text-red-500" />
                <h2 className="text-2xl font-black">Relatório de viagens</h2>
              </div>

              <p className="text-zinc-400 mb-4">
                Filtre as viagens por data, empresa, caminhão, material ou status e emita um relatório em PDF.
              </p>

              <div className="grid md:grid-cols-4 gap-3">
                <Input label="Data inicial" type="date" value={filtroRelatorio.inicio} onChange={(v) => setFiltroRelatorio({ ...filtroRelatorio, inicio: v })} />
                <Input label="Data final" type="date" value={filtroRelatorio.fim} onChange={(v) => setFiltroRelatorio({ ...filtroRelatorio, fim: v })} />
                <Select label="Empresa/cliente" value={filtroRelatorio.cliente} onChange={(v) => setFiltroRelatorio({ ...filtroRelatorio, cliente: v })} options={clientes.map(c => c.nome)} />
                <Select label="Caminhão" value={filtroRelatorio.caminhao} onChange={(v) => setFiltroRelatorio({ ...filtroRelatorio, caminhao: v })} options={caminhoes.map(c => c.placa)} />
                <Select label="Material" value={filtroRelatorio.material} onChange={(v) => setFiltroRelatorio({ ...filtroRelatorio, material: v })} options={materiais.map(m => m.nome)} />
                <Select label="Status" value={filtroRelatorio.status} onChange={(v) => setFiltroRelatorio({ ...filtroRelatorio, status: v })} options={["Programada", "Em andamento", "Finalizada"]} />

                <button onClick={() => setFiltroRelatorio({ inicio: "", fim: "", cliente: "", caminhao: "", material: "", status: "" })} className="mt-6 bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-3 font-bold">
                  Limpar filtros
                </button>

                <button onClick={gerarPdfRelatorioViagens} className="mt-6 bg-red-600 hover:bg-red-700 rounded-2xl p-3 font-bold">
                  Emitir PDF
                </button>
              </div>
            </section>

            <div className="grid md:grid-cols-3 gap-4">
              <Card titulo="Viagens encontradas" valor={viagensRelatorio.length} icone={Route} />
              <Card titulo="Total de fretes" valor={moeda(totalRelatorioViagens)} icone={Wallet} destaque />
              <Card titulo="Relatório" valor="PDF" icone={Filter} />
            </div>

            <ListaViagens viagens={viagensRelatorio} apagarViagem={apagarViagemComConfirmacao} editarViagem={editarViagem} />
          </div>
        )}


        {aba === "fluxo" && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              <Card titulo="Entradas" valor={moeda(resumoFluxo.entradas)} icone={Wallet} />
              <Card titulo="Saídas" valor={moeda(resumoFluxo.saidas)} icone={Fuel} />
              <Card titulo="Saldo" valor={moeda(resumoFluxo.saldo)} icone={CalendarDays} destaque />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
                <h2 className="text-2xl font-black mb-4">{entradaEditandoId ? "Editar entrada de caixa" : "Nova entrada de caixa"}</h2>
                <div className="grid gap-3">
                  <Input label="Data da entrada" type="date" value={entradaForm.data} onChange={(v) => setEntradaForm({ ...entradaForm, data: v })} />
                  <Input label="Valor R$" value={entradaForm.valor} onChange={(v) => setEntradaForm({ ...entradaForm, valor: formatarValorDigitado(v) })} />
                  <Select label="Cliente/empresa" value={entradaForm.cliente} onChange={(v) => setEntradaForm({ ...entradaForm, cliente: v })} options={clientes.map(c => c.nome)} />
                  <Input label="Descrição" value={entradaForm.descricao} onChange={(v) => setEntradaForm({ ...entradaForm, descricao: v })} />
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={salvarEntradaCaixa} className="bg-green-700 hover:bg-green-800 rounded-2xl px-6 py-3 font-bold inline-flex items-center gap-2">
                    <Save size={18} /> {entradaEditandoId ? "Salvar alterações" : "Salvar entrada"}
                  </button>
                  {entradaEditandoId && (
                    <button onClick={limparEntradaForm} className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-6 py-3 font-bold inline-flex items-center gap-2">
                      <X size={18} /> Cancelar
                    </button>
                  )}
                </div>
              </section>

              <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
                <h2 className="text-2xl font-black mb-4">{saidaEditandoId ? "Editar saída de caixa" : "Nova saída de caixa"}</h2>
                <div className="grid gap-3">
                  <Input label="Data da saída" type="date" value={saidaForm.data} onChange={(v) => setSaidaForm({ ...saidaForm, data: v })} />
                  <Input label="Valor R$" value={saidaForm.valor} onChange={(v) => setSaidaForm({ ...saidaForm, valor: formatarValorDigitado(v) })} />
                  <Select label="Empresa/responsável" value={saidaForm.cliente} onChange={(v) => setSaidaForm({ ...saidaForm, cliente: v })} options={clientes.map(c => c.nome)} />
                  <Select label="Caminhão" value={saidaForm.caminhao} onChange={(v) => setSaidaForm({ ...saidaForm, caminhao: v })} options={caminhoes.map(c => c.placa)} />
                  <Input label="Descrição/observação" value={saidaForm.descricao} onChange={(v) => setSaidaForm({ ...saidaForm, descricao: v })} />
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={salvarSaidaCaixa} className="bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-3 font-bold inline-flex items-center gap-2">
                    <Save size={18} /> {saidaEditandoId ? "Salvar alterações" : "Salvar saída"}
                  </button>
                  {saidaEditandoId && (
                    <button onClick={limparSaidaForm} className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-6 py-3 font-bold inline-flex items-center gap-2">
                      <X size={18} /> Cancelar
                    </button>
                  )}
                </div>
              </section>
            </div>

            <div className="flex justify-end">
              <button onClick={emitirPdfFluxoCaixa} className="bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-3 font-bold">
                Emitir PDF do fluxo
              </button>
            </div>

            <ListaFluxoCaixa
              fluxo={fluxoCaixa}
              apagarEntrada={(id) => setEntradasCaixa(entradasCaixa.filter(e => e.id !== id))}
              apagarSaida={(id) => setSaidasManuais(saidasManuais.filter(s => s.id !== id))}
              editarEntrada={editarEntradaCaixa}
              editarSaida={editarSaidaCaixa}
              viagens={viagens}
              marcarFretePago={marcarFretePago}
              desfazerPagamentoFrete={desfazerPagamentoFrete}
            />
          </div>
        )}


        {aba === "receberfixo" && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-4 gap-4">
              <Card titulo="Parcelas em aberto" valor={resumoContasReceber.abertas} icone={CalendarDays} />
              <Card titulo="Valor em aberto" valor={moeda(resumoContasReceber.valorAberto)} icone={Wallet} destaque />
              <Card titulo="Parcelas pagas" valor={resumoContasReceber.pagas} icone={Save} />
              <Card titulo="Valor recebido" valor={moeda(resumoContasReceber.valorPago)} icone={Wallet} />
            </div>

            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Nova conta fixa a receber</h2>
              <p className="text-zinc-400 mb-4">Exemplo: receber R$ 1.000,00 durante 10 meses. O sistema cria as parcelas automaticamente.</p>
              <div className="grid md:grid-cols-4 gap-3">
                <Select label="Cliente/empresa" value={contaReceberForm.cliente} onChange={(v) => setContaReceberForm({ ...contaReceberForm, cliente: v })} options={clientes.map(c => c.nome)} />
                <Input label="Descrição" value={contaReceberForm.descricao} onChange={(v) => setContaReceberForm({ ...contaReceberForm, descricao: v })} />
                <Input label="Valor de cada parcela R$" value={contaReceberForm.valorParcela} onChange={(v) => setContaReceberForm({ ...contaReceberForm, valorParcela: formatarValorDigitado(v) })} />
                <Input label="Quantidade de parcelas/meses" value={contaReceberForm.quantidadeParcelas} onChange={(v) => setContaReceberForm({ ...contaReceberForm, quantidadeParcelas: v.replace(/\\D/g, "") })} />
                <Input label="Data da primeira parcela" type="date" value={contaReceberForm.dataPrimeiraParcela} onChange={(v) => setContaReceberForm({ ...contaReceberForm, dataPrimeiraParcela: v })} />
              </div>
              <button onClick={salvarContaReceberFixa} className="mt-4 bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-3 font-bold inline-flex items-center gap-2">
                <Save size={18} /> Criar parcelas
              </button>
            </section>

            <ListaContasReceberFixas contas={contasReceberFixas} marcarPago={marcarContaReceberPaga} apagarConta={(id) => setContasReceberFixas(contasReceberFixas.filter(c => c.id !== id))} />
          </div>
        )}

        {aba === "contas" && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-4 gap-4">
              <Card titulo="Em aberto" valor={`${resumoContas.abertas} | ${moeda(resumoContas.valorAberto)}`} icone={CalendarDays} />
              <Card titulo="Atrasadas" valor={`${resumoContas.atrasadas} | ${moeda(resumoContas.valorAtrasado)}`} icone={Wallet} destaque />
              <Card titulo="Pagas" valor={`${resumoContas.pagas} | ${moeda(resumoContas.valorPago)}`} icone={Save} />
              <Card titulo="Total de contas" valor={contasAPagar.length} icone={Fuel} />
            </div>

            {despesaEditandoId && (
              <section className="bg-zinc-900 border border-red-800 rounded-3xl p-5">
                <h2 className="text-2xl font-black mb-1">Editar despesa</h2>
                <p className="text-zinc-400 mb-4">Altere os dados da despesa selecionada. Em contas recorrentes, você pode aplicar as alterações principais em todas as parcelas.</p>

                <div className="grid md:grid-cols-4 gap-3">
                  <Input label="Data lançamento" type="date" value={despesaForm.data} onChange={(v) => setDespesaForm({ ...despesaForm, data: v })} />
                  <Select label="Caminhão" value={despesaForm.caminhao} onChange={(v) => setDespesaForm({ ...despesaForm, caminhao: v })} options={caminhoes.map(c => c.placa)} />
                  <Select label="Tipo" value={despesaForm.tipo} onChange={(v) => setDespesaForm({ ...despesaForm, tipo: v })} options={["Combustível", "Manutenção", "Pneu", "Pedágio", "Óleo", "Peças", "Salário", "Aluguel", "Contador", "Financiamento", "Imposto", "Seguro", "Outros"]} />
                  <Select label="Empresa/cliente a pagar" value={despesaForm.responsavelPagamento} onChange={(v) => setDespesaForm({ ...despesaForm, responsavelPagamento: v })} options={clientes.map(c => c.nome)} />

                  <Input label="Descrição" value={despesaForm.descricao} onChange={(v) => setDespesaForm({ ...despesaForm, descricao: v })} />
                  <Input label="Valor R$" value={String(despesaForm.valor ?? "")} onChange={(v) => setDespesaForm({ ...despesaForm, valor: formatarValorDigitado(v) })} />
                  <Select label="Status do pagamento" value={despesaForm.statusPagamento} onChange={(v) => setDespesaForm({ ...despesaForm, statusPagamento: v })} options={["Pago", "A prazo", "Pendente"]} />
                  <Select label="Forma de pagamento" value={despesaForm.formaPagamento} onChange={(v) => setDespesaForm({ ...despesaForm, formaPagamento: v })} options={["Dinheiro", "Pix", "Cartão", "Boleto", "A prazo", "Desconto em folha", "Outro"]} />

                  <Input label="Data de vencimento/previsão" type="date" value={despesaForm.dataVencimento} onChange={(v) => setDespesaForm({ ...despesaForm, dataVencimento: v })} />
                  <Input label="Data de pagamento" type="date" value={despesaForm.dataPagamento} onChange={(v) => setDespesaForm({ ...despesaForm, dataPagamento: v })} />
                  <Input label="Posto/empresa" value={despesaForm.postoEmpresa} onChange={(v) => setDespesaForm({ ...despesaForm, postoEmpresa: v })} />
                  <Input label="KM no painel" value={despesaForm.kmPainel} onChange={(v) => setDespesaForm({ ...despesaForm, kmPainel: v })} />
                </div>

                {despesas.find((d) => d.id === despesaEditandoId)?.recorrenciaGrupoId && (
                  <label className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={aplicarRecorrencia}
                      onChange={(e) => setAplicarRecorrencia(e.target.checked)}
                    />
                    Aplicar alterações principais em todas as parcelas desta recorrência
                  </label>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={salvarDespesa} className="bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-3 font-bold inline-flex items-center gap-2">
                    <Save size={18} /> Salvar alterações
                  </button>
                  <button onClick={cancelarEdicaoDespesa} className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-6 py-3 font-bold inline-flex items-center gap-2">
                    <X size={18} /> Cancelar edição
                  </button>
                </div>
              </section>
            )}

            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-1">Nova conta recorrente a pagar</h2>
              <p className="text-zinc-400 mb-4">Use para salário de motorista, aluguel, contador, financiamento e outras contas mensais.</p>

              <div className="grid md:grid-cols-4 gap-3">
                <Select label="Empresa/pessoa a pagar" value={contaPagarRecorrenteForm.responsavelPagamento} onChange={(v) => setContaPagarRecorrenteForm({ ...contaPagarRecorrenteForm, responsavelPagamento: v })} options={clientes.map(c => c.nome)} />
                <Select label="Tipo" value={contaPagarRecorrenteForm.tipo} onChange={(v) => setContaPagarRecorrenteForm({ ...contaPagarRecorrenteForm, tipo: v })} options={["Salário", "Aluguel", "Contador", "Financiamento", "Imposto", "Seguro", "Manutenção", "Outros"]} />
                <Select label="Caminhão vinculado" value={contaPagarRecorrenteForm.caminhao} onChange={(v) => setContaPagarRecorrenteForm({ ...contaPagarRecorrenteForm, caminhao: v })} options={caminhoes.map(c => c.placa)} />
                <Select label="Forma de pagamento" value={contaPagarRecorrenteForm.formaPagamento} onChange={(v) => setContaPagarRecorrenteForm({ ...contaPagarRecorrenteForm, formaPagamento: v })} options={["Dinheiro", "Pix", "Cartão", "Boleto", "A prazo", "Desconto em folha", "Outro"]} />

                <Input label="Descrição" value={contaPagarRecorrenteForm.descricao} onChange={(v) => setContaPagarRecorrenteForm({ ...contaPagarRecorrenteForm, descricao: v })} />
                <Input label="Valor de cada parcela R$" value={contaPagarRecorrenteForm.valorParcela} onChange={(v) => setContaPagarRecorrenteForm({ ...contaPagarRecorrenteForm, valorParcela: formatarValorDigitado(v) })} />
                <Input label="Quantidade de parcelas/meses" value={contaPagarRecorrenteForm.quantidadeParcelas} onChange={(v) => setContaPagarRecorrenteForm({ ...contaPagarRecorrenteForm, quantidadeParcelas: v })} />
                <Input label="Primeiro vencimento" type="date" value={contaPagarRecorrenteForm.dataPrimeiraParcela} onChange={(v) => setContaPagarRecorrenteForm({ ...contaPagarRecorrenteForm, dataPrimeiraParcela: v })} />
              </div>

              <button onClick={salvarContaPagarRecorrente} className="mt-4 bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-3 font-bold inline-flex items-center gap-2">
                <Save size={18} /> Gerar contas recorrentes
              </button>
            </section>

            <ListaContas despesas={contasAPagar.filter((d) => statusConta(d) !== "Pago")} editarDespesa={editarDespesa} setDespesas={setDespesas} todasDespesas={despesas} setSaidasManuais={setSaidasManuais} />
          </div>
        )}

        {aba === "usuarios" && (
          <div className="grid md:grid-cols-3 gap-5">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Novo usuário</h2>
              <Input label="Nome" value={usuarioForm.nome} onChange={(v) => setUsuarioForm({ ...usuarioForm, nome: v })} />
              <Input label="Usuário" value={usuarioForm.usuario} onChange={(v) => setUsuarioForm({ ...usuarioForm, usuario: v })} />
              <Input label="Senha" type="password" value={usuarioForm.senha} onChange={(v) => setUsuarioForm({ ...usuarioForm, senha: v })} />
              <Select label="Perfil" value={usuarioForm.perfil} onChange={(v) => setUsuarioForm({ ...usuarioForm, perfil: v })} options={["Administrador", "Operacional", "Financeiro", "Motorista"]} />
              <button onClick={adicionarUsuario} className="w-full mt-3 bg-red-600 hover:bg-red-700 rounded-2xl p-3 font-bold flex items-center justify-center gap-2"><Plus size={18} /> Adicionar usuário</button>
            </section>

            <section className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Usuários cadastrados</h2>
              <div className="space-y-3">
                {usuarios.map((u) => (
                  <div key={u.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between">
                    <div>
                      <p className="font-black text-lg">{u.nome}</p>
                      <p className="text-zinc-400">Usuário: {u.usuario}</p>
                      <p className="text-zinc-400">Perfil: {u.perfil}</p>
                    </div>
                    <button onClick={() => setUsuarios(usuarios.filter(item => item.id !== u.id))} className="text-red-400"><Trash2 /></button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ titulo, valor, icone: Icon, destaque }) {
  return (
    <div className={`${destaque ? "bg-red-600" : "bg-zinc-900 border border-zinc-800"} rounded-3xl p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={destaque ? "text-red-100" : "text-zinc-400"}>{titulo}</p>
          <h2 className="text-2xl font-black mt-2">{valor}</h2>
        </div>
        <Icon size={36} />
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", icon: Icon }) {
  return (
    <label className="block mb-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="relative">
        {Icon && <Icon size={17} className="absolute left-3 top-4 text-zinc-500" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 outline-none focus:border-red-500 ${Icon ? "pl-10" : ""}`}
        />
      </div>
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block mb-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 outline-none focus:border-red-500"
      >
        <option value="">Selecione</option>
        {options.map((op) => <option key={op} value={op}>{op}</option>)}
      </select>
    </label>
  );
}




function ListaContasReceberFixas({ contas, marcarPago, apagarConta }) {
  const contasOrdenadas = [...contas].sort((a, b) =>
    String(a.dataVencimento || "").localeCompare(String(b.dataVencimento || ""))
  );

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <h2 className="text-2xl font-black mb-4">Parcelas cadastradas a receber</h2>
      <div className="overflow-auto">
        <table className="w-full min-w-[1000px] text-left text-sm border-separate border-spacing-y-3">
          <thead className="text-zinc-400">
            <tr>
              <th className="px-4 pb-2">Vencimento</th>
              <th className="px-4 pb-2">Cliente</th>
              <th className="px-4 pb-2">Descrição</th>
              <th className="px-4 pb-2">Parcela</th>
              <th className="px-4 pb-2">Valor</th>
              <th className="px-4 pb-2">Status</th>
              <th className="px-4 pb-2">Data pagamento</th>
              <th className="px-4 pb-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contasOrdenadas.map((c) => (
              <tr key={c.id} className="bg-zinc-950">
                <td className="px-4 py-4 rounded-l-2xl whitespace-nowrap">{formatarData(c.dataVencimento)}</td>
                <td className="px-4 py-4 whitespace-nowrap">{c.cliente || "-"}</td>
                <td className="px-4 py-4">{c.descricao || "-"}</td>
                <td className="px-4 py-4 whitespace-nowrap">{c.parcela}/{c.totalParcelas}</td>
                <td className="px-4 py-4 text-green-400 font-bold whitespace-nowrap">{moeda(c.valor)}</td>
                <td className="px-4 py-4 whitespace-nowrap">{c.status}</td>
                <td className="px-4 py-4 whitespace-nowrap">{formatarData(c.dataPagamento)}</td>
                <td className="px-4 py-4 rounded-r-2xl whitespace-nowrap">
                  <div className="flex gap-2">
                    {c.status !== "Pago" && (
                      <button onClick={() => marcarPago(c)} className="bg-green-700 hover:bg-green-800 rounded-xl px-3 py-2 font-bold">
                        Marcar pago
                      </button>
                    )}
                    <button onClick={() => apagarConta(c.id)} className="bg-red-600 hover:bg-red-700 rounded-xl px-3 py-2 font-bold">
                      Apagar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {contasOrdenadas.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-6 text-zinc-400">
                  Nenhuma conta fixa a receber cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}



function ListaFluxoCaixa({ fluxo, apagarEntrada, apagarSaida, editarEntrada, editarSaida, viagens, marcarFretePago, desfazerPagamentoFrete }) {
  const [pagina, setPagina] = React.useState(1);
  const [tipoFiltro, setTipoFiltro] = React.useState("Todos");
  const [ordenarPor, setOrdenarPor] = React.useState("data-desc");
  const [pesquisa, setPesquisa] = React.useState("");
  const porPagina = 10;

  const textoPesquisa = pesquisa.trim().toLowerCase();

  const fluxoFiltrado = fluxo
    .filter((item) => tipoFiltro === "Todos" || item.tipo === tipoFiltro)
    .filter((item) => {
      if (!textoPesquisa) return true;

      const conteudo = [
        item.data,
        formatarData(item.data),
        item.tipo,
        item.valor,
        moeda(item.valor),
        item.cliente,
        item.caminhao,
        item.descricao,
        item.origem,
      ]
        .join(" ")
        .toLowerCase();

      return conteudo.includes(textoPesquisa);
    })
    .sort((a, b) => {
      if (ordenarPor === "data-asc" || ordenarPor === "data-desc") {
        const dataA = a.data || "";
        const dataB = b.data || "";
        if (dataA < dataB) return ordenarPor === "data-asc" ? -1 : 1;
        if (dataA > dataB) return ordenarPor === "data-asc" ? 1 : -1;
        return 0;
      }

      if (ordenarPor === "empresa-asc" || ordenarPor === "empresa-desc") {
        const empresaA = String(a.cliente || "").toLowerCase();
        const empresaB = String(b.cliente || "").toLowerCase();
        if (empresaA < empresaB) return ordenarPor === "empresa-asc" ? -1 : 1;
        if (empresaA > empresaB) return ordenarPor === "empresa-asc" ? 1 : -1;
        return 0;
      }

      if (ordenarPor === "valor-asc" || ordenarPor === "valor-desc") {
        const valorA = numero(a.valor);
        const valorB = numero(b.valor);
        return ordenarPor === "valor-asc" ? valorA - valorB : valorB - valorA;
      }

      return 0;
    });

  const totalPaginas = Math.max(1, Math.ceil(fluxoFiltrado.length / porPagina));
  const inicio = (pagina - 1) * porPagina;
  const itensPagina = fluxoFiltrado.slice(inicio, inicio + porPagina);

  const totalEntradas = fluxoFiltrado.filter((i) => i.tipo === "Entrada").reduce((s, i) => s + numero(i.valor), 0);
  const totalSaidas = fluxoFiltrado.filter((i) => i.tipo === "Saída").reduce((s, i) => s + numero(i.valor), 0);

  const filtrosTexto = `Tipo: ${tipoFiltro} | Ordenação: ${ordenarPor} | Pesquisa: ${pesquisa || "Sem pesquisa"}`;

  const emitirPdfFiltrado = () => {
    const linhas = fluxoFiltrado.map((item) => `
      <tr>
        <td>${formatarData(item.data)}</td>
        <td>${item.tipo}</td>
        <td>${item.cliente || "-"}</td>
        <td>${item.caminhao || "-"}</td>
        <td>${item.descricao || "-"}</td>
        <td>${item.origem || "-"}</td>
        <td>${moeda(item.valor)}</td>
      </tr>
    `).join("");

    const html = `
      <html>
        <head>
          <title>Fluxo de caixa - ATR MINHOCÃO</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            h1 { color: #d71920; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
            th { background: #d71920; color: white; padding: 8px; text-align: left; }
            td { border-bottom: 1px solid #ddd; padding: 8px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="padding:10px 16px;background:#d71920;color:white;border:0;border-radius:8px;font-weight:bold;">
            Salvar PDF
          </button>
          <h1>ATR MINHOCÃO</h1>
          <h2>Fluxo de caixa filtrado</h2>
          <p><strong>Filtros:</strong> ${filtrosTexto}</p>
          <p><strong>Entradas:</strong> ${moeda(totalEntradas)} | <strong>Saídas:</strong> ${moeda(totalSaidas)} | <strong>Saldo:</strong> ${moeda(totalEntradas - totalSaidas)}</p>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Empresa</th>
                <th>Caminhão</th>
                <th>Descrição</th>
                <th>Origem</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>${linhas || `<tr><td colspan="7">Nenhuma movimentação encontrada.</td></tr>`}</tbody>
          </table>
        </body>
      </html>
    `;

    const janela = window.open("", "_blank");
    janela.document.write(html);
    janela.document.close();
    janela.focus();
  };

  const emitirPdfDespesasPorCaminhao = () => {
    const saidas = fluxoFiltrado.filter((item) => item.tipo === "Saída");

    const grupos = saidas.reduce((acc, item) => {
      const caminhao = item.caminhao || "Sem caminhão";
      if (!acc[caminhao]) acc[caminhao] = { total: 0, itens: [] };
      acc[caminhao].total += numero(item.valor);
      acc[caminhao].itens.push(item);
      return acc;
    }, {});

    const conteudo = Object.entries(grupos).map(([caminhao, grupo]) => `
      <h3>${caminhao} - Total: ${moeda(grupo.total)}</h3>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Empresa</th>
            <th>Descrição</th>
            <th>Origem</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${grupo.itens.map((item) => `
            <tr>
              <td>${formatarData(item.data)}</td>
              <td>${item.cliente || "-"}</td>
              <td>${item.descricao || "-"}</td>
              <td>${item.origem || "-"}</td>
              <td>${moeda(item.valor)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `).join("");

    const totalGeral = saidas.reduce((s, item) => s + numero(item.valor), 0);

    const html = `
      <html>
        <head>
          <title>Despesas por caminhão - ATR MINHOCÃO</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            h1 { color: #d71920; }
            h3 { margin-top: 24px; color: #333; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
            th { background: #d71920; color: white; padding: 8px; text-align: left; }
            td { border-bottom: 1px solid #ddd; padding: 8px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="padding:10px 16px;background:#d71920;color:white;border:0;border-radius:8px;font-weight:bold;">
            Salvar PDF
          </button>
          <h1>ATR MINHOCÃO</h1>
          <h2>Relatório de despesas por caminhão</h2>
          <p><strong>Filtros:</strong> ${filtrosTexto}</p>
          <p><strong>Total geral:</strong> ${moeda(totalGeral)}</p>
          ${conteudo || "<p>Nenhuma despesa encontrada para o filtro atual.</p>"}
        </body>
      </html>
    `;

    const janela = window.open("", "_blank");
    janela.document.write(html);
    janela.document.close();
    janela.focus();
  };

  const emitirPdfEntradasPorEmpresa = () => {
    const entradas = fluxoFiltrado.filter((item) => item.tipo === "Entrada");

    const grupos = entradas.reduce((acc, item) => {
      const empresa = item.cliente || "Sem empresa";
      if (!acc[empresa]) acc[empresa] = { total: 0, itens: [] };
      acc[empresa].total += numero(item.valor);
      acc[empresa].itens.push(item);
      return acc;
    }, {});

    const conteudo = Object.entries(grupos).map(([empresa, grupo]) => `
      <h3>${empresa} - Total: ${moeda(grupo.total)}</h3>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Caminhão</th>
            <th>Descrição</th>
            <th>Origem</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${grupo.itens.map((item) => `
            <tr>
              <td>${formatarData(item.data)}</td>
              <td>${item.caminhao || "-"}</td>
              <td>${item.descricao || "-"}</td>
              <td>${item.origem || "-"}</td>
              <td>${moeda(item.valor)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `).join("");

    const totalGeral = entradas.reduce((s, item) => s + numero(item.valor), 0);

    const html = `
      <html>
        <head>
          <title>Entradas por empresa - ATR MINHOCÃO</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            h1 { color: #d71920; }
            h3 { margin-top: 24px; color: #333; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
            th { background: #d71920; color: white; padding: 8px; text-align: left; }
            td { border-bottom: 1px solid #ddd; padding: 8px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="padding:10px 16px;background:#d71920;color:white;border:0;border-radius:8px;font-weight:bold;">
            Salvar PDF
          </button>
          <h1>ATR MINHOCÃO</h1>
          <h2>Relatório de entradas por empresa</h2>
          <p><strong>Filtros:</strong> ${filtrosTexto}</p>
          <p><strong>Total geral:</strong> ${moeda(totalGeral)}</p>
          ${conteudo || "<p>Nenhuma entrada encontrada para o filtro atual.</p>"}
        </body>
      </html>
    `;

    const janela = window.open("", "_blank");
    janela.document.write(html);
    janela.document.close();
    janela.focus();
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-black">Movimentações do fluxo de caixa</h2>
          <p className="text-zinc-400 text-sm">Máximo de 10 movimentações por página.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={emitirPdfFiltrado} className="bg-red-600 hover:bg-red-700 rounded-2xl px-4 py-2 font-bold">
            PDF fluxo filtrado
          </button>
          <button onClick={emitirPdfDespesasPorCaminhao} className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-4 py-2 font-bold">
            PDF despesas por caminhão
          </button>
          <button onClick={emitirPdfEntradasPorEmpresa} className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-4 py-2 font-bold">
            PDF entradas por empresa
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-3 mb-4">
        <Select
          label="Filtrar tipo"
          value={tipoFiltro}
          onChange={(v) => { setTipoFiltro(v); setPagina(1); }}
          options={["Todos", "Entrada", "Saída"]}
        />
        <Select
          label="Ordenar por"
          value={ordenarPor}
          onChange={(v) => { setOrdenarPor(v); setPagina(1); }}
          options={["data-desc", "data-asc", "empresa-asc", "empresa-desc", "valor-desc", "valor-asc"]}
        />
        <Input
          label="Pesquisar"
          value={pesquisa}
          onChange={(v) => { setPesquisa(v); setPagina(1); }}
        />
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3">
          <p className="text-xs text-zinc-500">Entradas filtradas</p>
          <p className="font-black text-green-400">{moeda(totalEntradas)}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3">
          <p className="text-xs text-zinc-500">Saídas filtradas</p>
          <p className="font-black text-red-400">{moeda(totalSaidas)}</p>
        </div>
      </div>

      <div className="grid gap-3">
        {itensPagina.map((item) => (
          <div key={`${item.tipo}-${item.id}`} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.tipo === "Entrada" ? "bg-green-700" : "bg-red-700"}`}>
                    {item.tipo}
                  </span>
                  <span className="bg-zinc-800 rounded-full px-3 py-1 text-xs">{formatarData(item.data)}</span>
                  <span className="bg-zinc-800 rounded-full px-3 py-1 text-xs">{item.origem || "-"}</span>
                </div>
                <h3 className={`font-black text-lg ${item.tipo === "Entrada" ? "text-green-400" : "text-red-400"}`}>
                  {moeda(item.valor)}
                </h3>
                <p className="text-zinc-300 text-sm">{item.descricao || "-"}</p>
                <p className="text-zinc-500 text-xs mt-1">
                  Empresa: {item.cliente || "-"} • Caminhão: {item.caminhao || "-"}
                </p>
              </div>

              <div className="flex flex-wrap lg:justify-end gap-2">
                {item.origem === "Frete" && item.viagemId ? (
                  <>
                    <button
                      onClick={() => { const v = viagens.find((v) => v.id === item.viagemId); if (v) marcarFretePago(v); }}
                      className="bg-green-900 hover:bg-green-800 rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      Alterar data
                    </button>
                    <button
                      onClick={() => { const v = viagens.find((v) => v.id === item.viagemId); if (v) desfazerPagamentoFrete(v); }}
                      className="bg-yellow-700 hover:bg-yellow-800 rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      Desfazer
                    </button>
                  </>
                ) : item.origem === "Manual" ? (
                  <>
                    <button
                      onClick={() => item.tipo === "Entrada" ? editarEntrada(item) : editarSaida(item)}
                      className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => item.tipo === "Entrada" ? apagarEntrada(item.id) : apagarSaida(item.id)}
                      className="bg-red-600 hover:bg-red-700 rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      Apagar
                    </button>
                  </>
                ) : "-"}
              </div>
            </div>
          </div>
        ))}

        {itensPagina.length === 0 && (
          <p className="text-zinc-400 py-6">Nenhuma movimentação encontrada.</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-5">
        <p className="text-zinc-400 text-sm">
          Página {pagina} de {totalPaginas}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPagina(Math.max(1, pagina - 1))}
            disabled={pagina === 1}
            className="bg-zinc-800 disabled:opacity-40 hover:bg-zinc-700 rounded-xl px-4 py-2 font-bold"
          >
            Anterior
          </button>
          <button
            onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
            disabled={pagina === totalPaginas}
            className="bg-zinc-800 disabled:opacity-40 hover:bg-zinc-700 rounded-xl px-4 py-2 font-bold"
          >
            Próxima
          </button>
        </div>
      </div>
    </section>
  );
}


function ListaViagens({ viagens, apagarViagem, editarViagem, marcarFretePago, desfazerPagamentoFrete, filtrosAvancados = false }) {
  const [ordenacao, setOrdenacao] = React.useState({
    campo: "data",
    direcao: "desc",
  });
  const [pagina, setPagina] = React.useState(1);
  const [pesquisa, setPesquisa] = React.useState("");
  const [filtros, setFiltros] = React.useState({
    viagemInicio: "",
    viagemFim: "",
    previsaoInicio: "",
    previsaoFim: "",
    cliente: "",
    caminhao: "",
    pagamento: "",
  });
  const porPagina = 10;

  const alternarOrdenacao = (campo) => {
    setPagina(1);
    setOrdenacao((atual) => ({
      campo,
      direcao: atual.campo === campo && atual.direcao === "asc" ? "desc" : "asc",
    }));
  };

  const pesoStatus = {
    Programada: 1,
    "Em andamento": 2,
    Finalizada: 3,
  };

  const clientesDisponiveis = Array.from(new Set(viagens.map((v) => v.cliente).filter(Boolean))).sort();
  const caminhoesDisponiveis = Array.from(new Set(viagens.map((v) => v.caminhao).filter(Boolean))).sort();

  const textoPesquisa = pesquisa.trim().toLowerCase();

  const viagensFiltradasPorPesquisa = [...viagens]
    .filter((v) => {
      if (!filtrosAvancados) return true;

      const okViagemInicio = !filtros.viagemInicio || v.data >= filtros.viagemInicio;
      const okViagemFim = !filtros.viagemFim || v.data <= filtros.viagemFim;
      const okPrevisaoInicio = !filtros.previsaoInicio || v.previsaoPagamento >= filtros.previsaoInicio;
      const okPrevisaoFim = !filtros.previsaoFim || v.previsaoPagamento <= filtros.previsaoFim;
      const okCliente = !filtros.cliente || v.cliente === filtros.cliente;
      const okCaminhao = !filtros.caminhao || v.caminhao === filtros.caminhao;

      let okPagamento = true;
      if (filtros.pagamento === "Pago") {
        okPagamento = !!v.fretePago;
      }
      if (filtros.pagamento === "Não pago e dentro do prazo") {
        okPagamento = !v.fretePago && !freteEmAtraso(v);
      }
      if (filtros.pagamento === "Em atraso") {
        okPagamento = freteEmAtraso(v);
      }

      return okViagemInicio && okViagemFim && okPrevisaoInicio && okPrevisaoFim && okCliente && okCaminhao && okPagamento;
    })
    .filter((v) => {
      if (!textoPesquisa) return true;

      const conteudo = [
        v.data,
        formatarData(v.data),
        v.createdAt,
        formatarData(String(v.createdAt || "").slice(0, 10)),
        v.numeroPedido,
        v.cliente,
        v.caminhao,
        v.material,
        v.origem,
        v.destino,
        v.quantidade,
        v.unidade,
        v.frete,
        moeda(v.frete),
        v.previsaoPagamento,
        formatarData(v.previsaoPagamento),
        v.dataPagamentoFrete,
        formatarData(v.dataPagamentoFrete),
        v.status,
        v.fretePago ? "Pago" : "Não pago",
        statusPrazoFrete(v),
      ]
        .join(" ")
        .toLowerCase();

      return conteudo.includes(textoPesquisa);
    });

  const viagensOrdenadas = viagensFiltradasPorPesquisa.sort((a, b) => {
    let valorA = a[ordenacao.campo] || "";
    let valorB = b[ordenacao.campo] || "";

    if (ordenacao.campo === "status") {
      valorA = pesoStatus[a.status] || 99;
      valorB = pesoStatus[b.status] || 99;
    }

    if (ordenacao.campo === "frete") {
      valorA = numero(a.frete);
      valorB = numero(b.frete);
    }

    if (valorA < valorB) return ordenacao.direcao === "asc" ? -1 : 1;
    if (valorA > valorB) return ordenacao.direcao === "asc" ? 1 : -1;
    return 0;
  });

  const totalPaginas = Math.max(1, Math.ceil(viagensOrdenadas.length / porPagina));
  const inicioPagina = (pagina - 1) * porPagina;
  const viagensPagina = viagensOrdenadas.slice(inicioPagina, inicioPagina + porPagina);

  const totalFiltrado = viagensOrdenadas.reduce((s, v) => s + numero(v.frete), 0);
  const totalAReceber = viagensOrdenadas
    .filter((v) => !v.fretePago)
    .reduce((s, v) => s + numero(v.frete), 0);
  const totalRecebido = viagensOrdenadas
    .filter((v) => v.fretePago)
    .reduce((s, v) => s + numero(v.frete), 0);
  const totalEmAtraso = viagensOrdenadas
    .filter(freteEmAtraso)
    .reduce((s, v) => s + numero(v.frete), 0);

  const seta = (campo) => {
    if (ordenacao.campo !== campo) return "↕";
    return ordenacao.direcao === "asc" ? "↑" : "↓";
  };

  const BotaoOrdenar = ({ campo, children }) => (
    <button onClick={() => alternarOrdenacao(campo)} className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-3 py-2 text-xs font-bold">
      {children} {seta(campo)}
    </button>
  );

  const limparFiltros = () => {
    setFiltros({ viagemInicio: "", viagemFim: "", previsaoInicio: "", previsaoFim: "", cliente: "", caminhao: "", pagamento: "" });
    setPesquisa("");
    setPagina(1);
  };

  const emitirPdfViagensFiltradas = () => {
    const linhas = viagensOrdenadas.map((v) => `
      <tr>
        <td>${formatarData(v.data)}</td>
        <td>${v.numeroPedido || "-"}</td>
        <td>${v.cliente || "-"}</td>
        <td>${v.caminhao || "-"}</td>
        <td>${v.material || "-"}</td>
        <td>${v.origem || "-"}</td>
        <td>${v.destino || "-"}</td>
        <td>${v.quantidade || "-"} ${v.unidade || ""}</td>
        <td>${moeda(v.frete)}</td>
        <td>${formatarData(v.previsaoPagamento)}</td>
        <td>${v.fretePago ? "Pago em " + formatarData(v.dataPagamentoFrete) : "Não pago"}</td>
      </tr>
    `).join("");

    const filtrosTexto = [
      filtros.viagemInicio ? `Viagem inicial: ${formatarData(filtros.viagemInicio)}` : null,
      filtros.viagemFim ? `Viagem final: ${formatarData(filtros.viagemFim)}` : null,
      filtros.previsaoInicio ? `Previsão inicial: ${formatarData(filtros.previsaoInicio)}` : null,
      filtros.previsaoFim ? `Previsão final: ${formatarData(filtros.previsaoFim)}` : null,
      filtros.cliente ? `Cliente: ${filtros.cliente}` : null,
      filtros.caminhao ? `Caminhão: ${filtros.caminhao}` : null,
      filtros.pagamento ? `Status do pagamento: ${filtros.pagamento}` : null,
      pesquisa ? `Pesquisa: ${pesquisa}` : null,
    ].filter(Boolean).join(" | ") || "Sem filtros";

    const html = `
      <html>
        <head>
          <title>Relatório de viagens - ATR MINHOCÃO</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            h1 { color: #d71920; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 16px; }
            th { background: #d71920; color: white; padding: 7px; text-align: left; }
            td { border-bottom: 1px solid #ddd; padding: 7px; }
            .resumo { margin: 12px 0; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="padding:10px 16px;background:#d71920;color:white;border:0;border-radius:8px;font-weight:bold;">
            Salvar PDF
          </button>
          <h1>ATR MINHOCÃO</h1>
          <h2>Relatório de viagens filtradas</h2>
          <p><strong>Filtros:</strong> ${filtrosTexto}</p>
          <div class="resumo">
            <strong>Total filtrado:</strong> ${moeda(totalFiltrado)} |
            <strong>A receber:</strong> ${moeda(totalAReceber)} |
            <strong>Recebido:</strong> ${moeda(totalRecebido)} |
            <strong>Em atraso:</strong> ${moeda(totalEmAtraso)}
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Caminhão</th>
                <th>Material</th>
                <th>Origem</th>
                <th>Destino</th>
                <th>Quantidade</th>
                <th>Frete</th>
                <th>Previsão</th>
                <th>Pagamento</th>
              </tr>
            </thead>
            <tbody>${linhas || `<tr><td colspan="11">Nenhuma viagem encontrada.</td></tr>`}</tbody>
          </table>
        </body>
      </html>
    `;

    const janela = window.open("", "_blank");
    janela.document.write(html);
    janela.document.close();
    janela.focus();
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-black">Viagens cadastradas</h2>
          <p className="text-zinc-400 text-sm">
            Exibindo até 10 viagens por página. Total filtrado: {viagensOrdenadas.length}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotaoOrdenar campo="data">Data</BotaoOrdenar>
          <BotaoOrdenar campo="createdAt">Cadastro</BotaoOrdenar>
          <BotaoOrdenar campo="numeroPedido">Pedido</BotaoOrdenar>
          <BotaoOrdenar campo="cliente">Cliente</BotaoOrdenar>
          <BotaoOrdenar campo="frete">Frete</BotaoOrdenar>
          <BotaoOrdenar campo="status">Status</BotaoOrdenar>
        </div>
      </div>

      {filtrosAvancados && (
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3">
            <p className="text-xs text-zinc-500">Total filtrado</p>
            <p className="font-black text-white">{moeda(totalFiltrado)}</p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3">
            <p className="text-xs text-zinc-500">A receber</p>
            <p className="font-black text-red-400">{moeda(totalAReceber)}</p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3">
            <p className="text-xs text-zinc-500">Recebido</p>
            <p className="font-black text-green-400">{moeda(totalRecebido)}</p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3">
            <p className="text-xs text-zinc-500">Em atraso</p>
            <p className="font-black text-red-300">{moeda(totalEmAtraso)}</p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <Input
          label="Pesquisar nas viagens/fretes"
          value={pesquisa}
          onChange={(v) => {
            setPesquisa(v);
            setPagina(1);
          }}
        />
        <p className="text-zinc-500 text-xs mt-2">
          Pesquise por pedido, cliente, caminhão, material, origem, destino, valor, status ou previsão de pagamento.
        </p>
      </div>

      {filtrosAvancados && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div>
              <h3 className="font-black">Filtros de viagens e pagamentos</h3>
              <p className="text-zinc-500 text-xs mt-1">Use “Viagem inicial/final” para filtrar pela data da viagem. Use “Previsão inicial/final” para filtrar pela previsão de pagamento.</p>
            </div>
            <button onClick={emitirPdfViagensFiltradas} className="bg-red-600 hover:bg-red-700 rounded-xl px-4 py-2 font-bold">
              Emitir PDF dos filtros
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <Input label="Viagem inicial" type="date" value={filtros.viagemInicio} onChange={(v) => { setFiltros({ ...filtros, viagemInicio: v }); setPagina(1); }} />
            <Input label="Viagem final" type="date" value={filtros.viagemFim} onChange={(v) => { setFiltros({ ...filtros, viagemFim: v }); setPagina(1); }} />
            <Input label="Previsão inicial" type="date" value={filtros.previsaoInicio} onChange={(v) => { setFiltros({ ...filtros, previsaoInicio: v }); setPagina(1); }} />
            <Input label="Previsão final" type="date" value={filtros.previsaoFim} onChange={(v) => { setFiltros({ ...filtros, previsaoFim: v }); setPagina(1); }} />
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <Select label="Cliente" value={filtros.cliente} onChange={(v) => { setFiltros({ ...filtros, cliente: v }); setPagina(1); }} options={clientesDisponiveis} />
            <Select label="Caminhão" value={filtros.caminhao} onChange={(v) => { setFiltros({ ...filtros, caminhao: v }); setPagina(1); }} options={caminhoesDisponiveis} />
            <Select label="Pagamento" value={filtros.pagamento} onChange={(v) => { setFiltros({ ...filtros, pagamento: v }); setPagina(1); }} options={["Pago", "Não pago e dentro do prazo", "Em atraso"]} />
          </div>

          <button onClick={limparFiltros} className="mt-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl px-4 py-2 font-bold">
            Limpar filtros
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {viagensPagina.map((v) => {
          const estaAtrasado = freteEmAtraso(v);

          return (
            <div key={v.id} className={(estaAtrasado ? "bg-red-950/40 border-red-700" : "bg-zinc-950 border-zinc-800") + " border rounded-2xl p-4"}>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-red-600 rounded-full px-3 py-1 text-xs font-bold">{formatarData(v.data)}</span>
                    <span className="bg-zinc-800 rounded-full px-3 py-1 text-xs">Pedido: {v.numeroPedido || "Não informado"}</span>
                    <span className="bg-zinc-800 rounded-full px-3 py-1 text-xs">{v.status || "-"}</span>

                    {v.fretePago ? (
                      <span className="bg-green-800 rounded-full px-3 py-1 text-xs font-bold">Pago: {formatarData(v.dataPagamentoFrete)}</span>
                    ) : (
                      <span className="bg-red-800 rounded-full px-3 py-1 text-xs font-bold">Não pago</span>
                    )}

                    {!v.fretePago && v.previsaoPagamento && (
                      <span className={(estaAtrasado ? "bg-red-600" : "bg-green-800") + " rounded-full px-3 py-1 text-xs font-bold"}>
                        {estaAtrasado ? "EM ATRASO" : "Dentro do prazo"}
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-lg">{v.cliente || "-"}</h3>
                  <p className="text-zinc-400 text-sm">
                    {v.caminhao || "-"} • {v.material || "-"} • {v.quantidade ? `${v.quantidade} ${v.unidade || ""}` : "Quantidade não informada"}
                  </p>
                  <p className="text-zinc-300 text-sm mt-1">
                    {v.origem || "-"} → {v.destino || "-"}
                  </p>
                  <p className={(estaAtrasado ? "text-red-300 font-bold" : "text-zinc-500") + " text-xs mt-1"}>
                    Previsão pagamento: {formatarData(v.previsaoPagamento)}
                  </p>
                </div>

                <div className="lg:text-right">
                  <p className="text-zinc-400 text-xs">Frete</p>
                  <p className={(estaAtrasado ? "text-red-300" : "text-red-400") + " font-black text-xl"}>{moeda(v.frete)}</p>
                  <div className="flex flex-wrap lg:justify-end gap-2 mt-3">
                    {marcarFretePago && !v.fretePago && (
                      <button onClick={() => marcarFretePago(v)} className="bg-green-700 hover:bg-green-800 rounded-xl px-3 py-2 text-xs font-bold">
                        Marcar pago
                      </button>
                    )}

                    {marcarFretePago && v.fretePago && (
                      <>
                        <button onClick={() => marcarFretePago(v)} className="bg-green-900 hover:bg-green-800 rounded-xl px-3 py-2 text-xs font-bold text-green-200">
                          Alterar data pagamento
                        </button>
                        {desfazerPagamentoFrete && (
                          <button onClick={() => desfazerPagamentoFrete(v)} className="bg-yellow-700 hover:bg-yellow-800 rounded-xl px-3 py-2 text-xs font-bold">
                            Desfazer pagamento
                          </button>
                        )}
                      </>
                    )}

                    {editarViagem && (
                      <button onClick={() => editarViagem(v)} className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-3 py-2 text-xs font-bold">
                        Editar
                      </button>
                    )}

                    <button onClick={() => apagarViagem(v.id)} className="bg-red-600 hover:bg-red-700 rounded-xl px-3 py-2 text-xs font-bold">
                      Apagar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {viagensPagina.length === 0 && (
          <p className="text-zinc-400 py-6">Nenhuma viagem encontrada para a pesquisa/filtro atual.</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-5">
        <p className="text-zinc-400 text-sm">
          Página {pagina} de {totalPaginas}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPagina(Math.max(1, pagina - 1))}
            disabled={pagina === 1}
            className="bg-zinc-800 disabled:opacity-40 hover:bg-zinc-700 rounded-xl px-4 py-2 font-bold"
          >
            Anterior
          </button>
          <button
            onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
            disabled={pagina === totalPaginas}
            className="bg-zinc-800 disabled:opacity-40 hover:bg-zinc-700 rounded-xl px-4 py-2 font-bold"
          >
            Próxima
          </button>
        </div>
      </div>
    </section>
  );
}



function ListaDespesas({ despesas, apagarDespesa, editarDespesa }) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <h2 className="text-2xl font-black mb-4"></h2>
      <div className="overflow-auto">
        <table className="w-full min-w-[1250px] text-left text-sm border-separate border-spacing-y-3">
          <thead className="text-zinc-400">
            <tr>
              <th className="px-4 pb-2">Data</th>
              <th className="px-4 pb-2">Caminhão</th>
              <th className="px-4 pb-2">Tipo</th>
              <th className="px-4 pb-2">Posto/empresa</th>
              <th className="px-4 pb-2">Litros</th>
              <th className="px-4 pb-2">Valor/L</th>
              <th className="px-4 pb-2">KM painel</th>
              <th className="px-4 pb-2">Pagamento</th>
              <th className="px-4 pb-2">Responsável</th>
              <th className="px-4 pb-2">Vencimento</th>
              <th className="px-4 pb-2">Total</th>
              <th className="px-4 pb-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((d) => (
              <tr key={d.id} className="bg-zinc-950">
                <td className="px-4 py-4 rounded-l-2xl whitespace-nowrap">{formatarData(d.data)}</td>
                <td className="px-4 py-4 font-bold whitespace-nowrap">{d.caminhao || "-"}</td>
                <td className="px-4 py-4 whitespace-nowrap">{d.tipo}</td>
                <td className="px-4 py-4 whitespace-nowrap">{d.postoEmpresa || "-"}</td>
                <td className="px-4 py-4 whitespace-nowrap">{d.litros ? `${numero(d.litros).toLocaleString("pt-BR")} L` : "-"}</td>
                <td className="px-4 py-4 whitespace-nowrap">{d.valorLitro ? moeda(numero(d.valorLitro)) : "-"}</td>
                <td className="px-4 py-4 whitespace-nowrap">{d.kmPainel || "-"}</td>
                <td className="px-4 py-4 whitespace-nowrap">{d.statusPagamento} / {normalizarFormaPagamento(d.formaPagamento)}</td>
                <td className="px-4 py-4 whitespace-nowrap">{d.responsavelPagamento || "-"}</td>
                <td className="px-4 py-4 whitespace-nowrap">{formatarData(d.dataVencimento)}</td>
                <td className="px-4 py-4 text-red-400 font-bold whitespace-nowrap">{moeda(d.valor)}</td>
                <td className="px-4 py-4 rounded-r-2xl whitespace-nowrap">
                  <div className="flex gap-3">
                    <button onClick={() => editarDespesa(d)} className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-3 py-2 font-bold inline-flex items-center gap-2">
                      <Pencil size={16} /> Editar
                    </button>
                    <button onClick={() => apagarDespesa(d.id)} className="bg-red-600 hover:bg-red-700 rounded-xl px-3 py-2 font-bold inline-flex items-center gap-2">
                      <Trash2 size={16} /> Apagar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}





function ListaContas({ despesas, editarDespesa, setDespesas, todasDespesas, setSaidasManuais }) {
  const [pagina, setPagina] = React.useState(1);
  const [pesquisa, setPesquisa] = React.useState("");
  const [filtroStatus, setFiltroStatus] = React.useState("Todos");
  const [ordenarData, setOrdenarData] = React.useState("asc");
  const porPagina = 10;

  const marcarComoPago = (despesa) => {
    const dataPagamento = prompt("Informe a data de pagamento no formato AAAA-MM-DD:", hojeISO());
    if (!dataPagamento) return;

    const despesaPaga = {
      ...despesa,
      statusPagamento: "Pago",
      dataPagamento,
      formaPagamento: normalizarFormaPagamento(despesa.formaPagamento),
    };

    setDespesas(todasDespesas.map((d) =>
      d.id === despesa.id ? despesaPaga : d
    ));

    if (typeof setSaidasManuais === "function") {
      setSaidasManuais((saidasAtuais) => {
        const jaExiste = saidasAtuais.some((s) => s.origemDespesaId === despesa.id);
        if (jaExiste) {
          return saidasAtuais.map((s) =>
            s.origemDespesaId === despesa.id
              ? {
                  ...s,
                  data: dataPagamento,
                  valor: numero(despesa.valor),
                  descricao: `Pagamento de conta: ${despesa.descricao || despesa.tipo || "Despesa"}`,
                  cliente: despesa.responsavelPagamento || despesa.postoEmpresa || "",
                  caminhao: despesa.caminhao || "",
                  origem: "Conta a pagar",
                }
              : s
          );
        }

        return [
          ...saidasAtuais,
          {
            id: crypto.randomUUID(),
            origemDespesaId: despesa.id,
            data: dataPagamento,
            valor: numero(despesa.valor),
            descricao: `Pagamento de conta: ${despesa.descricao || despesa.tipo || "Despesa"}`,
            cliente: despesa.responsavelPagamento || despesa.postoEmpresa || "",
            caminhao: despesa.caminhao || "",
            origem: "Conta a pagar",
          },
        ];
      });
    }
  };

  const textoPesquisa = pesquisa.trim().toLowerCase();

  const despesasFiltradas = [...despesas]
    .filter((d) => filtroStatus === "Todos" || statusConta(d) === filtroStatus)
    .filter((d) => {
      if (!textoPesquisa) return true;

      const conteudo = [
        statusConta(d),
        d.dataVencimento,
        formatarData(d.dataVencimento),
        d.dataPagamento,
        formatarData(d.dataPagamento),
        d.data,
        formatarData(d.data),
        d.responsavelPagamento,
        d.caminhao,
        d.tipo,
        d.descricao,
        d.formaPagamento,
        d.valor,
        moeda(d.valor),
        d.recorrente ? `Parcela ${d.parcelaAtual} ${d.parcelaTotal}` : "",
      ].join(" ").toLowerCase();

      return conteudo.includes(textoPesquisa);
    })
    .sort((a, b) => {
      const dataA = a.dataVencimento || "9999-12-31";
      const dataB = b.dataVencimento || "9999-12-31";
      if (dataA < dataB) return ordenarData === "asc" ? -1 : 1;
      if (dataA > dataB) return ordenarData === "asc" ? 1 : -1;
      return 0;
    });

  const totalPaginas = Math.max(1, Math.ceil(despesasFiltradas.length / porPagina));
  const inicio = (pagina - 1) * porPagina;
  const despesasPagina = despesasFiltradas.slice(inicio, inicio + porPagina);

  const totalFiltrado = despesasFiltradas.reduce((s, d) => s + numero(d.valor), 0);

  const apagarDespesaConta = (id) => {
    if (!window.confirm("Tem certeza que deseja apagar esta despesa/conta?")) return;
    setDespesas(todasDespesas.filter((d) => d.id !== id));
  };

  const apagarRecorrencia = (despesa) => {
    if (!despesa.recorrenciaGrupoId) return;
    if (!window.confirm("Deseja apagar todas as parcelas desta recorrência?")) return;
    setDespesas(todasDespesas.filter((d) => d.recorrenciaGrupoId !== despesa.recorrenciaGrupoId));
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-black">Contas a pagar por data</h2>
          <p className="text-zinc-400 text-sm">Máximo de 10 contas por página. Total filtrado: {despesasFiltradas.length}.</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 min-w-[180px]">
          <p className="text-xs text-zinc-500">Total filtrado</p>
          <p className="font-black text-red-400">{moeda(totalFiltrado)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <Input
          label="Pesquisar"
          value={pesquisa}
          onChange={(v) => {
            setPesquisa(v);
            setPagina(1);
          }}
        />
        <Select
          label="Status"
          value={filtroStatus}
          onChange={(v) => {
            setFiltroStatus(v);
            setPagina(1);
          }}
          options={["Todos", "Em aberto", "Atrasada", "Pago"]}
        />
        <Select
          label="Ordenar vencimento"
          value={ordenarData}
          onChange={(v) => {
            setOrdenarData(v);
            setPagina(1);
          }}
          options={["asc", "desc"]}
        />
      </div>

      <div className="grid gap-3">
        {despesasPagina.map((d) => {
          const status = statusConta(d);
          const statusClass = status === "Pago" ? "bg-green-700" : status === "Atrasada" ? "bg-red-700" : "bg-yellow-700";
          const cardClass = status === "Atrasada" ? "bg-red-950/30 border-red-800" : "bg-zinc-950 border-zinc-800";

          return (
            <div key={d.id} className={`${cardClass} border rounded-2xl p-4`}>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`${statusClass} rounded-full px-3 py-1 text-xs font-bold`}>{status}</span>
                    <span className="bg-zinc-800 rounded-full px-3 py-1 text-xs">Venc.: {formatarData(d.dataVencimento)}</span>
                    {d.recorrente && (
                      <span className="bg-zinc-800 rounded-full px-3 py-1 text-xs">
                        Parcela {d.parcelaAtual || "-"} / {d.parcelaTotal || "-"}
                      </span>
                    )}
                    {d.dataPagamento && (
                      <span className="bg-green-800 rounded-full px-3 py-1 text-xs">Pago: {formatarData(d.dataPagamento)}</span>
                    )}
                  </div>

                  <h3 className="font-black text-lg">{d.responsavelPagamento || "-"}</h3>
                  <p className="text-zinc-300 text-sm font-bold">{d.descricao || "-"}</p>
                  <p className="text-zinc-400 text-sm mt-1">
                    {d.tipo || "-"} • Caminhão: {d.caminhao || "-"} • Forma: {normalizarFormaPagamento(d.formaPagamento)}
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Lançamento: {formatarData(d.data)}
                  </p>
                </div>

                <div className="lg:text-right">
                  <p className="text-zinc-400 text-xs">Total</p>
                  <p className="text-red-400 font-black text-xl">{moeda(d.valor)}</p>
                  <div className="flex flex-wrap lg:justify-end gap-2 mt-3">
                    {status !== "Pago" && (
                      <button onClick={() => marcarComoPago(d)} className="bg-green-700 hover:bg-green-800 rounded-xl px-3 py-2 text-xs font-bold">
                        Marcar pago
                      </button>
                    )}
                    <button onClick={() => editarDespesa(d)} className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-3 py-2 text-xs font-bold">
                      Editar
                    </button>
                    <button onClick={() => apagarDespesaConta(d.id)} className="bg-red-600 hover:bg-red-700 rounded-xl px-3 py-2 text-xs font-bold">
                      Apagar
                    </button>
                    {d.recorrenciaGrupoId && (
                      <button onClick={() => apagarRecorrencia(d)} className="bg-red-950 hover:bg-red-900 border border-red-800 rounded-xl px-3 py-2 text-xs font-bold">
                        Apagar recorrência
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {despesasPagina.length === 0 && (
          <p className="text-zinc-400 py-6">Nenhuma conta encontrada.</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-5">
        <p className="text-zinc-400 text-sm">
          Página {pagina} de {totalPaginas}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPagina(Math.max(1, pagina - 1))}
            disabled={pagina === 1}
            className="bg-zinc-800 disabled:opacity-40 hover:bg-zinc-700 rounded-xl px-4 py-2 font-bold"
          >
            Anterior
          </button>
          <button
            onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
            disabled={pagina === totalPaginas}
            className="bg-zinc-800 disabled:opacity-40 hover:bg-zinc-700 rounded-xl px-4 py-2 font-bold"
          >
            Próxima
          </button>
        </div>
      </div>
    </section>
  );
}
