// ============================================================
// CONFIGURAÇÕES GERAIS
// ============================================================

// chave do groq fica no env.js separado (nao sobe pro github)
var sheetsUrl      = "https://script.google.com/macros/s/AKfycbzp_iCQmyXLwIml50L-cm6ufMGuS6C2a2VOn4h09dZw34Gc8A8xGTo_5jqmSquH95cLkA/exec";
var numeroWhats    = "551432324222";
var horaAbre       = 7;
var horaFechaSemana = 17;  // seg-sex fecha 17h
var horaFechaSabado = 11;  // sabado fecha 11h


// ============================================================
// ESTADO DA CONVERSA
// ============================================================

var etapaAtual     = "inicio";
var dadosPedido    = {};
var contadorPedido = Math.floor(Math.random() * 900) + 100;


// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function gerarNumeroPedido() {
  contadorPedido++;
  return "NR" + String(contadorPedido).padStart(4, "0");
}

// verifica se ta dentro do horario de funcionamento
// seg-sex: 7h-17h | sabado: 7h-11h | domingo: fechado
function dentroDoHorario() {
  let agora = new Date();
  let dia   = agora.getDay(); // 0=dom, 1=seg...6=sab
  let hora  = agora.getHours();
  if (dia >= 1 && dia <= 5) return hora >= horaAbre && hora < horaFechaSemana;
  if (dia === 6)             return hora >= horaAbre && hora < horaFechaSabado;
  return false; // domingo
}

function getHoraAtual() {
  let agora = new Date();
  return agora.getHours().toString().padStart(2, "0") + ":" +
         agora.getMinutes().toString().padStart(2, "0");
}

// valida se tem pelo menos 10 digitos (com ddd)
function validarTelefone(tel) {
  let numeros = tel.replace(/\D/g, "");
  return numeros.length >= 10 && numeros.length <= 11;
}


// ============================================================
// INTERFACE - adiciona mensagens e botoes na tela
// ============================================================

function addMsgBot(texto) {
  let area = document.getElementById("mensagens");
  let div  = document.createElement("div");
  div.classList.add("msg", "msg-bot");
  div.innerHTML = texto + '<div class="msg-hora">' + getHoraAtual() + '</div>';
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function addMsgUsuario(texto) {
  let area = document.getElementById("mensagens");
  let div  = document.createElement("div");
  div.classList.add("msg", "msg-usuario");
  div.innerHTML = texto + '<div class="msg-hora">' + getHoraAtual() + ' <span class="check-lido">✓✓</span></div>';
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function addOpcoes(opcoes) {
  let area = document.getElementById("mensagens");
  let div  = document.createElement("div");
  div.classList.add("opcoes");
  div.id = "opcoes-atuais";

  opcoes.forEach(function(op) {
    let btn = document.createElement("button");
    btn.textContent = op;
    btn.onclick = function() {
      div.remove();
      addMsgUsuario(op);
      setTimeout(function() { processarResposta(op); }, 600);
    };
    div.appendChild(btn);
  });

  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

// animacao de "digitando..." igual whatsapp
function mostrarDigitando(callback, tempo) {
  let area = document.getElementById("mensagens");
  let div  = document.createElement("div");
  div.classList.add("digitando");
  div.id = "digitando";
  div.innerHTML = "<span></span><span></span><span></span>";
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;

  setTimeout(function() {
    let d = document.getElementById("digitando");
    if (d) d.remove();
    callback();
  }, tempo || 1000);
}

function limparOpcoes() {
  let op = document.getElementById("opcoes-atuais");
  if (op) op.remove();
}

function resetarConversa() {
  etapaAtual  = "inicio";
  dadosPedido = {};
  document.getElementById("mensagens").innerHTML = "";
  iniciarConversa();
}


// ============================================================
// INTEGRACOES - whatsapp, sheets e groq
// ============================================================

function abrirWhatsApp() {
  let url = "https://wa.me/" + numeroWhats +
            "?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20um%20atendente%20da%20NR%20Ca%C3%A7ambas.";
  window.open(url, "_blank");
}

function salvarNoSheets(dados) {
  let url = sheetsUrl +
    "?numeroPedido=" + encodeURIComponent(dados.numeroPedido) +
    "&nome="         + encodeURIComponent(dados.nome)         +
    "&telefone="     + encodeURIComponent(dados.telefone)     +
    "&bairro="       + encodeURIComponent(dados.bairro)       +
    "&endereco="     + encodeURIComponent(dados.endereco)     +
    "&tamanho="      + encodeURIComponent(dados.tamanho)      +
    "&data="         + encodeURIComponent(dados.data)         +
    "&horario="      + encodeURIComponent(dados.horario)      +
    "&status="       + encodeURIComponent(dados.status);

  // uso fetch pra mandar os dados, mais confiavel que image()
  fetch(url).catch(function(err) {
    console.log("erro ao salvar no sheets:", err);
  });
}

function perguntarIA(msgUsuario, callback) {
  let area = document.getElementById("mensagens");
  let div  = document.createElement("div");
  div.classList.add("digitando");
  div.id = "digitando";
  div.innerHTML = "<span></span><span></span><span></span>";
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;

  let avisoHorario = !dentroDoHorario()
    ? "\nATENCAO: fora do horario agora (Seg-Sex 7h-17h, Sab 7h-11h). se pedir pedido, avisa que esta fechado."
    : "";

  let prompt =
    "Voce e o assistente virtual da NR Cacambas, empresa de aluguel de cacambas de entulho.\n" +
    "Responda curto e simpatico, em portugues brasileiro.\n" +
    "Informacoes:\n" +
    "- Cacambas: 3m3 (R$250), 5m3 (R$350), 7m3 (R$450)\n" +
    "- Entrega em ate 24h, segunda a sexta 7h as 17h, sabado 7h as 11h\n" +
    "- Preco inclui entrega e retirada\n" +
    "- Telefone: (14) 99999-0000\n" +
    "Se quiser fazer pedido, diga para clicar em 'Fazer um pedido'.\n" +
    "Nao invente informacoes." + avisoHorario;

  fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + GROQ_API_KEY
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      messages: [
        { role: "system", content: prompt },
        { role: "user",   content: msgUsuario }
      ]
    })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    let d = document.getElementById("digitando");
    if (d) d.remove();

    // tratamento de erro caso a ia nao retorne nada
    if (!data.choices || !data.choices.length) {
      callback("Desculpe, nao consegui responder agora. Escolha uma opcao abaixo:");
      return;
    }

    callback(data.choices[0].message.content);
  })
  .catch(function(err) {
    let d = document.getElementById("digitando");
    if (d) d.remove();
    console.log("erro groq:", err);
    callback("Desculpe, nao consegui entender. Escolha uma das opcoes abaixo:");
  });
}


// ============================================================
// FLUXO DO PEDIDO - logica principal do chatbot
// ============================================================

function processarResposta(resposta) {
  limparOpcoes();

  // botao disponivel em qualquer momento
  if (resposta === "💬 Falar com atendente") {
    abrirWhatsApp();
    mostrarDigitando(function() {
      addMsgBot("Abrindo o WhatsApp pra falar com nossa equipe! 📱");
      setTimeout(function() {
        mostrarDigitando(function() {
          addMsgBot("Posso ajudar com mais alguma coisa?");
          addOpcoes(["📋 Ver preços e tamanhos", "📦 Fazer um pedido", "⏰ Prazo de entrega", "💬 Falar com atendente"]);
        }, 800);
      }, 500);
    });
    etapaAtual = "inicio";
    return;
  }

  if (etapaAtual === "inicio" || etapaAtual === "menu") {
    _menuPrincipal(resposta);

  } else if (etapaAtual === "pedido_nome") {
    if (resposta.trim().length < 2) {
      addMsgBot("Por favor, digite um nome válido. 😊");
      return;
    }
    dadosPedido.nome = resposta.trim();
    etapaAtual = "pedido_telefone";
    mostrarDigitando(function() {
      addMsgBot("Ótimo, <b>" + dadosPedido.nome + "</b>! 😊<br>Qual é o seu <b>telefone</b> com DDD?<br>(Ex: (14) 99999-0000)");
    });

  } else if (etapaAtual === "pedido_telefone") {
    if (!validarTelefone(resposta)) {
      addMsgBot("⚠️ Telefone inválido. Digite com DDD, por favor.<br>Ex: (14) 99999-0000");
      return;
    }
    dadosPedido.telefone = resposta;
    etapaAtual = "pedido_bairro";
    mostrarDigitando(function() {
      addMsgBot("Anotado! Agora me diz o <b>bairro</b> pra entrega.");
    });

  } else if (etapaAtual === "pedido_bairro") {
    if (resposta.trim().length < 2) {
      addMsgBot("Por favor, informe o bairro. 📍");
      return;
    }
    dadosPedido.bairro = resposta.trim();
    etapaAtual = "pedido_endereco";
    mostrarDigitando(function() {
      addMsgBot("Perfeito! Agora o <b>endereço completo</b> com rua e número.");
    });

  } else if (etapaAtual === "pedido_endereco") {
    if (resposta.trim().length < 5) {
      addMsgBot("Por favor, coloca o endereço completo com rua e número. 📍");
      return;
    }
    dadosPedido.endereco = resposta.trim();
    etapaAtual = "pedido_tamanho";
    mostrarDigitando(function() {
      addMsgBot("Entendido! Qual <b>tamanho de caçamba</b> você precisa?");
      addOpcoes(["🟡 3m³ — R$ 250,00", "🟠 5m³ — R$ 350,00", "🔴 7m³ — R$ 450,00"]);
    });

  } else if (etapaAtual === "pedido_tamanho") {
    dadosPedido.tamanho = resposta;
    etapaAtual = "pedido_data";
    mostrarDigitando(function() {
      addMsgBot("Ótima escolha! Pra qual <b>data</b> precisa da entrega?<br>(Ex: amanhã, 12/06, próxima segunda)");
    });

  } else if (etapaAtual === "pedido_data") {
    dadosPedido.data        = resposta;
    dadosPedido.numPedido   = gerarNumeroPedido();
    etapaAtual = "pedido_confirmacao";
    mostrarDigitando(function() {
      addMsgBot(
        "Vou confirmar seu pedido <b>" + dadosPedido.numPedido + "</b>:<br><br>" +
        "👤 <b>Nome:</b> "      + dadosPedido.nome     + "<br>" +
        "📞 <b>Telefone:</b> "  + dadosPedido.telefone + "<br>" +
        "📍 <b>Bairro:</b> "    + dadosPedido.bairro   + "<br>" +
        "🏠 <b>Endereço:</b> "  + dadosPedido.endereco + "<br>" +
        "📦 <b>Tamanho:</b> "   + dadosPedido.tamanho  + "<br>" +
        "📅 <b>Data:</b> "      + dadosPedido.data     + "<br><br>" +
        "Está correto?"
      );
      addOpcoes(["✅ Sim, confirmar pedido", "❌ Não, refazer pedido"]);
    });

  } else if (etapaAtual === "pedido_confirmacao") {
    if (resposta === "✅ Sim, confirmar pedido") {

      // salvo essas variaveis antes de limpar o objeto
      let numPedido  = dadosPedido.numPedido;
      let telPedido  = dadosPedido.telefone;
      let nomePedido = dadosPedido.nome;

      etapaAtual = "inicio";

      salvarNoSheets({
        numeroPedido: dadosPedido.numPedido,
        nome:         dadosPedido.nome,
        telefone:     dadosPedido.telefone,
        bairro:       dadosPedido.bairro,
        endereco:     dadosPedido.endereco,
        tamanho:      dadosPedido.tamanho,
        data:         dadosPedido.data,
        horario:      new Date().toLocaleString("pt-BR"),
        status:       "Novo"
      });

      dadosPedido = {};

      mostrarDigitando(function() {
        addMsgBot(
          "✅ Pedido <b>" + numPedido + "</b> registrado com sucesso!<br><br>" +
          "Em breve nossa equipe vai entrar em contato pelo <b>" + telPedido + "</b>.<br>" +
          "Obrigado, <b>" + nomePedido + "</b>! 😊"
        );
        setTimeout(function() {
          mostrarDigitando(function() {
            addMsgBot("Posso ajudar com mais alguma coisa?");
            addOpcoes(["📋 Ver preços e tamanhos", "📦 Fazer um pedido", "⏰ Prazo de entrega", "💬 Falar com atendente"]);
          }, 800);
        }, 600);
      }, 1200);

    } else {
      etapaAtual  = "pedido_nome";
      dadosPedido = {};
      mostrarDigitando(function() {
        addMsgBot("Tudo bem! Vamos recomeçar. Qual é o seu <b>nome</b>?");
      });
    }
  }
}

function _menuPrincipal(resposta) {
  if (resposta === "📦 Fazer um pedido") {
    if (!dentroDoHorario()) {
      mostrarDigitando(function() {
        addMsgBot("⏰ Nosso atendimento funciona de <b>segunda a sexta das 7h às 17h</b> e <b>sábado das 7h às 11h</b>.<br><br>Agora estamos fechados. Retorne dentro do horário ou fale conosco pelo WhatsApp! 😊");
        addOpcoes(["💬 Falar com atendente", "🔙 Voltar ao início"]);
      });
      return;
    }
    etapaAtual = "pedido_nome";
    mostrarDigitando(function() {
      addMsgBot("Ótimo! Vou registrar seu pedido. 😊<br><br>Qual é o seu <b>nome completo</b>?");
    });

  } else if (resposta === "📋 Ver preços e tamanhos") {
    mostrarDigitando(function() {
      addMsgBot(
        "Temos os seguintes tamanhos disponíveis:<br><br>" +
        "🟡 <b>3m³</b> — R$ 250,00 (reformas pequenas)<br>" +
        "🟠 <b>5m³</b> — R$ 350,00 (reformas médias)<br>" +
        "🔴 <b>7m³</b> — R$ 450,00 (obras maiores)<br><br>" +
        "Os preços incluem entrega e retirada na cidade."
      );
      setTimeout(function() {
        mostrarDigitando(function() {
          addMsgBot("Posso te ajudar com mais alguma coisa?");
          addOpcoes(["📦 Fazer um pedido", "⏰ Prazo de entrega", "🔙 Voltar ao início"]);
        }, 800);
      }, 500);
    });

  } else if (resposta === "⏰ Prazo de entrega") {
    mostrarDigitando(function() {
      addMsgBot("Nosso prazo é de até <b>24 horas</b> após confirmar o pedido.<br>Atendemos de <b>segunda a sexta das 7h às 17h</b> e <b>sábado das 7h às 11h</b>.");
      setTimeout(function() {
        mostrarDigitando(function() {
          addMsgBot("Quer fazer um pedido ou tem outra dúvida?");
          addOpcoes(["📦 Fazer um pedido", "📋 Ver preços e tamanhos", "🔙 Voltar ao início"]);
        }, 800);
      }, 500);
    });

  } else if (resposta === "🔙 Voltar ao início") {
    etapaAtual = "inicio";
    mostrarDigitando(function() {
      addMsgBot("Como posso te ajudar?");
      addOpcoes(["📋 Ver preços e tamanhos", "📦 Fazer um pedido", "⏰ Prazo de entrega", "💬 Falar com atendente"]);
    });

  } else {
    // qualquer outra mensagem vai pra ia
    perguntarIA(resposta, function(respostaIA) {
      addMsgBot(respostaIA);
      setTimeout(function() {
        addOpcoes(["📋 Ver preços e tamanhos", "📦 Fazer um pedido", "⏰ Prazo de entrega", "💬 Falar com atendente"]);
      }, 400);
    });
  }
}


// ============================================================
// INICIALIZACAO
// ============================================================

function enviarMensagem() {
  let input = document.getElementById("inputMsg");
  let texto = input.value.trim();
  if (texto === "") return;
  limparOpcoes();
  addMsgUsuario(texto);
  input.value = "";
  setTimeout(function() { processarResposta(texto); }, 600);
}

document.getElementById("inputMsg").addEventListener("keypress", function(e) {
  if (e.key === "Enter") enviarMensagem();
});

function iniciarConversa() {
  let statusEl = document.getElementById("statusHeader");
  if (dentroDoHorario()) {
    statusEl.textContent = "Online agora";
    statusEl.classList.add("online");
    statusEl.style.color = "";
  } else {
    statusEl.textContent = "Fora do horário";
    statusEl.classList.remove("online");
    statusEl.style.color = "#e8a840";
  }

  // separador de data "Hoje", igual whatsapp
  let area = document.getElementById("mensagens");
  let sep  = document.createElement("div");
  sep.classList.add("data-separador");
  sep.textContent = "Hoje";
  area.appendChild(sep);

  mostrarDigitando(function() {
    addMsgBot("Olá! 👋 Bem-vindo ao atendimento da <b>NR Caçambas</b>!<br>Como posso te ajudar hoje?");
    addOpcoes(["📋 Ver preços e tamanhos", "📦 Fazer um pedido", "⏰ Prazo de entrega", "💬 Falar com atendente"]);
  }, 1200);
}

window.onload = function() {
  etapaAtual = "inicio";
  iniciarConversa();
};
