import React, { useEffect, useMemo, useState } from "react";
import { Truck, Route, Wallet, Fuel, Plus, Trash2, Save } from "lucide-react";

const moeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const numero = (valor) => Number(String(valor || "0").replace(",", "."));

const dadosIniciais = {
  caminhoes: [
    { id: crypto.randomUUID(), placa: "ATR-0001", modelo: "Scania Basculante", motorista: "Motorista 1" },
    { id: crypto.randomUUID(), placa: "ATR-0002", modelo: "Volvo FH", motorista: "Motorista 2" },
    { id: crypto.randomUUID(), placa: "ATR-0003", modelo: "Mercedes Actros", motorista: "Motorista 3" },
  ],
  viagens: [
    {
      id: crypto.randomUUID(),
      data: "2026-05-17",
      caminhao: "ATR-0001",
      origem: "Criciúma/SC",
      destino: "Porto Alegre/RS",
      cliente: "Cliente exemplo",
      frete: 7200,
      diesel: 2100,
      pedagio: 450,
      motorista: 800,
      outros: 300,
      status: "Finalizada",
    },
  ],
};

export default function App() {
  const [aba, setAba] = useState("dashboard");
  const [caminhoes, setCaminhoes] = useState([]);
  const [viagens, setViagens] = useState([]);
  const [caminhaoForm, setCaminhaoForm] = useState({ placa: "", modelo: "", motorista: "" });
  const [viagemForm, setViagemForm] = useState({
    data: "",
    caminhao: "",
    origem: "",
    destino: "",
    cliente: "",
    frete: "",
    diesel: "",
    pedagio: "",
    motorista: "",
    outros: "",
    status: "Programada",
  });

  useEffect(() => {
    const salvo = localStorage.getItem("atr-minhocao-v2");
    if (salvo) {
      const dados = JSON.parse(salvo);
      setCaminhoes(dados.caminhoes || []);
      setViagens(dados.viagens || []);
    } else {
      setCaminhoes(dadosIniciais.caminhoes);
      setViagens(dadosIniciais.viagens);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("atr-minhocao-v2", JSON.stringify({ caminhoes, viagens }));
  }, [caminhoes, viagens]);

  const totais = useMemo(() => {
    const frete = viagens.reduce((s, v) => s + numero(v.frete), 0);
    const despesas = viagens.reduce((s, v) => s + numero(v.diesel) + numero(v.pedagio) + numero(v.motorista) + numero(v.outros), 0);
    return { frete, despesas, lucro: frete - despesas };
  }, [viagens]);

  const adicionarCaminhao = () => {
    if (!caminhaoForm.placa) return alert("Informe a placa do caminhão.");
    setCaminhoes([...caminhoes, { id: crypto.randomUUID(), ...caminhaoForm }]);
    setCaminhaoForm({ placa: "", modelo: "", motorista: "" });
  };

  const adicionarViagem = () => {
    if (!viagemForm.origem || !viagemForm.destino || !viagemForm.frete) {
      return alert("Informe pelo menos origem, destino e valor do frete.");
    }
    setViagens([...viagens, { id: crypto.randomUUID(), ...viagemForm }]);
    setViagemForm({
      data: "",
      caminhao: "",
      origem: "",
      destino: "",
      cliente: "",
      frete: "",
      diesel: "",
      pedagio: "",
      motorista: "",
      outros: "",
      status: "Programada",
    });
  };

  const apagarViagem = (id) => setViagens(viagens.filter((v) => v.id !== id));
  const apagarCaminhao = (id) => setCaminhoes(caminhoes.filter((c) => c.id !== id));

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto p-5">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-red-500">ATR MINHOCÃO</h1>
            <p className="text-zinc-400">Sistema editável de gestão de transportes</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["dashboard", "caminhoes", "viagens"].map((item) => (
              <button
                key={item}
                onClick={() => setAba(item)}
                className={`px-5 py-3 rounded-2xl font-bold ${
                  aba === item ? "bg-red-600" : "bg-zinc-900 border border-zinc-800"
                }`}
              >
                {item === "dashboard" ? "Dashboard" : item === "caminhoes" ? "Caminhões" : "Viagens"}
              </button>
            ))}
          </div>
        </header>

        {aba === "dashboard" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card titulo="Caminhões" valor={caminhoes.length} icone={Truck} />
              <Card titulo="Viagens" valor={viagens.length} icone={Route} />
              <Card titulo="Fretes" valor={moeda(totais.frete)} icone={Wallet} />
              <Card titulo="Lucro" valor={moeda(totais.lucro)} icone={Fuel} destaque />
            </div>
            <ListaViagens viagens={viagens} apagarViagem={apagarViagem} />
          </div>
        )}

        {aba === "caminhoes" && (
          <div className="grid md:grid-cols-3 gap-5">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Novo caminhão</h2>
              <Input label="Placa" value={caminhaoForm.placa} onChange={(v) => setCaminhaoForm({ ...caminhaoForm, placa: v })} />
              <Input label="Modelo" value={caminhaoForm.modelo} onChange={(v) => setCaminhaoForm({ ...caminhaoForm, modelo: v })} />
              <Input label="Motorista" value={caminhaoForm.motorista} onChange={(v) => setCaminhaoForm({ ...caminhaoForm, motorista: v })} />
              <button onClick={adicionarCaminhao} className="w-full mt-3 bg-red-600 hover:bg-red-700 rounded-2xl p-3 font-bold flex items-center justify-center gap-2">
                <Plus size={18} /> Adicionar
              </button>
            </section>

            <section className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <h2 className="text-2xl font-black mb-4">Frota cadastrada</h2>
              <div className="space-y-3">
                {caminhoes.map((c) => (
                  <div key={c.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between gap-3">
                    <div>
                      <p className="font-black text-lg">{c.placa}</p>
                      <p className="text-zinc-400">{c.modelo}</p>
                      <p className="text-zinc-400">Motorista: {c.motorista}</p>
                    </div>
                    <button onClick={() => apagarCaminhao(c.id)} className="text-red-400"><Trash2 /></button>
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
              <div className="grid md:grid-cols-4 gap-3">
                <Input label="Data" type="date" value={viagemForm.data} onChange={(v) => setViagemForm({ ...viagemForm, data: v })} />
                <Select label="Caminhão" value={viagemForm.caminhao} onChange={(v) => setViagemForm({ ...viagemForm, caminhao: v })} options={caminhoes.map(c => c.placa)} />
                <Input label="Origem" value={viagemForm.origem} onChange={(v) => setViagemForm({ ...viagemForm, origem: v })} />
                <Input label="Destino" value={viagemForm.destino} onChange={(v) => setViagemForm({ ...viagemForm, destino: v })} />
                <Input label="Cliente" value={viagemForm.cliente} onChange={(v) => setViagemForm({ ...viagemForm, cliente: v })} />
                <Input label="Frete R$" value={viagemForm.frete} onChange={(v) => setViagemForm({ ...viagemForm, frete: v })} />
                <Input label="Diesel R$" value={viagemForm.diesel} onChange={(v) => setViagemForm({ ...viagemForm, diesel: v })} />
                <Input label="Pedágio R$" value={viagemForm.pedagio} onChange={(v) => setViagemForm({ ...viagemForm, pedagio: v })} />
                <Input label="Motorista R$" value={viagemForm.motorista} onChange={(v) => setViagemForm({ ...viagemForm, motorista: v })} />
                <Input label="Outros R$" value={viagemForm.outros} onChange={(v) => setViagemForm({ ...viagemForm, outros: v })} />
                <Select label="Status" value={viagemForm.status} onChange={(v) => setViagemForm({ ...viagemForm, status: v })} options={["Programada", "Em andamento", "Finalizada"]} />
              </div>
              <button onClick={adicionarViagem} className="mt-4 bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-3 font-bold flex items-center gap-2">
                <Save size={18} /> Salvar viagem
              </button>
            </section>

            <ListaViagens viagens={viagens} apagarViagem={apagarViagem} />
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

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block mb-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 outline-none focus:border-red-500"
      />
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
        {options.map((op) => (
          <option key={op} value={op}>{op}</option>
        ))}
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
              <th className="pb-3">Caminhão</th>
              <th className="pb-3">Origem</th>
              <th className="pb-3">Destino</th>
              <th className="pb-3">Frete</th>
              <th className="pb-3">Despesas</th>
              <th className="pb-3">Lucro</th>
              <th className="pb-3">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {viagens.map((v) => {
              const despesas = numero(v.diesel) + numero(v.pedagio) + numero(v.motorista) + numero(v.outros);
              const lucro = numero(v.frete) - despesas;
              return (
                <tr key={v.id} className="border-t border-zinc-800">
                  <td className="py-4">{v.data || "-"}</td>
                  <td>{v.caminhao || "-"}</td>
                  <td>{v.origem}</td>
                  <td>{v.destino}</td>
                  <td>{moeda(v.frete)}</td>
                  <td>{moeda(despesas)}</td>
                  <td className="font-bold text-red-400">{moeda(lucro)}</td>
                  <td>{v.status}</td>
                  <td><button onClick={() => apagarViagem(v.id)} className="text-red-400"><Trash2 size={18} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
