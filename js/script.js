// ============================================================
// CONFIGURAÇÕES GERAIS
// ============================================================

// Guarda qual filtro de tarefas está selecionado atualmente.
let filtroTarefasAtual = "todas";

// Guarda os calendários que estão ativos na página.
const calendariosAtivos = [];

// Endereço base da nossa API.
// Como o backend está rodando localmente, usamos localhost.
const API_URL = "http://localhost:3000";

// ============================================================
// INICIALIZAÇÃO
// ============================================================

// Espera o HTML terminar de carregar antes de configurar cada página.
document.addEventListener("DOMContentLoaded", function () {
  // Procura o formulário de cadastro pelo ID.
  const formularioCadastro = document.getElementById("formulario-cadastro");

  // Procura o formulário de login.
  const formularioLogin = document.querySelector('form[action="login.php"]');

  // Procura o formulário de tarefa.
  const formularioTarefa = document.getElementById("formulario-tarefa");

  // Atualiza a saudação quando a página de tarefas é aberta.
  atualizarSaudacao();

  // Atualiza os contadores do perfil.
  atualizarContadores();

  // ========================================================
  // CADASTRO
  // ========================================================

  // Configura o cadastro caso o formulário exista nessa página.
  if (formularioCadastro) {
    configurarCadastro(formularioCadastro);
  }

  // ========================================================
  // LOGIN
  // ========================================================

  // Configura o login caso o formulário exista nessa página.
  if (formularioLogin) {
    configurarLogin(formularioLogin);
  }

  // ========================================================
  // TAREFAS
  // ========================================================

  // Configura a página de adicionar/editar tarefa.
  if (formularioTarefa) {
    configurarPaginaTarefa(formularioTarefa);
  }

  // Configura os filtros e a lista de tarefas.
  if (document.getElementById("lista-tarefas")) {
    configurarFiltrosTarefas();
    renderizarTarefas(filtroTarefasAtual);
  }

  // Configura a página de tarefas concluídas.
  if (document.getElementById("lista-tarefas-concluidas")) {
    renderizarTarefasConcluidas();
  }

  // Configura o calendário da página de tarefas.
  if (document.getElementById("calendario-placeholder")) {
    configurarCalendario("calendario-placeholder", false);
  }

  // Configura o calendário da página de adicionar tarefa.
  if (document.getElementById("calendario-tarefa")) {
    configurarCalendario("calendario-tarefa", true);
  }

  // ========================================================
  // PERFIL
  // ========================================================

  // Verifica se estamos na página de perfil.
  if (document.getElementById("nomePerfil")) {
    // Carrega os dados reais do usuário através da API.
    carregarPerfil();
  }

  // Configura a edição do perfil.
  configurarEdicaoPerfil();

  // ========================================================
  // BOTÃO SAIR
  // ========================================================

  const botaoSair = document.getElementById("sair");

  if (botaoSair) {
    botaoSair.addEventListener("click", function () {
      // Remove os dados básicos do usuário atual.
      localStorage.removeItem("usuarioAtual");

      // Remove também o JWT.
      localStorage.removeItem("token");

      // Volta para a página de login.
      window.location.href = "../index.html";
    });
  }
});

// ============================================================
// USUÁRIO E AUTENTICAÇÃO
// ============================================================

// Recupera os dados do usuário salvo no navegador.
function obterUsuarioAtual() {
  const usuarioSalvo = localStorage.getItem("usuarioAtual");

  return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
}

// Guarda os dados básicos do usuário atual.
function salvarUsuarioAtual(conta) {
  localStorage.setItem(
    "usuarioAtual",
    JSON.stringify({
      id: conta.id,
      nome: conta.nome,
      email: conta.email,
    }),
  );
}

// Recupera o JWT salvo no navegador.
function obterToken() {
  return localStorage.getItem("token");
}

// ============================================================
// SAUDAÇÃO
// ============================================================

// Mostra o nome do usuário salvo ou somente "Olá,".
function atualizarSaudacao() {
  const saudacao = document.getElementById("saudacao-usuario");

  if (!saudacao) {
    return;
  }

  const usuarioAtual = obterUsuarioAtual();

  if (!usuarioAtual) {
    saudacao.textContent = "Olá,";

    return;
  }

  saudacao.textContent = `Olá, ${usuarioAtual.nome}`;
}

// ============================================================
// CONTADORES DO PERFIL
// ============================================================

// Conta somente as tarefas da conta atual.
function atualizarContadores() {
  const total = document.getElementById("total-tarefas");

  const concluidas = document.getElementById("tarefas-concluidas");

  if (!total || !concluidas) {
    return;
  }

  const tarefas = obterTarefasDoUsuarioAtual();

  total.textContent = tarefas.length;

  concluidas.textContent = tarefas.filter(function (tarefa) {
    return tarefa.concluida;
  }).length;
}

// ============================================================
// PERFIL - BUSCAR DADOS NA API
// ============================================================

// Busca os dados do usuário autenticado no backend.
async function carregarPerfil() {
  const token = obterToken();

  // Se não existe token, não existe autenticação válida.
  if (!token) {
    alert("Sua sessão não foi encontrada. Faça login novamente.");

    window.location.href = "../index.html";

    return;
  }

  try {
    // Faz uma requisição para a rota protegida.
    const resposta = await fetch(`${API_URL}/usuarios/me`, {
      method: "GET",

      // Envia o JWT no cabeçalho Authorization.
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Converte a resposta para JSON.
    const dados = await resposta.json();

    // Verifica se o token expirou ou é inválido.
    if (resposta.status === 401) {
      // Remove a sessão inválida.
      localStorage.removeItem("token");
      localStorage.removeItem("usuarioAtual");

      alert("Sua sessão expirou. Faça login novamente.");

      window.location.href = "../index.html";

      return;
    }

    // Verifica outros erros.
    if (!resposta.ok) {
      alert(dados.erro || "Não foi possível carregar o perfil.");

      return;
    }

    // Atualiza os dados do usuário no navegador.
    salvarUsuarioAtual(dados);

    // Atualiza os elementos visuais da página.
    const nomePerfil = document.getElementById("nomePerfil");

    const emailPerfil = document.getElementById("emailPerfil");

    if (nomePerfil) {
      nomePerfil.textContent = dados.nome;
    }

    if (emailPerfil) {
      emailPerfil.textContent = dados.email;
    }

    // Atualiza também a saudação.
    atualizarSaudacao();

    // Atualiza os contadores das tarefas.
    atualizarContadores();

    // Preenche os campos de edição.
    preencherCamposEdicaoPerfil(dados);
  } catch (erro) {
    // Mostra o erro no console para facilitar a identificação.
    console.error("Erro ao carregar perfil:", erro);

    alert("Não foi possível conectar ao servidor.");
  }
}

// ============================================================
// PERFIL - EDITAR
// ============================================================

// Configura o botão e o formulário de edição do perfil.
function configurarEdicaoPerfil() {
  const botaoEditar = document.getElementById("editar-perfil");

  const areaEditar = document.getElementById("area-editar-perfil");

  const formulario = document.getElementById("formulario-editar-perfil");

  const botaoCancelar = document.getElementById("cancelar-edicao-perfil");

  // Se a página não possui os elementos de edição,
  // simplesmente não fazemos nada.
  if (!botaoEditar || !areaEditar || !formulario || !botaoCancelar) {
    return;
  }

  // ========================================================
  // BOTÃO EDITAR
  // ========================================================

  botaoEditar.addEventListener("click", function () {
    // Recupera os dados atuais do usuário.
    const usuarioAtual = obterUsuarioAtual();

    // Preenche os campos com os dados atuais.
    if (usuarioAtual) {
      preencherCamposEdicaoPerfil(usuarioAtual);
    }

    // Mostra a área de edição.
    areaEditar.hidden = false;

    // Esconde o botão editar enquanto
    // o formulário está aberto.
    botaoEditar.hidden = true;

    // Coloca o cursor no campo de nome.
    const campoNome = document.getElementById("nome-editar");

    if (campoNome) {
      campoNome.focus();
    }
  });

  // ========================================================
  // BOTÃO CANCELAR
  // ========================================================

  botaoCancelar.addEventListener("click", function () {
    // Esconde novamente o formulário.
    areaEditar.hidden = true;

    // Mostra o botão editar.
    botaoEditar.hidden = false;
  });

  // ========================================================
  // SALVAR ALTERAÇÕES
  // ========================================================

  formulario.addEventListener("submit", async function (evento) {
    // Impede o formulário de recarregar a página.
    evento.preventDefault();

    // Pega os valores digitados.
    const nome = document.getElementById("nome-editar").value.trim();

    const email = document
      .getElementById("email-editar")
      .value.trim()
      .toLowerCase();

    // Validação básica.
    if (!nome || !email) {
      alert("Nome e e-mail são obrigatórios.");

      return;
    }

    // Recupera o JWT.
    const token = obterToken();

    // Sem token não podemos alterar o perfil.
    if (!token) {
      alert("Sua sessão expirou. Faça login novamente.");

      window.location.href = "../index.html";

      return;
    }

    try {
      // Envia os novos dados para a API.
      const resposta = await fetch(`${API_URL}/usuarios/me`, {
        // PUT significa atualização.
        method: "PUT",

        // Informa que estamos enviando JSON.
        headers: {
          "Content-Type": "application/json",

          // Envia o JWT para autenticar
          // o usuário da requisição.
          Authorization: `Bearer ${token}`,
        },

        // Envia somente os dados que podem
        // ser alterados pelo usuário.
        body: JSON.stringify({
          nome: nome,
          email: email,
        }),
      });

      // Converte a resposta para JSON.
      const dados = await resposta.json();

      // Verifica se o token expirou.
      if (resposta.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuarioAtual");

        alert("Sua sessão expirou. Faça login novamente.");

        window.location.href = "../index.html";

        return;
      }

      // Verifica se o e-mail já está sendo utilizado.
      if (resposta.status === 409) {
        alert(dados.erro || "Este e-mail já está cadastrado.");

        return;
      }

      // Verifica outros erros.
      if (!resposta.ok) {
        alert(dados.erro || "Não foi possível atualizar o perfil.");

        return;
      }

      // Depois da alteração, busca novamente os dados
      // diretamente do banco através da API.
      await carregarPerfil();

      // Fecha a área de edição.
      areaEditar.hidden = true;

      // Mostra novamente o botão editar.
      botaoEditar.hidden = false;

      // =================================================
      // MENSAGEM DE SUCESSO
      // =================================================

      // Cria a mensagem visual de sucesso.
      mostrarMensagemPerfil(dados.mensagem || "Perfil atualizado com sucesso!");
    } catch (erro) {
      console.error("Erro ao atualizar perfil:", erro);

      alert("Não foi possível conectar ao servidor.");
    }
  });
}

// ============================================================
// PERFIL - MENSAGEM DE SUCESSO
// ============================================================

// Cria uma mensagem visual de sucesso
// sem precisar colocar um elemento no HTML.
function mostrarMensagemPerfil(texto) {
  // Verifica se já existe uma mensagem na tela.
  const mensagemAntiga = document.querySelector(".mensagem-perfil");

  // Remove a mensagem antiga para evitar duplicação.
  if (mensagemAntiga) {
    mensagemAntiga.remove();
  }

  // Cria um novo elemento <div>.
  const mensagem = document.createElement("div");

  // Adiciona a classe que será estilizada pelo CSS.
  mensagem.className = "mensagem-perfil";

  // Define a mensagem de acessibilidade.
  mensagem.setAttribute("role", "status");

  // Coloca o texto dentro da mensagem.
  mensagem.textContent = texto;

  // Adiciona a mensagem diretamente ao body.
  document.body.appendChild(mensagem);

  // Remove automaticamente depois de 3 segundos.
  setTimeout(function () {
    mensagem.remove();
  }, 3000);
}

// ============================================================
// PERFIL - PREENCHER CAMPOS
// ============================================================

// Preenche os campos do formulário com os dados do usuário.
function preencherCamposEdicaoPerfil(usuario) {
  const campoNome = document.getElementById("nome-editar");

  const campoEmail = document.getElementById("email-editar");

  if (campoNome) {
    campoNome.value = usuario.nome || "";
  }

  if (campoEmail) {
    campoEmail.value = usuario.email || "";
  }
}

// ============================================================
// CADASTRO
// ============================================================

// O cadastro é realizado através da API.
// A senha NÃO é salva no localStorage.
// Ela é enviada para o backend,
// onde o bcrypt cria o hash.
function configurarCadastro(formularioCadastro) {
  formularioCadastro.addEventListener("submit", async function (evento) {
    // Impede o formulário de recarregar a página.
    evento.preventDefault();

    // Pega o nome digitado pelo usuário.
    const nome = document.getElementById("username").value.trim();

    // Pega o e-mail digitado pelo usuário.
    const email = document.getElementById("email").value.trim().toLowerCase();

    // Pega a senha digitada pelo usuário.
    const senha = document.getElementById("password").value.trim();

    // Impede o envio com campos vazios.
    if (!nome || !email || !senha) {
      alert("Preencha Nome, Email e Senha.");

      return;
    }

    try {
      // Envia os dados para o backend.
      const resposta = await fetch(`${API_URL}/usuarios`, {
        // POST é utilizado para criar
        // um novo usuário.
        method: "POST",

        // Informa ao servidor que estamos
        // enviando dados em formato JSON.
        headers: {
          "Content-Type": "application/json",
        },

        // Converte os dados do formulário
        // para JSON antes de enviar.
        body: JSON.stringify({
          nome: nome,
          email: email,
          senha: senha,
        }),
      });

      // Converte a resposta da API para JSON.
      const dados = await resposta.json();

      // Verifica se o cadastro apresentou erro.
      if (!resposta.ok) {
        // Se o e-mail já existir,
        // o backend retorna o status 409.
        if (resposta.status === 409) {
          mostrarMensagemCadastro("Conta já criada! Faça o login.", "atencao");

          setTimeout(function () {
            window.location.href = "../index.html";
          }, 3000);

          return;
        }

        // Mostra outros erros enviados pela API.
        alert(dados.erro || "Não foi possível realizar o cadastro.");

        return;
      }

      // Cadastro realizado com sucesso.
      mostrarMensagemCadastro("Cadastro realizado com sucesso!");

      // Limpa os campos do formulário.
      formularioCadastro.reset();

      // Depois do cadastro,
      // volta para o login.
      setTimeout(function () {
        window.location.href = "../index.html";
      }, 3000);
    } catch (erro) {
      // Mostra o erro no console.
      console.error("Erro ao realizar cadastro:", erro);

      // Esse erro normalmente acontece quando
      // o navegador não consegue acessar a API.
      alert(
        "Não foi possível conectar ao servidor. " +
          "Verifique se o backend está funcionando.",
      );
    }
  });
}

// ============================================================
// MENSAGEM DE CADASTRO
// ============================================================

// Cria uma mensagem visual usando o CSS do cadastro.
function mostrarMensagemCadastro(texto, tipo) {
  const mensagem = document.createElement("div");

  mensagem.className = "mensagem-cadastro";

  if (tipo) {
    mensagem.classList.add("mensagem-" + tipo);
  }

  mensagem.setAttribute("role", "status");

  mensagem.textContent = texto;

  document.body.appendChild(mensagem);
}

// ============================================================
// LOGIN
// ============================================================

// O login é realizado através da API.
function configurarLogin(formularioLogin) {
  formularioLogin.addEventListener("submit", async function (evento) {
    // Impede o formulário de recarregar a página.
    evento.preventDefault();

    // O campo username representa o e-mail.
    const email = document
      .getElementById("username")
      .value.trim()
      .toLowerCase();

    const senha = document.getElementById("password").value.trim();

    // Verifica se os campos foram preenchidos.
    if (!email || !senha) {
      alert("E-mail e senha são obrigatórios.");

      return;
    }

    try {
      // Envia o login para o backend.
      const resposta = await fetch(`${API_URL}/usuarios/login`, {
        // Método utilizado para login.
        method: "POST",

        // Informa que estamos enviando JSON.
        headers: {
          "Content-Type": "application/json",
        },

        // Envia e-mail e senha.
        body: JSON.stringify({
          email: email,
          senha: senha,
        }),
      });

      // Converte a resposta para JSON.
      const dados = await resposta.json();

      // Verifica se o login falhou.
      if (!resposta.ok) {
        alert(dados.erro || "E-mail ou senha incorretos.");

        return;
      }

      // =================================================
      // LOGIN REALIZADO
      // =================================================

      // Salva o JWT recebido do backend.
      // O token será usado nas rotas protegidas.
      localStorage.setItem("token", dados.token);

      // Salva somente os dados básicos do usuário.
      // A senha nunca é armazenada aqui.
      salvarUsuarioAtual(dados.usuario);

      // Vai para a página principal.
      window.location.href = "html/tarefas.html";
    } catch (erro) {
      // Mostra o erro no console.
      console.error("Erro ao realizar login:", erro);

      alert(
        "Não foi possível conectar ao servidor. " +
          "Verifique se o backend está funcionando.",
      );
    }
  });
}

// ============================================================
// TAREFAS - LOCALSTORAGE
// ============================================================

// Lê todas as tarefas agrupadas pelo e-mail de cada conta.
function obterTarefasSalvas() {
  const tarefasSalvas = localStorage.getItem("tarefasPorUsuario");

  return tarefasSalvas ? JSON.parse(tarefasSalvas) : {};
}

// Salva novamente a lista completa de tarefas.
function salvarTarefasSalvas(tarefasPorUsuario) {
  localStorage.setItem("tarefasPorUsuario", JSON.stringify(tarefasPorUsuario));
}

// Devolve somente as tarefas da conta atual.
function obterTarefasDoUsuarioAtual() {
  const usuarioAtual = obterUsuarioAtual();

  const tarefasPorUsuario = obterTarefasSalvas();

  if (!usuarioAtual) {
    return [];
  }

  return tarefasPorUsuario[usuarioAtual.email] || [];
}

// ============================================================
// ADICIONAR / EDITAR TAREFA
// ============================================================

// Configura o formulário e a lista lateral.
function configurarPaginaTarefa(formularioTarefa) {
  const usuarioAtual = obterUsuarioAtual();

  const idTarefaEditando = localStorage.getItem("tarefaEditando");

  if (!usuarioAtual) {
    alert("Faça login antes de adicionar uma tarefa.");

    window.location.href = "../index.html";

    return;
  }

  renderizarListaTarefasExistentes();

  if (idTarefaEditando) {
    carregarTarefaParaEdicao(idTarefaEditando);
  }

  formularioTarefa.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const titulo = document.getElementById("titulo-tarefa").value.trim();

    const data = document.getElementById("data-tarefa").value;

    const importancia = document.getElementById("importancia-tarefa").value;

    const descricao = document.getElementById("descricao-tarefa").value.trim();

    // Validação básica.
    if (!titulo || !data || !importancia) {
      alert("Preencha o nome, a data e a importância da tarefa.");

      return;
    }

    // =================================================
    // EDITAR TAREFA
    // =================================================

    if (idTarefaEditando) {
      const atualizou = alterarTarefaAtual(
        idTarefaEditando,
        function (tarefaAtualizada) {
          tarefaAtualizada.titulo = titulo;

          tarefaAtualizada.data = data;

          tarefaAtualizada.importancia = importancia;

          tarefaAtualizada.descricao = descricao;
        },
      );

      if (atualizou) {
        localStorage.removeItem("tarefaEditando");

        window.location.href = "../html/tarefas.html";
      }

      return;
    }

    // =================================================
    // NOVA TAREFA
    // =================================================

    const novaTarefa = {
      // Cria um ID único para a tarefa.
      id: Date.now().toString() + "-" + Math.random().toString(16).slice(2),

      titulo: titulo,

      data: data,

      importancia: importancia,

      descricao: descricao,

      concluida: false,

      fixada: false,
    };

    const tarefasPorUsuario = obterTarefasSalvas();

    const tarefasDoUsuario = tarefasPorUsuario[usuarioAtual.email] || [];

    tarefasDoUsuario.push(novaTarefa);

    tarefasPorUsuario[usuarioAtual.email] = tarefasDoUsuario;

    salvarTarefasSalvas(tarefasPorUsuario);

    window.location.href = "../html/tarefas.html";
  });

  // ========================================================
  // BOTÃO CANCELAR
  // ========================================================

  const botaoCancelar = document.getElementById("cancelar-tarefa");

  if (botaoCancelar) {
    botaoCancelar.addEventListener("click", function () {
      localStorage.removeItem("tarefaEditando");

      window.location.href = "../html/tarefas.html";
    });
  }
}

// ============================================================
// EDITAR TAREFA - CARREGAR
// ============================================================

// Preenche o formulário com os dados da tarefa.
function carregarTarefaParaEdicao(id) {
  const tarefa = obterTarefasDoUsuarioAtual().find(function (item) {
    return item.id === id;
  });

  if (!tarefa) {
    localStorage.removeItem("tarefaEditando");

    return;
  }

  document.getElementById("titulo-tarefa").value = tarefa.titulo;

  document.getElementById("data-tarefa").value = tarefa.data;

  document.getElementById("importancia-tarefa").value = tarefa.importancia;

  document.getElementById("descricao-tarefa").value = tarefa.descricao;

  const tituloPagina = document.getElementById("titulo-pagina-tarefa");

  if (tituloPagina) {
    tituloPagina.textContent = "Editar tarefa";
  }

  const tituloFormulario = document.getElementById("titulo-formulario-tarefa");

  if (tituloFormulario) {
    tituloFormulario.textContent = "Editar tarefa";
  }
}

// ============================================================
// LISTA DE TAREFAS EXISTENTES
// ============================================================

// Mostra as tarefas existentes na lista lateral.
function renderizarListaTarefasExistentes() {
  const lista = document.getElementById("lista-tarefas-existentes");

  const mensagemVazia = document.getElementById("sem-tarefas-existentes");

  if (!lista || !mensagemVazia) {
    return;
  }

  const tarefas = obterTarefasDoUsuarioAtual().filter(function (tarefa) {
    return !tarefa.concluida;
  });

  lista.innerHTML = "";

  mensagemVazia.hidden = tarefas.length > 0;

  tarefas.forEach(function (tarefa) {
    const item = document.createElement("li");

    item.className = "tarefa-existente";

    const titulo = document.createElement("strong");

    titulo.textContent = tarefa.titulo;

    const data = document.createElement("small");

    data.textContent = formatarData(tarefa.data);

    item.appendChild(titulo);

    item.appendChild(data);

    lista.appendChild(item);
  });
}

// ============================================================
// FILTROS
// ============================================================

// Prepara os botões de importância.
function configurarFiltrosTarefas() {
  document.querySelectorAll(".filtro").forEach(function (botao) {
    botao.addEventListener("click", function () {
      filtroTarefasAtual = botao.dataset.filtro;

      atualizarFiltroAtivo();

      renderizarTarefas(filtroTarefasAtual);
    });
  });

  atualizarFiltroAtivo();
}

// Destaca visualmente o filtro ativo.
function atualizarFiltroAtivo() {
  document.querySelectorAll(".filtro").forEach(function (botao) {
    const estaAtivo = botao.dataset.filtro === filtroTarefasAtual;

    botao.classList.toggle("filtro-ativo", estaAtivo);

    botao.setAttribute("aria-pressed", estaAtivo ? "true" : "false");
  });
}

// ============================================================
// RENDERIZAR TAREFAS
// ============================================================

// Mostra as tarefas pendentes da conta atual.
function renderizarTarefas(filtro) {
  const lista = document.getElementById("lista-tarefas");

  const modelo = document.getElementById("modelo-tarefa");

  const mensagemVazia = document.getElementById("sem-tarefas");

  if (!lista || !modelo || !mensagemVazia) {
    return;
  }

  lista.querySelectorAll(".card-tarefa").forEach(function (card) {
    card.remove();
  });

  const tarefas = obterTarefasDoUsuarioAtual()
    .filter(function (tarefa) {
      return (
        !tarefa.concluida &&
        (filtro === "todas" || tarefa.importancia === filtro)
      );
    })

    .sort(compararTarefas);

  mensagemVazia.hidden = tarefas.length > 0;

  tarefas.forEach(function (tarefa) {
    const card = modelo.content.cloneNode(true);

    const elementoCard = card.querySelector(".card-tarefa");

    elementoCard.dataset.importancia = tarefa.importancia;

    elementoCard.dataset.id = tarefa.id;

    card.querySelector(".nome-tarefa").textContent = tarefa.titulo;

    card.querySelector(".data-tarefa").textContent = formatarData(tarefa.data);

    card.querySelector(".data-tarefa").dateTime = tarefa.data;

    card.querySelector(".importancia-tarefa").textContent =
      "Importância: " + formatarImportancia(tarefa.importancia);

    card.querySelector(".descricao-tarefa").textContent =
      tarefa.descricao || "Sem descrição.";

    card.querySelector(".checkbox-conclusao").checked = tarefa.concluida;

    card
      .querySelector(".botao-fixar")
      .setAttribute("aria-pressed", tarefa.fixada ? "true" : "false");

    card.querySelector(".botao-fixar").title = tarefa.fixada
      ? "Desafixar tarefa"
      : "Fixar tarefa";

    if (tarefa.fixada) {
      elementoCard.classList.add("tarefa-fixada");

      card.querySelector(".botao-fixar").classList.add("fixar-ativo");
    }

    configurarAcoesDoCard(card, tarefa);

    lista.appendChild(card);
  });
}

// ============================================================
// ORGANIZAÇÃO DAS TAREFAS
// ============================================================

// Mantém tarefas fixadas primeiro e organiza por importância.
function compararTarefas(primeiraTarefa, segundaTarefa) {
  if (primeiraTarefa.fixada !== segundaTarefa.fixada) {
    return primeiraTarefa.fixada ? -1 : 1;
  }

  const pesos = {
    alta: 1,

    media: 2,

    baixa: 3,
  };

  return (
    (pesos[primeiraTarefa.importancia] || 4) -
    (pesos[segundaTarefa.importancia] || 4)
  );
}

// ============================================================
// ALTERAR TAREFA
// ============================================================

// Atualiza uma tarefa da conta atual.
function alterarTarefaAtual(id, alteracao) {
  const usuarioAtual = obterUsuarioAtual();

  if (!usuarioAtual) {
    return false;
  }

  const tarefasPorUsuario = obterTarefasSalvas();

  const tarefas = tarefasPorUsuario[usuarioAtual.email] || [];

  const indice = tarefas.findIndex(function (tarefa) {
    return tarefa.id === id;
  });

  if (indice === -1) {
    return false;
  }

  alteracao(tarefas[indice]);

  tarefasPorUsuario[usuarioAtual.email] = tarefas;

  salvarTarefasSalvas(tarefasPorUsuario);

  return true;
}

// ============================================================
// AÇÕES DO CARD
// ============================================================

// Liga os controles ao card correspondente.
function configurarAcoesDoCard(card, tarefa) {
  const elementoCard = card.querySelector(".card-tarefa");

  // ========================================================
  // FIXAR
  // ========================================================

  card.querySelector(".botao-fixar").addEventListener("click", function () {
    alterarTarefaAtual(tarefa.id, function (tarefaAtualizada) {
      tarefaAtualizada.fixada = !tarefaAtualizada.fixada;
    });

    renderizarTarefas(filtroTarefasAtual);

    renderizarCalendarios();
  });

  // ========================================================
  // CONCLUIR
  // ========================================================

  card
    .querySelector(".checkbox-conclusao")
    .addEventListener("change", function () {
      concluirTarefa(tarefa.id);
    });

  // ========================================================
  // EDITAR
  // ========================================================

  card.querySelector(".botao-editar").addEventListener("click", function () {
    localStorage.setItem("tarefaEditando", tarefa.id);

    window.location.href = "tarefa.html";
  });

  // ========================================================
  // EXCLUIR
  // ========================================================

  card.querySelector(".botao-excluir").addEventListener("click", function () {
    mostrarConfirmacaoExclusao(tarefa.id);
  });

  // Permite foco pelo teclado.
  elementoCard.setAttribute("tabindex", "0");
}

// ============================================================
// CONCLUIR TAREFA
// ============================================================

// Marca uma tarefa como concluída.
function concluirTarefa(id) {
  alterarTarefaAtual(id, function (tarefaAtualizada) {
    tarefaAtualizada.concluida = true;
  });

  renderizarTarefas(filtroTarefasAtual);

  renderizarCalendarios();

  atualizarContadores();
}

// ============================================================
// MODAL DE EXCLUSÃO
// ============================================================

// Mostra confirmação antes de excluir.
function mostrarConfirmacaoExclusao(id) {
  const modal = document.createElement("div");

  modal.className = "modal-confirmacao";

  const conteudo = document.createElement("div");

  conteudo.className = "conteudo-confirmacao";

  const mensagem = document.createElement("p");

  mensagem.textContent = "Tem certeza?";

  const acoes = document.createElement("div");

  acoes.className = "acoes-confirmacao";

  const cancelar = document.createElement("button");

  cancelar.type = "button";

  cancelar.className = "botao-cancelar-exclusao";

  cancelar.textContent = "Cancelar";

  const confirmar = document.createElement("button");

  confirmar.type = "button";

  confirmar.className = "botao-confirmar-exclusao";

  confirmar.textContent = "Sim";

  cancelar.addEventListener("click", function () {
    modal.remove();
  });

  confirmar.addEventListener("click", function () {
    excluirTarefa(id);

    modal.remove();
  });

  acoes.appendChild(cancelar);

  acoes.appendChild(confirmar);

  conteudo.appendChild(mensagem);

  conteudo.appendChild(acoes);

  modal.appendChild(conteudo);

  document.body.appendChild(modal);

  cancelar.focus();
}

// ============================================================
// EXCLUIR TAREFA
// ============================================================

// Remove somente a tarefa da conta atual.
function excluirTarefa(id) {
  const usuarioAtual = obterUsuarioAtual();

  if (!usuarioAtual) {
    return;
  }

  const tarefasPorUsuario = obterTarefasSalvas();

  const tarefas = tarefasPorUsuario[usuarioAtual.email] || [];

  tarefasPorUsuario[usuarioAtual.email] = tarefas.filter(function (tarefa) {
    return tarefa.id !== id;
  });

  salvarTarefasSalvas(tarefasPorUsuario);

  renderizarTarefas(filtroTarefasAtual);

  renderizarTarefasConcluidas();

  renderizarListaTarefasExistentes();

  renderizarCalendarios();

  atualizarContadores();
}

// ============================================================
// TAREFAS CONCLUÍDAS
// ============================================================

// Renderiza somente as tarefas concluídas.
function renderizarTarefasConcluidas() {
  const lista = document.getElementById("lista-tarefas-concluidas");

  const mensagemVazia = document.getElementById("sem-tarefas-concluidas");

  const quantidade = document.getElementById("quantidade-concluidas");

  if (!lista || !mensagemVazia || !quantidade) {
    return;
  }

  const tarefas = obterTarefasDoUsuarioAtual().filter(function (tarefa) {
    return tarefa.concluida;
  });

  lista.innerHTML = "";

  quantidade.textContent = tarefas.length;

  mensagemVazia.hidden = tarefas.length > 0;

  tarefas.forEach(function (tarefa) {
    const card = document.createElement("article");

    card.className = "tarefa-concluida";

    const titulo = document.createElement("h2");

    titulo.textContent = tarefa.titulo;

    const meta = document.createElement("p");

    meta.className = "meta-tarefa";

    meta.textContent =
      formatarData(tarefa.data) +
      " • " +
      formatarImportancia(tarefa.importancia);

    const descricao = document.createElement("p");

    descricao.className = "descricao-tarefa-concluida";

    descricao.textContent = tarefa.descricao || "Sem descrição.";

    const excluir = document.createElement("button");

    excluir.type = "button";

    excluir.className = "botao-excluir-concluida";

    excluir.textContent = "Excluir";

    excluir.addEventListener("click", function () {
      mostrarConfirmacaoExclusao(tarefa.id);
    });

    card.appendChild(titulo);

    card.appendChild(meta);

    card.appendChild(descricao);

    card.appendChild(excluir);

    lista.appendChild(card);
  });
}

// ============================================================
// FORMATAÇÃO
// ============================================================

// Converte YYYY-MM-DD para DD/MM/YYYY.
function formatarData(data) {
  if (!data) {
    return "Sem data";
  }

  const partes = data.split("-");

  return partes.length === 3
    ? partes[2] + "/" + partes[1] + "/" + partes[0]
    : data;
}

// Mostra a importância com a primeira letra maiúscula.
function formatarImportancia(importancia) {
  const nomes = {
    alta: "Alta",

    media: "Média",

    baixa: "Baixa",
  };

  return nomes[importancia] || importancia;
}

// ============================================================
// CALENDÁRIO
// ============================================================

// Cria um calendário dentro da área existente.
function configurarCalendario(idArea, sincronizarFormulario) {
  const area = document.getElementById(idArea);

  if (!area) {
    return;
  }

  const entradaData = sincronizarFormulario
    ? document.getElementById("data-tarefa")
    : null;

  let dataInicial =
    entradaData && entradaData.value
      ? criarDataLocal(entradaData.value)
      : new Date();

  const calendario = {
    area: area,

    ano: dataInicial.getFullYear(),

    mes: dataInicial.getMonth(),

    entradaData: entradaData,

    sincronizarFormulario: sincronizarFormulario,
  };

  calendariosAtivos.push(calendario);

  renderizarCalendario(calendario);

  if (entradaData) {
    entradaData.addEventListener("change", function () {
      if (!entradaData.value) {
        return;
      }

      const dataSelecionada = criarDataLocal(entradaData.value);

      calendario.ano = dataSelecionada.getFullYear();

      calendario.mes = dataSelecionada.getMonth();

      renderizarCalendario(calendario);
    });
  }
}

// Redesenha todos os calendários.
function renderizarCalendarios() {
  calendariosAtivos.forEach(function (calendario) {
    renderizarCalendario(calendario);
  });
}

// Monta o mês, navegação e dias.
function renderizarCalendario(calendario) {
  const tarefas = obterTarefasDoUsuarioAtual();

  const tarefasPorData = {};

  tarefas.forEach(function (tarefa) {
    if (tarefa.data) {
      tarefasPorData[tarefa.data] = true;
    }
  });

  calendario.area.innerHTML = "";

  const controles = document.createElement("div");

  controles.className = "calendario-controles";

  const anterior = document.createElement("button");

  anterior.type = "button";

  anterior.className = "mes-anterior";

  anterior.textContent = "‹";

  anterior.setAttribute("aria-label", "Mês anterior");

  anterior.addEventListener("click", function () {
    calendario.mes -= 1;

    ajustarMesCalendario(calendario);

    renderizarCalendario(calendario);
  });

  const titulo = document.createElement("h3");

  titulo.textContent = new Date(
    calendario.ano,
    calendario.mes,
    1,
  ).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const proximo = document.createElement("button");

  proximo.type = "button";

  proximo.className = "mes-proximo";

  proximo.textContent = "›";

  proximo.setAttribute("aria-label", "Próximo mês");

  proximo.addEventListener("click", function () {
    calendario.mes += 1;

    ajustarMesCalendario(calendario);

    renderizarCalendario(calendario);
  });

  controles.appendChild(anterior);

  controles.appendChild(titulo);

  controles.appendChild(proximo);

  const nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const grade = document.createElement("div");

  grade.className = "calendario-grade";

  nomesDias.forEach(function (nomeDia) {
    const cabecalhoDia = document.createElement("span");

    cabecalhoDia.className = "calendario-dia-semana";

    cabecalhoDia.textContent = nomeDia;

    grade.appendChild(cabecalhoDia);
  });

  const primeiroDia = new Date(calendario.ano, calendario.mes, 1).getDay();

  const totalDias = new Date(calendario.ano, calendario.mes + 1, 0).getDate();

  const hoje = dataParaChave(new Date());

  const dataSelecionada = calendario.entradaData
    ? calendario.entradaData.value
    : "";

  // Cria espaços antes do primeiro dia.
  for (let vazio = 0; vazio < primeiroDia; vazio += 1) {
    const espaco = document.createElement("span");

    espaco.className = "calendario-dia vazio";

    grade.appendChild(espaco);
  }

  // Cria os dias do mês.
  for (let dia = 1; dia <= totalDias; dia += 1) {
    const data = new Date(calendario.ano, calendario.mes, dia);

    const chave = dataParaChave(data);

    const botaoDia = document.createElement("button");

    botaoDia.type = "button";

    botaoDia.className = "calendario-dia";

    botaoDia.textContent = dia;

    botaoDia.dataset.data = chave;

    // Destaca o dia atual.
    if (chave === hoje) {
      botaoDia.classList.add("dia-atual");
    }

    // Destaca dias que possuem tarefas.
    if (tarefasPorData[chave]) {
      botaoDia.classList.add("dia-com-tarefa");
    }

    // Destaca a data selecionada.
    if (chave === dataSelecionada) {
      botaoDia.classList.add("dia-selecionado");
    }

    // Se for o calendário do formulário,
    // permite selecionar uma data.
    if (calendario.sincronizarFormulario) {
      botaoDia.addEventListener("click", function () {
        calendario.entradaData.value = chave;

        calendario.ano = data.getFullYear();

        calendario.mes = data.getMonth();

        renderizarCalendario(calendario);
      });
    }

    grade.appendChild(botaoDia);
  }

  calendario.area.appendChild(controles);

  calendario.area.appendChild(grade);
}

// Mantém o mês entre janeiro e dezembro.
function ajustarMesCalendario(calendario) {
  while (calendario.mes < 0) {
    calendario.mes += 12;

    calendario.ano -= 1;
  }

  while (calendario.mes > 11) {
    calendario.mes -= 12;

    calendario.ano += 1;
  }
}

// Converte YYYY-MM-DD para uma data local.
function criarDataLocal(data) {
  const partes = data.split("-").map(Number);

  return new Date(partes[0], partes[1] - 1, partes[2]);
}

// Converte Date para YYYY-MM-DD.
function dataParaChave(data) {
  const ano = data.getFullYear();

  const mes = String(data.getMonth() + 1).padStart(2, "0");

  const dia = String(data.getDate()).padStart(2, "0");

  return ano + "-" + mes + "-" + dia;
}