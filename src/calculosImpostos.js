import { supabase } from "./supabaseClient.js";

export function parseMoney(str) {
  return (
    parseFloat(
      String(str)
        .replace(/[^\d,-]/g, "")
        .replace(",", "."),
    ) || 0
  );
}

export function formatMoney(val) {
  let num = parseFloat(val);
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function mascararCNPJ(cnpj) {
  let val = String(cnpj).replace(/\D/g, "");
  if (val === "") return "";
  if (val.length > 14) val = val.substring(0, 14);
  return val
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function titleCase(str) {
  if (!str) return "";
  const ignore = [
    "de", "do", "da", "dos", "das", "e", "em", "para", "com", "ou",
    "ltda", "s/a", "sa", "mef", "epp", "me"
  ];
  return str
    .toLowerCase()
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w, idx) => {
      if (idx > 0 && ignore.includes(w)) return w;
      if (["ltda", "s/a", "sa", "me", "epp"].includes(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

export function validarCNPJ(cnpj) {
  const originalInput = cnpj;
  cnpj = String(cnpj).replace(/[^\d]+/g, "");
  console.log(`[CNPJ Debug] original: "${originalInput}" -> cleaned: "${cnpj}"`);
  if (cnpj === "") {
    console.warn(`[CNPJ Debug] Cleaner resulted in empty string.`);
    return false;
  }
  if (cnpj.length < 14) {
    const padded = cnpj.padStart(14, "0");
    console.log(`[CNPJ Debug] Padding string from ${cnpj.length} to 14 chars -> "${padded}"`);
    cnpj = padded;
  }
  if (cnpj.length !== 14) {
    console.warn(`[CNPJ Debug] CNPJ length ${cnpj.length} is not 14 digits.`);
    return false;
  }
  if (/^(\d)\1{13}$/.test(cnpj)) {
    console.warn(`[CNPJ Debug] CNPJ consists of repeated digits: "${cnpj}".`);
    return false;
  }

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) {
    console.warn(`[CNPJ Debug] First check digit mismatch: calculated ${resultado}, got ${digitos.charAt(0)}.`);
    return false;
  }

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) {
    console.warn(`[CNPJ Debug] Second check digit mismatch: calculated ${resultado}, got ${digitos.charAt(1)}.`);
    return false;
  }

  console.log(`[CNPJ Debug] "${originalInput}" is a VALID CNPJ!`);
  return true;
}

export async function atualizarStatusConferida(idNota, status) {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from("notas_fiscais")
      .update({ conferida: !!status })
      .eq("id", idNota);

    if (error) {
      console.error("Erro ao atualizar status de conferência no Supabase:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Erro na chamada de atualizarStatusConferida:", e);
    return false;
  }
}

export function recalcularValorLiquido() {
  const brutoEl = document.getElementById("iptValorBruto");
  const issEl = document.getElementById("iptISS");
  const inssEl = document.getElementById("iptINSS");
  const irEl = document.getElementById("iptIR");
  const chkPisEl = document.getElementById("chkPis");
  const pisValEl = document.getElementById("iptPisVal");
  const lblValorLiquido = document.getElementById("lblValorLiquido");

  if (!lblValorLiquido) return;

  let bruto = parseFloat(brutoEl ? brutoEl.value : 0) || 0;
  let iss = parseFloat(issEl ? issEl.value : 0) || 0;
  let inss = parseFloat(inssEl ? inssEl.value : 0) || 0;
  let ir = parseFloat(irEl ? irEl.value : 0) || 0;
  let pcc =
    chkPisEl && chkPisEl.checked
      ? parseFloat(pisValEl ? pisValEl.value : 0) || 0
      : 0;

  let liquido = bruto - (iss + inss + ir + pcc);
  lblValorLiquido.innerText = formatMoney(liquido);
}

export function calcularPisCofins() {
  const elBruto = document.getElementById("iptValorBruto");
  if (!elBruto) return;
  const bruto = parseFloat(elBruto.value) || 0;
  const pis = (bruto * 0.0065).toFixed(2);
  const cofins = (bruto * 0.03).toFixed(2);
  const csll = (bruto * 0.01).toFixed(2);
  
  const elPis = document.getElementById("iptPIS");
  const elCofins = document.getElementById("iptCOFINS");
  const elCsll = document.getElementById("iptCSLL");
  const elPisVal = document.getElementById("iptPisVal");

  if (elPis) elPis.value = pis;
  if (elCofins) elCofins.value = cofins;
  if (elCsll) elCsll.value = csll;
  if (elPisVal) {
    elPisVal.value = (
      parseFloat(pis) +
      parseFloat(cofins) +
      parseFloat(csll)
    ).toFixed(2);
  }
  
  recalcularValorLiquido();
}

export function ativarEdicaoPccManual() {
  window.pisModificadoManualmente = true;
  const boxPccTotal = document.getElementById("boxPccTotal");
  const boxPccManual = document.getElementById("boxPccManual");
  const iptPIS = document.getElementById("iptPIS");

  if (boxPccTotal) boxPccTotal.classList.add("hidden");
  if (boxPccManual) {
    boxPccManual.classList.remove("hidden");
    boxPccManual.classList.add("grid");
  }
  if (iptPIS) iptPIS.focus();
}

export function atualizarSomaPcc() {
  window.pisModificadoManualmente = true;
  const elPis = document.getElementById("iptPIS");
  const elCofins = document.getElementById("iptCOFINS");
  const elCsll = document.getElementById("iptCSLL");
  const elPisVal = document.getElementById("iptPisVal");

  let p = elPis ? (parseFloat(elPis.value) || 0) : 0;
  let c = elCofins ? (parseFloat(elCofins.value) || 0) : 0;
  let s = elCsll ? (parseFloat(elCsll.value) || 0) : 0;

  if (elPisVal) elPisVal.value = (p + c + s).toFixed(2);
  recalcularValorLiquido();
}

export function predizerImpostoPorAmostra(novoValorBruto, notaAmostraEncontrada) {
  const resultado = {};
  const impostos = ['inss', 'iss', 'pcc', 'irrf'];
  
  impostos.forEach(imposto => {
    const valorAntigo = notaAmostraEncontrada[`valor_${imposto}`] || 0;
    const brutoAntigo = notaAmostraEncontrada.valor_bruto;

    if (valorAntigo > 0 && brutoAntigo > 0) {
      // Encontra a alíquota real praticada na nota de amostra
      const aliquotaEfetiva = valorAntigo / brutoAntigo;
      const valorSugerido = novoValorBruto * aliquotaEfetiva;

      // Arredonda estritamente para duas casas decimais (centavos)
      resultado[imposto] = Math.round((valorSugerido + Number.EPSILON) * 100) / 100;
    } else {
      resultado[imposto] = 0;
    }
  });

  return resultado;
}

export function aplicarValoresSugeridos(valores) {
  const elIss = document.getElementById("iptISS");
  const elInss = document.getElementById("iptINSS");
  const elIr = document.getElementById("iptIR");
  const chkPis = document.getElementById("chkPis");
  const iptPisContainer = document.getElementById("iptPisContainer");
  const elPisVal = document.getElementById("iptPisVal");
  const elPis = document.getElementById("iptPIS");
  const elCofins = document.getElementById("iptCOFINS");
  const elCsll = document.getElementById("iptCSLL");

  if (elIss) elIss.value = valores.iss > 0 ? valores.iss.toFixed(2) : "";
  if (elInss) elInss.value = valores.inss > 0 ? valores.inss.toFixed(2) : "";
  if (elIr) elIr.value = valores.irrf > 0 ? valores.irrf.toFixed(2) : "";

  if (chkPis && iptPisContainer) {
    if (valores.pcc > 0) {
      chkPis.checked = true;
      iptPisContainer.classList.remove("hidden");
      iptPisContainer.classList.add("flex");
      if (elPisVal) elPisVal.value = valores.pcc.toFixed(2);
      if (elPis) elPis.value = valores.val_pis > 0 ? valores.val_pis.toFixed(2) : "";
      if (elCofins) elCofins.value = valores.val_cofins > 0 ? valores.val_cofins.toFixed(2) : "";
      if (elCsll) elCsll.value = valores.val_csll > 0 ? valores.val_csll.toFixed(2) : "";
    } else {
      chkPis.checked = false;
      iptPisContainer.classList.add("hidden");
      iptPisContainer.classList.remove("flex");
      if (elPisVal) elPisVal.value = "";
      if (elPis) elPis.value = "";
      if (elCofins) elCofins.value = "";
      if (elCsll) elCsll.value = "";
    }
  }

  // Recalcula o valor líquido na tela
  recalcularValorLiquido();
}

export async function predizerEncargos() {
  if (!supabase) return;

  const iptCnpj = document.getElementById("iptCnpj");
  const iptValorBruto = document.getElementById("iptValorBruto");
  const iptCondominio = document.getElementById("iptCondominio");

  if (!iptCnpj || !iptValorBruto || !iptCondominio) return;

  const rawCnpj = iptCnpj.value.replace(/[^\d]+/g, "").padStart(14, "0");
  const valorBruto = parseFloat(iptValorBruto.value) || 0;
  const codCond = iptCondominio.value.trim();

  // O gatilho de busca deve ocorrer de forma assíncrona assim que o usuário preencher o CNPJ e o Valor Bruto da nota atual.
  if (!rawCnpj || rawCnpj.length < 14 || valorBruto <= 0 || !codCond) {
    return;
  }

  try {
    // REGRA 1 (Mesmo Condomínio, Mesmo Valor Bruto)
    const { data: dataR1, error: errorR1 } = await supabase
      .from("notas_fiscais")
      .select("*")
      .eq("condominio_codigo", codCond)
      .eq("empresa_cnpj", rawCnpj)
      .eq("valor_bruto", valorBruto)
      .order("created_at", { ascending: false })
      .limit(1);

    if (errorR1) {
      console.error("Erro na busca da Regra 1:", errorR1);
    }

    if (dataR1 && dataR1.length > 0) {
      const nota = dataR1[0];
      aplicarValoresSugeridos({
        inss: parseFloat(nota.inss) || 0,
        iss: parseFloat(nota.iss) || 0,
        irrf: parseFloat(nota.ir) || 0,
        pcc: parseFloat(nota.pis_digitado) || 0,
        val_pis: parseFloat(nota.val_pis) || 0,
        val_cofins: parseFloat(nota.val_cofins) || 0,
        val_csll: parseFloat(nota.val_csll) || 0
      });
      return;
    }

    // REGRA 2 (Outro Condomínio, Valor Bruto Próximo - Range de 20%)
    const minBruto = valorBruto * 0.8;
    const maxBruto = valorBruto * 1.2;

    const { data: dataR2, error: errorR2 } = await supabase
      .from("notas_fiscais")
      .select("*")
      .eq("empresa_cnpj", rawCnpj)
      .gte("valor_bruto", minBruto)
      .lte("valor_bruto", maxBruto)
      .order("created_at", { ascending: false })
      .limit(1);

    if (errorR2) {
      console.error("Erro na busca da Regra 2:", errorR2);
    }

    if (dataR2 && dataR2.length > 0) {
      const nota = dataR2[0];
      
      const notaAmostraEncontrada = {
        valor_bruto: parseFloat(nota.valor_bruto) || 0,
        valor_inss: parseFloat(nota.inss) || 0,
        valor_iss: parseFloat(nota.iss) || 0,
        valor_irrf: parseFloat(nota.ir) || 0,
        valor_pcc: parseFloat(nota.pis_digitado) || 0,
        val_pis: parseFloat(nota.val_pis) || 0,
        val_cofins: parseFloat(nota.val_cofins) || 0,
        val_csll: parseFloat(nota.val_csll) || 0
      };

      const resultado = predizerImpostoPorAmostra(valorBruto, notaAmostraEncontrada);

      // Calcular proporcionalmente os impostos internos do PCC se houver
      if (resultado.pcc > 0 && notaAmostraEncontrada.valor_pcc > 0) {
        resultado.val_pis = Math.round(((valorBruto * (notaAmostraEncontrada.val_pis / notaAmostraEncontrada.valor_bruto)) + Number.EPSILON) * 100) / 100;
        resultado.val_cofins = Math.round(((valorBruto * (notaAmostraEncontrada.val_cofins / notaAmostraEncontrada.valor_bruto)) + Number.EPSILON) * 100) / 100;
        resultado.val_csll = Math.round(((valorBruto * (notaAmostraEncontrada.val_csll / notaAmostraEncontrada.valor_bruto)) + Number.EPSILON) * 100) / 100;
      } else {
        resultado.val_pis = 0;
        resultado.val_cofins = 0;
        resultado.val_csll = 0;
      }

      aplicarValoresSugeridos(resultado);
      return;
    }

    // REGRA 3 (Fora do Range ou Sem Histórico)
    aplicarValoresSugeridos({
      inss: 0,
      iss: 0,
      irrf: 0,
      pcc: 0,
      val_pis: 0,
      val_cofins: 0,
      val_csll: 0
    });

  } catch (error) {
    console.error("Erro ao predizer encargos:", error);
  }
}

let predizerDebounceTimeout = null;
export function debouncedPredizerEncargos() {
  clearTimeout(predizerDebounceTimeout);
  predizerDebounceTimeout = setTimeout(() => {
    predizerEncargos();
  }, 400);
}

export async function carregarSmartDefaults(cnpjRaw) {
  await predizerEncargos();
}
