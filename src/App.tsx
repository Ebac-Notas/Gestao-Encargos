import { useState, useEffect } from 'react';
import { initialInvoices, Invoice, WindowType } from './types';
import { DraggableWindow } from './components/DraggableWindow';
import { PlusCircle, Building2, Home, FileClock } from 'lucide-react';

export default function App() {
  const [operator, setOperator] = useState(() => {
    return localStorage.getItem('operator') || 'Vinícius';
  });
  
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [openWindows, setOpenWindows] = useState<WindowType[]>([]);

  useEffect(() => {
    localStorage.setItem('operator', operator);
  }, [operator]);

  const toggleWindow = (type: WindowType) => {
    if (!openWindows.includes(type)) {
      setOpenWindows([...openWindows, type]);
    }
  };

  const closeWindow = (type: WindowType) => {
    setOpenWindows(openWindows.filter(w => w !== type));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 font-sans relative">
      {/* Top Bar */}
      <header className="h-14 bg-slate-800 flex items-center justify-between px-6 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">F</div>
          <h1 className="text-white font-semibold text-lg tracking-tight uppercase">Gestão de Notas Fiscais</h1>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-slate-400 text-xs font-medium uppercase">Operador:</label>
          <input 
            type="text" 
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="bg-slate-700 text-white text-sm border border-slate-600 rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 w-40"
            placeholder="Ex: Vinícius"
          />
        </div>
      </header>
        
      {/* Actions Toolbar */}
      <nav className="h-16 bg-white border-b border-slate-300 flex items-center px-6 gap-3 shrink-0 shadow-sm">
        <button 
          onClick={() => toggleWindow('LANCAR_NOTA')}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-bold shadow-sm transition-colors focus:outline-none"
        >
          <PlusCircle size={16} />
          LANÇAR NOTA FISCAL
        </button>
        
        <button 
          onClick={() => toggleWindow('GERENCIAR_EMPRESAS')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold shadow-sm transition-colors focus:outline-none"
        >
          <Building2 size={16} />
          GERENCIAR EMPRESAS
        </button>
        
        <button 
          onClick={() => toggleWindow('GERENCIAR_CONDOMINIOS')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold shadow-sm transition-colors focus:outline-none"
        >
          <Home size={16} />
          GERENCIAR CONDOMÍNIOS
        </button>
        
        <button 
          onClick={() => toggleWindow('AUDITORIA')}
          className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm font-bold shadow-sm transition-colors focus:outline-none"
        >
          <FileClock size={16} />
          LOG DE AUDITORIA
        </button>
      </nav>

      {/* Main Workspace (DataGrid) */}
      <main className="flex-1 p-4 flex flex-col overflow-hidden">
        <div className="bg-white border border-slate-300 rounded shadow-sm flex flex-col h-full overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-300 flex justify-between items-center px-4 py-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase">DataGrid de Notas Fiscais Emitidas</span>
            <div className="text-[10px] text-slate-400">Visualizando {invoices.length} registros</div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-200 sticky top-0 z-10">
                <tr className="divide-x divide-slate-300">
                  <th className="p-2 font-bold text-slate-700 whitespace-nowrap">Condomínio</th>
                  <th className="p-2 font-bold text-slate-700 whitespace-nowrap">Empresa (CNPJ/Nome)</th>
                  <th className="p-2 font-bold text-slate-700 whitespace-nowrap">Nº Nota</th>
                  <th className="p-2 font-bold text-slate-700 whitespace-nowrap">Emissão</th>
                  <th className="p-2 font-bold text-slate-700 whitespace-nowrap text-right">Valor Total</th>
                  <th className="p-2 font-bold text-slate-700 whitespace-nowrap text-right">ISS</th>
                  <th className="p-2 font-bold text-slate-700 whitespace-nowrap text-right">INSS</th>
                  <th className="p-2 font-bold text-slate-700 whitespace-nowrap text-right">IR</th>
                  <th className="p-2 font-bold text-slate-700 whitespace-nowrap">Operador</th>
                  <th className="p-2 font-bold text-slate-700 whitespace-nowrap">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.length > 0 ? (
                  invoices.map((inv, index) => (
                    <tr key={inv.id} className={`${index % 2 === 0 ? '' : 'bg-slate-50'} hover:bg-blue-50 transition-colors divide-x divide-slate-200`}>
                      <td className="p-2 truncate max-w-xs" title={inv.condominio}>{inv.condominio}</td>
                      <td className="p-2 truncate max-w-sm" title={inv.empresa}>{inv.empresa}</td>
                      <td className="p-2 font-mono">{inv.numeroNota}</td>
                      <td className="p-2">{new Date(inv.emissao).toLocaleDateString('pt-BR')}</td>
                      <td className="p-2 text-right font-mono font-semibold text-blue-700">{formatCurrency(inv.valorTotal)}</td>
                      <td className="p-2 text-right font-mono text-red-600">{formatCurrency(inv.iss)}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(inv.inss)}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(inv.ir)}</td>
                      <td className="p-2"><span className={`bg-slate-100 px-1.5 py-0.5 rounded ${inv.operador === operator ? 'text-blue-600 font-medium' : ''}`}>{inv.operador}</span></td>
                      <td className="p-2 text-slate-500">{inv.dataHora}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 italic">Nenhuma nota fiscal lançada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="bg-slate-100 h-8 flex items-center px-4 shrink-0 border-t border-slate-300 text-[10px] text-slate-500 font-medium z-10">
            <div className="flex gap-4">
              <span>PRONTO PARA ENVIAR</span>
              <span>|</span>
              <span>SERVIDOR: LOCAL-SQL-01</span>
              <span>|</span>
              <span>ESTADO: CONECTADO</span>
            </div>
          </footer>
        </div>
      </main>

      {/* Floating Windows Area */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {openWindows.includes('LANCAR_NOTA') && (
          <DraggableWindow title="UserForm - Novo Lançamento de NF" onClose={() => closeWindow('LANCAR_NOTA')} defaultPosition={{ x: 100, y: 100 }} width="400px" height="auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nº da Nota</label>
                <input type="text" defaultValue="000.457" className="border border-slate-300 p-1.5 text-sm bg-slate-50" readOnly />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Data Emissão</label>
                <input type="text" defaultValue="14/10/2026" className="border border-slate-300 p-1.5 text-sm bg-slate-50" readOnly />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Condomínio</label>
              <select className="border border-slate-300 p-1.5 text-sm bg-white">
                <option>Residencial Aurora</option>
                <option>Cond. Mirante Sul</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Valor Total (R$)</label>
              <input type="text" placeholder="0,00" className="border border-slate-300 p-1.5 text-sm bg-white" />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => closeWindow('LANCAR_NOTA')} className="px-4 py-1.5 bg-slate-200 text-xs font-bold rounded border border-slate-300 hover:bg-slate-300 transition-colors">CANCELAR</button>
              <button className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded shadow-sm hover:bg-emerald-700 transition-colors">CONFIRMAR (F5)</button>
            </div>
          </DraggableWindow>
        )}

        {openWindows.includes('GERENCIAR_EMPRESAS') && (
          <DraggableWindow title="UserForm - Cadastro de Empresas" onClose={() => closeWindow('GERENCIAR_EMPRESAS')} defaultPosition={{ x: 150, y: 120 }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Lista de Fornecedores</div>
            <p className="text-sm text-slate-700 border border-slate-300 p-3 bg-slate-50 block">
              Grid de empresas cadastradas com opções de adicionar, editar e inativar.
            </p>
          </DraggableWindow>
        )}

        {openWindows.includes('GERENCIAR_CONDOMINIOS') && (
          <DraggableWindow title="UserForm - Cadastro de Condomínios" onClose={() => closeWindow('GERENCIAR_CONDOMINIOS')} defaultPosition={{ x: 200, y: 140 }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Gestão de Clientes</div>
            <p className="text-sm text-slate-700 border border-slate-300 p-3 bg-slate-50 block">
              Grid de condomínios com dados de gestão, síndico e faturamento atrelado.
            </p>
          </DraggableWindow>
        )}

        {openWindows.includes('AUDITORIA') && (
          <DraggableWindow title="UserForm - System Audit" onClose={() => closeWindow('AUDITORIA')} defaultPosition={{ x: 250, y: 160 }} width="700px">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Rastreabilidade</div>
            <ul className="text-xs text-slate-700 font-mono bg-slate-50 border border-slate-300 flex flex-col">
              <li className="border-b border-slate-200 p-2">2026-06-13 10:45:01 - Vinícius acessou o sistema.</li>
              <li className="border-b border-slate-200 p-2">2026-06-13 10:46:12 - Vinícius lançou NF #005411.</li>
              <li className="p-2">2026-06-13 10:48:28 - Operador alterado para Vinícius.</li>
            </ul>
          </DraggableWindow>
        )}
      </div>
    </div>
  );
}

