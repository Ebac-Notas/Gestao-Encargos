import { supabase } from "./supabaseClient.js";
import { formatMoney, mascararCNPJ, parseMoney, titleCase } from "./calculosImpostos.js";

// Utility date formatting
export function formatDateTime(date) {
  if (!(date instanceof Date) || isNaN(date)) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${d}/${m}/${y} ${h}:${mi}:${s}`;
}

// --- 0. TOAST NOTIFICATION SYSTEM ---
export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");

  let bgColor = "bg-blue-600",
    icon = "info";
  if (type === "success") {
    bgColor = "bg-emerald-600";
    icon = "check_circle";
  }
  if (type === "error") {
    bgColor = "bg-red-600";
    icon = "error_outline";
  }
  if (type === "warning") {
    bgColor = "bg-yellow-500 text-slate-900";
    icon = "warning";
  }

  toast.className = `${bgColor} ${type === "warning" ? "text-slate-900" : "text-white"} px-4 py-3 rounded shadow-lg flex items-center gap-3 text-[13px] font-bold opacity-0 transition-opacity duration-300 transform translate-y-2 pointer-events-auto`;
  toast.innerHTML = `<span class="material-symbols-outlined">${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-2");
    toast.classList.add("opacity-100", "translate-y-0");
  });

  setTimeout(() => {
    toast.classList.remove("opacity-100", "translate-y-0");
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// --- SORTS & DATA STATES ---
export function sortGrid(gridName, col) {
  if (gridName === "notes") {
    gridName = "notas";
  }
  let st = window.sortState[gridName];
  if (!st) {
    window.sortState[gridName] = { col: "", asc: true };
    st = window.sortState[gridName];
  }
  if (st.col === col) {
    st.asc = !st.asc;
  } else {
    st.col = col;
    st.asc = true;
  }
  if (gridName === "notas") renderNotas(false);
  if (gridName === "empresas") renderEmpresas(false);
  if (gridName === "cond") renderCondominios(false);
}

export function togglePccCols() {
  let cols = document.querySelectorAll(".col-pcc-det");
  cols.forEach((c) => {
    if (c.classList.contains("hidden")) {
      c.classList.remove("hidden");
    } else {
      c.classList.add("hidden");
    }
  });
}

// --- DATA SYNC ---
export async function sincronizarDados(entidade = "todas", condominioCodigo = null) {
  if (!supabase) return;
  try {
    if (entidade === "todas" || entidade === "condominios") {
      const { data } = await supabase
        .from("condominios")
        .select("*")
        .order("codigo");
      if (data) {
        window.dbCondominios = data.map((c) => ({
          codigo: c.codigo,
          nome: c.razao_social,
          cnpj: c.cnpj,
        }));
      }
    }
    if (entidade === "todas" || entidade === "empresas") {
      const { data } = await supabase
        .from("empresas")
        .select("*")
        .order("razao_social");
      if (data) {
        window.dbEmpresas = data.map((e) => ({
          cnpj: e.cnpj,
          nome: e.razao_social,
          uf: e.UF || e.uf || null,
        }));
      }
    }
    if (entidade === "todas" || entidade === "notas") {
      const refEl = document.getElementById("txtReferencia");
      const refAtual = refEl ? refEl.value : "";
      
      let codCondSelecionado = condominioCodigo;
      if (!codCondSelecionado) {
        const elFlt = document.getElementById("fltCondominio") || 
                      document.getElementById("selCondominio") || 
                      document.getElementById("filtroCondominio") ||
                      document.getElementById("iptCondominioBusca");
        if (elFlt && elFlt.value) {
          codCondSelecionado = elFlt.value;
        }
      }

      let query = supabase
        .from("notas_fiscais")
        .select(
          `
              id,
              condominio_codigo,
              empresa_cnpj,
              numero_nota,
              data_consolidada,
              referencia,
              valor_bruto,
              iss,
              inss,
              ir,
              is_pcc,
              pis_digitado,
              val_pis,
              val_cofins,
              val_csll,
              criado_por,
              created_at,
              outro_municipio,
              cod_servico,
              status_servico,
              conferida,
              condominios(razao_social),
              empresas(razao_social)
          `,
        );

      if (refAtual) {
        query = query.eq("referencia", refAtual);
      }
      if (codCondSelecionado) {
        query = query.eq("condominio_codigo", codCondSelecionado);
      }

      const { data } = await query.order("created_at", { ascending: false });

      if (data) {
        window.dbNotas = data.map((n) => ({
          id: n.id,
          codCond: n.condominio_codigo,
          nomeCond: n.condominios
            ? n.condominios.razao_social
            : "CONDOMÍNIO DESCONHECIDO",
          cnpj: n.empresa_cnpj,
          nomeEmp: n.empresas
            ? n.empresas.razao_social
            : "EMPRESA DESCONHECIDA",
          numNota: n.numero_nota,
          dataCompleta: n.data_consolidada,
          referencia: n.referencia,
          valor: Number(n.valor_bruto),
          iss: Number(n.iss),
          inss: Number(n.inss),
          ir: Number(n.ir),
          pisDigitado: (n.pis_digitado !== null && Number(n.pis_digitado) > 0)
            ? Number(n.pis_digitado)
            : (Number(n.val_pis || 0) + Number(n.val_cofins || 0) + Number(n.val_csll || 0)),
          valPIS: Number(n.val_pis),
          valCOFINS: Number(n.val_cofins),
          valCSLL: Number(n.val_csll),
          operador: n.criado_por,
          dataHora: n.created_at
            ? formatDateTime(new Date(n.created_at))
            : "",
          outroMunicipio: !!n.outro_municipio,
          codServico: n.cod_servico || "",
          statusServico: n.status_servico || "",
          conferida: !!n.conferida,
        }));
        window.notasDoMes = [...window.dbNotas];
      }
    }
    if (entidade === "todas" || entidade === "auditoria") {
      const { data } = await supabase
        .from("logs_auditoria")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        window.dbAuditoria = data.map((l) => ({
          id: l.id,
          dataHora: l.created_at
            ? formatDateTime(new Date(l.created_at))
            : "",
          operador: l.operador,
          acao: l.acao,
          entidade: l.entidade,
          recurso: l.recurso,
          descricao: l.descricao,
          referencia: l.referencia,
        }));
      }
    }
  } catch (e) {
    console.error("Erro na sincronização de dados:", e);
  }
}

export function obterRowHtml(n) {
  let uniqueId = String(n.cnpj) + "|" + String(n.numNota);
  let e = (window.dbEmpresas || []).find(
    (x) => String(x.cnpj) === String(n.cnpj).replace(/[^\d]+/g, ""),
  );
  let displayNomeEmp = e ? e.nome : n.nomeEmp;

  // Dynamic row background for checked notes (using distinct #bbf7d0 green for checked notes)
  let rowBgClass = "hover:bg-blue-50 transition-colors cursor-pointer bg-white";
  let rowStyle = "";
  if (n.conferida) {
    rowBgClass = "hover:bg-green-250 transition-colors cursor-pointer bg-green-100";
    rowStyle = 'style="background-color: #bbf7d0;"';
  }

  // Leftmost column for checkbox
  let colConferirHtml = window.modoConferencia
    ? `<td class="p-2 text-center border-r border-slate-200 bg-slate-100 col-conferir-cell" onclick="event.stopPropagation()">
        <input type="checkbox" class="chk-conferir rounded text-emerald-600 border-slate-300 focus:ring-0 cursor-pointer" data-id="${n.id}">
       </td>`
    : `<td class="col-conferir-cell" style="display: none;"></td>`;

  // Check if PCC columns are detailed/hidden
  let isPccColHidden = document.querySelectorAll(".col-pcc-det.hidden").length > 0;
  let pccHiddenClass = isPccColHidden ? "hidden" : "";

  return `
    <tr class="${rowBgClass}" ${rowStyle} data-id="${n.id}" ondblclick="window.startEditRow('notas', '${uniqueId}', this, event)">
      ${colConferirHtml}
      <td class="p-2 text-center font-mono font-bold text-slate-600 bg-slate-100 border-r border-slate-200 editable-cell" data-prop="codCond">${n.codCond}</td>
      <td class="p-2 font-medium truncate max-w-xs border-r border-slate-200" data-prop="nomeCond">${n.nomeCond}</td>
      <td class="p-2 truncate font-mono text-slate-700 max-w-xs border-r border-slate-200 editable-cell" data-prop="cnpj">${mascararCNPJ(n.cnpj)}</td>
      <td class="p-2 truncate max-w-sm border-r border-slate-200" data-prop="nomeEmp">${displayNomeEmp}</td>
      <td class="p-2 text-center font-mono text-slate-800 font-bold border-r border-slate-200 editable-cell" data-prop="numNota">${n.numNota}</td>
      <td class="p-2 text-center text-slate-600 border-r border-slate-200 editable-cell" data-prop="dataCompleta">${n.dataCompleta}</td>
      <td class="p-2 text-right font-mono font-bold text-emerald-700 border-r border-slate-200 editable-cell" data-prop="valor">${formatMoney(n.valor)}</td>
      <td class="p-2 text-right font-mono text-red-600 border-r border-slate-200 editable-cell" data-prop="iss">${formatMoney(n.iss)}</td>
      <td class="p-2 text-right font-mono text-slate-600 border-r border-slate-200 editable-cell" data-prop="inss">${formatMoney(n.inss)}</td>
      <td class="p-2 text-right font-mono text-slate-600 border-r border-slate-200 editable-cell" data-prop="ir">${formatMoney(n.ir)}</td>
      <td class="p-2 text-right font-mono font-bold text-slate-800 bg-slate-100 border-r border-slate-200 editable-cell" data-prop="pisDigitado">${formatMoney(n.pisDigitado || 0)}</td>
      <td class="p-2 text-right font-mono text-[11px] text-slate-500 border-r border-slate-200 col-pcc-det ${pccHiddenClass} editable-cell" data-prop="valPIS">${formatMoney(n.valPIS || 0)}</td>
      <td class="p-2 text-right font-mono text-[11px] text-slate-500 border-r border-slate-200 col-pcc-det ${pccHiddenClass} editable-cell" data-prop="valCOFINS">${formatMoney(n.valCOFINS || 0)}</td>
      <td class="p-2 text-right font-mono text-[11px] text-slate-500 border-r border-slate-200 col-pcc-det ${pccHiddenClass} editable-cell" data-prop="valCSLL">${formatMoney(n.valCSLL || 0)}</td>
      <td class="p-2 text-center font-mono border-r border-slate-200 editable-cell" data-prop="codServico">${n.outroMunicipio ? (n.codServico || "-") : "-"}</td>
      <td class="p-2 text-center border-r border-slate-200 editable-cell font-bold text-slate-700 font-mono" data-prop="statusServico">
        ${n.outroMunicipio 
          ? `<button type="button" onclick="window.toggleStatusServicoClick(event, '${uniqueId}')" class="status-btn px-2.5 py-1 text-[11px] font-extrabold uppercase rounded cursor-pointer transition-all hover:scale-105 shadow-sm inline-flex items-center gap-1 ${(n.statusServico || 'Pendente').toUpperCase() === 'OK' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}"><span class="w-1.5 h-1.5 rounded-full ${(n.statusServico || 'Pendente').toUpperCase() === 'OK' ? 'bg-emerald-500' : 'bg-amber-500'}"></span><span class="status-text">${n.statusServico || 'Pendente'}</span></button>` 
          : "-"}
      </td>
      <td class="p-2 text-center border-r border-slate-200"><span class="bg-blue-100 px-2 py-0.5 rounded text-[10px] font-black text-blue-800 align-middle">${n.operador}</span></td>
      <td class="p-2 text-center">
         <button onclick="window.handleAcaoRow('notas', '${uniqueId}', this)" class="btn-acao p-1 rounded text-red-600 hover:bg-red-50 focus:outline-none transition-colors" title="Excluir">
           <span class="material-symbols-outlined text-[16px]">delete</span>
         </button>
      </td>
    </tr>
  `;
}
window.obterRowHtml = obterRowHtml;

export async function renderNotas(fetchFirst = true, condominioCodigo = null) {
  if (fetchFirst) {
    await sincronizarDados("notas", condominioCodigo);
  }
  const grid = document.getElementById("gridNotas");
  if (!grid) return;
  const refEl = document.getElementById("txtReferencia");
  const refAtual = refEl ? refEl.value : "";
  grid.innerHTML = "";
  let filtradas = window.notasDoMes.filter((n) => n.referencia === refAtual);

  // Apply Dynamic Search
  const txtBuscaInput = document.getElementById("txtBuscaNotas");
  const txtBusca = txtBuscaInput
    ? txtBuscaInput.value.trim().toLowerCase()
    : "";
  if (txtBusca) {
    if (txtBusca.startsWith("c:")) {
      const restanteTexto = txtBusca.slice(2).trim();
      filtradas = filtradas.filter((n) => {
        let codCond = String(n.codCond || "").toLowerCase().trim();
        return codCond === restanteTexto;
      });
    } else {
      const queryNum = txtBusca.replace(/[^\d]/g, "");

      filtradas = filtradas.filter((n) => {
        let e = window.dbEmpresas.find(
          (x) => String(x.cnpj) === String(n.cnpj).replace(/[^\d]+/g, ""),
        );
        let nomeEmp = (e ? e.nome : n.nomeEmp || "").toLowerCase();
        let cnpj = String(n.cnpj).toLowerCase();
        let cnpjClean = cnpj.replace(/[^\d]/g, "");
        let cnpjFormatted = mascararCNPJ(n.cnpj).toLowerCase();
        let numNota = String(n.numNota).toLowerCase();
        let codCond = String(n.codCond).toLowerCase();
        let nomeCond = (n.nomeCond || "").toLowerCase();
        let valor = String(n.valor).toLowerCase();
        let valorFormatted = formatMoney(n.valor).toLowerCase();
        let operador = String(n.operador || "").toLowerCase();

        let iss = String(n.iss || "").toLowerCase();
        let issFormatted = formatMoney(n.iss || 0).toLowerCase();
        let inss = String(n.inss || "").toLowerCase();
        let inssFormatted = formatMoney(n.inss || 0).toLowerCase();
        let ir = String(n.ir || "").toLowerCase();
        let irFormatted = formatMoney(n.ir || 0).toLowerCase();
        let pisDigitado = String(n.pisDigitado || "").toLowerCase();
        let pisDigitadoFormatted = formatMoney(
          n.pisDigitado || 0,
        ).toLowerCase();
        let valPIS = String(n.valPIS || "").toLowerCase();
        let valPISFormatted = formatMoney(n.valPIS || 0).toLowerCase();
        let valCOFINS = String(n.valCOFINS || "").toLowerCase();
        let valCOFINSFormatted = formatMoney(
          n.valCOFINS || 0,
        ).toLowerCase();
        let valCSLL = String(n.valCSLL || "").toLowerCase();
        let valCSLLFormatted = formatMoney(n.valCSLL || 0).toLowerCase();

        return (
          nomeEmp.includes(txtBusca) ||
          cnpj.includes(txtBusca) ||
          (queryNum && cnpjClean.includes(queryNum)) ||
          cnpjFormatted.includes(txtBusca) ||
          numNota.includes(txtBusca) ||
          codCond.includes(txtBusca) ||
          nomeCond.includes(txtBusca) ||
          valor.includes(txtBusca) ||
          valorFormatted.includes(txtBusca) ||
          operador.includes(txtBusca) ||
          iss.includes(txtBusca) ||
          issFormatted.includes(txtBusca) ||
          inss.includes(txtBusca) ||
          inssFormatted.includes(txtBusca) ||
          ir.includes(txtBusca) ||
          irFormatted.includes(txtBusca) ||
          pisDigitado.includes(txtBusca) ||
          pisDigitadoFormatted.includes(txtBusca) ||
          valPIS.includes(txtBusca) ||
          valPISFormatted.includes(txtBusca) ||
          valCOFINS.includes(txtBusca) ||
          valCOFINSFormatted.includes(txtBusca) ||
          valCSLL.includes(txtBusca) ||
          valCSLLFormatted.includes(txtBusca)
        );
      });
    }
  }

  // Apply Encargos Filter
  const elFltISS = document.getElementById("fltISS");
  const elFltINSS = document.getElementById("fltINSS");
  const elFltIR = document.getElementById("fltIR");
  const elFltPIS = document.getElementById("fltPIS");

  const fltISS = elFltISS ? elFltISS.checked : false;
  const fltINSS = elFltINSS ? elFltINSS.checked : false;
  const fltIR = elFltIR ? elFltIR.checked : false;
  const fltPIS = elFltPIS ? elFltPIS.checked : false;
  const fltOutroEl = document.getElementById("fltOutroMunicipio");
  const fltOutro = fltOutroEl ? fltOutroEl.checked : false;

  if (fltISS || fltINSS || fltIR || fltPIS) {
    filtradas = filtradas.filter((n) => {
      if (fltISS && n.iss > 0) return true;
      if (fltINSS && n.inss > 0) return true;
      if (fltIR && n.ir > 0) return true;
      if (fltPIS && n.pisDigitado > 0) return true;
      return false;
    });
  }

  if (fltOutro) {
    filtradas = filtradas.filter((n) => n.outroMunicipio === true);
  }

  // Apply "À Conferir" Filter
  const fltAConferirEl = document.getElementById("fltAConferir");
  const fltAConferir = fltAConferirEl ? fltAConferirEl.checked : false;
  if (fltAConferir) {
    filtradas = filtradas.filter((n) => !n.conferida);
  }

  // Sorting
  if (window.sortState.notas.col) {
    filtradas.sort((a, b) => {
      let v1 = a[window.sortState.notas.col];
      let v2 = b[window.sortState.notas.col];

      let n1 = parseFloat(v1);
      let n2 = parseFloat(v2);
      if (typeof v1 === "number" || (!isNaN(n1) && !isNaN(n2))) {
        return window.sortState.notas.asc ? n1 - n2 : n2 - n1;
      }
      return window.sortState.notas.asc
        ? String(v1).localeCompare(String(v2), undefined, {
            numeric: true,
          })
        : String(v2).localeCompare(String(v1), undefined, {
            numeric: true,
          });
    });
  } else {
    if (window.modoConferencia) {
      // Tertiary sorting: Primary: codCond, Secondary: cnpj, Tertiary: numNota
      filtradas.sort((a, b) => {
        let c1 = String(a.codCond || "").trim();
        let c2 = String(b.codCond || "").trim();
        let cmpCond = c1.localeCompare(c2, undefined, { numeric: true });
        if (cmpCond !== 0) return cmpCond;

        let cnpj1 = String(a.cnpj || "").replace(/[^\d]+/g, "");
        let cnpj2 = String(b.cnpj || "").replace(/[^\d]+/g, "");
        let cmpCnpj = cnpj1.localeCompare(cnpj2, undefined, { numeric: true });
        if (cmpCnpj !== 0) return cmpCnpj;

        let n1 = String(a.numNota || "").trim();
        let n2 = String(b.numNota || "").trim();
        return n1.localeCompare(n2, undefined, { numeric: true });
      });
    } else {
      // Default: bring most recent to top (by id descending)
      filtradas.sort((a, b) => {
        let idA = Number(a.id) || 0;
        let idB = Number(b.id) || 0;
        return idB - idA;
      });
    }
  }

  // Store the full filtered & sorted set in memory for exports AND mass updates before paginating
  window.notasFiltradasAtivas = [...filtradas];
  const totalNotasFiltradasOriginal = filtradas.length;

  // Apply limit or pagination
  const paginacaoDiv = document.getElementById("paginacaoNotas");
  if (window.modoConferencia) {
    const itemsPerPage = window.itensPorPaginaNotas || 50;
    const paginasTotais = Math.ceil(totalNotasFiltradasOriginal / itemsPerPage) || 1;
    
    // Bounds checker
    if (window.paginaAtualNotas > paginasTotais) {
      window.paginaAtualNotas = paginasTotais;
    }
    if (window.paginaAtualNotas < 1) {
      window.paginaAtualNotas = 1;
    }

    const startIdx = (window.paginaAtualNotas - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, totalNotasFiltradasOriginal);

    filtradas = filtradas.slice(startIdx, endIdx);

    // Update Pagination controls
    if (paginacaoDiv) {
      paginacaoDiv.classList.remove("hidden");
      const pagSurgindoInfo = document.getElementById("pagSurgindoInfo");
      const pagTotalInfo = document.getElementById("pagTotalInfo");
      const pagAtualText = document.getElementById("pagAtual");
      const pagTotalText = document.getElementById("pagTotal");
      const btnPrev = document.getElementById("btnPagAnterior");
      const btnNext = document.getElementById("btnPagProxima");
      
      if (pagSurgindoInfo) {
        pagSurgindoInfo.innerText = totalNotasFiltradasOriginal > 0 ? `${startIdx + 1} - ${endIdx}` : "0 - 0";
      }
      if (pagTotalInfo) {
        pagTotalInfo.innerText = totalNotasFiltradasOriginal;
      }
      if (pagAtualText) {
        pagAtualText.innerText = window.paginaAtualNotas;
      }
      if (pagTotalText) {
        pagTotalText.innerText = paginasTotais;
      }
      if (btnPrev) {
        btnPrev.disabled = window.paginaAtualNotas <= 1;
      }
      if (btnNext) {
        btnNext.disabled = window.paginaAtualNotas >= paginasTotais;
      }
    }
  } else {
    if (paginacaoDiv) {
      paginacaoDiv.classList.add("hidden");
    }
    filtradas = filtradas.slice(0, 20);
  }

  // Render on table grid (using the optimized obterRowHtml helper)
  filtradas.forEach((n) => {
    grid.innerHTML += obterRowHtml(n);
  });

  const thConferir = document.getElementById("th-conferir");
  if (thConferir) {
    thConferir.style.display = window.modoConferencia ? "table-cell" : "none";
  }
  const chkSelTodas = document.getElementById("chk-selecionar-todas");
  if (chkSelTodas) {
    chkSelTodas.checked = false;
  }

  const labelEl = document.getElementById("qtdeNotas");
  if (labelEl) {
    if (window.modoConferencia) {
      labelEl.innerText =
        `MODO DE CONFERÊNCIA | TOTAL REGISTROS: ${totalNotasFiltradasOriginal}`;
    } else {
      labelEl.innerText =
        `EXIBINDO REGISTROS MAIS RECENTES (MÁXIMO 20) | TOTAL: ${totalNotasFiltradasOriginal}`;
    }
  }
}

export async function renderEmpresas(fetchFirst = true) {
  if (fetchFirst) {
    await sincronizarDados("empresas");
  }
  const grid = document.getElementById("gridEmpresas");
  if (!grid) return;
  grid.innerHTML = "";
  let arr = [...window.dbEmpresas];
  if (window.sortState.empresas.col) {
    arr.sort((a, b) => {
      let v1 = a[window.sortState.empresas.col];
      let v2 = b[window.sortState.empresas.col];
      return window.sortState.empresas.asc
        ? String(v1).localeCompare(v2)
        : String(v2).localeCompare(v1);
    });
  }

  arr.forEach((e) => {
    let cnpjFormatado = mascararCNPJ(e.cnpj);
    grid.innerHTML += `
      <tr class="hover:bg-blue-50 cursor-pointer" ondblclick="window.startEditRow('empresas', '${e.cnpj}', this, event)">
        <td class="p-3 font-mono font-black text-slate-700 border-r border-slate-200 editable-cell" data-prop="cnpj">${cnpjFormatado}</td>
        <td class="p-3 font-bold text-slate-800 editable-cell" data-prop="nome">${e.nome}</td>
        <td class="p-3 text-center">
           <button onclick="window.handleAcaoRow('empresas', '${e.cnpj}', this)" class="btn-acao p-1 rounded text-red-600 hover:bg-red-50 focus:outline-none transition-colors" title="Excluir">
             <span class="material-symbols-outlined text-[16px]">delete</span>
           </button>
        </td>
      </tr>
    `;
  });
}

export async function renderCondominios(fetchFirst = true) {
  if (fetchFirst) {
    await sincronizarDados("condominios");
  }
  const grid = document.getElementById("gridCondominios");
  if (!grid) return;
  grid.innerHTML = "";

  let arr = [...window.dbCondominios];
  if (window.sortState.cond.col) {
    arr.sort((a, b) => {
      let v1 = a[window.sortState.cond.col];
      let v2 = b[window.sortState.cond.col];
      return window.sortState.cond.asc
        ? String(v1).localeCompare(v2)
        : String(v2).localeCompare(v1);
    });
  }

  arr.forEach((c) => {
    let formattedCnpj = "";
    if (c.cnpj) {
      formattedCnpj = window.mascararCNPJ ? window.mascararCNPJ(c.cnpj) : c.cnpj;
    }
    grid.innerHTML += `
      <tr class="hover:bg-blue-50 border-b border-slate-200 cursor-pointer" ondblclick="window.startEditRow('cond', '${c.codigo}', this, event)">
        <td class="p-3 font-mono font-black text-center text-slate-700 bg-slate-50 border-r border-slate-200 editable-cell" data-prop="codigo">${c.codigo}</td>
        <td class="p-3 font-bold text-slate-800 text-xs editable-cell" data-prop="nome">${c.nome}</td>
        <td class="p-3 font-mono text-center text-slate-700 text-xs editable-cell border-l border-r border-slate-200" data-prop="cnpj">${formattedCnpj}</td>
        <td class="p-3 text-center">
           <button onclick="window.handleAcaoRow('cond', '${c.codigo}', this)" class="btn-acao p-1 rounded text-red-600 hover:bg-red-50 focus:outline-none transition-colors" title="Excluir">
             <span class="material-symbols-outlined text-[16px]">delete</span>
           </button>
        </td>
      </tr>
    `;
  });
}

export function parseLogDate(dataHoraStr) {
  if (!dataHoraStr) return null;
  const parts = dataHoraStr.split(" ");
  const dateParts = parts[0].split("/");
  if (dateParts.length === 3) {
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);

    let hour = 0,
      min = 0,
      sec = 0;
    if (parts.length > 1) {
      const timeParts = parts[1].split(":");
      if (timeParts.length >= 2) {
        hour = parseInt(timeParts[0], 10);
        min = parseInt(timeParts[1], 10);
        if (timeParts.length > 2) {
          sec = parseInt(timeParts[2], 10);
        }
      }
    }
    return new Date(year, month, day, hour, min, sec);
  }
  return null;
}

export function getNumNotaFromLog(a) {
  if (a.numNota) return a.numNota;
  const match = String(a.descricao || "").match(/\[NF\s+(\d+)\]/i);
  if (match) return match[1];
  return "-";
}

export async function renderAuditoria(fetchFirst = true) {
  if (fetchFirst) {
    await sincronizarDados("auditoria");
  }
  const grid = document.getElementById("gridAuditoria");
  if (!grid) return;
  grid.innerHTML = "";

  let filtrados = [...window.dbAuditoria];

  // Dynamic Search inside Log de Auditoria
  const txtBuscaAudInput = document.getElementById("txtBuscaAuditoria");
  const txtBuscaAud = txtBuscaAudInput
    ? txtBuscaAudInput.value.trim().toLowerCase()
    : "";
  if (txtBuscaAud) {
    filtrados = filtrados.filter((a) => {
      let dataHora = String(a.dataHora || "").toLowerCase();
      let operador = String(a.operador || "").toLowerCase();
      let acao = String(a.acao || "").toLowerCase();
      let numNota = String(getNumNotaFromLog(a) || "").toLowerCase();
      let entidade = String(a.entidade || "").toLowerCase();
      let recurso = String(a.recurso || "").toLowerCase();
      let descricao = String(a.descricao || "").toLowerCase();

      return (
        dataHora.includes(txtBuscaAud) ||
        operador.includes(txtBuscaAud) ||
        acao.includes(txtBuscaAud) ||
        numNota.includes(txtBuscaAud) ||
        entidade.includes(txtBuscaAud) ||
        recurso.includes(txtBuscaAud) ||
        descricao.includes(txtBuscaAud)
      );
    });
  }

  // 1. Filter by Action type
  const actionFilterEl = document.getElementById("fltLogAcao");
  const actionFilter = actionFilterEl ? actionFilterEl.value : "ALL";
  if (actionFilter === "CREATE_ONLY") {
    filtrados = filtrados.filter((a) => a.acao === "CREATE_INVOICE");
  } else if (actionFilter === "UPDATE_ONLY") {
    filtrados = filtrados.filter((a) => a.acao !== "CREATE_INVOICE");
  }

  // 2. Filter by Period (mensal, anual, custom)
  const periodTypeEl = document.getElementById("fltLogPeriodo");
  const periodType = periodTypeEl ? periodTypeEl.value : "mensal";
  const refValEl = document.getElementById("txtReferencia");
  const refVal = refValEl ? refValEl.value : ""; // 'YYYY-MM'

  if (periodType === "mensal") {
    if (refVal) {
      const parts = refVal.split("-");
      const refYear = parts[0];
      const refMonth = parts[1];
      filtrados = filtrados.filter((a) => {
        const d = parseLogDate(a.dataHora);
        if (!d) return false;
        const yr = d.getFullYear().toString();
        const mo = (d.getMonth() + 1).toString().padStart(2, "0");
        return yr === refYear && mo === refMonth;
      });
    }
  } else if (periodType === "anual") {
    if (refVal) {
      const refYear = refVal.split("-")[0];
      filtrados = filtrados.filter((a) => {
        const d = parseLogDate(a.dataHora);
        if (!d) return false;
        return d.getFullYear().toString() === refYear;
      });
    }
  } else if (periodType === "custom") {
    const elDateIni = document.getElementById("fltLogDataIni");
    const elDateFim = document.getElementById("fltLogDataFim");
    const dateIniStr = elDateIni ? elDateIni.value : "";
    const dateFimStr = elDateFim ? elDateFim.value : "";

    let dIni = dateIniStr ? new Date(dateIniStr + "T00:00:00") : null;
    let dFim = dateFimStr ? new Date(dateFimStr + "T23:59:59") : null;

    filtrados = filtrados.filter((a) => {
      const d = parseLogDate(a.dataHora);
      if (!d) return false;
      if (dIni && d < dIni) return false;
      if (dFim && d > dFim) return false;
      return true;
    });
  }

  // 3. Sort/Ordem of Execution
  const orderEl = document.getElementById("fltLogOrdem");
  const order = orderEl ? orderEl.value : "desc";
  filtrados.sort((a, b) => {
    const t1 = parseLogDate(a.dataHora)?.getTime() || 0;
    const t2 = parseLogDate(b.dataHora)?.getTime() || 0;
    return order === "asc" ? t1 - t2 : t2 - t1;
  });

  // 4. Render Table Row Markup
  filtrados.forEach((a) => {
    const numNotaDisplay = getNumNotaFromLog(a);
    let statusClass = "bg-slate-200 text-slate-800 border-slate-300";
    if (a.acao === "CREATE_INVOICE") {
      statusClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
    } else if (a.acao.startsWith("UPDATE_")) {
      statusClass = "bg-indigo-100 text-indigo-800 border-indigo-300";
    }

    grid.innerHTML += `
       <tr class="hover:bg-yellow-50 cursor-crosshair transition-colors border-b border-slate-200">
         <td class="p-2.5 border-r border-slate-200 font-bold text-slate-800">${a.dataHora}</td>
         <td class="p-2.5 border-r border-slate-200 font-bold text-blue-700 text-center">${a.operador}</td>
         <td class="p-2.5 border-r border-slate-200 text-center">
            <span class="${statusClass} border px-2 py-0.5 rounded font-black tracking-tight text-[10px] block">${a.acao}</span>
         </td>
         <td class="p-2.5 border-r border-slate-200 font-mono font-bold text-[11px] text-center text-slate-800 bg-slate-50">${numNotaDisplay}</td>
         <td class="p-2.5 border-r border-slate-200 text-center font-bold">${a.entidade}</td>
         <td class="p-2.5 border-r border-slate-200 font-mono text-[10px] text-center">${a.recurso}</td>
         <td class="p-2.5 max-w-sm truncate" title="${a.descricao}">${a.descricao}</td>
       </tr>
     `;
  });
}

export function alternarModoConferencia() {
  window.modoConferencia = !window.modoConferencia;
  
  // Clear sorting column when entering conference mode so it uses the preset tertiary sorting
  if (window.modoConferencia && window.sortState && window.sortState.notas) {
    window.sortState.notas.col = "";
  }

  const btn = document.getElementById("btnModoConferencia");
  if (btn) {
    if (window.modoConferencia) {
      btn.innerHTML = `<span class="material-symbols-outlined text-[15px]">checklist</span> <span>Exibir Últimos 20</span>`;
      btn.className = "px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase rounded border border-indigo-500 transition-colors focus:outline-none flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer";
      showToast("Modo de Conferência: todos os lançamentos ordenados por Condomínio, CNPJ e Nº Nota.", "info");
    } else {
      btn.innerHTML = `<span class="material-symbols-outlined text-[15px]">checklist</span> <span>Exibir Todos os Lançamentos</span>`;
      btn.className = "px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white font-bold text-[11px] uppercase rounded border border-slate-600 transition-colors focus:outline-none flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer";
      showToast("Exibindo apenas os últimos 20 lançamentos mais recentes.", "info");
    }
  }
  const btnLote = document.getElementById("btnConferirNotasLote");
  if (btnLote) {
    if (window.modoConferencia) {
      btnLote.classList.remove("hidden");
    } else {
      btnLote.classList.add("hidden");
    }
  }
  renderNotas(false);
}

let searchDebounceTimeout = null;
export function debouncedSearchNotas() {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    renderNotas(false);
  }, 300);
}
