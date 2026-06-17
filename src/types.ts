export interface Invoice {
  id: string;
  condominio: string;
  empresa: string;
  numeroNota: string;
  emissao: string;
  valorTotal: number;
  iss: number;
  inss: number;
  ir: number;
  operador: string;
  dataHora: string;
}

export type WindowType = 'LANCAR_NOTA' | 'GERENCIAR_EMPRESAS' | 'GERENCIAR_CONDOMINIOS' | 'AUDITORIA';

export const initialInvoices: Invoice[] = [
  {
    id: '1',
    condominio: 'Condomínio Reserva das Flores',
    empresa: '12.345.678/0001-90 - Tech Limpeza Ltda',
    numeroNota: '0019283',
    emissao: '2026-06-10',
    valorTotal: 2500.00,
    iss: 125.00,
    inss: 275.00,
    ir: 37.50,
    operador: 'Vinícius',
    dataHora: '2026-06-10 14:30'
  },
  {
    id: '2',
    condominio: 'Edifício Central Plaza',
    empresa: '98.765.432/0001-10 - Manutenção Já ME',
    numeroNota: '005411',
    emissao: '2026-06-11',
    valorTotal: 890.00,
    iss: 44.50,
    inss: 0,
    ir: 0,
    operador: 'Vinícius',
    dataHora: '2026-06-11 09:15'
  },
  {
    id: '3',
    condominio: 'Residencial Vida Nova',
    empresa: '45.123.890/0001-55 - Jardim Serviços',
    numeroNota: '000102',
    emissao: '2026-06-12',
    valorTotal: 1200.00,
    iss: 60.00,
    inss: 132.00,
    ir: 0,
    operador: 'Maria',
    dataHora: '2026-06-12 11:45'
  }
];
