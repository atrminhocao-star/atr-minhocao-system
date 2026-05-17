
import React from "react";
import { Truck, Route, Wallet, Wrench } from "lucide-react";
import { motion } from "framer-motion";

const cards = [
  { title: "Caminhões", value: "3", icon: Truck },
  { title: "Viagens", value: "12", icon: Route },
  { title: "Lucro Mensal", value: "R$ 18.420", icon: Wallet },
  { title: "Manutenções", value: "2", icon: Wrench },
];

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-5xl font-black text-red-500">
                ATR MINHOCÃO
              </h1>
              <p className="text-zinc-400 mt-2">
                Sistema de gestão de transportes
              </p>
            </div>

            <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-2xl font-bold">
              Nova Viagem
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-5 mb-10">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400">{card.title}</p>
                      <h2 className="text-3xl font-black mt-2">
                        {card.value}
                      </h2>
                    </div>

                    <Icon className="text-red-500" size={38} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h2 className="text-2xl font-black mb-5">
              Viagens Recentes
            </h2>

            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead className="text-zinc-400">
                  <tr>
                    <th className="pb-4">Origem</th>
                    <th className="pb-4">Destino</th>
                    <th className="pb-4">Frete</th>
                    <th className="pb-4">Lucro</th>
                    <th className="pb-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-t border-zinc-800">
                    <td className="py-4">Criciúma/SC</td>
                    <td>Porto Alegre/RS</td>
                    <td>R$ 7.200</td>
                    <td className="text-red-400 font-bold">R$ 3.900</td>
                    <td>Finalizada</td>
                  </tr>

                  <tr className="border-t border-zinc-800">
                    <td className="py-4">Içara/SC</td>
                    <td>Curitiba/PR</td>
                    <td>R$ 6.500</td>
                    <td className="text-red-400 font-bold">R$ 3.100</td>
                    <td>Em andamento</td>
                  </tr>

                  <tr className="border-t border-zinc-800">
                    <td className="py-4">Tubarão/SC</td>
                    <td>Joinville/SC</td>
                    <td>R$ 5.800</td>
                    <td className="text-red-400 font-bold">R$ 2.840</td>
                    <td>Programada</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
