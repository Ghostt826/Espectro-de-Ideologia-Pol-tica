// ===========================================================
// ESPECTRO DE IDEOLOGIA POLÍTICA
// script.js — dados dos partidos e lógica do site
// ===========================================================

// ===========================================================
// CONFIGURAÇÃO: 7 categorias ideológicas, em ordem fixa
// ===========================================================
const CATEGORIAS = [
  { id: "extrema-esquerda", label: "Extrema-Esquerda", cor: "#6A0000", tom: "escuro" },
  { id: "esquerda",         label: "Esquerda",         cor: "#A51E1E", tom: "escuro" },
  { id: "centro-esquerda",  label: "Centro-Esquerda",  cor: "#D67A7A", tom: "claro"  },
  { id: "centro",           label: "Centro",           cor: "#E8E8E8", tom: "claro"  },
  { id: "centro-direita",   label: "Centro-Direita",   cor: "#7DA6E8", tom: "claro"  },
  { id: "direita",          label: "Direita",          cor: "#1F5CC4", tom: "escuro" },
  { id: "extrema-direita",  label: "Extrema-Direita",  cor: "#002D8F", tom: "escuro" },
];

// ===========================================================
// CORES OFICIAIS PARA COMBINAÇÕES DE 2 E 3 CATEGORIAS
// CONTÍGUAS — chave: ids unidos por "+", na ordem
// esquerda -> direita
// ===========================================================
const CORES_COMBINACAO = {
  // pares (2 categorias)
  "extrema-esquerda+esquerda":            "#870F0F",
  "esquerda+centro-esquerda":             "#BE4B4B",
  "centro-esquerda+centro":               "#DEB1B1",
  "centro+centro-direita":                "#B3C7F0",
  "centro-direita+direita":               "#4F81D6",
  "direita+extrema-direita":               "#1044A8",

  // trios (3 categorias)
  "extrema-esquerda+esquerda+centro-esquerda": "#A54545",
  "esquerda+centro-esquerda+centro":           "#CC8282",
  "centro-esquerda+centro+centro-direita":     "#C4C9D4",
  "centro+centro-direita+direita":             "#7FA3DA",
  "centro-direita+direita+extrema-direita":    "#2F64BF",
};

// ===========================================================
// PARTIDOS DE EXEMPLO — partidos políticos brasileiros reais,
// usados apenas para ilustrar o funcionamento do gráfico na
// primeira visita. O posicionamento de cada partido no espectro
// é uma simplificação didática e pode ser livremente editado,
// removido ou substituído pelo painel de gestão abaixo.
//
// categorias: array com 1 a 3 ids de CATEGORIAS, na ordem
//             em que aparecem no espectro (esquerda → direita)
// ===========================================================
const PARTIDOS_PADRAO = [
  { id: "p1", sigla: "PCB",  nome: "Partido Comunista Brasileiro",        categorias: ["extrema-esquerda"] },
  { id: "p2", sigla: "PT",   nome: "Partido dos Trabalhadores",           categorias: ["esquerda"] },
  { id: "p3", sigla: "PSOL", nome: "Partido Socialismo e Liberdade",      categorias: ["extrema-esquerda", "esquerda"] },
  { id: "p4", sigla: "PSB",  nome: "Partido Socialista Brasileiro",       categorias: ["esquerda", "centro-esquerda"] },
  { id: "p5", sigla: "MDB",  nome: "Movimento Democrático Brasileiro",    categorias: ["centro"] },
  { id: "p6", sigla: "PSDB", nome: "Partido da Social Democracia Brasileira", categorias: ["centro", "centro-direita"] },
  { id: "p7", sigla: "UNIÃO", nome: "União Brasil",                       categorias: ["centro-direita", "direita"] },
  { id: "p8", sigla: "NOVO", nome: "Partido Novo",                        categorias: ["direita"] },
  { id: "p9", sigla: "PL",   nome: "Partido Liberal",                     categorias: ["direita", "extrema-direita"] },
];

const STORAGE_KEY = "espectro-politico-partidos";

function carregarPartidos() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) return JSON.parse(salvo);
  } catch (e) {
    console.warn("Não foi possível ler dados salvos, usando padrão.", e);
  }
  return PARTIDOS_PADRAO.slice();
}

function salvarPartidos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(PARTIDOS));
  } catch (e) {
    console.warn("Não foi possível salvar no navegador.", e);
  }
}

let PARTIDOS = carregarPartidos();

// ===========================================================
// RENDERIZAÇÃO — não precisa editar a partir daqui
// ===========================================================
const catIndex = Object.fromEntries(CATEGORIAS.map((c, i) => [c.id, i]));

function renderLegenda() {
  const el = document.getElementById("legenda");
  el.innerHTML = CATEGORIAS.map(c => `
    <div class="legenda-item">
      <div class="legenda-cor" style="background:${c.cor}"></div>
      <div class="legenda-label">${c.label}</div>
    </div>
  `).join("");
}

function renderEixo() {
  const el = document.getElementById("eixo");
  el.innerHTML = CATEGORIAS.map(c => `<span>${c.label}</span>`).join("");
}

function renderTracksBg() {
  const el = document.getElementById("tracks-bg");
  el.innerHTML = CATEGORIAS.map(() => `<div class="track"></div>`).join("");
}

// retorna a cor sólida oficial para 1, 2 ou 3 categorias contíguas
function corDaBarra(idsCategorias) {
  if (idsCategorias.length === 1) {
    return CATEGORIAS[catIndex[idsCategorias[0]]].cor;
  }
  const chave = idsCategorias.join("+");
  if (CORES_COMBINACAO[chave]) {
    return CORES_COMBINACAO[chave];
  }
  // fallback de segurança, não deveria ocorrer com seleção válida
  console.warn("Combinação sem cor cadastrada:", chave);
  return CATEGORIAS[catIndex[idsCategorias[0]]].cor;
}

// decide se o texto deve ser claro ou escuro com base no tom predominante
function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.substring(0, 2), 16),
    g: parseInt(v.substring(2, 4), 16),
    b: parseInt(v.substring(4, 6), 16),
  };
}

// calcula se o fundo é claro ou escuro com base na luminância
// real da cor final (funciona tanto para cores de categoria
// única quanto para as cores de combinação da tabela fixa)
function tomDaCor(hex) {
  const { r, g, b } = hexToRgb(hex);
  // luminância relativa (fórmula padrão WCAG simplificada)
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia < 0.55 ? "escuro" : "claro";
}

function renderPartidos() {
  const el = document.getElementById("chart-rows");
  const contador = document.getElementById("contador");
  contador.textContent = `${PARTIDOS.length} ${PARTIDOS.length === 1 ? "partido" : "partidos"} cadastrados`;

  if (!PARTIDOS.length) {
    el.innerHTML = `<div class="empty-state">Nenhum partido cadastrado ainda.</div>`;
    return;
  }

  el.innerHTML = PARTIDOS.map(p => {
    const indices = p.categorias.map(id => catIndex[id]).sort((a,b) => a - b);
    const totalCols = CATEGORIAS.length;
    const colStart = indices[0];
    const colSpan = (indices[indices.length - 1] - indices[0]) + 1;
    const leftPct = (colStart / totalCols) * 100;
    const widthPct = (colSpan / totalCols) * 100;
    const bg = corDaBarra(p.categorias);
    const tom = tomDaCor(bg);
    const mostraNomeCompleto = p.categorias.length > 1;

    return `
      <div class="row">
        <div class="bar tom-${tom}"
             style="left:${leftPct}%; width:${widthPct}%; background-color:${bg}"
             title="${p.nome}">
          ${mostraNomeCompleto ? `${p.sigla} — ${p.nome}` : p.sigla}
        </div>
      </div>
    `;
  }).join("");
}

function renderIndice() {
  const el = document.getElementById("indice-partidos");
  el.innerHTML = PARTIDOS.map(p => {
    const corPrincipal = CATEGORIAS[catIndex[p.categorias[0]]].cor;
    return `
      <div class="indice-item">
        <span class="indice-swatch" style="background:${corPrincipal}"></span>
        <span class="indice-sigla">${p.sigla}</span>
        <span class="indice-nome">${p.nome}</span>
      </div>
    `;
  }).join("");
}

function renderTudo() {
  renderPartidos();
  renderIndice();
  renderListaGestao();
}

// ===========================================================
// PAINEL DE GESTÃO — adicionar, editar e remover partidos
// ===========================================================
let categoriasSelecionadas = [];

function gerarId() {
  return "p" + Date.now() + Math.floor(Math.random() * 1000);
}

function renderChecksCategorias() {
  const el = document.getElementById("checks-categorias");
  el.innerHTML = CATEGORIAS.map((c, i) => {
    const marcado = categoriasSelecionadas.includes(c.id);
    const desabilitado = !marcado && !podeSelecionar(i);
    return `
      <label class="check-cat ${marcado ? "marcado" : ""} ${desabilitado ? "desabilitado" : ""}">
        <input type="checkbox" value="${c.id}" data-idx="${i}"
               ${marcado ? "checked" : ""} ${desabilitado ? "disabled" : ""}>
        <span class="swatch-mini" style="background:${c.cor}"></span>
        ${c.label}
      </label>
    `;
  }).join("");

  Array.from(el.querySelectorAll('input[type="checkbox"]')).forEach(input => {
    input.addEventListener("change", onToggleCategoria);
  });
}

// só permite marcar uma categoria se ela continuar formando
// um bloco contíguo com as já selecionadas, e o total não
// passar de 3
function podeSelecionar(idx) {
  if (categoriasSelecionadas.length >= 3) return false;
  if (categoriasSelecionadas.length === 0) return true;
  const indices = categoriasSelecionadas.map(id => catIndex[id]);
  const min = Math.min(...indices);
  const max = Math.max(...indices);
  return idx === min - 1 || idx === max + 1;
}

function onToggleCategoria(e) {
  const id = e.target.value;
  if (e.target.checked) {
    categoriasSelecionadas.push(id);
  } else {
    categoriasSelecionadas = categoriasSelecionadas.filter(c => c !== id);
  }
  // mantém a ordem correta (esquerda -> direita)
  categoriasSelecionadas.sort((a, b) => catIndex[a] - catIndex[b]);
  renderChecksCategorias();
}

function limparForm() {
  document.getElementById("editando-id").value = "";
  document.getElementById("input-sigla").value = "";
  document.getElementById("input-nome").value = "";
  document.getElementById("form-erro").textContent = "";
  categoriasSelecionadas = [];
  renderChecksCategorias();
  document.getElementById("btn-submit").textContent = "Adicionar Partido";
  document.getElementById("btn-cancelar").style.display = "none";
}

function iniciarEdicao(id) {
  const partido = PARTIDOS.find(p => p.id === id);
  if (!partido) return;
  document.getElementById("editando-id").value = id;
  document.getElementById("input-sigla").value = partido.sigla;
  document.getElementById("input-nome").value = partido.nome;
  categoriasSelecionadas = partido.categorias.slice();
  renderChecksCategorias();
  document.getElementById("btn-submit").textContent = "Salvar Alterações";
  document.getElementById("btn-cancelar").style.display = "inline-block";
  const formEl = document.getElementById("form-partido");
  if (typeof formEl.scrollIntoView === "function") {
    formEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function removerPartido(id) {
  const partido = PARTIDOS.find(p => p.id === id);
  if (!partido) return;
  if (!confirm(`Remover "${partido.sigla} — ${partido.nome}"?`)) return;
  PARTIDOS = PARTIDOS.filter(p => p.id !== id);
  salvarPartidos();
  renderTudo();
  if (document.getElementById("editando-id").value === id) limparForm();
}

function onSubmitForm(e) {
  e.preventDefault();
  const erroEl = document.getElementById("form-erro");
  const editandoId = document.getElementById("editando-id").value;
  const sigla = document.getElementById("input-sigla").value.trim().toUpperCase();
  const nome = document.getElementById("input-nome").value.trim();

  if (!sigla || !nome) {
    erroEl.textContent = "Preencha a sigla e o nome completo.";
    return;
  }
  if (categoriasSelecionadas.length === 0) {
    erroEl.textContent = "Selecione ao menos uma categoria no espectro.";
    return;
  }
  const siglaDuplicada = PARTIDOS.some(p => p.sigla.toUpperCase() === sigla && p.id !== editandoId);
  if (siglaDuplicada) {
    erroEl.textContent = "Já existe um partido com essa sigla.";
    return;
  }

  if (editandoId) {
    const partido = PARTIDOS.find(p => p.id === editandoId);
    partido.sigla = sigla;
    partido.nome = nome;
    partido.categorias = categoriasSelecionadas.slice();
  } else {
    PARTIDOS.push({ id: gerarId(), sigla, nome, categorias: categoriasSelecionadas.slice() });
  }

  salvarPartidos();
  renderTudo();
  limparForm();
}

function renderListaGestao() {
  const el = document.getElementById("lista-gestao");
  if (!PARTIDOS.length) {
    el.innerHTML = `<div class="lista-vazia">Nenhum partido cadastrado. Use o formulário acima para adicionar o primeiro.</div>`;
    return;
  }
  el.innerHTML = PARTIDOS.map(p => {
    const corPrincipal = CATEGORIAS[catIndex[p.categorias[0]]].cor;
    const catsLabels = p.categorias.map(id => CATEGORIAS[catIndex[id]].label).join(" + ");
    return `
      <div class="item-gestao">
        <span class="swatch-mini" style="background:${corPrincipal}"></span>
        <div class="info">
          <div class="nome-linha">${p.sigla}<span class="nome-completo-inline">${p.nome}</span></div>
          <div class="cats-linha">${catsLabels}</div>
        </div>
        <div class="acoes-item">
          <button type="button" class="btn-mini editar" data-id="${p.id}">Editar</button>
          <button type="button" class="btn-mini remover" data-id="${p.id}">Remover</button>
        </div>
      </div>
    `;
  }).join("");

  Array.from(el.querySelectorAll(".btn-mini.editar")).forEach(btn => {
    btn.addEventListener("click", () => iniciarEdicao(btn.dataset.id));
  });
  Array.from(el.querySelectorAll(".btn-mini.remover")).forEach(btn => {
    btn.addEventListener("click", () => removerPartido(btn.dataset.id));
  });
}

// ===========================================================
// EXPORTAR / IMPORTAR — backup em JSON da lista de partidos
// ===========================================================

function exportarPartidos() {
  const payload = {
    tipo: "espectro-politico-partidos",
    versao: 1,
    exportadoEm: new Date().toISOString(),
    partidos: PARTIDOS,
  };
  const conteudo = JSON.stringify(payload, null, 2);
  const blob = new Blob([conteudo], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const dataHoje = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `partidos-espectro-politico-${dataHoje}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// valida e normaliza um array de partidos vindo de um arquivo
// importado; lança erro com mensagem amigável se algo for inválido
function validarPartidosImportados(lista) {
  if (!Array.isArray(lista)) {
    throw new Error("O arquivo não contém uma lista de partidos válida.");
  }

  const idsValidos = CATEGORIAS.map(c => c.id);
  const siglasVistas = new Set();
  const partidosValidados = [];

  lista.forEach((item, i) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Item ${i + 1} do arquivo não é um partido válido.`);
    }
    const sigla = String(item.sigla || "").trim().toUpperCase();
    const nome = String(item.nome || "").trim();
    const categorias = Array.isArray(item.categorias) ? item.categorias : [];

    if (!sigla || !nome) {
      throw new Error(`Item ${i + 1} está sem sigla ou nome.`);
    }
    if (siglasVistas.has(sigla)) {
      throw new Error(`Sigla duplicada no arquivo: "${sigla}".`);
    }
    if (categorias.length === 0 || categorias.length > 3) {
      throw new Error(`"${sigla}" precisa ter de 1 a 3 categorias.`);
    }
    if (categorias.some(c => !idsValidos.includes(c))) {
      throw new Error(`"${sigla}" tem uma categoria desconhecida.`);
    }
    const indices = categorias.map(c => catIndex[c]).sort((a, b) => a - b);
    for (let k = 1; k < indices.length; k++) {
      if (indices[k] !== indices[k - 1] + 1) {
        throw new Error(`As categorias de "${sigla}" precisam ser contíguas.`);
      }
    }

    siglasVistas.add(sigla);
    partidosValidados.push({
      id: item.id && typeof item.id === "string" ? item.id : gerarId(),
      sigla,
      nome,
      categorias: categorias.slice().sort((a, b) => catIndex[a] - catIndex[b]),
    });
  });

  return partidosValidados;
}

function importarPartidosDeArquivo(file) {
  const erroEl = document.getElementById("form-erro");
  const leitor = new FileReader();

  leitor.onload = () => {
    try {
      const json = JSON.parse(leitor.result);
      const lista = Array.isArray(json) ? json : json.partidos;
      const validados = validarPartidosImportados(lista);

      const substituir = confirm(
        `O arquivo contém ${validados.length} partido(s).\n\n` +
        `Clique OK para SUBSTITUIR a lista atual,\n` +
        `ou Cancelar para ADICIONAR esses partidos à lista existente (sem sobrescrever as siglas já cadastradas).`
      );

      if (substituir) {
        PARTIDOS = validados;
      } else {
        const siglasAtuais = new Set(PARTIDOS.map(p => p.sigla.toUpperCase()));
        const novos = validados.filter(p => !siglasAtuais.has(p.sigla.toUpperCase()));
        PARTIDOS = PARTIDOS.concat(novos);
      }

      salvarPartidos();
      renderTudo();
      limparForm();
      erroEl.textContent = "";
    } catch (e) {
      erroEl.textContent = "Erro ao importar: " + e.message;
    }
  };

  leitor.onerror = () => {
    erroEl.textContent = "Não foi possível ler o arquivo selecionado.";
  };

  leitor.readAsText(file);
}

document.getElementById("form-partido").addEventListener("submit", onSubmitForm);
document.getElementById("btn-cancelar").addEventListener("click", limparForm);

document.getElementById("btn-exportar").addEventListener("click", exportarPartidos);

document.getElementById("btn-importar").addEventListener("click", () => {
  document.getElementById("input-importar-arquivo").click();
});

document.getElementById("input-importar-arquivo").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) importarPartidosDeArquivo(file);
  e.target.value = ""; // permite importar o mesmo arquivo de novo, se quiser
});

renderChecksCategorias();

renderLegenda();
renderEixo();
renderTracksBg();
renderTudo();