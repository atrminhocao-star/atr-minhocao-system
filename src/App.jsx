import React, { useEffect, useMemo, useState } from "react";
import { Truck, Route, Wallet, Fuel, Plus, Trash2, Save, LogOut, User, Lock, Droplets, Gauge, Building2, Filter, Pencil, X, CalendarDays } from "lucide-react";

const CHAVE_PRINCIPAL = "atr-minhocao-dados";
const CHAVES_ANTIGAS = ["atr-minhocao-v4", "atr-minhocao-v3", "atr-minhocao-v2"];

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

const normalizarFormaPagamento = (forma) => {
  if (forma === "Desconto por empresa") return "Desconto em folha";
  return forma || "-";
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

  const [filtroRecebimentos, setFiltroRecebimentos] = useState({
    inicio: "",
    fim: "",
    cliente: "",
  });

  const [despesaForm, setDespesaForm] = useState(despesaVazia);
  const [despesaEditandoId, setDespesaEditandoId] = useState(null);

  useEffect(() => {
    let dadosEncontrados = null;

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
    }

    if (sessao) setLogado(JSON.parse(sessao));
  }, []);

  useEffect(() => {
    const dados = { usuarios, clientes, materiais, caminhoes, viagens, despesas };
    localStorage.setItem(CHAVE_PRINCIPAL, JSON.stringify(dados));
    localStorage.setItem("atr-minhocao-v4", JSON.stringify(dados));
  }, [usuarios, clientes, materiais, caminhoes, viagens, despesas]);

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
        return okInicio && okFim && okCliente;
      })
      .sort((a, b) => String(a.previsaoPagamento || "9999-12-31").localeCompare(String(b.previsaoPagamento || "9999-12-31")));
  }, [viagens, filtroRecebimentos]);

  const totalFretesAReceber = useMemo(() => {
    return fretesAReceber.reduce((s, v) => s + numero(v.frete), 0);
  }, [fretesAReceber]);

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
      setClientes(clientes.map((c) => c.id === clienteEditandoId ? { ...c, ...clienteForm } : c));
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

  const adicionarViagem = () => {
    if (!viagemForm.origem || !viagemForm.destino || !viagemForm.frete || !viagemForm.cliente) {
      return alert("Informe cliente, origem, destino e frete.");
    }
    setViagens([...viagens, { id: crypto.randomUUID(), ...viagemForm }]);
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

  const salvarDespesa = () => {
    if (!despesaForm.data || !despesaForm.caminhao || !despesaForm.tipo) return alert("Informe data, caminhão e tipo da despesa.");

    let valorFinal = numero(despesaForm.valor);

    if (despesaForm.tipo === "Combustível") {
      if (!despesaForm.litros || !despesaForm.valorLitro || !despesaForm.kmPainel) {
        return alert("Para combustível, informe litros, valor por litro e KM do painel.");
      }
      valorFinal = numero(despesaForm.litros) * numero(despesaForm.valorLitro);
    }

    if (despesaForm.statusPagamento === "A prazo" || despesaForm.formaPagamento === "A prazo" || despesaForm.formaPagamento === "Desconto em folha") {
      if (!despesaForm.responsavelPagamento) {
        return alert("Para lançamento a prazo/desconto, selecione a empresa/cliente responsável pelo pagamento.");
      }
    }

    const despesaSalva = { ...despesaForm, valor: valorFinal };

    if (despesaEditandoId) {
      setDespesas(despesas.map((d) => d.id === despesaEditandoId ? { ...d, ...despesaSalva } : d));
      setDespesaEditandoId(null);
    } else {
      setDespesas([...despesas, { id: crypto.randomUUID(), ...despesaSalva }]);
    }

    setDespesaForm(despesaVazia);
  };

  const editarDespesa = (despesa) => {
    setDespesaEditandoId(despesa.id);
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
    setAba("despesas");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicaoDespesa = () => {
    setDespesaEditandoId(null);
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

  const menu = [
    { id: "dashboard", nome: "Dashboard" },
    { id: "clientes", nome: "Clientes/Empresas" },
    { id: "materiais", nome: "Materiais" },
    { id: "caminhoes", nome: "Caminhões" },
    { id: "viagens", nome: "Viagens" },
    { id: "recebimentos", nome: "Fretes a receber" },
    { id: "despesas", nome: "Abastecimentos/Despesas" },
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

            <ListaViagens viagens={viagensFiltradas} apagarViagem={(id) => setViagens(viagens.filter(v => v.id !== id))} />
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
                onChange={(v) => setMaterialForm({ ...materialForm, valor: v })}
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
              <h2 className="text-2xl font-black mb-4">Nova viagem</h2>
              <p className="text-zinc-400 mb-4">O diesel fica apenas na aba de abastecimentos/despesas por caminhão. Ao selecionar o material, origem, destino e valor unitário são puxados automaticamente, mas podem ser ajustados se necessário.</p>
              <div className="grid md:grid-cols-4 gap-3">
                <Input label="Data da viagem" type="date" value={viagemForm.data} onChange={(v) => setViagemForm({ ...viagemForm, data: v })} />
                <Input label="Número do pedido" value={viagemForm.numeroPedido} onChange={(v) => setViagemForm({ ...viagemForm, numeroPedido: v })} />
                <Select label="Cliente" value={viagemForm.cliente} onChange={(v) => setViagemForm({ ...viagemForm, cliente: v })} options={clientes.map(c => c.nome)} />
                <Select label="Caminhão" value={viagemForm.caminhao} onChange={(v) => setViagemForm({ ...viagemForm, caminhao: v })} options={caminhoes.map(c => c.placa)} />
                <Input label="Origem" value={viagemForm.origem} onChange={(v) => setViagemForm({ ...viagemForm, origem: v })} />
                <Input label="Destino" value={viagemForm.destino} onChange={(v) => setViagemForm({ ...viagemForm, destino: v })} />
                <Select label="Material" value={viagemForm.material} onChange={selecionarMaterial} options={materiais.map(m => m.nome)} />
                <Input label="Quantidade" value={viagemForm.quantidade} onChange={atualizarQuantidadeViagem} />
                <Select label="Unidade" value={viagemForm.unidade} onChange={(v) => setViagemForm({ ...viagemForm, unidade: v })} options={["Toneladas", "Quilos", "Viagem", "Carga", "Outro"]} />
                <Input label="Valor unitário R$" value={viagemForm.valorUnitario} onChange={atualizarValorUnitarioViagem} />
                <Input label="Frete total a receber R$" value={viagemForm.frete} onChange={(v) => setViagemForm({ ...viagemForm, frete: v })} />
                <Input label="Previsão de pagamento" type="date" value={viagemForm.previsaoPagamento} onChange={(v) => setViagemForm({ ...viagemForm, previsaoPagamento: v })} />
                <Select label="Status" value={viagemForm.status} onChange={(v) => setViagemForm({ ...viagemForm, status: v })} options={["Programada", "Em andamento", "Finalizada"]} />
              </div>
              <button onClick={adicionarViagem} className="mt-4 bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-3 font-bold flex items-center gap-2"><Save size={18} /> Salvar viagem</button>
            </section>

            <ListaViagens viagens={viagens} apagarViagem={(id) => setViagens(viagens.filter(v => v.id !== id))} />
          </div>
        )}


        {aba === "recebimentos" && (
          <div className="space-y-5">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="text-red-500" />
                <h2 className="text-2xl font-black">Filtros de fretes a receber</h2>
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <Input label="Data inicial" type="date" value={filtroRecebimentos.inicio} onChange={(v) => setFiltroRecebimentos({ ...filtroRecebimentos, inicio: v })} />
                <Input label="Data final" type="date" value={filtroRecebimentos.fim} onChange={(v) => setFiltroRecebimentos({ ...filtroRecebimentos, fim: v })} />
                <Select label="Cliente" value={filtroRecebimentos.cliente} onChange={(v) => setFiltroRecebimentos({ ...filtroRecebimentos, cliente: v })} options={clientes.map(c => c.nome)} />
                <button onClick={() => setFiltroRecebimentos({ inicio: "", fim: "", cliente: "" })} className="mt-6 bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-3 font-bold">Limpar filtros</button>
              </div>
            </section>

            <div className="grid md:grid-cols-3 gap-4">
              <Card titulo="Fretes encontrados" valor={fretesAReceber.length} icone={Route} />
              <Card titulo="Total a receber" valor={moeda(totalFretesAReceber)} icone={Wallet} destaque />
              <Card titulo="Clientes filtrados" valor={filtroRecebimentos.cliente || "Todos"} icone={Building2} />
            </div>

            <ListaViagens viagens={fretesAReceber} apagarViagem={(id) => setViagens(viagens.filter(v => v.id !== id))} />
          </div>
        )}

        {aba === "despesas" && (
          <div className="space-y-5">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-1">{despesaEditandoId ? "Editar abastecimento/despesa" : "Novo abastecimento/despesa por caminhão"}</h2>
              <p className="text-zinc-400 mb-4">Controle combustível e despesas independentes da viagem.</p>

              <div className="grid md:grid-cols-4 gap-3">
                <Input label="Data" type="date" value={despesaForm.data} onChange={(v) => setDespesaForm({ ...despesaForm, data: v })} />
                <Select label="Caminhão" value={despesaForm.caminhao} onChange={(v) => setDespesaForm({ ...despesaForm, caminhao: v })} options={caminhoes.map(c => c.placa)} />
                <Select label="Tipo" value={despesaForm.tipo} onChange={(v) => setDespesaForm({ ...despesaForm, tipo: v })} options={["Combustível", "Manutenção", "Pneu", "Pedágio", "Óleo", "Peças", "Outros"]} />
                <Input label="Posto/empresa" value={despesaForm.postoEmpresa} onChange={(v) => setDespesaForm({ ...despesaForm, postoEmpresa: v })} />

                {despesaForm.tipo === "Combustível" ? (
                  <>
                    <Input label="Quantidade de litros" value={despesaForm.litros} onChange={(v) => setDespesaForm({ ...despesaForm, litros: v })} icon={Droplets} />
                    <Input label="Valor por litro R$" value={despesaForm.valorLitro} onChange={(v) => setDespesaForm({ ...despesaForm, valorLitro: v })} />
                    <Input label="KM no painel" value={despesaForm.kmPainel} onChange={(v) => setDespesaForm({ ...despesaForm, kmPainel: v })} icon={Gauge} />
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3">
                      <p className="text-sm text-zinc-400">Total calculado</p>
                      <p className="text-2xl font-black text-red-400">{moeda(numero(despesaForm.litros) * numero(despesaForm.valorLitro))}</p>
                    </div>
                  </>
                ) : (
                  <Input label="Valor R$" value={despesaForm.valor} onChange={(v) => setDespesaForm({ ...despesaForm, valor: v })} />
                )}

                <Select label="Status do pagamento" value={despesaForm.statusPagamento} onChange={(v) => setDespesaForm({ ...despesaForm, statusPagamento: v })} options={["Pago", "A prazo", "Pendente"]} />
                <Select label="Forma de pagamento" value={despesaForm.formaPagamento} onChange={(v) => setDespesaForm({ ...despesaForm, formaPagamento: v })} options={["Dinheiro", "Pix", "Cartão", "Boleto", "A prazo", "Desconto em folha", "Outro"]} />

                {despesaForm.statusPagamento === "Pago" ? (
                  <Input label="Data de pagamento" type="date" value={despesaForm.dataPagamento} onChange={(v) => setDespesaForm({ ...despesaForm, dataPagamento: v })} />
                ) : null}

                {despesaForm.statusPagamento === "A prazo" || despesaForm.formaPagamento === "A prazo" || despesaForm.formaPagamento === "Desconto em folha" ? (
                  <>
                    <Select label="Empresa/cliente responsável pelo pagamento" value={despesaForm.responsavelPagamento} onChange={(v) => setDespesaForm({ ...despesaForm, responsavelPagamento: v })} options={clientes.map(c => c.nome)} />
                    <Input label="Data de vencimento/previsão" type="date" value={despesaForm.dataVencimento} onChange={(v) => setDespesaForm({ ...despesaForm, dataVencimento: v })} />
                    <Input label="Data de pagamento" type="date" value={despesaForm.dataPagamento} onChange={(v) => setDespesaForm({ ...despesaForm, dataPagamento: v })} />
                  </>
                ) : null}

                <Input label="Observação" value={despesaForm.descricao} onChange={(v) => setDespesaForm({ ...despesaForm, descricao: v })} />
              </div>

              <button onClick={salvarDespesa} className="mt-4 bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-3 font-bold inline-flex items-center gap-2"><Save size={18} /> {despesaEditandoId ? "Salvar alterações" : "Salvar lançamento"}</button>
              {despesaEditandoId && <button onClick={cancelarEdicaoDespesa} className="mt-4 ml-2 bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-6 py-3 font-bold inline-flex items-center gap-2"><X size={18} /> Cancelar edição</button>}
            </section>

            <ListaDespesas despesas={despesas} apagarDespesa={(id) => setDespesas(despesas.filter(d => d.id !== id))} editarDespesa={editarDespesa} />
          </div>
        )}

        {aba === "contas" && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-4 gap-4">
              <Card titulo="Em aberto" valor={`${resumoContas.abertas} | ${moeda(resumoContas.valorAberto)}`} icone={CalendarDays} />
              <Card titulo="Atrasadas" valor={`${resumoContas.atrasadas} | ${moeda(resumoContas.valorAtrasado)}`} icone={Wallet} destaque />
              <Card titulo="Pagas" valor={`${resumoContas.pagas} | ${moeda(resumoContas.valorPago)}`} icone={Save} />
              <Card titulo="Total no controle" valor={contasAPagar.length} icone={Fuel} />
            </div>
            <ListaContas despesas={contasAPagar} editarDespesa={editarDespesa} setDespesas={setDespesas} todasDespesas={despesas} />
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

function ListaViagens({ viagens, apagarViagem }) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <h2 className="text-2xl font-black mb-4">Viagens cadastradas</h2>
      <div className="overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-400">
            <tr>
              <th className="pb-3">Data</th>
              <th className="pb-3">Cliente</th>
              <th className="pb-3">Caminhão</th>
              <th className="pb-3">Origem</th>
              <th className="pb-3">Destino</th>
              <th className="pb-3">Frete</th>
              <th className="pb-3">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {viagens.map((v) => (
              <tr key={v.id} className="border-t border-zinc-800">
                <td className="py-4">{formatarData(v.data)}</td>
                <td>{v.cliente || "-"}</td>
                <td>{v.caminhao || "-"}</td>
                <td>{v.origem}</td>
                <td>{v.destino}</td>
                <td>{moeda(v.frete)}</td>
                <td>{v.status}</td>
                <td><button onClick={() => apagarViagem(v.id)} className="text-red-400"><Trash2 size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


function ListaDespesas({ despesas, apagarDespesa, editarDespesa }) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <h2 className="text-2xl font-black mb-4">Abastecimentos e despesas cadastradas</h2>
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




function ListaContas({ despesas, editarDespesa, setDespesas, todasDespesas }) {
  const marcarComoPago = (despesa) => {
    const dataPagamento = prompt("Informe a data de pagamento no formato AAAA-MM-DD:", hojeISO());
    if (!dataPagamento) return;

    setDespesas(todasDespesas.map((d) =>
      d.id === despesa.id
        ? { ...d, statusPagamento: "Pago", dataPagamento, formaPagamento: normalizarFormaPagamento(d.formaPagamento) }
        : d
    ));
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <h2 className="text-2xl font-black mb-4">Contas a pagar por data</h2>
      <div className="overflow-auto">
        <table className="w-full min-w-[1200px] text-left text-sm border-separate border-spacing-y-3">
          <thead className="text-zinc-400">
            <tr>
              <th className="px-4 pb-2">Status</th>
              <th className="px-4 pb-2">Vencimento</th>
              <th className="px-4 pb-2">Data pagamento</th>
              <th className="px-4 pb-2">Data lançamento</th>
              <th className="px-4 pb-2">Empresa/cliente a pagar</th>
              <th className="px-4 pb-2">Caminhão</th>
              <th className="px-4 pb-2">Tipo</th>
              <th className="px-4 pb-2">Forma de pagamento</th>
              <th className="px-4 pb-2">Total</th>
              <th className="px-4 pb-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((d) => {
              const status = statusConta(d);
              return (
                <tr key={d.id} className="bg-zinc-950">
                  <td className="px-4 py-4 rounded-l-2xl whitespace-nowrap">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      status === "Pago" ? "bg-green-700" : status === "Atrasada" ? "bg-red-700" : "bg-yellow-700"
                    }`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{formatarData(d.dataVencimento)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{formatarData(d.dataPagamento)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{formatarData(d.data)}</td>
                  <td className="px-4 py-4 font-bold whitespace-nowrap">{d.responsavelPagamento || "-"}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{d.caminhao || "-"}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{d.tipo}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{normalizarFormaPagamento(d.formaPagamento)}</td>
                  <td className="px-4 py-4 text-red-400 font-bold whitespace-nowrap">{moeda(d.valor)}</td>
                  <td className="px-4 py-4 rounded-r-2xl whitespace-nowrap">
                    <div className="flex gap-2">
                      {status !== "Pago" && (
                        <button onClick={() => marcarComoPago(d)} className="bg-green-700 hover:bg-green-800 rounded-xl px-3 py-2 font-bold">
                          Marcar pago
                        </button>
                      )}
                      <button onClick={() => editarDespesa(d)} className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-3 py-2 font-bold inline-flex items-center gap-2">
                        <Pencil size={16} /> Editar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
