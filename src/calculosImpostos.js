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
  const bruto = parseFloat(document.getElementById("iptValorBruto").value) || 0;
  const pis = (bruto * 0.0065).toFixed(2);
  const cofins = (bruto * 0.03).toFixed(2);
  const csll = (bruto * 0.01).toFixed(2);
  
  document.getElementById("iptPIS").value = pis;
  document.getElementById("iptCOFINS").value = cofins;
  document.getElementById("iptCSLL").value = csll;
  document.getElementById("iptPisVal").value = (
    parseFloat(pis) +
    parseFloat(cofins) +
    parseFloat(csll)
  ).toFixed(2);
  
  recalcularValorLiquido();
}

export function ativarEdicaoPccManual() {
  window.pisModificadoManualmente = true;
  document.getElementById("boxPccTotal").classList.add("hidden");
  document.getElementById("boxPccManual").classList.remove("hidden");
  document.getElementById("boxPccManual").classList.add("grid");
  document.getElementById("iptPIS").focus();
}

export function atualizarSomaPcc() {
  window.pisModificadoManualmente = true;
  let p = parseFloat(document.getElementById("iptPIS").value) || 0;
  let c = parseFloat(document.getElementById("iptCOFINS").value) || 0;
  let s = parseFloat(document.getElementById("iptCSLL").value) || 0;
  document.getElementById("iptPisVal").value = (p + c + s).toFixed(2);
  recalcularValorLiquido();
}

export async function carregarSmartDefaults(cnpjRaw) {
  if (!supabase) return;
  const raw = cnpjRaw.replace(/[^\d]+/g, "");
  if (!raw) return;
  try {
    const { data, error } = await supabase
      .from("notas_fiscais")
      .select("valor_bruto, iss, inss, ir, val_pis, val_cofins, val_csll")
      .eq("empresa_cnpj", raw)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Erro ao buscar ultima nota para smart defaults:", error);
      return;
    }

    if (data && data.length > 0) {
      const notaAnterior = data[0];
      const valorBrutoAnterior = parseFloat(notaAnterior.valor_bruto) || 0;
      if (valorBrutoAnterior > 0) {
        const valorIssAnterior = parseFloat(notaAnterior.iss) || 0;
        const valorInssAnterior = parseFloat(notaAnterior.inss) || 0;
        const valorIrAnterior = parseFloat(notaAnterior.ir) || 0;

        const valPisAnterior = parseFloat(notaAnterior.val_pis) || 0;
        const valCofinsAnterior = parseFloat(notaAnterior.val_cofins) || 0;
        const valCsllAnterior = parseFloat(notaAnterior.val_csll) || 0;

        window.aliquotasValidas = {
          iss: valorIssAnterior / valorBrutoAnterior,
          inss: valorInssAnterior / valorBrutoAnterior,
          ir: valorIrAnterior / valorBrutoAnterior,
          pcc_perfil: (valPisAnterior > 0 || valCofinsAnterior > 0 || valCsllAnterior > 0)
        };

        // Apply PCC Perfil dynamics right away
        const chkPis = document.getElementById("chkPis");
        const iptPisContainer = document.getElementById("iptPisContainer");
        if (chkPis && iptPisContainer) {
          if (window.aliquotasValidas.pcc_perfil) {
            chkPis.checked = true;
            iptPisContainer.classList.remove("hidden");
            iptPisContainer.classList.add("flex");
          } else {
            chkPis.checked = false;
            iptPisContainer.classList.add("hidden");
            iptPisContainer.classList.remove("flex");
          }
        }

        console.log("Smart defaults calculados da nota anterior:", window.aliquotasValidas);
      } else {
        window.aliquotasValidas = null;
      }
    } else {
      window.aliquotasValidas = null;
    }
  } catch (e) {
    console.error("Erro no processamento das aliquotas historicas:", e);
    window.aliquotasValidas = null;
  }
}
