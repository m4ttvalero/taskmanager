let filtroTarefasAtual = "todas";
const calendariosAtivos = [];

// Espera o HTML terminar de carregar antes de configurar cada página.
document.addEventListener("DOMContentLoaded", function () {
	const formularioCadastro = document.querySelector('form[action="cadastro.php"]');
	const formularioLogin = document.querySelector('form[action="login.php"]');
	const formularioTarefa = document.getElementById("formulario-tarefa");

	// Atualiza a saudação quando a página tarefas é aberta.
	atualizarSaudacao();
	atualizarContadores();

	if (formularioCadastro) {
		configurarCadastro(formularioCadastro);
	}

	if (formularioLogin) {
		configurarLogin(formularioLogin);
	}

	if (formularioTarefa) {
		configurarPaginaTarefa(formularioTarefa);
	}

	if (document.getElementById("lista-tarefas")) {
		configurarFiltrosTarefas();
		renderizarTarefas(filtroTarefasAtual);
	}

	if (document.getElementById("lista-tarefas-concluidas")) {
		renderizarTarefasConcluidas();
	}

	if (document.getElementById("calendario-placeholder")) {
		configurarCalendario("calendario-placeholder", false);
	}

	if (document.getElementById("calendario-tarefa")) {
		configurarCalendario("calendario-tarefa", true);
	}

// ==============================
// PERFIL
// ==============================

const nomePerfil = document.getElementById("nomePerfil");
const emailPerfil = document.getElementById("emailPerfil");
const botaoSair = document.getElementById("sair");

const usuarioAtual = obterUsuarioAtual();

if (usuarioAtual) {

    if (nomePerfil) {
        nomePerfil.textContent = usuarioAtual.nome;
    }

    if (emailPerfil) {
        emailPerfil.textContent = usuarioAtual.email;
    }

    atualizarContadores();
}


// ==============================
// BOTÃO SAIR
// ==============================

if (botaoSair) {

    botaoSair.addEventListener("click", function () {

        localStorage.removeItem("usuarioAtual");

        window.location.href = "../index.html";
    });
}

});

// Lê as contas salvas no navegador ou devolve uma lista vazia.
function obterContas() {
	const contasSalvas = localStorage.getItem("contas");
	return contasSalvas ? JSON.parse(contasSalvas) : [];
}

// Recupera os dados da conta que está usando o site neste momento.
function obterUsuarioAtual() {
	const usuarioSalvo = localStorage.getItem("usuarioAtual");
	return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
}

// Guarda qual conta está usando o site neste momento.
function salvarUsuarioAtual(conta) {
	localStorage.setItem("usuarioAtual", JSON.stringify({
		nome: conta.nome,
		email: conta.email
	}));
}

// Lê todas as tarefas agrupadas pelo e-mail de cada conta.
function obterTarefasSalvas() {
	const tarefasSalvas = localStorage.getItem("tarefasPorUsuario");
	return tarefasSalvas ? JSON.parse(tarefasSalvas) : {};
}

// Salva novamente a lista completa de tarefas no navegador.
function salvarTarefasSalvas(tarefasPorUsuario) {
	localStorage.setItem("tarefasPorUsuario", JSON.stringify(tarefasPorUsuario));
}

// Devolve somente as tarefas pertencentes à conta atual.
function obterTarefasDoUsuarioAtual() {
	const usuarioAtual = obterUsuarioAtual();
	const tarefasPorUsuario = obterTarefasSalvas();

	if (!usuarioAtual) {
		return [];
	}

	return tarefasPorUsuario[usuarioAtual.email] || [];
}

// Mostra o nome salvo ou somente "Olá," quando ninguém está logado.
function atualizarSaudacao() {
	const saudacao = document.getElementById("saudacao-usuario");
	const usuarioSalvo = localStorage.getItem("usuarioAtual");

	if (!saudacao) {
		return;
	}

	if (!usuarioSalvo) {
		saudacao.textContent = "Olá,";
		return;
	}

	const usuarioAtual = JSON.parse(usuarioSalvo);
	saudacao.textContent = `Olá, ${usuarioAtual.nome}`;
}

// ==============================
// CONTADORES DO PERFIL
// ==============================

// Conta somente as tarefas da conta atual e atualiza os números do perfil.
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

// Salva uma nova conta e define essa conta como a conta atual.
function configurarCadastro(formularioCadastro) {
	formularioCadastro.addEventListener("submit", function (evento) {
		evento.preventDefault();

		const nome = document.getElementById("username").value.trim();
		const email = document.getElementById("email").value.trim().toLowerCase();
		const senha = document.getElementById("password").value.trim();

		// Impede o salvamento enquanto algum campo estiver vazio.
		if (!nome || !email || !senha) {
			alert("Preencha Nome, Email e Senha.");
			return;
		}

		const contas = obterContas();
		// Compara o e-mail digitado com os e-mails das contas existentes.
		const emailJaCadastrado = contas.some(function (conta) {
			return conta.email === email;
		});

		if (emailJaCadastrado) {
			// Evita contas repetidas e orienta a pessoa a usar o login.
			mostrarMensagemCadastro("Conta já criada! Faça o login.", "atencao");

			// Leva a pessoa ao login depois de visualizar a mensagem.
			setTimeout(function () {
				window.location.href = "../index.html";
			}, 3000);
			return;
		}

		const novaConta = {
			nome: nome,
			email: email,
			senha: senha
		};

		contas.push(novaConta);
		localStorage.setItem("contas", JSON.stringify(contas));
		salvarUsuarioAtual(novaConta);

		mostrarMensagemCadastro("Cadastro salvo com sucesso.");
		formularioCadastro.reset();

		// Aguarda a mensagem ser exibida antes de abrir a pagina de tarefas.
		setTimeout(function () {
			window.location.href = "tarefas.html";
		}, 3000);
	});
}

// Cria uma mensagem visual usando a classe estilizada no cadastro.css.
function mostrarMensagemCadastro(texto, tipo) {
	const mensagem = document.createElement("div");
	mensagem.className = "mensagem-cadastro";

	// O tipo permite aplicar um estilo diferente, como a mensagem de atenção.
	if (tipo) {
		mensagem.classList.add("mensagem-" + tipo);
	}

	// Insere a mensagem no body para que o CSS possa posicioná-la na tela.
	mensagem.setAttribute("role", "status");
	mensagem.textContent = texto;
	document.body.appendChild(mensagem);
	}

// Verifica o nome e a senha e define a conta atual após o login.
function configurarLogin(formularioLogin) {
	formularioLogin.addEventListener("submit", function (evento) {
		evento.preventDefault();

		const nome = document.getElementById("username").value.trim();
		const senha = document.getElementById("password").value.trim();
		// Procura uma conta com o mesmo nome e senha informados no login.
		const contaEncontrada = obterContas().find(function (conta) {
			return conta.nome === nome && conta.senha === senha;
		});

		if (!contaEncontrada) {
			alert("Nome de usuário ou senha incorretos.");
			return;
		}

		salvarUsuarioAtual(contaEncontrada);
		window.location.href = "html/tarefas.html";
	});
}

// ==============================
// ADICIONAR TAREFA
// ==============================

// Configura o formulario e a lista lateral da pagina de adicionar tarefa.
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

		// Pegamos os dados preenchidos pelo usuário.
		const titulo = document.getElementById("titulo-tarefa").value.trim();
		const data = document.getElementById("data-tarefa").value;
		const importancia = document.getElementById("importancia-tarefa").value;
		const descricao = document.getElementById("descricao-tarefa").value.trim();

		// Nome, data e importancia são obrigatorios para criar a tarefa.
		if (!titulo || !data || !importancia) {
			alert("Preencha o nome, a data e a importância da tarefa.");
			return;
		}

		// Se houver um ID de edicao, atualizamos a tarefa sem criar outra.
		if (idTarefaEditando) {
			const atualizou = alterarTarefaAtual(idTarefaEditando, function (tarefaAtualizada) {
				tarefaAtualizada.titulo = titulo;
				tarefaAtualizada.data = data;
				tarefaAtualizada.importancia = importancia;
				tarefaAtualizada.descricao = descricao;
			});

			if (atualizou) {
				localStorage.removeItem("tarefaEditando");
				window.location.href = "../html/tarefas.html";
			}
			return;
		}

		// Criamos um novo objeto de tarefa com valores iniciais simples.
		const novaTarefa = {
			id: Date.now().toString() + "-" + Math.random().toString(16).slice(2),
			titulo: titulo,
			data: data,
			importancia: importancia,
			descricao: descricao,
			concluida: false,
			fixada: false
		};

		// Pegamos as tarefas de todas as contas e alteramos somente a conta atual.
		const tarefasPorUsuario = obterTarefasSalvas();
		const tarefasDoUsuario = tarefasPorUsuario[usuarioAtual.email] || [];
		tarefasDoUsuario.push(novaTarefa);
		tarefasPorUsuario[usuarioAtual.email] = tarefasDoUsuario;

		// Salvamos a tarefa no localStorage separada pelo e-mail da conta.
		salvarTarefasSalvas(tarefasPorUsuario);

		// Redirecionamos para a pagina principal depois de salvar.
		window.location.href = "../html/tarefas.html";
	});

	// O botao cancelar apenas volta sem salvar os dados preenchidos.
	document.getElementById("cancelar-tarefa").addEventListener("click", function () {
		localStorage.removeItem("tarefaEditando");
		window.location.href = "../html/tarefas.html";
	});
}

// Preenche o formulario com os dados da tarefa que sera editada.
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
	document.getElementById("titulo-pagina-tarefa").textContent = "Editar tarefa";
	document.getElementById("titulo-formulario-tarefa").textContent = "Editar tarefa";
}

// Mostra as tarefas existentes da conta na lista lateral.
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

// ==============================
// LISTAGEM E FILTROS DE TAREFAS
// ==============================

// Prepara os botoes de importancia para filtrar os cards exibidos.
function configurarFiltrosTarefas() {
	document.querySelectorAll(".filtro").forEach(function (botao) {
		botao.addEventListener("click", function () {
			// Guardamos o filtro atual apenas para controlar a visualizacao.
			filtroTarefasAtual = botao.dataset.filtro;
			atualizarFiltroAtivo();
			renderizarTarefas(filtroTarefasAtual);
		});
	});

	// O filtro Todas começa selecionado quando a pagina abre.
	atualizarFiltroAtivo();
}

// Destaca visualmente somente o filtro que esta ativo.
function atualizarFiltroAtivo() {
	document.querySelectorAll(".filtro").forEach(function (botao) {
		const estaAtivo = botao.dataset.filtro === filtroTarefasAtual;
		botao.classList.toggle("filtro-ativo", estaAtivo);
		botao.setAttribute("aria-pressed", estaAtivo ? "true" : "false");
	});
}

// Mostra na pagina principal somente as tarefas da conta atual.
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
			return !tarefa.concluida && (filtro === "todas" || tarefa.importancia === filtro);
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
		card.querySelector(".importancia-tarefa").textContent = "Importância: " + formatarImportancia(tarefa.importancia);
		card.querySelector(".descricao-tarefa").textContent = tarefa.descricao || "Sem descrição.";
		card.querySelector(".checkbox-conclusao").checked = tarefa.concluida;
		card.querySelector(".botao-fixar").setAttribute("aria-pressed", tarefa.fixada ? "true" : "false");
		card.querySelector(".botao-fixar").title = tarefa.fixada ? "Desafixar tarefa" : "Fixar tarefa";

		if (tarefa.fixada) {
			elementoCard.classList.add("tarefa-fixada");
			card.querySelector(".botao-fixar").classList.add("fixar-ativo");
		}

		configurarAcoesDoCard(card, tarefa);
		lista.appendChild(card);
	});
}

// ==============================
// ORGANIZACAO DAS TAREFAS
// ==============================

// Mantem tarefas fixadas primeiro e depois organiza por importancia.
function compararTarefas(primeiraTarefa, segundaTarefa) {
	if (primeiraTarefa.fixada !== segundaTarefa.fixada) {
		return primeiraTarefa.fixada ? -1 : 1;
	}

	const pesos = { alta: 1, media: 2, baixa: 3 };
	return (pesos[primeiraTarefa.importancia] || 4) - (pesos[segundaTarefa.importancia] || 4);
}

// Atualiza uma tarefa da conta atual e depois redesenha a lista.
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

// Liga os quatro controles ao card correspondente.
function configurarAcoesDoCard(card, tarefa) {
	const elementoCard = card.querySelector(".card-tarefa");

	card.querySelector(".botao-fixar").addEventListener("click", function () {
		// ==============================
		// FIXAR TAREFA
		// ==============================
		alterarTarefaAtual(tarefa.id, function (tarefaAtualizada) {
			tarefaAtualizada.fixada = !tarefaAtualizada.fixada;
		});
		renderizarTarefas(filtroTarefasAtual);
		renderizarCalendarios();
	});

	card.querySelector(".checkbox-conclusao").addEventListener("change", function () {
		concluirTarefa(tarefa.id);
	});

	card.querySelector(".botao-editar").addEventListener("click", function () {
		// ==============================
		// EDITAR TAREFA
		// ==============================
		localStorage.setItem("tarefaEditando", tarefa.id);
		window.location.href = "tarefa.html";
	});

	card.querySelector(".botao-excluir").addEventListener("click", function () {
		// ==============================
		// EXCLUIR TAREFA
		// ==============================
		mostrarConfirmacaoExclusao(tarefa.id);
	});

	// Permite que o teclado tambem identifique o card em foco.
	elementoCard.setAttribute("tabindex", "0");
}

// ==============================
// CONCLUIR TAREFA
// ==============================

// Marca a tarefa como concluida sem apagar seus dados.
function concluirTarefa(id) {
	alterarTarefaAtual(id, function (tarefaAtualizada) {
		tarefaAtualizada.concluida = true;
	});

	// Tarefas concluidas deixam de aparecer na lista de pendentes.
	renderizarTarefas(filtroTarefasAtual);
	renderizarCalendarios();
	atualizarContadores();
}

// Mostra uma confirmacao com os botoes Cancelar e Sim.
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

// Remove permanentemente somente a tarefa da conta atual.
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

// ==============================
// TAREFAS CONCLUIDAS
// ==============================

// Renderiza somente as tarefas concluidas da conta atual.
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
		meta.textContent = formatarData(tarefa.data) + " • " + formatarImportancia(tarefa.importancia);

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

// Converte a data do input para o formato usado na tela.
function formatarData(data) {
	if (!data) {
		return "Sem data";
	}

	const partes = data.split("-");
	return partes.length === 3 ? partes[2] + "/" + partes[1] + "/" + partes[0] : data;
}

// Mostra a importancia com a primeira letra maiuscula.
function formatarImportancia(importancia) {
	const nomes = {
		alta: "Alta",
		media: "Média",
		baixa: "Baixa"
	};

	return nomes[importancia] || importancia;
}

// ==============================
// CALENDARIO
// ==============================

// Cria um calendario dentro da area que ja existe no HTML.
function configurarCalendario(idArea, sincronizarFormulario) {
	const area = document.getElementById(idArea);

	if (!area) {
		return;
	}

	const entradaData = sincronizarFormulario ? document.getElementById("data-tarefa") : null;
	let dataInicial = entradaData && entradaData.value ? criarDataLocal(entradaData.value) : new Date();

	const calendario = {
		area: area,
		ano: dataInicial.getFullYear(),
		mes: dataInicial.getMonth(),
		entradaData: entradaData,
		sincronizarFormulario: sincronizarFormulario
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

// Redesenha todos os calendarios depois de uma alteracao nas tarefas.
function renderizarCalendarios() {
	calendariosAtivos.forEach(function (calendario) {
		renderizarCalendario(calendario);
	});
}

// Monta o mes atual, os botoes de navegacao e os dias marcados.
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
	anterior.setAttribute("aria-label", "Mes anterior");
	anterior.addEventListener("click", function () {
		calendario.mes -= 1;
		ajustarMesCalendario(calendario);
		renderizarCalendario(calendario);
	});

	const titulo = document.createElement("h3");
	titulo.textContent = new Date(calendario.ano, calendario.mes, 1).toLocaleDateString("pt-BR", {
		month: "long",
		year: "numeric"
	});

	const proximo = document.createElement("button");
	proximo.type = "button";
	proximo.className = "mes-proximo";
	proximo.textContent = "›";
	proximo.setAttribute("aria-label", "Proximo mes");
	proximo.addEventListener("click", function () {
		calendario.mes += 1;
		ajustarMesCalendario(calendario);
		renderizarCalendario(calendario);
	});

	controles.appendChild(anterior);
	controles.appendChild(titulo);
	controles.appendChild(proximo);

	const nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
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
	const dataSelecionada = calendario.entradaData ? calendario.entradaData.value : "";

	for (let vazio = 0; vazio < primeiroDia; vazio += 1) {
		const espaco = document.createElement("span");
		espaco.className = "calendario-dia vazio";
		grade.appendChild(espaco);
	}

	for (let dia = 1; dia <= totalDias; dia += 1) {
		const data = new Date(calendario.ano, calendario.mes, dia);
		const chave = dataParaChave(data);
		const botaoDia = document.createElement("button");
		botaoDia.type = "button";
		botaoDia.className = "calendario-dia";
		botaoDia.textContent = dia;
		botaoDia.dataset.data = chave;

		if (chave === hoje) {
			botaoDia.classList.add("dia-atual");
		}

		if (tarefasPorData[chave]) {
			botaoDia.classList.add("dia-com-tarefa");
		}

		if (chave === dataSelecionada) {
			botaoDia.classList.add("dia-selecionado");
		}

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

// Mantem o mes entre janeiro e dezembro ao navegar.
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

// Converte uma data YYYY-MM-DD em uma data local sem deslocamento de fuso.
function criarDataLocal(data) {
	const partes = data.split("-").map(Number);
	return new Date(partes[0], partes[1] - 1, partes[2]);
}

// Converte Date para a mesma chave usada pelo input de data.
function dataParaChave(data) {
	const ano = data.getFullYear();
	const mes = String(data.getMonth() + 1).padStart(2, "0");
	const dia = String(data.getDate()).padStart(2, "0");
	return ano + "-" + mes + "-" + dia;
}

