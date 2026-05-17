import React, { useEffect, useMemo, useState } from "react";
import { Truck, Route, Wallet, Fuel, Plus, Trash2, Save, LogOut, User, Lock, Droplets, Gauge, Building2, Filter } from "lucide-react";

const moeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const numero = (valor) => Number(String(valor || "0").replace(",", "."));

const dadosIniciais = {
  usuarios: [
    { id: "1", nome: "Administrador", usuario: "admin", senha: "1234", perfil: "Administrador" },
  ],
  clientes: [
    { id: crypto.randomUUID(), nome: "Cliente exemplo", contato: "", telefone: "", cidade: "Criciúma/SC" },
  ],
  caminhoes: [
    { id: crypto.randomUUID(), placa: "ATR-0001", modelo: "Scania Basculante", motorista: "Motorista 1" },
    { id: crypto.randomUUID(), placa: "ATR-0002", modelo: "Volvo FH", motorista: "Motorista 2" },
    { id: crypto.randomUUID(), placa: "ATR-0003", modelo: "Mercedes Actros", motorista: "Motorista 3" },
  ],
  viagens: [],
  despesas: [],
};

export default function App() {
  const [aba, setAba] = useState("dashboard");
  const [logado, setLogado] = useState(null);

  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [caminhoes, setCaminhoes] = useState([]);
  const [viagens, setViagens] = useState([]);
  const [despesas, setDespesas] = useState([]);

  const [loginForm, setLoginForm] = useState({ usuario: "", senha: "" });
  const [filtros, setFiltros] = useState({ cliente: "", caminhao: "" });

  const [usuarioForm, setUsuarioForm] = useState({ nome: "", usuario: "", senha: "", perfil: "Operacional" });
  const [clienteForm, setClienteForm] = useState({ nome: "", contato: "", telefone: "", cidade: "" });
  const [caminhaoForm, setCaminhaoForm] = useState({ placa: "", modelo: "", motorista: "" });

  const [viagemForm, setViagemForm] = useState({
    data: "",
    caminhao: "",
    origem: "",
    destino: "",
    cliente: "",
    frete: "",
    status: "Programada",
  });

  const [despesaForm, setDespesaForm] = useState({
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
    responsavelPagamento: "",
    descricao: "",
    valor: "",
    statusPagamento: "Pago",
  });

  useEffect(() => {
    const salvo = localStorage.getItem("atr-minhocao-v4");
    const sessao = localStorage.getItem("atr-minhocao-login");

    if (salvo) {
      const dados = JSON.parse(salvo);
      setUsuarios(dados.usuarios || dadosIniciais.usuarios);
      setClientes(dados.clientes || []);
      setCaminhoes(dados.caminhoes || dadosIniciais.caminhoes);
      setViagens(dados.viagens || []);
      setDespesas(dados.despesas || []);
    } else {
      setUsuarios(dadosIniciais.usuarios);
      setClientes(dadosIniciais.clientes);
      setCaminhoes(dadosIniciais.caminhoes);
      setViagens(dadosIniciais.viagens);
      setDespesas(dadosIniciais.despesas);
    }

    if (sessao) setLogado(JSON.parse(sessao));
  }, []);

  useEffect(() => {
    localStorage.setItem("atr-minhocao-v4", JSON.stringify({ usuarios, clientes, caminhoes, viagens, despesas }));
  }, [usuarios, clientes, caminhoes, viagens, despesas]);

  const viagensFiltradas = useMemo(() => {
    return viagens.filter((v) => {
      const okCliente = !filtros.cliente || v.cliente === filtros.cliente;
      const okCaminhao = !filtros.caminhao || v.caminhao === filtros.caminhao;
      return okCliente && okCaminhao;
    });
  }, [viagens, filtros]);

  const totais = useMemo(() => {
    const frete = viagensFiltradas.reduce((s, v) => s + numero(v.frete), 0);
    const despesasTotal = despesas.reduce((s, d) => s + numero(d.valor), 0);
    const litros = despesas.reduce((s, d) => s + numero(d.litros), 0);
    const pendente = despesas.filter(d => d.statusPagamento === "A prazo" || d.statusPagamento === "Pendente").reduce((s, d) => s + numero(d.valor), 0);
    return { frete, despesasTotal, lucro: frete - despesasTotal, litros, pendente };
  }, [viagensFiltradas, despesas]);

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

  const adicionarCliente = () => {
    if (!clienteForm.nome) return alert("Informe o nome do cliente.");
    if (clientes.some((c) => c.nome.toLowerCase() === clienteForm.nome.toLowerCase())) return alert("Esse cliente já existe.");
    setClientes([...clientes, { id: crypto.randomUUID(), ...clienteForm }]);
    setClienteForm({ nome: "", contato: "", telefone: "", cidade: "" });
  };

  const adicionarCaminhao = () => {
    if (!caminhaoForm.placa) return alert("Informe a placa do caminhão.");
    setCaminhoes([...caminhoes, { id: crypto.randomUUID(), ...caminhaoForm }]);
    setCaminhaoForm({ placa: "", modelo: "", motorista: "" });
  };

  const adicionarViagem = () => {
    if (!viagemForm.origem || !viagemForm.destino || !viagemForm.frete || !viagemForm.cliente) {
      return alert("Informe cliente, origem, destino e frete.");
    }
    setViagens([...viagens, { id: crypto.randomUUID(), ...viagemForm }]);
    setViagemForm({ data: "", caminhao: "", origem: "", destino: "", cliente: "", frete: "", status: "Programada" });
  };

  const adicionarDespesa = () => {
    if (!despesaForm.data || !despesaForm.caminhao || !despesaForm.tipo) return alert("Informe data, caminhão e tipo da despesa.");

    let valorFinal = numero(despesaForm.valor);

    if (despesaForm.tipo === "Combustível") {
      if (!despesaForm.litros || !despesaForm.valorLitro || !despesaForm.kmPainel) {
        return alert("Para combustível, informe litros, valor por litro e KM do painel.");
      }
      valorFinal = numero(despesaForm.litros) * numero(despesaForm.valorLitro);
    }

    if (despesaForm.statusPagamento === "A prazo" && !despesaForm.pagamentoPrazoComo) {
      return alert("Informe como o pagamento a prazo será quitado/descontado.");
    }

    setDespesas([...despesas, { id: crypto.randomUUID(), ...despesaForm, valor: valorFinal }]);

    setDespesaForm({
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
      responsavelPagamento: "",
      descricao: "",
      valor: "",
      statusPagamento: "Pago",
    });
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
    { id: "clientes", nome: "Clientes" },
    { id: "caminhoes", nome: "Caminhões" },
    { id: "viagens", nome: "Viagens" },
    { id: "despesas", nome: "Abastecimentos/Despesas" },
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
              <Card titulo="A prazo/pendente" valor={moeda(totais.pendente)} icone={Wallet} destaque />
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
              <h2 className="text-2xl font-black mb-4">Novo cliente</h2>
              <Input label="Nome do cliente/empresa" value={clienteForm.nome} onChange={(v) => setClienteForm({ ...clienteForm, nome: v })} icon={Building2} />
              <Input label="Contato" value={clienteForm.contato} onChange={(v) => setClienteForm({ ...clienteForm, contato: v })} />
              <Input label="Telefone" value={clienteForm.telefone} onChange={(v) => setClienteForm({ ...clienteForm, telefone: v })} />
              <Input label="Cidade/UF" value={clienteForm.cidade} onChange={(v) => setClienteForm({ ...clienteForm, cidade: v })} />
              <button onClick={adicionarCliente} className="w-full mt-3 bg-red-600 hover:bg-red-700 rounded-2xl p-3 font-bold flex items-center justify-center gap-2"><Plus size={18} /> Adicionar cliente</button>
            </section>

            <section className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Clientes cadastrados</h2>
              <div className="space-y-3">
                {clientes.map((c) => (
                  <div key={c.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between">
                    <div>
                      <p className="font-black text-lg">{c.nome}</p>
                      <p className="text-zinc-400">Contato: {c.contato || "-"}</p>
                      <p className="text-zinc-400">Telefone: {c.telefone || "-"}</p>
                      <p className="text-zinc-400">Cidade: {c.cidade || "-"}</p>
                    </div>
                    <button onClick={() => setClientes(clientes.filter(item => item.id !== c.id))} className="text-red-400"><Trash2 /></button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {aba === "caminhoes" && (
          <div className="grid md:grid-cols-3 gap-5">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Novo caminhão</h2>
              <Input label="Placa" value={caminhaoForm.placa} onChange={(v) => setCaminhaoForm({ ...caminhaoForm, placa: v })} />
              <Input label="Modelo" value={caminhaoForm.modelo} onChange={(v) => setCaminhaoForm({ ...caminhaoForm, modelo: v })} />
              <Input label="Motorista" value={caminhaoForm.motorista} onChange={(v) => setCaminhaoForm({ ...caminhaoForm, motorista: v })} />
              <button onClick={adicionarCaminhao} className="w-full mt-3 bg-red-600 hover:bg-red-700 rounded-2xl p-3 font-bold flex items-center justify-center gap-2"><Plus size={18} /> Adicionar</button>
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
                    <button onClick={() => setCaminhoes(caminhoes.filter(item => item.id !== c.id))} className="text-red-400"><Trash2 /></button>
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
              <p className="text-zinc-400 mb-4">O diesel foi removido daqui. Abastecimentos são lançados na aba de despesas por caminhão.</p>
              <div className="grid md:grid-cols-4 gap-3">
                <Input label="Data" type="date" value={viagemForm.data} onChange={(v) => setViagemForm({ ...viagemForm, data: v })} />
                <Select label="Cliente" value={viagemForm.cliente} onChange={(v) => setViagemForm({ ...viagemForm, cliente: v })} options={clientes.map(c => c.nome)} />
                <Select label="Caminhão" value={viagemForm.caminhao} onChange={(v) => setViagemForm({ ...viagemForm, caminhao: v })} options={caminhoes.map(c => c.placa)} />
                <Input label="Origem" value={viagemForm.origem} onChange={(v) => setViagemForm({ ...viagemForm, origem: v })} />
                <Input label="Destino" value={viagemForm.destino} onChange={(v) => setViagemForm({ ...viagemForm, destino: v })} />
                <Input label="Frete R$" value={viagemForm.frete} onChange={(v) => setViagemForm({ ...viagemForm, frete: v })} />
                <Select label="Status" value={viagemForm.status} onChange={(v) => setViagemForm({ ...viagemForm, status: v })} options={["Programada", "Em andamento", "Finalizada"]} />
              </div>
              <button onClick={adicionarViagem} className="mt-4 bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-3 font-bold flex items-center gap-2"><Save size={18} /> Salvar viagem</button>
            </section>

            <ListaViagens viagens={viagens} apagarViagem={(id) => setViagens(viagens.filter(v => v.id !== id))} />
          </div>
        )}

        {aba === "despesas" && (
          <div className="space-y-5">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-1">Novo abastecimento/despesa por caminhão</h2>
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
                <Select label="Forma de pagamento" value={despesaForm.formaPagamento} onChange={(v) => setDespesaForm({ ...despesaForm, formaPagamento: v })} options={["Dinheiro", "Pix", "Cartão", "Boleto", "A prazo", "Desconto por empresa", "Outro"]} />

                {despesaForm.statusPagamento === "A prazo" || despesaForm.formaPagamento === "A prazo" || despesaForm.formaPagamento === "Desconto por empresa" ? (
                  <>
                    <Select label="Como será pago/descontado?" value={despesaForm.pagamentoPrazoComo} onChange={(v) => setDespesaForm({ ...despesaForm, pagamentoPrazoComo: v })} options={["Pagar depois ao posto/fornecedor", "Descontar da empresa/cliente", "Descontar de acerto do motorista", "Boleto/fatura mensal", "Outro"]} />
                    <Input label="Empresa responsável pelo desconto/pagamento" value={despesaForm.responsavelPagamento} onChange={(v) => setDespesaForm({ ...despesaForm, responsavelPagamento: v })} />
                    <Input label="Data de vencimento/previsão" type="date" value={despesaForm.dataVencimento} onChange={(v) => setDespesaForm({ ...despesaForm, dataVencimento: v })} />
                  </>
                ) : null}

                <Input label="Observação" value={despesaForm.descricao} onChange={(v) => setDespesaForm({ ...despesaForm, descricao: v })} />
              </div>

              <button onClick={adicionarDespesa} className="mt-4 bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-3 font-bold flex items-center gap-2"><Save size={18} /> Salvar lançamento</button>
            </section>

            <ListaDespesas despesas={despesas} apagarDespesa={(id) => setDespesas(despesas.filter(d => d.id !== id))} />
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
                <td className="py-4">{v.data || "-"}</td>
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

function ListaDespesas({ despesas, apagarDespesa }) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <h2 className="text-2xl font-black mb-4">Abastecimentos e despesas cadastradas</h2>
      <div className="overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-400">
            <tr>
              <th className="pb-3">Data</th>
              <th className="pb-3">Caminhão</th>
              <th className="pb-3">Tipo</th>
              <th className="pb-3">Posto/empresa</th>
              <th className="pb-3">Litros</th>
              <th className="pb-3">Valor/L</th>
              <th className="pb-3">KM painel</th>
              <th className="pb-3">Pagamento</th>
              <th className="pb-3">Como será pago</th>
              <th className="pb-3">Responsável</th>
              <th className="pb-3">Vencimento</th>
              <th className="pb-3">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((d) => (
              <tr key={d.id} className="border-t border-zinc-800">
                <td className="py-4">{d.data || "-"}</td>
                <td>{d.caminhao || "-"}</td>
                <td>{d.tipo}</td>
                <td>{d.postoEmpresa || "-"}</td>
                <td>{d.litros ? `${numero(d.litros).toLocaleString("pt-BR")} L` : "-"}</td>
                <td>{d.valorLitro ? moeda(d.valorLitro) : "-"}</td>
                <td>{d.kmPainel || "-"}</td>
                <td>{d.statusPagamento} / {d.formaPagamento}</td>
                <td>{d.pagamentoPrazoComo || "-"}</td>
                <td>{d.responsavelPagamento || "-"}</td>
                <td>{d.dataVencimento || "-"}</td>
                <td className="text-red-400 font-bold">{moeda(d.valor)}</td>
                <td><button onClick={() => apagarDespesa(d.id)} className="text-red-400"><Trash2 size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
