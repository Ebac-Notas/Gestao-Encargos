import "./index.css";
import { supabase } from "./supabaseClient.js";
import { 
  parseMoney, 
  formatMoney, 
  mascararCNPJ, 
  titleCase, 
  validarCNPJ, 
  recalcularValorLiquido, 
  calcularPisCofins, 
  ativarEdicaoPccManual, 
  atualizarSomaPcc, 
  carregarSmartDefaults,
  atualizarStatusConferida
} from "./calculosImpostos.js";
import { 
  formatDateTime, 
  showToast, 
  sortGrid, 
  togglePccCols, 
  sincronizarDados, 
  renderNotas, 
  renderEmpresas, 
  renderCondominios, 
  renderAuditoria, 
  alternarModoConferencia, 
  debouncedSearchNotas,
  parseLogDate,
  getNumNotaFromLog
} from "./filtrosInterface.js";

// --- GLOBAL STATE INITIALIZATION ---
window.dbCondominios = [];
window.dbEmpresas = [];
window.dbNotas = [];
window.notasDoMes = [];
window.dbAuditoria = [];
window.modoConferencia = false;
window.isBatchUpdating = false;
window.paginaAtualNotas = 1;
window.itensPorPaginaNotas = 50;
window.notasFiltradasAtivas = [];
window.sortState = {
  notas: { col: "", asc: true },
  empresas: { col: "", asc: true },
  cond: { col: "", asc: true },
};
window.aliquotasValidas = null;
window.pisModificadoManualmente = false;

// --- EXPOSE SYSTEM LIBRARIES/CLIENTS ---
window.supabase = supabase;

// --- EXPOSE CALCULATIONS MODULE TO GLOBAL WINDOW ---
window.parseMoney = parseMoney;
window.formatMoney = formatMoney;
window.mascararCNPJ = mascararCNPJ;
window.titleCase = titleCase;
window.validarCNPJ = validarCNPJ;
window.recalcularValorLiquido = recalcularValorLiquido;
window.calcularPisCofins = calcularPisCofins;
window.ativarEdicaoPccManual = ativarEdicaoPccManual;
window.atualizarSomaPcc = atualizarSomaPcc;
window.carregarSmartDefaults = carregarSmartDefaults;
window.atualizarStatusConferida = atualizarStatusConferida;

// --- EXPOSE INTERFACE MODULE TO GLOBAL WINDOW ---
window.formatDateTime = formatDateTime;
window.showToast = showToast;
window.sortGrid = sortGrid;
window.togglePccCols = togglePccCols;
window.sincronizarDados = sincronizarDados;
window.renderNotas = renderNotas;
window.renderEmpresas = renderEmpresas;
window.renderCondominios = renderCondominios;
window.renderAuditoria = renderAuditoria;
window.alternarModoConferencia = alternarModoConferencia;
window.debouncedSearchNotas = debouncedSearchNotas;

// --- DOM ELEMENTS REFERENCE FUNCTION ---
function getEl(id) {
  return document.getElementById(id);
}

// --- MINIMALIST FILTER TRANSITION FUNCTION ---
export function toggleFiltroInterativo(forceState) {
  const cnt = getEl("cntFiltroInterativo");
  const btnCloseLeft = getEl("btnFiltroCloseLeft");
  const btnCloseRight = getEl("btnFiltroCloseRight");
  const content = getEl("conteudoFiltros");
  const btnTrigger = getEl("btnFiltroTrigger");

  if (!cnt) return;

  const isExpanded = cnt.classList.contains("expanded");
  const nextExpanded = forceState !== undefined ? forceState : !isExpanded;

  if (nextExpanded) {
    cnt.classList.add("expanded");
    cnt.classList.remove("w-28", "px-4", "justify-center", "cursor-pointer", "hover:bg-slate-50", "hover:border-slate-400");
    cnt.classList.add("w-[820px]", "px-10", "bg-white", "border-slate-400");

    if (btnCloseLeft) btnCloseLeft.classList.remove("hidden");
    if (btnCloseRight) btnCloseRight.classList.remove("hidden");

    if (content) {
      content.classList.remove("opacity-0", "max-w-0", "pointer-events-none");
      content.classList.add("opacity-100", "max-w-[660px]");
    }
    
    if (btnTrigger) {
      btnTrigger.classList.add("border-r", "border-slate-200", "pr-3", "mr-3", "pointer-events-none");
    }
  } else {
    cnt.classList.remove("expanded");
    cnt.classList.remove("w-[820px]", "px-10", "border-slate-400");
    cnt.classList.add("w-28", "px-4", "justify-center", "cursor-pointer", "hover:bg-slate-50", "hover:border-slate-400");

    if (btnCloseLeft) btnCloseLeft.classList.add("hidden");
    if (btnCloseRight) btnCloseRight.classList.add("hidden");

    if (content) {
      content.classList.add("opacity-0", "max-w-0", "pointer-events-none");
      content.classList.remove("opacity-100", "max-w-[660px]");
    }

    if (btnTrigger) {
      btnTrigger.classList.remove("border-r", "border-slate-200", "pr-3", "mr-3", "pointer-events-none");
    }
  }
}
window.toggleFiltroInterativo = toggleFiltroInterativo;

// --- DYNAMIC FONT ZOOM / SCALING ENGINE WITH COLLAPSE / AUTOCLOSE ---
let fonteInatividadeTimeoutId = null;
window.isMouseOverFonte = false;

export function resetFonteInatividadeTimer() {
  if (fonteInatividadeTimeoutId) {
    clearTimeout(fonteInatividadeTimeoutId);
    fonteInatividadeTimeoutId = null;
  }
  if (window.isMouseOverFonte) {
    // Se o mouse estiver por cima, impede o recolhimento automático
    return;
  }
  fonteInatividadeTimeoutId = setTimeout(() => {
    toggleFonteInterativa(false);
  }, 5000);
}

export function toggleFonteInterativa(forceState) {
  const cnt = getEl("cntFonteInterativa");
  const btnCloseLeft = getEl("btnFonteCloseLeft");
  const btnCloseRight = getEl("btnFonteCloseRight");
  const content = getEl("conteudoFonte");
  const btnTrigger = getEl("btnFonteTrigger");

  if (!cnt) return;

  const isExpanded = cnt.classList.contains("expanded");
  const nextExpanded = forceState !== undefined ? forceState : !isExpanded;

  if (nextExpanded) {
    cnt.classList.add("expanded");
    cnt.classList.remove("w-28", "px-3", "justify-center", "cursor-pointer", "hover:bg-slate-50", "hover:border-slate-400");
    cnt.classList.add("w-[320px]", "px-4", "bg-white", "border-slate-400");

    if (btnCloseLeft) btnCloseLeft.classList.remove("hidden");
    if (btnCloseRight) btnCloseRight.classList.remove("hidden");

    if (content) {
      content.classList.remove("opacity-0", "max-w-0", "pointer-events-none");
      content.classList.add("opacity-100", "max-w-[280px]");
    }
    
    if (btnTrigger) {
      btnTrigger.classList.add("border-r", "border-slate-200", "pr-2", "mr-2", "pointer-events-none");
    }

    resetFonteInatividadeTimer();
  } else {
    cnt.classList.remove("expanded");
    cnt.classList.remove("w-[320px]", "px-4", "border-slate-400");
    cnt.classList.add("w-28", "px-3", "justify-center", "cursor-pointer", "hover:bg-slate-50", "hover:border-slate-400");

    if (btnCloseLeft) btnCloseLeft.classList.add("hidden");
    if (btnCloseRight) btnCloseRight.classList.add("hidden");

    if (content) {
      content.classList.add("opacity-0", "max-w-0", "pointer-events-none");
      content.classList.remove("opacity-100", "max-w-[280px]");
    }

    if (btnTrigger) {
      btnTrigger.classList.remove("border-r", "border-slate-200", "pr-2", "mr-2", "pointer-events-none");
    }

    if (fonteInatividadeTimeoutId) {
      clearTimeout(fonteInatividadeTimeoutId);
      fonteInatividadeTimeoutId = null;
    }
  }
}

export function aplicarTamanhoFonte(escala) {
  const minScale = 90;
  const maxScale = 115;
  const safeEscala = Math.max(minScale, Math.min(maxScale, escala));
  
  localStorage.setItem("appFontScale", safeEscala);

  // Apply scale as a CSS variable on the html root
  document.documentElement.style.setProperty("--app-font-scale", safeEscala / 100);

  // Directly apply inline zoom property to #tela-dashboard
  const dashboard = getEl("tela-dashboard");
  if (dashboard) {
    dashboard.style.zoom = safeEscala / 100;
  }

  // Update UI Select Preset
  const selectPreset = getEl("selTamanhoPreset");
  if (selectPreset) {
    if (["90", "95", "100", "105", "110", "115"].includes(String(safeEscala))) {
      selectPreset.value = String(safeEscala);
    } else {
      let optCustom = selectPreset.querySelector('option[value="custom"]');
      if (!optCustom) {
        optCustom = document.createElement("option");
        optCustom.value = "custom";
        selectPreset.appendChild(optCustom);
      }
      optCustom.text = `Customizado (${safeEscala}%)`;
      optCustom.selected = true;
    }
  }

  // Update UI percentage label
  const lblTamanhoAtual = getEl("lblTamanhoAtual");
  if (lblTamanhoAtual) {
    lblTamanhoAtual.innerText = `${safeEscala}%`;
  }
}

export function selecionarTamanhoPreset(val) {
  if (val === "custom") return;
  const scale = parseInt(val, 10) || 100;
  aplicarTamanhoFonte(scale);
}

export function ajustarEscalaFina(delta) {
  let scale = parseInt(localStorage.getItem("appFontScale"), 10) || 100;
  scale += delta;
  aplicarTamanhoFonte(scale);
}

export function carregarPreferenciaTamanhoFonte() {
  const savedScale = parseInt(localStorage.getItem("appFontScale"), 10) || 100;
  aplicarTamanhoFonte(savedScale);
}

window.toggleFonteInterativa = toggleFonteInterativa;
window.resetFonteInatividadeTimer = resetFonteInatividadeTimer;
window.aplicarTamanhoFonte = aplicarTamanhoFonte;
window.selecionarTamanhoPreset = selecionarTamanhoPreset;
window.ajustarEscalaFina = ajustarEscalaFina;
window.carregarPreferenciaTamanhoFonte = carregarPreferenciaTamanhoFonte;


// --- MAIN BUSINESS FUNCTIONS ---
export function getOperador() {
  const el = getEl("nome-operador");
  return (el ? el.innerText : "Desconhecido").toUpperCase();
}
window.getOperador = getOperador;

export function limparFormulario(forceClearAll = false) {
  const iptCondominio = getEl("iptCondominio");
  const iptCnpj = getEl("iptCnpj");
  const iptRazaoSocial = getEl("iptRazaoSocial");
  const lblRazaoSocial = getEl("lblRazaoSocial");
  const iptNota = getEl("iptNota");
  const iptDiaEmissao = getEl("iptDiaEmissao");
  const iptValorBruto = getEl("iptValorBruto");
  const iptISS = getEl("iptISS");
  const iptINSS = getEl("iptINSS");
  const iptIR = getEl("iptIR");
  const chkPis = getEl("chkPis");
  const iptPisContainer = getEl("iptPisContainer");
  const iptPisVal = getEl("iptPisVal");
  const iptPIS = getEl("iptPIS");
  const iptCOFINS = getEl("iptCOFINS");
  const iptCSLL = getEl("iptCSLL");
  const chkManterCNPJ = getEl("chkManterCNPJ");

  iptCondominio.value = "";
  const lblHeader = getEl("lblHeaderCondominio");
  if (lblHeader) {
    lblHeader.innerText = "AGUARDANDO CONDOMÍNIO...";
    lblHeader.className =
      "text-xl font-black text-slate-800 uppercase tracking-wide";
  }

  if (forceClearAll || !chkManterCNPJ.checked) {
    window.aliquotasValidas = null;
    iptCnpj.value = "";
    iptRazaoSocial.value = "";
    iptRazaoSocial.readOnly = false;
    iptRazaoSocial.className =
      "border border-slate-300 p-2 text-[13px] rounded bg-white font-medium focus:outline-none focus:border-emerald-500 shadow-sm transition-colors";
    lblRazaoSocial.innerText = "Razão Social";
    lblRazaoSocial.className =
      "text-[11px] font-bold text-slate-700 uppercase transition-colors";
    getEl("boxNovaEmpresa").classList.add("hidden");
    getEl("boxNovaEmpresa").classList.remove("flex");

    iptCondominio.focus();
  } else {
    iptCondominio.focus();
  }

  iptNota.value = "";
  iptDiaEmissao.value = "";
  iptValorBruto.value = "";
  iptISS.value = "";
  iptINSS.value = "";
  iptIR.value = "";
  chkPis.checked = false;
  iptPisContainer.classList.add("hidden");
  iptPisContainer.classList.remove("flex");
  getEl("boxPccTotal").classList.remove("hidden");
  getEl("boxPccManual").classList.remove("grid");
  getEl("boxPccManual").classList.add("hidden");
  iptPisVal.value = "";
  iptPIS.value = "";
  iptCOFINS.value = "";
  iptCSLL.value = "";
  window.pisModificadoManualmente = false;

  const chkOutros = getEl("chkOutrosMunicipios");
  const boxCod = getEl("boxCodServico");
  const iptCod = getEl("iptCodServico");
  if (chkOutros) chkOutros.checked = false;
  if (boxCod) {
    boxCod.classList.add("hidden");
    boxCod.classList.remove("flex");
  }
  if (iptCod) iptCod.value = "";

  recalcularValorLiquido();
}
window.limparFormulario = limparFormulario;

export async function enviarNota() {
  window.aliquotasValidas = null;
  const iptCondominio = getEl("iptCondominio");
  const iptCnpj = getEl("iptCnpj");
  const iptRazaoSocial = getEl("iptRazaoSocial");
  const iptNota = getEl("iptNota");
  const iptDiaEmissao = getEl("iptDiaEmissao");
  const iptValorBruto = getEl("iptValorBruto");
  const iptISS = getEl("iptISS");
  const iptINSS = getEl("iptINSS");
  const iptIR = getEl("iptIR");
  const chkPis = getEl("chkPis");
  const iptPisVal = getEl("iptPisVal");
  const iptPIS = getEl("iptPIS");
  const iptCOFINS = getEl("iptCOFINS");
  const iptCSLL = getEl("iptCSLL");
  const chkManterCNPJ = getEl("chkManterCNPJ");

  const requireField = (val, fieldName) => {
    if (!val) {
      showToast(`Preencha o campo: ${fieldName}`, "error");
      return false;
    }
    return true;
  };

  if (!requireField(iptCondominio.value, "Cód. Condomínio")) return;
  if (iptCondominio.value.length !== 3) {
    showToast("Código do condomínio inválido.", "error");
    return;
  }

  if (!requireField(iptCnpj.value, "CNPJ Emissor")) return;
  let rawCnpj = iptCnpj.value.replace(/[^\d]+/g, "").padStart(14, "0");

  if (!requireField(iptRazaoSocial.value, "Razão Social da Empresa")) return;
  if (!requireField(iptNota.value, "Nº da Nota")) return;

  let diaDigitado = parseInt(iptDiaEmissao.value);
  if (!diaDigitado || diaDigitado < 1 || diaDigitado > 31) {
    showToast("Dia de Emissão inválido. Digite um valor entre 1 e 31.", "error");
    iptDiaEmissao.focus();
    return;
  }

  let valBruto = parseFloat(iptValorBruto.value) || 0;
  if (valBruto <= 0) {
    showToast("Valor bruto não pode ser zero.", "error");
    iptValorBruto.focus();
    return;
  }
  let issCalc = parseFloat(iptISS.value) || 0;
  if (issCalc > valBruto * 0.1) {
    showToast("ISS inválido: não pode ser maior que 10% do total.", "error");
    iptISS.focus();
    return;
  }

  let refSelecionada = getEl("txtReferencia").value;
  if (!refSelecionada) {
    showToast("Selecione uma Competência de Lançamento no topo da tela.", "error");
    return;
  }

  let numNotaLimpo = iptNota.value.replace(/^0+/, "").trim() || "0";
  let isDupe = false;

  if (window.dbNotas && window.dbNotas.length > 0) {
    isDupe = window.dbNotas.some((n) => {
      let noteCnpjRaw = String(n.cnpj || "").replace(/[^\d]+/g, "");
      return (
        noteCnpjRaw === rawCnpj &&
        String(n.numNota || "").trim() === numNotaLimpo
      );
    });
  }

  if (!isDupe && supabase) {
    try {
      const { data: existingNote } = await supabase
        .from("notas_fiscais")
        .select("id")
        .eq("numero_nota", numNotaLimpo)
        .eq("empresa_cnpj", rawCnpj)
        .limit(1);

      if (existingNote && existingNote.length > 0) {
        isDupe = true;
      }
    } catch (err) {
      console.error("Erro ao validar duplicidade no banco:", err);
    }
  }

  if (isDupe) {
    showToast(
      `Transação Negada: Nota fiscal nº ${numNotaLimpo} já consta no sistema para esta Empresa/Fornecedor (CNPJ: ${mascararCNPJ(rawCnpj)}).`,
      "error",
    );
    iptNota.focus();
    return;
  }

  let outroMunicipio = getEl("chkOutrosMunicipios").checked;
  let codServico = "";
  let statusServico = "";
  if (outroMunicipio) {
    codServico = getEl("iptCodServico").value.trim();
    if (!codServico) {
      showToast("Preencha o Código de Serviço para Notas de Outros Municípios.", "error");
      const iptCod = getEl("iptCodServico");
      if (iptCod) iptCod.focus();
      return;
    }
    statusServico = "Pendente";
  }

  let isEmpresaNova = false;
  try {
    const { data } = await supabase
      .from("empresas")
      .select("*")
      .eq("cnpj", rawCnpj)
      .maybeSingle();
    if (!data) {
      isEmpresaNova = true;
      await supabase
        .from("empresas")
        .insert([
          {
            cnpj: rawCnpj,
            razao_social: titleCase(iptRazaoSocial.value),
          },
        ]);
    }
  } catch (e) {}

  if (isEmpresaNova) {
    window.dbEmpresas.push({
      cnpj: rawCnpj,
      nome: titleCase(iptRazaoSocial.value),
    });
    renderEmpresas(false);
  }

  let oper = getOperador();
  let diaStr = String(diaDigitado).padStart(2, "0");
  let dataFormatada = `${diaStr}/${refSelecionada.split("-")[1]}/${refSelecionada.split("-")[0]}`;

  let nomeEmpresaFinal = titleCase(iptRazaoSocial.value);

  let novaNota = {
    outroMunicipio: outroMunicipio,
    codServico: codServico,
    statusServico: statusServico,
    codCond: iptCondominio.value,
    nomeCond: titleCase(getEl("lblHeaderCondominio").innerText),
    cnpj: iptCnpj.value,
    nomeEmp: nomeEmpresaFinal,
    numNota: numNotaLimpo,
    dataCompleta: dataFormatada,
    referencia: refSelecionada,
    valor: valBruto,
    iss: issCalc,
    inss: parseFloat(iptINSS.value) || 0,
    ir: parseFloat(iptIR.value) || 0,
    pisDigitado: chkPis.checked ? parseFloat(iptPisVal.value) || 0 : 0,
    valPIS: chkPis.checked ? parseFloat(iptPIS.value) || 0 : 0,
    valCOFINS: chkPis.checked ? parseFloat(iptCOFINS.value) || 0 : 0,
    valCSLL: chkPis.checked ? parseFloat(iptCSLL.value) || 0 : 0,
    operador: oper,
    dataHora: formatDateTime(new Date()),
  };

  try {
    const { error: insertError } = await supabase
      .from("notas_fiscais")
      .insert([
        {
          condominio_codigo: iptCondominio.value,
          empresa_cnpj: rawCnpj,
          numero_nota: numNotaLimpo,
          dia_emissao: diaDigitado,
          data_consolidada: dataFormatada,
          referencia: refSelecionada,
          valor_bruto: valBruto,
          iss: issCalc,
          inss: parseFloat(iptINSS.value) || 0,
          ir: parseFloat(iptIR.value) || 0,
          is_pcc: chkPis.checked,
          pis_digitado: chkPis.checked ? parseFloat(iptPisVal.value) || 0 : 0,
          val_pis: chkPis.checked ? parseFloat(iptPIS.value) || 0 : 0,
          val_cofins: chkPis.checked ? parseFloat(iptCOFINS.value) || 0 : 0,
          val_csll: chkPis.checked ? parseFloat(iptCSLL.value) || 0 : 0,
          criado_por: oper,
          outro_municipio: outroMunicipio,
          cod_servico: outroMunicipio ? codServico : null,
          status_servico: outroMunicipio ? statusServico : null,
        },
      ]);

    if (insertError) {
      if (
        insertError.code === "23505" ||
        String(insertError.message).toLowerCase().includes("duplicate") ||
        String(insertError.message).toLowerCase().includes("unique")
      ) {
        showToast("Nota fiscal já consta na planilha.", "error");
        getEl("iptNota").focus();
        return;
      } else {
        showToast("Erro ao salvar nota fiscal: " + insertError.message, "error");
        return;
      }
    }
  } catch (eInserted) {
    console.error(eInserted);
  }

  window.dbAuditoria.unshift({
    dataHora: formatDateTime(new Date()),
    operador: oper,
    acao: "CREATE_INVOICE",
    entidade: novaNota.codCond,
    recurso: novaNota.cnpj,
    descricao: `Ref: [NF ${novaNota.numNota}] - Valor: ${formatMoney(novaNota.valor)} - Emissor: ${novaNota.nomeEmp}`,
    referencia: refSelecionada,
  });

  try {
    await supabase.from("logs_auditoria").insert([
      {
        operador: oper,
        acao: "CREATE_INVOICE",
        entidade: iptCondominio.value,
        recurso: rawCnpj,
        descricao: `Ref: [NF ${numNotaLimpo}] - Valor: ${formatMoney(valBruto)} - Emissor: ${nomeEmpresaFinal}`,
        referencia: refSelecionada,
        num_nota: numNotaLimpo,
      },
    ]);
  } catch (el) {}

  renderNotas(true);
  renderAuditoria(true);

  limparFormulario(false);

  showToast("Nota fiscal lançada com sucesso!", "success");
  // Ensure the cursor returns to the condominium field regardless of chkManterCNPJ
  const iptCond = getEl("iptCondominio");
  if (iptCond) {
    iptCond.focus();
    iptCond.select();
  }
}
window.enviarNota = enviarNota;

export function alterarAba(tabId) {
  const conteudos = document.querySelectorAll(".aba-conteudo");
  conteudos.forEach((conteudo) => conteudo.classList.add("hidden"));

  const abaAtiva = getEl(tabId);
  if (abaAtiva) abaAtiva.classList.remove("hidden");

  const botoesIds = [
    "btn-tab-notas",
    "btn-tab-lancar",
    "btn-tab-empresas",
    "btn-tab-condominios",
    "btn-tab-auditoria",
  ];

  botoesIds.forEach((btnId) => {
    const btn = getEl(btnId);
    if (btn) {
      btn.classList.remove("aba-ativa");
      btn.classList.add("aba-inativa");
    }
  });

  const botaoAtual = getEl("btn-" + tabId);
  if (botaoAtual) {
    botaoAtual.classList.remove("aba-inativa");
    botaoAtual.classList.add("aba-ativa");
  }
}
window.alterarAba = alterarAba;

export function mostrarTelaPrimeiroAcesso(isInvite = false) {
  getEl("box-login").classList.add("hidden");
  getEl("box-cadastro").classList.remove("hidden");

  const txtEmailCadastro = getEl("txtEmailCadastro");
  if (txtEmailCadastro) {
    const urlString = window.location.href + window.location.hash;
    const temConviteUrl =
      urlString.includes("type=invite") ||
      urlString.includes("access_token=") ||
      urlString.includes("type=signup") ||
      urlString.includes("type=recovery");
    const aplicarDisabled = isInvite || temConviteUrl;

    if (aplicarDisabled) {
      txtEmailCadastro.disabled = true;
      txtEmailCadastro.readOnly = true;
      txtEmailCadastro.classList.add(
        "bg-slate-200",
        "cursor-not-allowed",
        "font-semibold",
        "text-slate-500",
      );
      if (!txtEmailCadastro.value || txtEmailCadastro.value.trim() === "") {
        txtEmailCadastro.placeholder = "Carregando e-mail do convite...";
      }
    } else {
      txtEmailCadastro.disabled = false;
      txtEmailCadastro.readOnly = false;
      txtEmailCadastro.classList.remove(
        "bg-slate-200",
        "cursor-not-allowed",
        "font-semibold",
        "text-slate-500",
      );
      txtEmailCadastro.placeholder = "roberto@empresa.com";
    }
  }
}
window.mostrarTelaPrimeiroAcesso = mostrarTelaPrimeiroAcesso;

export function mostrarTelaLogin() {
  getEl("box-cadastro").classList.add("hidden");
  getEl("box-login").classList.remove("hidden");
}
window.mostrarTelaLogin = mostrarTelaLogin;

export function logarUsuario(nome) {
  getEl("nome-operador").innerText = nome;
  getEl("tela-autenticacao").classList.add("hidden");
  getEl("tela-dashboard").classList.remove("hidden");

  const now = new Date();
  const anoStr = now.getFullYear();
  const mesStr = String(now.getMonth() + 1).padStart(2, "0");
  let currentRef = getEl("txtReferencia").value;
  if (!currentRef) {
    syncReferencia(`${anoStr}-${mesStr}`);
  } else {
    renderNotas(true);
    renderAuditoria(true);
  }
  renderEmpresas(true);
  renderCondominios(true);

  alterarAba("tab-notas");
  inicializarRealtime();
}
window.logarUsuario = logarUsuario;

export async function executarLogin() {
  const email = getEl("txtEmail").value.trim();
  const senha = getEl("txtSenha").value;

  if (!email || !senha) {
    showToast("Preencha o e-mail e a senha.", "error");
    return;
  }

  if (!supabase) {
    showToast("Supabase não configurado ou offline.", "error");
    return;
  }

  try {
    showToast("Autenticando...", "info");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error) {
      showToast(`Falha no login: ${error.message || "Credenciais inválidas"}`, "error");
      return;
    }

    if (data && data.user) {
      const chkLembrarEmail = getEl("chkLembrarEmail");
      if (chkLembrarEmail && chkLembrarEmail.checked) {
        localStorage.setItem("lembrar_email", email);
      } else {
        localStorage.removeItem("lembrar_email");
      }

      const nome = data.user.user_metadata?.full_name || data.user.email || "Operador";
      logarUsuario(nome);
      showToast(`Acesso concedido. Bem-vindo, ${nome}!`, "success");
    }
  } catch (e) {
    showToast(`Erro ao realizar login: ${e.message || e}`, "error");
  }
}
window.executarLogin = executarLogin;

export async function executarCadastro() {
  const nome = getEl("txtNomeUsuario").value.trim();
  const email = getEl("txtEmailCadastro").value.trim();
  const senha = getEl("txtNovaSenha").value;
  const confirmar = getEl("txtConfirmarSenha").value;

  if (!nome) {
    showToast("Nome completo é obrigatório.", "error");
    return;
  }
  if (!email) {
    showToast("E-mail é obrigatório.", "error");
    return;
  }
  if (!senha) {
    showToast("Senha é obrigatória.", "error");
    return;
  }
  if (senha !== confirmar) {
    showToast("As senhas não conferem.", "error");
    return;
  }

  if (!supabase) {
    showToast("Supabase não configurado.", "error");
    return;
  }

  try {
    showToast("Definindo cadastro...", "info");
    const { data, error } = await supabase.auth.updateUser({
      password: senha,
      data: { full_name: nome },
    });

    if (error) {
      showToast(`Falha ao definir cadastro: ${error.message || error}`, "error");
      return;
    }

    if (data && data.user) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      showToast("Cadastro definido e ativado com sucesso!", "success");
      logarUsuario(nome);
    }
  } catch (e) {
    showToast(`Erro no cadastro: ${e.message || e}`, "error");
  }
}
window.executarCadastro = executarCadastro;

export async function fazerLogout() {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
  localStorage.removeItem("usuarioAutenticado");

  const rememberedEmail = localStorage.getItem("lembrar_email");
  const txtEmail = getEl("txtEmail");
  if (txtEmail) {
    txtEmail.value = rememberedEmail || "";
  }
  const txtSenha = getEl("txtSenha");
  if (txtSenha) txtSenha.value = "";

  const elTxtNomeUsuario = getEl("txtNomeUsuario");
  if (elTxtNomeUsuario) elTxtNomeUsuario.value = "";

  const txtEmailCadastro = getEl("txtEmailCadastro");
  if (txtEmailCadastro) {
    txtEmailCadastro.value = "";
    txtEmailCadastro.disabled = false;
    txtEmailCadastro.readOnly = false;
    txtEmailCadastro.classList.remove(
      "bg-slate-200",
      "cursor-not-allowed",
      "font-semibold",
      "text-slate-500",
    );
    txtEmailCadastro.placeholder = "roberto@empresa.com";
  }

  const elTxtNovaSenha = getEl("txtNovaSenha");
  if (elTxtNovaSenha) elTxtNovaSenha.value = "";
  const elTxtConfirmarSenha = getEl("txtConfirmarSenha");
  if (elTxtConfirmarSenha) elTxtConfirmarSenha.value = "";

  const elTelaDashboard = getEl("tela-dashboard");
  if (elTelaDashboard) elTelaDashboard.classList.add("hidden");
  const elTelaAutenticacao = getEl("tela-autenticacao");
  if (elTelaAutenticacao) elTelaAutenticacao.classList.remove("hidden");

  mostrarTelaLogin();
  showToast("Sessão encerrada.", "warning");
}
window.fazerLogout = fazerLogout;

export function syncReferencia(val) {
  const elTxtReferencia = getEl("txtReferencia");
  if (elTxtReferencia) elTxtReferencia.value = val;
  const elIptReferenciaInterna = getEl("iptReferenciaInterna");
  if (elIptReferenciaInterna) {
    elIptReferenciaInterna.value = val;
  }
  renderNotas(true);
  renderAuditoria(true);
}
window.syncReferencia = syncReferencia;

export async function verificarAutenticacao() {
  if (!supabase) return false;

  const urlString = window.location.href + window.location.hash;
  const hasInviteOrRecovery =
    urlString.includes("type=invite") ||
    urlString.includes("type=recovery") ||
    urlString.includes("type=signup") ||
    urlString.includes("access_token=");

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || (await supabase.auth.getUser())?.data?.user;

    if (user) {
      if (hasInviteOrRecovery) {
        mostrarTelaPrimeiroAcesso(true);
        const txtEmailCadastro = getEl("txtEmailCadastro");
        if (txtEmailCadastro) {
          txtEmailCadastro.value = user.email || "";
          txtEmailCadastro.disabled = true;
          txtEmailCadastro.readOnly = true;
          txtEmailCadastro.classList.add(
            "bg-slate-200",
            "cursor-not-allowed",
            "font-semibold",
            "text-slate-500",
          );
        }
        showToast("Por favor, defina seu nome e senha para o primeiro acesso.", "info");
        return false;
      }
      const nome = user.user_metadata?.full_name || user.email || "Operador";
      logarUsuario(nome);
      return true;
    }
  } catch (e) {
    console.error("Erro ao verificar autenticação:", e);
  }

  getEl("tela-autenticacao").classList.remove("hidden");
  getEl("tela-dashboard").classList.add("hidden");

  const rememberedEmail = localStorage.getItem("lembrar_email");
  const txtEmail = getEl("txtEmail");
  const chkLembrarEmail = getEl("chkLembrarEmail");
  if (rememberedEmail && txtEmail) {
    txtEmail.value = rememberedEmail;
    if (chkLembrarEmail) chkLembrarEmail.checked = true;
  }

  return false;
}
window.verificarAutenticacao = verificarAutenticacao;

// Export functions
export function limparTabelaParaExportacao(tableClone) {
  const thead = tableClone.querySelector("thead");
  if (!thead) return;
  const headers = Array.from(thead.querySelectorAll("th"));
  
  const indicesToRemove = [];
  const realTable = getEl("tableNotas");
  const realPccDet = realTable ? realTable.querySelector(".col-pcc-det") : null;
  const hideDetailedPcc = realPccDet ? realPccDet.classList.contains("hidden") : true;

  headers.forEach((th, idx) => {
    const text = th.textContent.toLowerCase();
    const isConferir = th.id === "th-conferir" || th.querySelector("input[type=checkbox]");
    const isOperador = text.includes("operador");
    const isAcoes = text.includes("ações") || text.includes("acoes") || text.includes("delete") || text.includes("excluir");
    const isDetailedPcc = th.classList.contains("col-pcc-det");

    if (isConferir || isOperador || isAcoes || (isDetailedPcc && hideDetailedPcc)) {
      indicesToRemove.push(idx);
    }
  });

  // Sort indices descending to remove from the end first without shifting preceding columns
  indicesToRemove.sort((a, b) => b - a);

  const rows = Array.from(tableClone.querySelectorAll("tr"));
  rows.forEach((row) => {
    indicesToRemove.forEach((idx) => {
      if (row.cells[idx]) {
        row.deleteCell(idx);
      }
    });
  });
}
window.limparTabelaParaExportacao = limparTabelaParaExportacao;

export function exportarExcel() {
  let table = getEl("tableNotas").cloneNode(true);
  
  // Replace the tbody with all filtered rows of the period (un-paginated!)
  const tbody = table.querySelector("tbody");
  if (tbody && window.notasFiltradasAtivas && window.notasFiltradasAtivas.length > 0) {
    let allRowsHtml = "";
    window.notasFiltradasAtivas.forEach((n) => {
      allRowsHtml += window.obterRowHtml(n);
    });
    tbody.innerHTML = allRowsHtml;
  }

  // Pure clean: remove checkbox column, Operador, Ações, and hidden detailed PCC column
  limparTabelaParaExportacao(table);

  let thead = table.querySelector("thead");
  if (thead) {
    let cells = thead.querySelectorAll("th");
    cells.forEach((cell) => {
      let text = cell.textContent.replace(/↕/g, "").replace(/\[\+\]/g, "").replace(/\[\-\]/g, "").trim();
      cell.innerHTML = `<strong>${text}</strong>`;
    });
  }

  const numericProps = ["valor", "iss", "inss", "ir", "pisDigitado", "valPIS", "valCOFINS", "valCSLL"];
  Array.from(table.querySelectorAll("tbody tr")).forEach((tr) => {
    Array.from(tr.cells).forEach((cell) => {
      let prop = cell.getAttribute("data-prop");
      if (numericProps.includes(prop)) {
        let numVal = parseMoney(cell.textContent || cell.innerText);
        cell.setAttribute("x:num", numVal.toFixed(2));
        cell.setAttribute("style", "mso-number-format:'\"R$\"\\ #\\,##0\\.00'; text-align: right;");
      } else if (prop === "codCond" || prop === "cnpj" || prop === "numNota") {
        cell.setAttribute("style", "mso-number-format:'\\@';");
      }
    });
  });

  let html = `
  <html xmlns:x="urn:schemas-microsoft-com:office:excel">
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    <table border="1">${table.innerHTML}</table>
  </body>
  </html>`;

  let blob = new Blob([html], { type: "application/vnd.ms-excel" });
  let url = URL.createObjectURL(blob);
  let link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `notas-fiscais-${getEl("txtReferencia").value}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
window.exportarExcel = exportarExcel;

export function exportarPdf() {
  try {
    let win = window.open("", "_blank");
    if (win) {
      let tableClone = getEl("tableNotas").cloneNode(true);
      
      // Replace the tbody with all filtered rows of the period (un-paginated!)
      const tbody = tableClone.querySelector("tbody");
      if (tbody && window.notasFiltradasAtivas && window.notasFiltradasAtivas.length > 0) {
        let allRowsHtml = "";
        window.notasFiltradasAtivas.forEach((n) => {
          allRowsHtml += window.obterRowHtml(n);
        });
        tbody.innerHTML = allRowsHtml;
      }

      // Pure clean: remove checkbox column, Operador, Ações, and hidden detailed PCC column
      limparTabelaParaExportacao(tableClone);

      let thead = tableClone.querySelector("thead");
      if (thead) {
        let cells = thead.querySelectorAll("th");
        cells.forEach((cell) => {
          let text = cell.textContent.replace(/↕/g, "").replace(/\[\+\]/g, "").replace(/\[\-\]/g, "").trim();
          cell.innerHTML = text;
        });
      }

      win.document.write(`
              <html>
              <head>
                  <title>Notas Fiscais</title>
                  <style>
                      body { font-family: sans-serif; margin: 20px; color: #334155; }
                      h2 { font-size: 16px; color: #1e293b; margin-bottom: 20px; font-family: sans-serif; font-weight: bold; }
                      table { border-collapse: collapse; width: 100%; font-size: 10px; }
                      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
                      th { background-color: #f1f5f9; font-weight: bold; color: #475569; }
                      .text-right { text-align: right; }
                      .text-center { text-align: center; }
                  </style>
              </head>
              <body>
                  <h2>Relatório de Notas</h2>
                  ${tableClone.outerHTML}
              </body>
              </html>
          `);
      win.document.close();
      win.focus();
      win.print();
      win.close();
    } else {
      showToast("Para imprimir, abra o aplicativo em uma nova guia pelo botão superior do AI Studio.", "warning");
    }
  } catch (e) {
    window.print();
  }
}
window.exportarPdf = exportarPdf;

export function toggleDropdownExportar(event, forceState) {
  if (event) {
    event.stopPropagation();
  }
  const menu = document.getElementById("menuExportar");
  const arrow = document.getElementById("arrowDropdownExportar");
  if (!menu) return;
  
  const isHidden = menu.classList.contains("hidden");
  const show = typeof forceState === "boolean" ? forceState : isHidden;

  if (show) {
    menu.classList.remove("hidden");
    if (arrow) arrow.style.transform = "rotate(180deg)";
  } else {
    menu.classList.add("hidden");
    if (arrow) arrow.style.transform = "rotate(0deg)";
  }
}
window.toggleDropdownExportar = toggleDropdownExportar;

// Close dropdown on click outside
document.addEventListener("click", () => {
  toggleDropdownExportar(null, false);
});

// --- INLINE AND BULK ACTIONS ---
export async function toggleStatusServicoClick(e, uniqueId) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  let nota = window.dbNotas.find((n) => n.cnpj + "|" + n.numNota === uniqueId);
  if (!nota || !nota.outroMunicipio) return;

  let currentStatus = (nota.statusServico || "Pendente").trim().toUpperCase();
  let newStatus = currentStatus === "OK" ? "Pendente" : "OK";

  let btn = e ? e.currentTarget : null;
  if (!btn) return;
  let tr = btn.closest("tr");
  let actionsBtn = tr ? tr.querySelector(".btn-acao") : null;
  let isEditing = actionsBtn && actionsBtn.dataset.editing === "true";

  if (isEditing) {
    nota.statusServico = newStatus;
    let statusTextEl = btn.querySelector(".status-text");
    let dotEl = btn.querySelector("span:first-child");
    
    if (newStatus === "OK") {
      if (statusTextEl) statusTextEl.innerText = "OK";
      btn.className = "status-btn px-2.5 py-1 text-[11px] font-extrabold uppercase rounded cursor-pointer transition-all hover:scale-105 shadow-sm inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300";
      if (dotEl) dotEl.className = "w-1.5 h-1.5 rounded-full bg-emerald-500";
    } else {
      if (statusTextEl) statusTextEl.innerText = "Pendente";
      btn.className = "status-btn px-2.5 py-1 text-[11px] font-extrabold uppercase rounded cursor-pointer transition-all hover:scale-105 shadow-sm inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300";
      if (dotEl) dotEl.className = "w-1.5 h-1.5 rounded-full bg-amber-505";
    }
    showToast(`Status alterado para ${newStatus}. Salve a linha para confirmar no banco.`, "info");
  } else {
    nota.statusServico = newStatus;
    let oper = getOperador();
    let refSelecionada = getEl("txtReferencia").value;

    try {
      window.dbAuditoria.unshift({
        dataHora: formatDateTime(new Date()),
        operador: oper,
        acao: "UPDATE_STATUS",
        entidade: nota.codCond,
        recurso: nota.cnpj,
        descricao: `Alteração de status de serviço para [${newStatus}] na NF [${nota.numNota}]`,
        referencia: refSelecionada,
        numNota: nota.numNota,
      });

      await supabase
        .from("notas_fiscais")
        .update({ status_servico: newStatus })
        .eq("id", nota.id);

      await supabase.from("logs_auditoria").insert([
        {
          operador: oper,
          acao: "UPDATE_STATUS",
          entidade: nota.codCond,
          recurso: nota.cnpj,
          descricao: `Alteração de status de serviço para [${newStatus}] na NF [${nota.numNota}]`,
          referencia: refSelecionada,
          num_nota: nota.numNota,
        },
      ]);

      showToast(`Status atualizado para ${newStatus}!`, "success");
      renderNotas(false);
      renderAuditoria(true);
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar alteração de status.", "error");
    }
  }
}
window.toggleStatusServicoClick = toggleStatusServicoClick;

let currentRowInEdit = null;

export function startEditRow(gridName, id, trEl, event) {
  if (currentRowInEdit && currentRowInEdit !== trEl) {
    endEditRow(currentRowInEdit);
  }
  currentRowInEdit = trEl;
  let btnObj = trEl.querySelector(".btn-acao");
  if (btnObj.dataset.editing === "true") return;

  btnObj.dataset.editing = "true";
  btnObj.innerHTML = '<span class="material-symbols-outlined text-[16px]">save</span>';
  btnObj.classList.replace("text-red-600", "text-emerald-700");
  btnObj.classList.replace("hover:bg-red-50", "hover:bg-emerald-50");

  let tds = trEl.querySelectorAll(".editable-cell");
  tds.forEach((td) => {
    if (td.dataset.prop === "statusServico") return;
    td.contentEditable = "true";
    td.classList.add("bg-yellow-50", "border-2", "border-yellow-400", "outline-none");

    if (["valPIS", "valCOFINS", "valCSLL"].includes(td.dataset.prop)) {
      td.addEventListener("input", function () {
        let tr = this.closest("tr");
        let p = parseMoney(tr.querySelector('[data-prop="valPIS"]').innerText);
        let c = parseMoney(tr.querySelector('[data-prop="valCOFINS"]').innerText);
        let s = parseMoney(tr.querySelector('[data-prop="valCSLL"]').innerText);
        tr.querySelector('[data-prop="pisDigitado"]').innerText = formatMoney(p + c + s);
      });
    }

    td.addEventListener("focus", function () {
      let range = document.createRange();
      range.selectNodeContents(this);
      let sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    td.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        this.blur();
      }
    });

    if (td.dataset.prop === "codCond" || td.dataset.prop === "codigo") {
      td.addEventListener("input", function (e) {
        if (e.inputType === "deleteContentBackward") return;
        let v = this.innerText;
        if (v.length > 3) {
          this.innerText = v.substring(0, 3);
          let sel = window.getSelection();
          let range = document.createRange();
          range.setStart(this.firstChild, 3);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    }

    if (td.dataset.prop === "cnpj") {
      td.addEventListener("input", function (e) {
        if (e.inputType === "deleteContentBackward") return;
        applyMaskToContentEditable(this, function (val) {
          if (val.length > 14) val = val.substring(0, 14);
          return mascararCNPJ(val);
        });
      });
      td.addEventListener("blur", function () {
        this.innerText = mascararCNPJ(this.innerText);
      });
    }

    if (td.dataset.prop === "dataCompleta") {
      td.addEventListener("input", function (e) {
        if (e.inputType === "deleteContentBackward") return;
        applyMaskToContentEditable(this, function (val) {
          val = val.replace(/\D/g, "");
          if (val.length > 8) val = val.substring(0, 8);
          if (val.length >= 5) {
            return val.replace(/^(\d{2})(\d{2})(.*)/, "$1/$2/$3");
          } else if (val.length >= 3) {
            return val.replace(/^(\d{2})(.*)/, "$1/$2");
          }
          return val;
        });
      });
    }

    if (td.dataset.prop === "numNota") {
      td.addEventListener("blur", function () {
        this.innerText = this.innerText.replace(/^0+/, "") || "0";
      });
    }

    if (td.dataset.prop === "nome") {
      td.addEventListener("blur", function () {
        this.innerText = titleCase(this.innerText.trim());
      });
    }
  });

  showToast("Modo de edição ativo. Altere a célula e clique fora para salvar.", "info");
  if (event) {
    let clickedTd = event.target.closest(".editable-cell");
    if (clickedTd) {
      setTimeout(() => clickedTd.focus(), 10);
    }
  }
}
window.startEditRow = startEditRow;

export function endEditRow(trEl) {
  let btnObj = trEl.querySelector(".btn-acao");
  if (!btnObj) return;
  btnObj.dataset.editing = "false";
  btnObj.innerHTML = '<span class="material-symbols-outlined text-[16px]">delete</span>';
  btnObj.classList.replace("text-emerald-700", "text-red-600");
  btnObj.classList.replace("hover:bg-emerald-50", "hover:bg-red-50");

  let tds = trEl.querySelectorAll(".editable-cell");
  tds.forEach((td) => {
    td.contentEditable = "false";
    td.classList.remove("bg-yellow-50", "border-2", "border-yellow-400", "outline-none");
  });
  currentRowInEdit = null;
}
window.endEditRow = endEditRow;

export function showConfirm(message, onConfirm, onCancel) {
  let overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm";
  overlay.innerHTML = `
      <div class="bg-white rounded shadow-2xl p-6 w-96 max-w-[90%] transform transition-all scale-100">
          <h3 class="text-lg font-bold text-slate-800 mb-4">${message}</h3>
          <div class="flex justify-end gap-3 mt-6">
              <button class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium transition-colors" id="btnConfirmNo">Não</button>
              <button class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors" id="btnConfirmYes">Sim</button>
          </div>
      </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector("#btnConfirmNo").addEventListener("click", () => {
    document.body.removeChild(overlay);
    if (onCancel) onCancel();
  });
  overlay.querySelector("#btnConfirmYes").addEventListener("click", () => {
    document.body.removeChild(overlay);
    if (onConfirm) onConfirm();
  });
}
window.showConfirm = showConfirm;

export function handleAcaoRow(gridName, id, btnObj) {
  try {
    if (btnObj.dataset.editing === "true") {
      let tr = btnObj.closest("tr");
      let props = {};
      let tds = tr.querySelectorAll(".editable-cell");
      tds.forEach((td) => {
        props[td.dataset.prop] = td.innerText;
      });

      let oBruto = 0;
      let oIss = 0;
      let oInss = 0;
      let oIr = 0;
      let oPIS = 0;
      let oCOFINS = 0;
      let oCSLL = 0;
      let oPISDigitado = 0;

      if (gridName === "notas") {
        oBruto = parseMoney(props.valor);
        oIss = parseMoney(props.iss);
        oInss = parseMoney(props.inss);
        oIr = parseMoney(props.ir);
        oPIS = parseMoney(props.valPIS);
        oCOFINS = parseMoney(props.valCOFINS);
        oCSLL = parseMoney(props.valCSLL);
        oPISDigitado = parseMoney(props.pisDigitado);

        if (oBruto <= 0) {
          showToast("Valor Bruto editado inválido.", "error");
          return;
        }
        if (oIss > oBruto * 0.1) {
          showToast("ISS não pode exceder 10% do Valor Bruto.", "error");
          return;
        }
      }

      (async () => {
        try {
          if (gridName === "notas") {
            let originalCnpj = id.split("|")[0];
            let originalNota = id.split("|")[1];

            let rowEncontrada = window.dbNotas.find(n => 
              String(n.cnpj).replace(/[^\d]+/g, "") === originalCnpj.replace(/[^\d]+/g, "") && 
              String(n.numNota).trim() === originalNota.trim()
            );

            if (rowEncontrada) {
              let cleanNewCnpj = String(props.cnpj || "").replace(/[^\d]+/g, "");
              if (!validarCNPJ(props.cnpj)) {
                showToast("CNPJ editado inválido.", "error");
                return;
              }

              let codCondLimpo = String(props.codCond || "").trim().toUpperCase();
              let condBsc = window.dbCondominios.find(c => c.codigo === codCondLimpo);
              let nomeCondResult = rowEncontrada.nomeCond;
              if (condBsc) {
                nomeCondResult = condBsc.nome;
              } else {
                try {
                  const { data } = await supabase
                    .from("condominios")
                    .select("razao_social")
                    .eq("codigo", codCondLimpo)
                    .maybeSingle();
                  if (data) {
                    nomeCondResult = data.razao_social;
                  } else {
                    showToast(`Cód. Condominio ${codCondLimpo} não encontrado no banco.`, "error");
                    return;
                  }
                } catch (eCond) {}
              }

              let empBsc = window.dbEmpresas.find(x => x.cnpj === cleanNewCnpj);
              let nomeEmpResult = rowEncontrada.nomeEmp;
              if (empBsc) {
                nomeEmpResult = empBsc.nome;
              } else {
                try {
                  const { data } = await supabase
                    .from("empresas")
                    .select("razao_social")
                    .eq("cnpj", cleanNewCnpj)
                    .maybeSingle();
                  if (data) {
                    nomeEmpResult = data.razao_social;
                  } else {
                    await supabase.from("empresas").insert([{ cnpj: cleanNewCnpj, razao_social: "FORNECEDOR AUTOMÁTICO" }]);
                    nomeEmpResult = "FORNECEDOR AUTOMÁTICO";
                  }
                } catch (eEmp) {}
              }

              let numNotaLimpo = String(props.numNota).replace(/^0+/, "").trim() || "0";

              if (cleanNewCnpj !== originalCnpj || numNotaLimpo !== originalNota) {
                const { data: dupCheck } = await supabase
                  .from("notas_fiscais")
                  .select("id")
                  .eq("empresa_cnpj", cleanNewCnpj)
                  .eq("numero_nota", numNotaLimpo)
                  .limit(1);
                if (dupCheck && dupCheck.length > 0) {
                  showToast(`Já existe Nota ${numNotaLimpo} para este CNPJ editado no banco!`, "error");
                  return;
                }
              }

              await supabase
                .from("notas_fiscais")
                .update({
                  condominio_codigo: codCondLimpo,
                  empresa_cnpj: cleanNewCnpj,
                  numero_nota: numNotaLimpo,
                  data_consolidada: props.dataCompleta,
                  referencia: rowEncontrada.referencia,
                  valor_bruto: oBruto,
                  iss: oIss,
                  inss: oInss,
                  ir: oIr,
                  val_pis: oPIS,
                  val_cofins: oCOFINS,
                  val_csll: oCSLL,
                  is_pcc: oPISDigitado > 0,
                  pis_digitado: oPISDigitado,
                  cod_servico: props.codServico !== "-" ? props.codServico : null,
                  status_servico: props.statusServico !== "-" ? props.statusServico : null
                })
                .eq("id", rowEncontrada.id);

              let oper = getOperador();
              await supabase.from("logs_auditoria").insert([
                {
                  operador: oper,
                  acao: "UPDATE_INVOICE",
                  entidade: codCondLimpo,
                  recurso: cleanNewCnpj,
                  descricao: `Edição de nota [NF ${numNotaLimpo}] - Valor Original: ${formatMoney(rowEncontrada.valor)} | Novo: ${formatMoney(oBruto)}`,
                  referencia: rowEncontrada.referencia,
                  num_nota: numNotaLimpo,
                },
              ]);

              showToast("Nota editada e salva com sucesso!", "success");
            }
          } else if (gridName === "empresas") {
            let cleanNewCnpj = String(props.cnpj || "").replace(/[^\d]+/g, "").padStart(14, "0");
            if (!validarCNPJ(props.cnpj)) {
              showToast("CNPJ inválido.", "error");
              return;
            }
            await supabase
              .from("empresas")
              .update({ razao_social: titleCase(props.nome) })
              .eq("cnpj", id);

            let oper = getOperador();
            await supabase.from("logs_auditoria").insert([
              {
                operador: oper,
                acao: "UPDATE_EMPRESA",
                entidade: cleanNewCnpj,
                recurso: props.nome,
                descricao: `Empresa [CNPJ ${cleanNewCnpj}] atualizada na administração`,
                referencia: getEl("txtReferencia").value,
              },
            ]);

            showToast("Empresa atualizada!", "success");
          } else if (gridName === "cond") {
            let codCondLimpo = String(props.codigo || "").trim().toUpperCase();
            if (codCondLimpo.length !== 3) {
              showToast("Cód. Condominio inválido.", "error");
              return;
            }
            await supabase
              .from("condominios")
              .update({ razao_social: titleCase(props.nome) })
              .eq("codigo", id);

            let oper = getOperador();
            await supabase.from("logs_auditoria").insert([
              {
                operador: oper,
                acao: "UPDATE_CONDOMINIO",
                entidade: codCondLimpo,
                recurso: props.nome,
                descricao: `Condomínio [Cód ${codCondLimpo}] atualizado na administração`,
                referencia: getEl("txtReferencia").value,
              },
            ]);

            showToast("Condomínio atualizado!", "success");
          }

          endEditRow(tr);
          await renderNotas(true);
          await renderEmpresas(true);
          await renderCondominios(true);
          await renderAuditoria(true);
        } catch (dbError) {
          console.error(dbError);
          showToast("Erro ao gravar edição no banco.", "error");
        }
      })();
      return;
    }

    showConfirm(
      `Confirma a exclusão deste item de ID [${id}]? Esta operação é definitiva.`,
      async () => {
        try {
          if (gridName === "notas") {
            let cleanCnpj = id.split("|")[0];
            let cleanNota = id.split("|")[1];

            let row = window.dbNotas.find((n) => {
              let rowCnpj = String(n.cnpj).replace(/[^\d]+/g, "");
              return (
                rowCnpj === cleanCnpj.replace(/[^\d]+/g, "") &&
                String(n.numNota).trim() === cleanNota.trim()
              );
            });

            if (row) {
              await supabase.from("notas_fiscais").delete().eq("id", row.id);

              let oper = getOperador();
              await supabase.from("logs_auditoria").insert([
                {
                  operador: oper,
                  acao: "DELETE_INVOICE",
                  entidade: row.codCond,
                  recurso: cleanCnpj,
                  descricao: `Exclusão de NF [${cleanNota}] no valor de ${formatMoney(row.valor)}`,
                  referencia: row.referencia,
                  num_nota: cleanNota,
                },
              ]);
            }
          } else if (gridName === "empresas") {
            await supabase.from("empresas").delete().eq("cnpj", id);

            let oper = getOperador();
            await supabase.from("logs_auditoria").insert([
              {
                operador: oper,
                acao: "DELETE_EMPRESA",
                entidade: id,
                recurso: "",
                descricao: `Exclusão manual de cadastro de Empresa fornecedora`,
                referencia: getEl("txtReferencia").value,
              },
            ]);
          } else if (gridName === "cond") {
            await supabase.from("condominios").delete().eq("codigo", id);

            let oper = getOperador();
            await supabase.from("logs_auditoria").insert([
              {
                operador: oper,
                acao: "DELETE_CONDOMINIO",
                entidade: id,
                recurso: "",
                descricao: `Exclusão manual de condomínio administrador`,
                referencia: getEl("txtReferencia").value,
              },
            ]);
          }

          showToast("Registro excluído!", "warning");
          await renderNotas(true);
          await renderEmpresas(true);
          await renderCondominios(true);
          await renderAuditoria(true);
        } catch (err) {
          console.error(err);
          showToast("Erro ao executar ação de exclusão.", "error");
        }
      },
    );
  } catch (ex) {
    console.error(ex);
  }
}
window.handleAcaoRow = handleAcaoRow;

export function applyMaskToContentEditable(el, maskFn) {
  let sel = window.getSelection();
  if (!sel.rangeCount) return;
  let range = sel.getRangeAt(0);

  let preCursorText = el.innerText.substring(0, range.startOffset);
  let rawDigitsBeforeCursor = preCursorText.replace(/\D/g, "").length;

  let rawVal = el.innerText.replace(/\D/g, "");
  let formattedVal = maskFn(rawVal);

  if (el.innerText !== formattedVal) {
    el.innerText = formattedVal;

    let newPos = 0;
    let digitsMatched = 0;
    for (let i = 0; i < formattedVal.length; i++) {
      if (/\d/.test(formattedVal[i])) {
        digitsMatched++;
      }
      if (digitsMatched === rawDigitsBeforeCursor) {
        newPos = i + 1;
        while (newPos < formattedVal.length && !/\d/.test(formattedVal[newPos])) {
          newPos++;
        }
        break;
      }
    }
    if (rawDigitsBeforeCursor === 0) newPos = 0;

    if (el.firstChild) {
      let newRange = document.createRange();
      newRange.setStart(el.firstChild, Math.min(newPos, el.firstChild.length));
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  }
}
window.applyMaskToContentEditable = applyMaskToContentEditable;

export function salvarNovoCondominio() {
  let cod = getEl("novaCodCond").value.trim().toUpperCase();
  let nome = titleCase(getEl("novoNomeCond").value.trim());

  if (cod.length !== 3) {
    showToast("Código deve ter 3 dígitos.", "error");
    return;
  }
  if (!nome) {
    showToast("Nome é obrigatório.", "error");
    return;
  }

  if (window.dbCondominios.some((c) => c.codigo === cod)) {
    showToast("Código já cadastrado.", "error");
    return;
  }

  (async () => {
    try {
      const { error } = await supabase
        .from("condominios")
        .insert([{ codigo: cod, razao_social: nome }]);
      if (error) {
        showToast("Erro ao gravar: " + error.message, "error");
        return;
      }
      let oper = getOperador();
      await supabase.from("logs_auditoria").insert([
        {
          operador: oper,
          acao: "ADD_CONDOMINIO",
          entidade: cod,
          recurso: nome,
          descricao: `Novo condomínio adicionado manualmente`,
          referencia: getEl("txtReferencia").value,
        },
      ]);
      showToast("Condomínio adicionado com sucesso.", "success");
      getEl("modalNovoCond").classList.add("hidden");
      getEl("novaCodCond").value = "";
      getEl("novoNomeCond").value = "";
      renderCondominios(true);
    } catch (e) {
      console.error(e);
      showToast("Erro ao criar condomínio.", "error");
    }
  })();
}
window.salvarNovoCondominio = salvarNovoCondominio;

export function processarLoteCondominio() {
  let txt = getEl("txtLoteCond").value.trim();
  if (!txt) return;

  let linhas = txt.split("\n");
  let itemsToUpsert = [];
  let inseridos = 0;
  let atualizados = 0;

  linhas.forEach((linha) => {
    let partes = linha.split("\t");
    if (partes.length >= 2) {
      let cod = partes[0].trim().toUpperCase();
      let nome = titleCase(partes[1].trim());
      if (cod.length === 3 && nome) {
        let existente = window.dbCondominios.find((c) => c.codigo === cod);
        if (existente) {
          atualizados++;
        } else {
          inseridos++;
        }
        itemsToUpsert.push({ codigo: cod, razao_social: nome });
      }
    }
  });

  if (itemsToUpsert.length === 0) {
    showToast("Nenhum condomínio válido encontrado no texto.", "warning");
    return;
  }

  (async () => {
    try {
      const { error } = await supabase
        .from("condominios")
        .upsert(itemsToUpsert);
      if (error) {
        showToast("Erro ao importar lote: " + error.message, "error");
        return;
      }
      let oper = getOperador();
      await supabase.from("logs_auditoria").insert([
        {
          operador: oper,
          acao: "BATCH_CONDOMINIO",
          entidade: `${itemsToUpsert.length} Condomínios`,
          recurso: "",
          descricao: `Importação em lote de ${itemsToUpsert.length} condomínios`,
          referencia: getEl("txtReferencia").value,
        },
      ]);

      showToast(
        `Lote processado: ${inseridos} inseridos, ${atualizados} atualizados.`,
        "success",
      );
      getEl("modalLoteCond").classList.add("hidden");
      getEl("txtLoteCond").value = "";
      renderCondominios(true);
    } catch (e) {
      console.error(e);
      showToast("Erro ao processar lote no banco de dados.", "error");
    }
  })();
}
window.processarLoteCondominio = processarLoteCondominio;

export function salvarNovaEmpresa() {
  let cnpjInput = getEl("novaCnpjEmp").value.trim();
  let cnpjLimpo = cnpjInput.replace(/[^\d]+/g, "").padStart(14, "0");
  let nome = titleCase(getEl("novoNomeEmp").value.trim());

  if (!validarCNPJ(cnpjInput)) {
    showToast("CNPJ inválido.", "error");
    return;
  }
  if (!nome) {
    showToast("Razão Social é obrigatória.", "error");
    return;
  }

  if (window.dbEmpresas.some((e) => e.cnpj === cnpjLimpo)) {
    showToast("CNPJ já cadastrado.", "error");
    return;
  }

  (async () => {
    try {
      const { error } = await supabase
        .from("empresas")
        .insert([{ cnpj: cnpjLimpo, razao_social: nome }]);
      if (error) {
        showToast("Erro ao gravar: " + error.message, "error");
        return;
      }
      let oper = getOperador();
      await supabase.from("logs_auditoria").insert([
        {
          operador: oper,
          acao: "ADD_EMPRESA",
          entidade: cnpjLimpo,
          recurso: nome,
          descricao: `Nova empresa cadastrada manualmente`,
          referencia: getEl("txtReferencia").value,
        },
      ]);
      showToast("Empresa adicionada com sucesso.", "success");
      getEl("modalNovaEmp").classList.add("hidden");
      getEl("novaCnpjEmp").value = "";
      getEl("novoNomeEmp").value = "";
      renderEmpresas(true);
    } catch (e) {
      console.error(e);
      showToast("Erro ao criar empresa.", "error");
    }
  })();
}
window.salvarNovaEmpresa = salvarNovaEmpresa;

export function processarLoteEmpresa() {
  let txt = getEl("txtLoteEmp").value.trim();
  if (!txt) return;

  let linhas = txt.split("\n");
  let itemsToUpsert = [];
  let inseridos = 0;
  let atualizados = 0;

  linhas.forEach((linha) => {
    let partes = linha.split("\t");
    if (partes.length >= 2) {
      let cnpjLimpo = partes[0].replace(/[^\d]+/g, "").padStart(14, "0");
      let nome = titleCase(partes[1].trim());

      if (cnpjLimpo && nome) {
        let existente = window.dbEmpresas.find((e) => e.cnpj === cnpjLimpo);
        if (existente) {
          atualizados++;
        } else {
          inseridos++;
        }
        itemsToUpsert.push({ cnpj: cnpjLimpo, razao_social: nome });
      }
    }
  });

  if (itemsToUpsert.length === 0) {
    showToast("Nenhuma empresa válida encontrada no texto.", "warning");
    return;
  }

  (async () => {
    try {
      const { error } = await supabase
        .from("empresas")
        .upsert(itemsToUpsert);
      if (error) {
        showToast("Erro ao importar lote: " + error.message, "error");
        return;
      }
      let oper = getOperador();
      await supabase.from("logs_auditoria").insert([
        {
          operador: oper,
          acao: "BATCH_EMPRESA",
          entidade: `${itemsToUpsert.length} Empresas`,
          recurso: "",
          descricao: `Importação em lote de ${itemsToUpsert.length} empresas`,
          referencia: getEl("txtReferencia").value,
        },
      ]);

      showToast(
        `Lote processado: ${inseridos} inseridos, ${atualizados} atualizados.`,
        "success",
      );
      getEl("modalLoteEmp").classList.add("hidden");
      getEl("txtLoteEmp").value = "";
      renderEmpresas(true);
    } catch (e) {
      console.error(e);
      showToast("Erro ao processar lote no banco de dados.", "error");
    }
  })();
}
window.processarLoteEmpresa = processarLoteEmpresa;

// --- REALTIME INITIALIZATION ---
let realtimeInicializado = false;
export function inicializarRealtime() {
  if (!supabase) return;
  if (realtimeInicializado) {
    console.log("Inscrição em tempo real já ativa.");
    return;
  }

  console.log("Inicializando inscrições em tempo real (Supabase Realtime)...");

  try {
    const canalNotas = supabase
      .channel("realtime_notas")
      .on("postgres_changes", { event: "*", schema: "public", table: "notas_fiscais" }, async (payload) => {
        console.log("Alteração em tempo real [notas_fiscais]:", payload);
        if (window.isBatchUpdating) {
          console.log("Ignorando evento em tempo real de notas devido a atualização em lote.");
          return;
        }
        await renderNotas(true);
      })
      .subscribe((status) => {
        console.log("Status canal notas:", status);
      });

    const canalEmpresas = supabase
      .channel("realtime_empresas")
      .on("postgres_changes", { event: "*", schema: "public", table: "empresas" }, async (payload) => {
        console.log("Alteração em tempo real [empresas]:", payload);
        await renderEmpresas(true);
      })
      .subscribe((status) => {
        console.log("Status canal empresas:", status);
      });

    const canalCondominios = supabase
      .channel("realtime_condominios")
      .on("postgres_changes", { event: "*", schema: "public", table: "condominios" }, async (payload) => {
        console.log("Alteração em tempo real [condominios]:", payload);
        await renderCondominios(true);
      })
      .subscribe((status) => {
        console.log("Status canal condominios:", status);
      });

    const canalAuditoria = supabase
      .channel("realtime_auditoria")
      .on("postgres_changes", { event: "*", schema: "public", table: "logs_auditoria" }, async (payload) => {
        console.log("Alteração em tempo real [logs_auditoria]:", payload);
        if (window.isBatchUpdating) {
          console.log("Ignorando evento em tempo real de auditoria devido a atualização em lote.");
          return;
        }
        await renderAuditoria(true);
      })
      .subscribe((status) => {
        console.log("Status canal auditoria:", status);
      });

    realtimeInicializado = true;
    console.log("Inscrições em tempo real ativadas com sucesso!");
  } catch (error) {
    console.error("Falha ao configurar Supabase Realtime:", error);
  }
}
window.inicializarRealtime = inicializarRealtime;


// --- DOMContentLoaded WORKFLOW ENTRANCE ---
window.addEventListener("DOMContentLoaded", () => {
  localStorage.removeItem("usuarios");
  localStorage.removeItem("cadastrosUsuarios");
  localStorage.removeItem("usuarioAutenticado");

  if (supabase) {
    const urlString = window.location.href + window.location.hash;
    const temTokenUrl =
      urlString.includes("type=invite") ||
      urlString.includes("access_token=") ||
      urlString.includes("type=signup") ||
      urlString.includes("type=recovery");

    if (temTokenUrl) {
      mostrarTelaPrimeiroAcesso(true);

      let tentativas = 0;
      const intervalId = setInterval(async () => {
        tentativas++;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const user = session?.user || (await supabase.auth.getUser())?.data?.user;

          if (user && user.email) {
            const txtEmailCadastro = getEl("txtEmailCadastro");
            if (txtEmailCadastro) {
              txtEmailCadastro.value = user.email;
              txtEmailCadastro.disabled = true;
              txtEmailCadastro.readOnly = true;
              txtEmailCadastro.classList.add(
                "bg-slate-200",
                "cursor-not-allowed",
                "font-semibold",
                "text-slate-500",
              );
            }
            clearInterval(intervalId);
          }
        } catch (e) {
          console.error("Erro ao obter dados do usuário convidado na inicialização:", e);
        }
        if (tentativas > 25) {
          clearInterval(intervalId);
        }
      }, 200);
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      const urlString = window.location.href + window.location.hash;
      const hasInvite =
        urlString.includes("type=invite") ||
        urlString.includes("access_token=") ||
        urlString.includes("type=signup") ||
        event === "PASSWORD_RECOVERY";
      if (hasInvite) {
        mostrarTelaPrimeiroAcesso(true);

        const user = session?.user || (await supabase.auth.getUser())?.data?.user;
        if (user && user.email) {
          const txtEmailCadastro = getEl("txtEmailCadastro");
          if (txtEmailCadastro) {
            txtEmailCadastro.value = user.email;
            txtEmailCadastro.disabled = true;
            txtEmailCadastro.readOnly = true;
            txtEmailCadastro.classList.add(
              "bg-slate-200",
              "cursor-not-allowed",
              "font-semibold",
              "text-slate-500",
            );
          }
        }
      }
    });
  }

  const setupFieldNavigation = (inputEl, nextAction) => {
    if (!inputEl) return;
    const handleKey = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (typeof nextAction === "string") {
          const nextEl = getEl(nextAction);
          if (nextEl) nextEl.focus();
        } else if (typeof nextAction === "function") {
          nextAction();
        }
      }
    };
    inputEl.addEventListener("keydown", handleKey);
    inputEl.addEventListener("keyup", handleKey);
  };

  setupFieldNavigation(getEl("novaCnpjEmp"), "novoNomeEmp");
  setupFieldNavigation(getEl("novoNomeEmp"), salvarNovaEmpresa);
  setupFieldNavigation(getEl("novaCodCond"), "novoNomeCond");
  setupFieldNavigation(getEl("novoNomeCond"), salvarNovoCondominio);

  // Auto capitalize first letters (Title Case) on blur
  ["novoNomeEmp", "novoNomeCond", "iptRazaoSocial", "txtNomeUsuario"].forEach((id) => {
    const el = getEl(id);
    if (el) {
      el.addEventListener("blur", function () {
        this.value = titleCase(this.value.trim());
      });
    }
  });

  const now = new Date();
  const anoStr = now.getFullYear();
  const mesStr = String(now.getMonth() + 1).padStart(2, "0");
  const elTxtReferencia = getEl("txtReferencia");
  if (elTxtReferencia) {
    elTxtReferencia.value = `${anoStr}-${mesStr}`;
  }
  const elIptReferenciaInterna = getEl("iptReferenciaInterna");
  if (elIptReferenciaInterna) {
    elIptReferenciaInterna.value = `${anoStr}-${mesStr}`;
  }

  const iptValorBruto = getEl("iptValorBruto");
  const iptISS = getEl("iptISS");
  const iptINSS = getEl("iptINSS");
  const iptIR = getEl("iptIR");
  [iptValorBruto, iptISS, iptINSS, iptIR].forEach((input) => {
    if (input) input.addEventListener("input", recalcularValorLiquido);
  });
  if (getEl("chkPis")) {
    getEl("chkPis").addEventListener("change", () => {
      setTimeout(recalcularValorLiquido, 50);
    });
  }
  if (getEl("iptPIS")) getEl("iptPIS").addEventListener("input", recalcularValorLiquido);
  if (getEl("iptCOFINS")) getEl("iptCOFINS").addEventListener("input", recalcularValorLiquido);
  if (getEl("iptCSLL")) getEl("iptCSLL").addEventListener("input", recalcularValorLiquido);
  if (getEl("iptPisVal")) getEl("iptPisVal").addEventListener("input", recalcularValorLiquido);

  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      const tabLancar = getEl("tab-lancar");
      if (tabLancar && !tabLancar.classList.contains("hidden")) {
        const elCond = getEl("iptCondominio");
        const elCnpj = getEl("iptCnpj");
        const elNota = getEl("iptNota");
        const elDia = getEl("iptDiaEmissao");
        const elBruto = getEl("iptValorBruto");
        const elIss = getEl("iptISS");
        const elInss = getEl("iptINSS");
        const elIr = getEl("iptIR");
        const elChkPis = getEl("chkPis");
        const elPisVal = getEl("iptPisVal");

        if (!elCond || !elCnpj || !elNota || !elDia || !elBruto || !elIss || !elInss || !elIr || !elChkPis || !elPisVal) {
          return;
        }

        const cond = elCond.value.trim();
        const cnpj = elCnpj.value.trim();
        const nota = elNota.value.trim();
        const dia = elDia.value.trim();
        const bruto = parseFloat(elBruto.value) || 0;

        const iss = parseFloat(elIss.value) || 0;
        const inss = parseFloat(elInss.value) || 0;
        const ir = parseFloat(elIr.value) || 0;
        const chkPis = elChkPis.checked;
        const pisVal = chkPis ? parseFloat(elPisVal.value) || 0 : 0;

        const temEncargo = iss > 0 || inss > 0 || ir > 0 || pisVal > 0;

        if (cond && cnpj && nota && dia && bruto > 0 && temEncargo) {
          event.preventDefault();
          enviarNota();
        } else {
          let missing = [];
          if (!cond) missing.push("Condomínio");
          if (!cnpj) missing.push("CNPJ");
          if (!nota) missing.push("Nº Nota");
          if (!dia) missing.push("Dia de Emissão");
          if (bruto <= 0) missing.push("Valor Bruto");
          if (!temEncargo) missing.push("Pelo menos 1 encargo (>0)");

          showToast(`Não é possível enviar via Ctrl+Enter. Faltam: ${missing.join(", ")}`, "warning");
        }
      }
    }
  });

  const checkLoginEnter = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      executarLogin();
    }
  };
  const txtEmail = getEl("txtEmail");
  const txtSenha = getEl("txtSenha");
  if (txtEmail) txtEmail.addEventListener("keydown", checkLoginEnter);
  if (txtSenha) txtSenha.addEventListener("keydown", checkLoginEnter);

  const checkRegisterEnter = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      executarCadastro();
    }
  };
  ["txtNomeUsuario", "txtEmailCadastro", "txtNovaSenha", "txtConfirmarSenha"].forEach((id) => {
    const el = getEl(id);
    if (el) el.addEventListener("keydown", checkRegisterEnter);
  });

  // Attach all form behaviors dynamically inside main.js
  const iptDiaEmissao = getEl("iptDiaEmissao");
  let iptDiaEmissaoWarned = false;
  
  if (iptDiaEmissao) {
    iptDiaEmissao.addEventListener("input", function () {
      if (this.value.length > 2) {
        this.value = this.value.slice(0, 2);
      }
      this.classList.remove("border-red-500", "text-red-700", "bg-red-50", "ring-2", "ring-red-400");
      this.classList.add("border-slate-300", "focus:border-emerald-500");
      iptDiaEmissaoWarned = false;
    });

    iptDiaEmissao.addEventListener("blur", function () {
      let val = parseInt(this.value);
      if (this.value !== "" && (isNaN(val) || val > 31 || val <= 0)) {
        this.classList.add("border-red-500", "text-red-700", "bg-red-50", "ring-2", "ring-red-400");
        this.classList.remove("border-slate-300", "focus:border-emerald-500");
        if (!iptDiaEmissaoWarned) {
          showToast("Atenção: O dia deve ser um número válido (01 a 31).", "error");
          iptDiaEmissaoWarned = true;
        }
      }
    });
  }

  if (iptISS) {
    iptISS.addEventListener("blur", function () {
      let valBruto = parseFloat(iptValorBruto.value) || 0;
      let issCalc = parseFloat(this.value) || 0;
      if (valBruto > 0 && issCalc > valBruto * 0.1) {
        showToast("ISS inválido: não pode ser maior que 10% do total.", "error");
        this.classList.add("border-red-500", "text-red-700", "bg-red-50", "ring-2", "ring-red-400");
      } else {
        this.classList.remove("border-red-500", "text-red-700", "bg-red-50", "ring-2", "ring-red-400");
      }
    });
  }

  const iptNota = getEl("iptNota");
  const iptCnpj = getEl("iptCnpj");
  
  if (iptNota) {
    iptNota.addEventListener("blur", function () {
      this.value = this.value.replace(/^0+/, "");
      let numNota = this.value.trim();
      let cnpj = iptCnpj ? iptCnpj.value : "";
      const refEl = getEl("txtReferencia");
      let refSelecionada = refEl ? refEl.value : "";

      if (numNota && cnpj && refSelecionada) {
        let isDupe = window.dbNotas.some((n) => {
          let noteCnpjRaw = String(n.cnpj || "").replace(/[^\d]+/g, "");
          let cnpjRaw = String(cnpj || "").replace(/[^\d]+/g, "");
          return (
            noteCnpjRaw === cnpjRaw &&
            String(n.numNota || "").trim() === numNota
          );
        });
        if (isDupe) {
          showToast(`ATENÇÃO: Nota fiscal nº ${numNota} já cadastrada para esta Empresa/Emitente (CNPJ: ${mascararCNPJ(cnpj)})!`, "error");
          const form = getEl("formLancarNota");
          if (form) {
            form.classList.add("ring-4", "ring-red-500", "transition-all", "duration-200");
          }

          try {
            let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = "square";
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
          } catch (e) {}

          setTimeout(() => {
            if (form) {
              form.classList.remove("ring-4", "ring-red-500");
            }
            limparFormulario(true);
          }, 2000);
        }
      }
    });
  }

  const iptCondominio = getEl("iptCondominio");
  if (iptCondominio) {
    iptCondominio.addEventListener("input", function () {
      let val = this.value.toUpperCase();
      this.value = val;
      const lblCondHeader = getEl("lblHeaderCondominio");
      if (lblCondHeader && val.length < 3) {
        lblCondHeader.innerText = "AGUARDANDO CONDOMÍNIO...";
        lblCondHeader.className = "text-xl font-black text-slate-800 uppercase tracking-wide";
      }
    });

    iptCondominio.addEventListener("blur", async function () {
      let val = this.value.trim().toUpperCase();
      if (!val) return;
      if (val.length !== 3) {
        showToast("Código do condomínio deve conter 3 dígitos.", "error");
        this.value = "";
        return;
      }
      const lblCondHeader = getEl("lblHeaderCondominio");
      if (lblCondHeader) lblCondHeader.innerText = "BUSCANDO NO BANCO...";

      try {
        const { data, error } = await supabase
          .from("condominios")
          .select("razao_social")
          .eq("codigo", val)
          .maybeSingle();
        if (data) {
          if (lblCondHeader) {
            lblCondHeader.innerText = data.razao_social;
            lblCondHeader.className = "text-xl font-black text-emerald-700 uppercase tracking-wide";
          }
          
          const chkManterCNPJ = getEl("chkManterCNPJ");
          const iptCnpj = getEl("iptCnpj");
          const iptRazaoSocial = getEl("iptRazaoSocial");
          if (chkManterCNPJ && chkManterCNPJ.checked && iptCnpj && iptCnpj.value.trim() && iptRazaoSocial && iptRazaoSocial.value.trim()) {
            setTimeout(() => {
              const iptNota = getEl("iptNota");
              if (iptNota) {
                iptNota.focus();
                iptNota.select();
              }
            }, 10);
          } else {
            setTimeout(() => { if (iptCnpj) iptCnpj.focus(); }, 10);
          }
        } else {
          showToast("Código do condomínio não encontrado.", "error");
          this.value = "";
          if (lblCondHeader) {
            lblCondHeader.innerText = "CÓDIGO INEXISTENTE";
            lblCondHeader.className = "text-xl font-black text-red-600 uppercase tracking-wide";
          }
          setTimeout(() => { if (iptCondominio) iptCondominio.focus(); }, 10);
        }
      } catch (e) {
        console.error(e);
        if (lblCondHeader) lblCondHeader.innerText = "ERRO DE CONEXÃO";
      }
    });
  }

  const orderIds = [
    "iptCondominio",
    "iptCnpj",
    "iptRazaoSocial",
    "iptNota",
    "iptDiaEmissao",
    "iptValorBruto",
    "iptISS",
    "iptINSS",
    "iptIR",
    "chkPis",
    "iptPIS",
    "iptCOFINS",
    "iptCSLL",
    "btnEnviarNota",
    "chkOutrosMunicipios",
    "iptCodServico",
    "chkManterCNPJ",
    "btnLimparTudo"
  ];

  const getVisibleList = () => {
    const visible = [];
    orderIds.forEach((itemId) => {
      const item = getEl(itemId);
      if (!item) return;
      
      let isHidden = false;
      let temp = item;
      while (temp) {
        if (temp.classList && temp.classList.contains("hidden")) {
          isHidden = true;
          break;
        }
        temp = temp.parentElement;
      }
      
      if (!isHidden) {
        visible.push(item);
      }
    });
    return visible;
  };

  orderIds.forEach((id) => {
    const el = getEl(id);
    if (!el) return;

    el.addEventListener("keydown", function (e) {
      if (el.id === "iptCnpj") {
        const listaCnpj = getEl("listaCnpj");
        if (listaCnpj && !listaCnpj.classList.contains("hidden") && listaCnpj.children.length > 0) {
          if (e.key === "Enter" || e.key === "Tab" || e.key === "ArrowDown" || e.key === "ArrowUp") {
            return;
          }
        }
      }
      if (el.id === "iptRazaoSocial") {
        const listaNome = getEl("listaNome");
        if (listaNome && !listaNome.classList.contains("hidden") && listaNome.children.length > 0) {
          if (e.key === "Enter" || e.key === "Tab" || e.key === "ArrowDown" || e.key === "ArrowUp") {
            return;
          }
        }
      }

      if (el.id === "iptCnpj" && (e.key === "Tab" || e.key === "Enter")) {
        let raw = el.value.replace(/[^\d]+/g, "");
        if (raw) {
          e.preventDefault();
          window.cnpjJaProcessadoTeclado = true;

          if (raw.length === 12 || raw.length === 13) {
            raw = raw.padStart(14, "0");
            el.value = mascararCNPJ(raw);
          }

          if (!validarCNPJ(el.value)) {
            showToast("CNPJ inválido!", "error");
            el.value = "";
            getEl("iptRazaoSocial").value = "";
            getEl("boxNovaEmpresa").classList.add("hidden");
            getEl("boxNovaEmpresa").classList.remove("flex");
            setTimeout(() => el.focus(), 10);
            return;
          }

          let emp = window.dbEmpresas.find(x => String(x.cnpj) === raw);
          const iptRazaoSocial = getEl("iptRazaoSocial");
          const lblRazaoSocial = getEl("lblRazaoSocial");
          
          if (emp) {
            iptRazaoSocial.value = titleCase(emp.nome);
            iptRazaoSocial.readOnly = true;
            iptRazaoSocial.className = "border border-slate-300 p-2 text-[13px] rounded bg-slate-100 font-medium focus:outline-none shadow-sm transition-colors text-emerald-900 cursor-not-allowed";
            lblRazaoSocial.innerText = "Razão Social (Encontrado)";
            lblRazaoSocial.className = "text-[11px] font-bold text-emerald-700 uppercase transition-colors";
            getEl("boxNovaEmpresa").classList.add("hidden");
            getEl("boxNovaEmpresa").classList.remove("flex");

            carregarSmartDefaults(raw);

            setTimeout(() => {
              const iptNota = getEl("iptNota");
              if (iptNota) {
                iptNota.focus();
                iptNota.select();
              }
            }, 20);
          } else {
            iptRazaoSocial.value = "";
            iptRazaoSocial.readOnly = false;
            iptRazaoSocial.placeholder = "Digite o nome da empresa...";
            iptRazaoSocial.className = "border border-yellow-500 p-2 text-[13px] rounded bg-white font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm transition-colors";
            lblRazaoSocial.innerText = "Razão Social (Nova Empresa)";
            lblRazaoSocial.className = "text-[11px] font-bold text-yellow-700 uppercase transition-colors";
            getEl("boxNovaEmpresa").classList.remove("hidden");
            getEl("boxNovaEmpresa").classList.add("flex");
            showToast("CNPJ não cadastrado. Preencha o nome da empresa.", "warning");

            setTimeout(() => {
              if (iptRazaoSocial) {
                iptRazaoSocial.focus();
                iptRazaoSocial.select();
              }
            }, 20);
          }
          return;
        }
      }

      if (e.key === "Tab") {
        const visibleElements = getVisibleList();
        const currentIndex = visibleElements.indexOf(el);
        if (currentIndex !== -1) {
          e.preventDefault();
          let targetEl = null;

          const chkManter = getEl("chkManterCNPJ");
          const iptCnpj = getEl("iptCnpj");
          const iptRazaoSocial = getEl("iptRazaoSocial");
          const hasKeepCnpj = chkManter && chkManter.checked && iptCnpj && iptCnpj.value.trim() && iptRazaoSocial && iptRazaoSocial.value.trim();

          if (e.shiftKey) {
            let prevIdx = currentIndex - 1;
            while (prevIdx >= 0) {
              const candidate = visibleElements[prevIdx];
              if (hasKeepCnpj && (candidate.id === "iptCnpj" || candidate.id === "iptRazaoSocial")) {
                prevIdx--;
                continue;
              }
              targetEl = candidate;
              break;
            }
            if (!targetEl) {
              targetEl = visibleElements[visibleElements.length - 1];
            }
          } else {
            let nextIdx = currentIndex + 1;
            while (nextIdx < visibleElements.length) {
              const candidate = visibleElements[nextIdx];
              if (hasKeepCnpj && (candidate.id === "iptCnpj" || candidate.id === "iptRazaoSocial")) {
                nextIdx++;
                continue;
              }
              targetEl = candidate;
              break;
            }
            if (!targetEl) {
              targetEl = visibleElements[0];
            }
          }

          if (targetEl) {
            targetEl.focus();
            if (targetEl.tagName === "INPUT" && targetEl.type !== "checkbox" && targetEl.type !== "radio") {
              targetEl.select();
            }
          }
        }
      }

      if (e.key === "Enter") {
        if (el.tagName === "BUTTON") {
          return;
        }
        
        e.preventDefault();
        const visibleElements = getVisibleList();
        const currentIndex = visibleElements.indexOf(el);
        
        if (currentIndex !== -1) {
          let nextIdx = currentIndex + 1;
          let targetEl = null;

          const chkManter = getEl("chkManterCNPJ");
          const iptCnpj = getEl("iptCnpj");
          const iptRazaoSocial = getEl("iptRazaoSocial");
          const hasKeepCnpj = chkManter && chkManter.checked && iptCnpj && iptCnpj.value.trim() && iptRazaoSocial && iptRazaoSocial.value.trim();
          
          while (nextIdx < visibleElements.length) {
            const candidate = visibleElements[nextIdx];
            if (candidate.tagName === "INPUT" && candidate.type !== "checkbox" && candidate.type !== "radio") {
              if (candidate.id === "iptRazaoSocial" && candidate.readOnly) {
                nextIdx++;
                continue;
              }
              if (hasKeepCnpj && (candidate.id === "iptCnpj" || candidate.id === "iptRazaoSocial")) {
                nextIdx++;
                continue;
              }
              targetEl = candidate;
              break;
            }
            nextIdx++;
          }
          
          if (!targetEl) {
            nextIdx = 0;
            while (nextIdx < currentIndex) {
              const candidate = visibleElements[nextIdx];
              if (candidate.tagName === "INPUT" && candidate.type !== "checkbox" && candidate.type !== "radio") {
                if (candidate.id === "iptRazaoSocial" && candidate.readOnly) {
                  nextIdx++;
                  continue;
                }
                if (hasKeepCnpj && (candidate.id === "iptCnpj" || candidate.id === "iptRazaoSocial")) {
                  nextIdx++;
                  continue;
                }
                targetEl = candidate;
                break;
              }
              nextIdx++;
            }
          }

          if (targetEl) {
            targetEl.focus();
            targetEl.select();
          }
        }
      }
    });
  });

  const chkOutros = getEl("chkOutrosMunicipios");
  const boxCod = getEl("boxCodServico");
  const iptCod = getEl("iptCodServico");

  if (chkOutros && boxCod && iptCod) {
    chkOutros.addEventListener("change", function () {
      if (this.checked) {
        boxCod.classList.remove("hidden");
        boxCod.classList.add("flex");
        setTimeout(() => iptCod.focus(), 10);
      } else {
        boxCod.classList.add("hidden");
        boxCod.classList.remove("flex");
        iptCod.value = "";
      }
    });
  }

  const taxElNames = ["iptISS", "iptINSS", "iptIR", "iptPIS", "iptCOFINS", "iptCSLL", "iptPisVal"];
  taxElNames.forEach((id) => {
    const input = getEl(id);
    if (input) {
      input.addEventListener("focus", function () {
        setTimeout(() => {
          this.select();
        }, 10);
      });
    }
  });

  const listaCnpj = getEl("listaCnpj");
  const listaNome = getEl("listaNome");
  const iptRazaoSocial = getEl("iptRazaoSocial");
  const lblRazaoSocial = getEl("lblRazaoSocial");

  if (iptCnpj) {
    iptCnpj.addEventListener("input", async function () {
      let valFormatado = mascararCNPJ(this.value);
      this.value = valFormatado;

      let raw = valFormatado.replace(/[^\d]+/g, "");
      if (raw.length > 0) {
        let filtrados = (
          (
            await supabase
              .from("empresas")
              .select("*")
              .ilike("cnpj", "%" + raw + "%")
          ).data || []
        ).map((e) => ({ cnpj: e.cnpj, nome: e.razao_social }));
        renderAutocompleteCnpj(filtrados);
      } else {
        window.aliquotasValidas = null;
        if (listaCnpj) listaCnpj.classList.add("hidden");
        if (iptRazaoSocial) {
          iptRazaoSocial.value = "";
          iptRazaoSocial.readOnly = false;
          iptRazaoSocial.className = "border border-slate-300 p-2 text-[13px] rounded bg-white font-medium focus:outline-none focus:border-emerald-500 shadow-sm transition-colors";
        }
        if (lblRazaoSocial) {
          lblRazaoSocial.innerText = "Razão Social";
          lblRazaoSocial.className = "text-[11px] font-bold text-slate-700 uppercase transition-colors";
        }
        const boxNovaEmpresa = getEl("boxNovaEmpresa");
        if (boxNovaEmpresa) {
          boxNovaEmpresa.classList.add("hidden");
          boxNovaEmpresa.classList.remove("flex");
        }
      }
    });

    iptCnpj.addEventListener("blur", async function () {
      setTimeout(async () => {
        if (window.cnpjJaProcessadoTeclado) {
          window.cnpjJaProcessadoTeclado = false;
          return;
        }
        if (listaCnpj && !listaCnpj.classList.contains("hidden")) {
          listaCnpj.classList.add("hidden");
          if (iptRazaoSocial) {
            iptRazaoSocial.value = "";
            iptRazaoSocial.readOnly = false;
            iptRazaoSocial.className = "border border-slate-300 p-2 text-[13px] rounded bg-white font-medium focus:outline-none focus:border-emerald-500 shadow-sm transition-colors";
          }
          if (lblRazaoSocial) {
            lblRazaoSocial.innerText = "Razão Social";
            lblRazaoSocial.className = "text-[11px] font-bold text-slate-700 uppercase transition-colors";
          }
          const boxNovaEmpresa = getEl("boxNovaEmpresa");
          if (boxNovaEmpresa) {
            boxNovaEmpresa.classList.add("hidden");
            boxNovaEmpresa.classList.remove("flex");
          }
        }

        let raw = iptCnpj.value.replace(/[^\d]+/g, "");
        if (!raw) {
          window.aliquotasValidas = null;
          if (iptRazaoSocial) {
            iptRazaoSocial.value = "";
            iptRazaoSocial.readOnly = false;
            iptRazaoSocial.className = "border border-slate-300 p-2 text-[13px] rounded bg-white font-medium focus:outline-none focus:border-emerald-500 shadow-sm transition-colors";
          }
          if (lblRazaoSocial) {
            lblRazaoSocial.innerText = "Razão Social";
            lblRazaoSocial.className = "text-[11px] font-bold text-slate-700 uppercase transition-colors";
          }
          const boxNovaEmpresa = getEl("boxNovaEmpresa");
          if (boxNovaEmpresa) {
            boxNovaEmpresa.classList.add("hidden");
            boxNovaEmpresa.classList.remove("flex");
          }
          return;
        }

        if (raw.length === 12 || raw.length === 13) {
          raw = raw.padStart(14, "0");
          iptCnpj.value = mascararCNPJ(raw);
        }

        if (!validarCNPJ(iptCnpj.value)) {
          window.aliquotasValidas = null;
          showToast("CNPJ inválido!", "error");
          iptCnpj.value = "";
          iptRazaoSocial.value = "";
          getEl("boxNovaEmpresa").classList.add("hidden");
          getEl("boxNovaEmpresa").classList.remove("flex");
          setTimeout(() => iptCnpj.focus(), 10);
          return;
        }

        let emp = null;
        try {
          const { data } = await supabase
            .from("empresas")
            .select("*")
            .eq("cnpj", raw)
            .maybeSingle();
          if (data) emp = { cnpj: data.cnpj, nome: data.razao_social };
        } catch (e) {
          console.error(e);
        }
        if (emp) {
          iptRazaoSocial.value = titleCase(emp.nome);
          iptRazaoSocial.readOnly = true;
          iptRazaoSocial.className = "border border-slate-300 p-2 text-[13px] rounded bg-slate-100 font-medium focus:outline-none shadow-sm transition-colors text-emerald-900 cursor-not-allowed";
          lblRazaoSocial.innerText = "Razão Social (Encontrado)";
          lblRazaoSocial.className = "text-[11px] font-bold text-emerald-700 uppercase transition-colors";
          getEl("boxNovaEmpresa").classList.add("hidden");
          getEl("boxNovaEmpresa").classList.remove("flex");

          carregarSmartDefaults(raw);
        } else {
          window.aliquotasValidas = null;
          iptRazaoSocial.value = "";
          iptRazaoSocial.readOnly = false;
          iptRazaoSocial.placeholder = "Digite o nome da empresa...";
          iptRazaoSocial.className = "border border-yellow-500 p-2 text-[13px] rounded bg-white font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm transition-colors";
          lblRazaoSocial.innerText = "Razão Social (Nova Empresa)";
          lblRazaoSocial.className = "text-[11px] font-bold text-yellow-700 uppercase transition-colors";
          getEl("boxNovaEmpresa").classList.remove("hidden");
          getEl("boxNovaEmpresa").classList.add("flex");
          showToast("CNPJ não cadastrado. Preencha o nome da empresa.", "warning");
          setTimeout(() => iptRazaoSocial.focus(), 80);
        }
      }, 50);
    });
  }

  if (iptRazaoSocial) {
    iptRazaoSocial.addEventListener("input", async function () {
      if (iptCnpj.value.length > 0) return;
      let val = this.value.toLowerCase();
      if (val.length > 1) {
        let filtrados = (
          (
            await supabase
              .from("empresas")
              .select("*")
              .ilike("razao_social", "%" + val + "%")
          ).data || []
        ).map((e) => ({ cnpj: e.cnpj, nome: e.razao_social }));
        renderAutocompleteNome(filtrados);
      } else {
        listaNome.classList.add("hidden");
      }
    });
  }

  [
    { ipt: iptCnpj, list: listaCnpj },
    { ipt: iptRazaoSocial, list: listaNome },
  ].forEach((obj) => {
    if (!obj.ipt) return;
    obj.ipt.addEventListener("keydown", function (e) {
      if (
        obj.list.classList.contains("hidden") ||
        obj.list.children.length === 0
      )
        return;

      let activeEl = obj.list.querySelector(".autocomplete-active");

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!activeEl) {
          obj.list.children[0].classList.add("bg-emerald-100", "text-emerald-900", "autocomplete-active");
        } else {
          activeEl.classList.remove("bg-emerald-100", "text-emerald-900", "autocomplete-active");
          if (activeEl.nextElementSibling) {
            activeEl.nextElementSibling.classList.add("bg-emerald-100", "text-emerald-900", "autocomplete-active");
          } else {
            obj.list.children[0].classList.add("bg-emerald-100", "text-emerald-900", "autocomplete-active");
          }
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!activeEl) {
          obj.list.lastElementChild.classList.add("bg-emerald-100", "text-emerald-900", "autocomplete-active");
        } else {
          activeEl.classList.remove("bg-emerald-100", "text-emerald-900", "autocomplete-active");
          if (activeEl.previousElementSibling) {
            activeEl.previousElementSibling.classList.add("bg-emerald-100", "text-emerald-900", "autocomplete-active");
          } else {
            obj.list.lastElementChild.classList.add("bg-emerald-100", "text-emerald-900", "autocomplete-active");
          }
        }
      }

      let newActiveEl = obj.list.querySelector(".autocomplete-active");
      if (newActiveEl) {
        newActiveEl.scrollIntoView({ block: "nearest", behavior: "auto" });
      }

      if (e.key === "Enter" || e.key === "Tab") {
        if (activeEl) {
          e.preventDefault();
          activeEl.dispatchEvent(new MouseEvent("mousedown"));
        } else {
          e.preventDefault();
          obj.list.children[0].dispatchEvent(new MouseEvent("mousedown"));
        }
      } else if (e.key === "Escape") {
        obj.list.classList.add("hidden");
      }
    });
  });

  function renderAutocompleteCnpj(empresas) {
    if (empresas.length === 0) {
      listaCnpj.classList.add("hidden");
      return;
    }
    listaCnpj.innerHTML = "";
    empresas.forEach((e) => {
      let li = document.createElement("li");
      li.className = "p-2 text-[13.5px] font-mono cursor-pointer hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 font-medium transition-colors flex items-center justify-between gap-2";
      li.innerHTML = `<span><strong class="pointer-events-none">${mascararCNPJ(e.cnpj)}</strong></span> <span class="pl-2 truncate text-slate-500 font-sans text-xs flex-1 text-right pointer-events-none">${e.nome}</span>`;
      li.addEventListener("mousedown", (evt) => {
        evt.preventDefault();
        window.selecionarCnpj(e.cnpj, e.nome);
      });
      listaCnpj.appendChild(li);
    });
    listaCnpj.classList.remove("hidden");
  }

  function renderAutocompleteNome(empresas) {
    if (empresas.length === 0) {
      listaNome.classList.add("hidden");
      return;
    }
    listaNome.innerHTML = "";
    empresas.forEach((e) => {
      let li = document.createElement("li");
      li.className = "p-2 text-[13.5px] font-mono cursor-pointer hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 font-medium transition-colors flex items-center justify-between gap-2";
      li.innerHTML = `<span class="truncate text-slate-700 font-sans text-xs flex-1 pointer-events-none">${e.nome}</span> <span><strong class="pointer-events-none text-slate-500">${mascararCNPJ(e.cnpj)}</strong></span>`;
      li.addEventListener("mousedown", (evt) => {
        evt.preventDefault();
        window.selecionarNome(e.cnpj, e.nome);
      });
      listaNome.appendChild(li);
    });
    listaNome.classList.remove("hidden");
  }

  window.selecionarNome = (cnpj, nome) => {
    iptCnpj.value = mascararCNPJ(cnpj);
    listaNome.classList.add("hidden");

    iptRazaoSocial.value = titleCase(nome);
    iptRazaoSocial.readOnly = true;
    iptRazaoSocial.className = "border border-slate-300 p-2 text-[13px] rounded bg-slate-100 font-medium focus:outline-none shadow-sm transition-colors text-emerald-900 cursor-not-allowed";
    lblRazaoSocial.innerText = "Razão Social (Encontrado)";
    lblRazaoSocial.className = "text-[11px] font-bold text-emerald-700 uppercase transition-colors";
    getEl("boxNovaEmpresa").classList.add("hidden");
    getEl("boxNovaEmpresa").classList.remove("flex");

    carregarSmartDefaults(cnpj);
    setTimeout(() => getEl("iptNota").focus(), 10);
  };

  window.selecionarCnpj = (cnpj, nome) => {
    iptCnpj.value = mascararCNPJ(cnpj);
    listaCnpj.classList.add("hidden");

    iptRazaoSocial.value = titleCase(nome);
    iptRazaoSocial.readOnly = true;
    iptRazaoSocial.className = "border border-slate-300 p-2 text-[13px] rounded bg-slate-100 font-medium focus:outline-none shadow-sm transition-colors text-emerald-900 cursor-not-allowed";
    lblRazaoSocial.innerText = "Razão Social (Encontrado)";
    lblRazaoSocial.className = "text-[11px] font-bold text-emerald-700 uppercase transition-colors";
    getEl("boxNovaEmpresa").classList.add("hidden");
    getEl("boxNovaEmpresa").classList.remove("flex");

    carregarSmartDefaults(cnpj);
    setTimeout(() => getEl("iptNota").focus(), 10);
  };

  const chkPis = getEl("chkPis");
  const iptPisContainer = getEl("iptPisContainer");
  
  if (chkPis) {
    chkPis.addEventListener("change", function () {
      if (this.checked) {
        iptPisContainer.classList.remove("hidden");
        iptPisContainer.classList.add("flex");
        getEl("boxPccTotal").classList.remove("hidden");
        getEl("boxPccManual").classList.remove("grid");
        getEl("boxPccManual").classList.add("hidden");

        window.pisModificadoManualmente = false;
        calcularPisCofins();
        setTimeout(() => getEl("btnEnviarNota").focus(), 10);
      } else {
        iptPisContainer.classList.add("hidden");
        iptPisContainer.classList.remove("flex");
        getEl("iptPIS").value = "";
        getEl("iptCOFINS").value = "";
        getEl("iptCSLL").value = "";
        getEl("iptPisVal").value = "";
        window.pisModificadoManualmente = false;
      }
    });
  }

  if (iptValorBruto) {
    iptValorBruto.addEventListener("input", function () {
      let bruto = parseFloat(iptValorBruto.value) || 0;

      if (window.aliquotasValidas) {
        if (window.aliquotasValidas.iss !== undefined) {
          const elIss = getEl("iptISS");
          if (elIss) elIss.value = (bruto * window.aliquotasValidas.iss).toFixed(2);
        }
        if (window.aliquotasValidas.inss !== undefined) {
          const elInss = getEl("iptINSS");
          if (elInss) elInss.value = (bruto * window.aliquotasValidas.inss).toFixed(2);
        }
        if (window.aliquotasValidas.ir !== undefined) {
          const elIr = getEl("iptIR");
          if (elIr) elIr.value = (bruto * window.aliquotasValidas.ir).toFixed(2);
        }
      }

      if (getEl("chkPis").checked && !window.pisModificadoManualmente) {
        calcularPisCofins();
      }

      recalcularValorLiquido();
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest(".fixed.inset-0")) return;
    if (currentRowInEdit && !currentRowInEdit.contains(e.target)) {
      let editingBtn = currentRowInEdit.querySelector(".btn-acao");
      if (editingBtn && editingBtn.dataset.editing === "true") {
        e.preventDefault();
        e.stopPropagation();

        if (document.querySelector(".fixed.inset-0.bg-black\\/60")) return;

        showConfirm(
          "Deseja salvar as alterações em andamento?",
          () => {
            editingBtn.click();
          },
          () => {
            endEditRow(currentRowInEdit);
            showToast("Edição cancelada.", "info");
            renderNotas();
            renderEmpresas();
            renderCondominios();
          },
        );
      }
    }
  }, true);

  const novaCnpjEmp = getEl("novaCnpjEmp");
  if (novaCnpjEmp) {
    novaCnpjEmp.addEventListener("input", function () {
      this.value = mascararCNPJ(this.value);
    });
  }

  carregarPreferenciaTamanhoFonte();
  verificarAutenticacao();
});

export function selecionarTodasNotas(checked) {
  const checkboxes = document.querySelectorAll(".chk-conferir");
  checkboxes.forEach((cb) => {
    cb.checked = checked;
  });
}
window.selecionarTodasNotas = selecionarTodasNotas;

export async function conferirNotasLote() {
  const checkboxes = Array.from(document.querySelectorAll(".chk-conferir"));
  const checkedBoxes = checkboxes.filter((cb) => cb.checked);
  
  if (checkedBoxes.length === 0) {
    showToast("Nenhuma nota selecionada. Marque os checkboxes das notas que deseja alterar.", "warning");
    return;
  }

  showToast("Processando alterações...", "info");
  window.isBatchUpdating = true;

  const promessas = [];
  
  checkedBoxes.forEach((cb) => {
    const idNota = cb.getAttribute("data-id");
    
    // Find matching note in our local cache to determine current status
    const dbNotasArray = Array.isArray(window.dbNotas) ? window.dbNotas : [];
    const notasDoMesArray = Array.isArray(window.notasDoMes) ? window.notasDoMes : [];
    
    const notaDb = dbNotasArray.find(n => String(n.id) === String(idNota));
    const currentStatus = notaDb ? !!notaDb.conferida : false;
    // Toggle (reverse) the status!
    const newStatus = !currentStatus;

    // Immediate visual styling feedback
    const tr = cb.closest("tr");
    if (tr) {
      if (newStatus) {
        tr.className = "hover:bg-green-250 transition-colors cursor-pointer bg-green-100";
        tr.style.backgroundColor = "#bbf7d0"; // Beautiful soft-mid green, darker than before (#bbf7d0 is distinct and legible)
      } else {
        tr.className = "hover:bg-blue-50 transition-colors cursor-pointer bg-white";
        tr.style.backgroundColor = "";
      }
    }

    // Update state objects instantly in memory
    const notaMem = notasDoMesArray.find(n => String(n.id) === String(idNota));
    if (notaMem) {
      notaMem.conferida = newStatus;
    }
    if (notaDb) {
      notaDb.conferida = newStatus;
    }

    // Call Supabase update operation
    promessas.push(
      atualizarStatusConferida(idNota, newStatus).then((success) => {
        if (!success) {
          console.error(`Falha ao registrar status "conferida=${newStatus}" para nota ID ${idNota}`);
        }
      })
    );
  });

  try {
    await Promise.all(promessas);
    
    let oper = typeof getOperador === "function" ? getOperador() : "Operador";
    await supabase.from("logs_auditoria").insert([
      {
        operador: oper,
        acao: "CONFERIR_NOTAS",
        entidade: `${checkedBoxes.length} registros`,
        recurso: "Modulação de Status por Lote",
        descricao: `Lote de ${checkedBoxes.length} notas processadas com sucesso.`
      }
    ]);
    
    showToast(`Sucesso! ${checkedBoxes.length} notas alteradas no banco de dados.`, "success");
  } catch (error) {
    console.error("Erro ao registrar conferências:", error);
    showToast("Erro ao processar as alterações de conferência.", "error");
  } finally {
    window.isBatchUpdating = false;
    // Single render call to refresh list state and keep UI perfectly updated
    if (typeof renderNotas === "function") {
      await renderNotas(false);
    }
    if (typeof renderAuditoria === "function") {
      await renderAuditoria(true);
    }
  }
}
window.conferirNotasLote = conferirNotasLote;

export function mudarPaginaNotas(direcao) {
  const totItens = window.notasFiltradasAtivas ? window.notasFiltradasAtivas.length : 0;
  const itemsPerPage = window.itensPorPaginaNotas || 50;
  const totPaginas = Math.ceil(totItens / itemsPerPage) || 1;
  const novaPagina = window.paginaAtualNotas + direcao;

  if (novaPagina >= 1 && novaPagina <= totPaginas) {
    window.paginaAtualNotas = novaPagina;
    if (typeof renderNotas === "function") {
      renderNotas(false);
    }
  }
}
window.mudarPaginaNotas = mudarPaginaNotas;
