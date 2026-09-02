export const ATTRIBUTES = {
  fisico: { label: "Físico", short: "FIS", defaultColor: "#d13b22" },
  mente: { label: "Mente", short: "MEN", defaultColor: "#4a84cf" },
  emocao: { label: "Emoção", short: "EMO", defaultColor: "#5f9e3e" },
};

export const DIE_STEPS = [4, 6, 8, 10, 12, 20];

export const SKILL_ORDER = [
  "acrobacia", "aptidao", "atletismo", "crime", "disciplina", "enganacao", "furtividade",
  "intimidar", "intuicao", "luta", "maquinas", "medicina", "ocultismo", "percepcao",
  "persuasao", "pesquisar", "pontaria", "sobrevivencia", "tecnologia", "vigor"
];

export const SKILL_LABELS = {
  acrobacia: "Acrobacia", aptidao: "Aptidão", atletismo: "Atletismo", crime: "Crime",
  disciplina: "Disciplina", enganacao: "Enganação", furtividade: "Furtividade", intimidar: "Intimidar",
  intuicao: "Intuição", luta: "Luta", maquinas: "Máquinas", medicina: "Medicina", ocultismo: "Ocultismo",
  percepcao: "Percepção", persuasao: "Persuasão", pesquisar: "Pesquisar", pontaria: "Pontaria",
  sobrevivencia: "Sobrevivência", tecnologia: "Tecnologia", vigor: "Vigor"
};

const s = (die, attribute, specialization = "") => ({ die, attribute, specialization });

export const CHARACTERS = {
  alan: {
    id: "alan", name: "Alan", profile: "Executor", occupation: "Cientista", level: 2,
    accent: "#d13b22", portrait: "./assets/characters/alan.png", token: "./assets/tokens/alan.png", thumbPosition:"50% 13%", maxPV: 10, maxPD: 16,
    attributes: { fisico: 6, mente: 8, emocao: 8 },
    skills: {
      acrobacia:s(4,"fisico"), aptidao:s(6,"mente","Humanas"), atletismo:s(4,"fisico"), crime:s(6,"fisico"),
      disciplina:s(6,"emocao"), enganacao:s(6,"emocao"), furtividade:s(4,"fisico"), intimidar:s(4,"emocao"),
      intuicao:s(4,"emocao"), luta:s(4,"fisico"), maquinas:s(4,"mente"), medicina:s(4,"mente"),
      ocultismo:s(4,"mente"), percepcao:s(8,"mente"), persuasao:s(4,"emocao"), pesquisar:s(6,"mente"),
      pontaria:s(4,"fisico"), sobrevivencia:s(4,"mente"), tecnologia:s(4,"mente"), vigor:s(6,"fisico")
    },
    abilities: [
      { id:"foco-mental", name:"Foco Mental", text:"Quando faz um teste mental, você pode gastar 2 PD para receber +d4 no teste.", highlights:["teste mental","2 PD"], action:"focusMental" },
      { id:"impeto", name:"Ímpeto", text:"Você possui uma barra de ímpeto com três espaços. Sempre que falha em um teste, você preenche um espaço na barra. Você pode apagar espaços preenchidos para receber +d4 em um teste, ou apagar três espaços para aumentar um atributo em um passo até o fim da cena.", highlights:["barra de ímpeto","espaços","falha","teste","atributo","passo"], highlightOnce:["espaços"], tracker:"impulse" }
    ]
  },
  edgar: {
    id: "edgar", name: "Edgar", profile: "Executor", occupation: "Operário", level: 2,
    accent: "#d13b22", portrait: "./assets/characters/edgar.png", token: "./assets/tokens/edgar.png", thumbPosition:"50% 12%", maxPV: 18, maxPD: 10,
    attributes: { fisico: 10, mente: 6, emocao: 6 },
    skills: {
      acrobacia:s(4,"fisico"), aptidao:s(4,"mente"), atletismo:s(8,"fisico"), crime:s(6,"fisico"),
      disciplina:s(4,"emocao"), enganacao:s(4,"emocao"), furtividade:s(4,"fisico"), intimidar:s(6,"emocao"),
      intuicao:s(4,"emocao"), luta:s(6,"fisico"), maquinas:s(4,"mente"), medicina:s(4,"mente"),
      ocultismo:s(4,"mente"), percepcao:s(6,"mente"), persuasao:s(4,"emocao"), pesquisar:s(4,"mente"),
      pontaria:s(4,"fisico"), sobrevivencia:s(6,"mente"), tecnologia:s(4,"mente"), vigor:s(6,"fisico")
    },
    abilities: [
      { id:"esforco-suor", name:"Esforço e Suor", text:"Você possui uma perícia física aumentada para d6 (já contabilizado na ficha).", highlights:[] },
      { id:"impeto", name:"Ímpeto", text:"Você possui uma barra de ímpeto com três espaços. Sempre que falha em um teste, você preenche um espaço na barra. Você pode apagar espaços preenchidos para receber +d4 em um teste, ou apagar três espaços para aumentar um atributo em um passo até o fim da cena.", highlights:["barra de ímpeto","espaços","falha","teste","atributo","passo"], highlightOnce:["espaços"], tracker:"impulse" }
    ]
  },
  eloisa: {
    id: "eloisa", name: "Eloísa", profile: "Analista", occupation: "Artista", level: 2,
    accent: "#4a84cf", portrait: "./assets/characters/eloisa.png", token: "./assets/tokens/eloisa.png", thumbPosition:"50% 12%", maxPV: 12, maxPD: 14,
    attributes: { fisico: 8, mente: 8, emocao: 6 },
    skills: {
      acrobacia:s(6,"fisico"), aptidao:s(4,"mente"), atletismo:s(4,"fisico"), crime:s(6,"fisico"),
      disciplina:s(6,"emocao"), enganacao:s(4,"emocao"), furtividade:s(4,"fisico"), intimidar:s(4,"emocao"),
      intuicao:s(8,"emocao"), luta:s(4,"fisico"), maquinas:s(4,"mente"), medicina:s(4,"mente"),
      ocultismo:s(4,"mente"), percepcao:s(6,"mente"), persuasao:s(4,"emocao"), pesquisar:s(6,"mente"),
      pontaria:s(4,"fisico"), sobrevivencia:s(4,"mente"), tecnologia:s(6,"mente"), vigor:s(4,"fisico")
    },
    abilities: [
      { id:"avaliacao", name:"Avaliação", text:"Você pode gastar uma ação e 2 PD para observar um ser ou um ambiente. Você recebe 2d4 que pode usar em testes relativos àquele ser ou ambiente (você pode usá-los como quiser, recebendo +2d4 em um teste ou +d4 em dois testes). Você não pode acumular mais do que dois dados bônus por esta habilidade.", highlights:["uma ação e 2 PD"], action:"evaluation" },
      { id:"foco-emocional", name:"Foco Emocional", text:"Quando faz um teste emocional, você pode gastar 2 PD para receber +d4 no teste.", highlights:["teste emocional","2 PD"], action:"focusEmotional" }
    ]
  },
  kenia: {
    id: "kenia", name: "Kênia", profile: "Analista", occupation: "Profissional de Escritório", level: 2,
    accent: "#4a84cf", portrait: "./assets/characters/kenia.png", token: "./assets/tokens/kenia.png", thumbPosition:"50% 11%", maxPV: 12, maxPD: 12,
    attributes: { fisico: 6, mente: 10, emocao: 6 },
    skills: {
      acrobacia:s(6,"fisico"), aptidao:s(6,"mente","Atualidades"), atletismo:s(6,"fisico"), crime:s(4,"fisico"),
      disciplina:s(6,"emocao"), enganacao:s(4,"emocao"), furtividade:s(4,"fisico"), intimidar:s(4,"emocao"),
      intuicao:s(6,"emocao"), luta:s(4,"fisico"), maquinas:s(4,"mente"), medicina:s(4,"mente"),
      ocultismo:s(4,"mente"), percepcao:s(6,"mente"), persuasao:s(4,"emocao"), pesquisar:s(6,"mente"),
      pontaria:s(4,"fisico"), sobrevivencia:s(4,"mente"), tecnologia:s(8,"mente"), vigor:s(6,"fisico")
    },
    abilities: [
      { id:"avaliacao", name:"Avaliação", text:"Você pode gastar uma ação e 2 PD para observar um ser ou um ambiente. Você recebe 2d4 que pode usar em testes relativos àquele ser ou ambiente (você pode usá-los como quiser, recebendo +2d4 em um teste ou +d4 em dois testes). Você não pode acumular mais do que dois dados bônus por esta habilidade.", highlights:["uma ação e 2 PD"], action:"evaluation" },
      { id:"conhecimento-tecnico", name:"Conhecimento Técnico", text:"Você possui uma perícia mental aumentada para d6 (este aumento já está contabilizado na ficha).", highlights:[] }
    ]
  },
  victor: {
    id: "victor", name: "Victor", profile: "Vigilante", occupation: "Professor", level: 2,
    accent: "#5f9e3e", portrait: "./assets/characters/victor.png", token: "./assets/tokens/victor.png", thumbPosition:"50% 12%", maxPV: 14, maxPD: 14,
    attributes: { fisico: 8, mente: 6, emocao: 8 },
    skills: {
      acrobacia:s(4,"fisico"), aptidao:s(6,"mente","Humanas"), atletismo:s(6,"fisico"), crime:s(4,"fisico"),
      disciplina:s(6,"emocao"), enganacao:s(4,"emocao"), furtividade:s(4,"fisico"), intimidar:s(4,"emocao"),
      intuicao:s(4,"emocao"), luta:s(4,"fisico"), maquinas:s(4,"mente"), medicina:s(4,"mente"),
      ocultismo:s(4,"mente"), percepcao:s(6,"mente"), persuasao:s(4,"emocao"), pesquisar:s(8,"mente"),
      pontaria:s(4,"fisico"), sobrevivencia:s(4,"mente"), tecnologia:s(4,"mente"), vigor:s(6,"fisico")
    },
    abilities: [
      { id:"mentoria", name:"Mentoria", text:"Quando ajuda outro personagem, você pode fazer um teste da perícia que usou para ajudar contra DT 7. Se passar, o personagem ajudado pode substituir um dos dados rolados por ele pela sua rolagem alta.", highlights:["ajuda","DT 7"] },
      { id:"prontidao", name:"Prontidão", text:"No início de qualquer conflito, você pode gastar 3 PD. Se fizer isso, ganha uma rodada na qual pode agir antes dos demais personagens e NPCs.", highlights:["3 PD","ganha uma rodada"], action:"readiness" }
    ]
  }
};

export function defaultRuntimeState() {
  return {
    v: 3,
    testDt: null,
    assignments: {},
    characters: Object.fromEntries(Object.values(CHARACTERS).map(c => [c.id, {
      pv: c.maxPV, pd: c.maxPD, impulse: 0, evaluationDice: 0, readiness: false,
      pendingDice: [], stepMods: { fisico: 0, mente: 0, emocao: 0 }, updatedAt: Date.now()
    }]))
  };
}

export function stepDie(sides, delta = 0) {
  let idx = DIE_STEPS.indexOf(Number(sides));
  if (idx < 0) idx = 0;
  idx = Math.max(0, Math.min(DIE_STEPS.length - 1, idx + Number(delta || 0)));
  return DIE_STEPS[idx];
}

export function labelSkill(character, key) {
  const base = SKILL_LABELS[key] || key;
  const spec = character?.skills?.[key]?.specialization;
  return spec ? `${base} (${spec})` : base;
}
