// Importa a conexão com o banco de dados MySQL
const conexao = require("../config/database");

function dataValida(data) {
  if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const dataConvertida = new Date(Date.UTC(ano, mes - 1, dia));

  return dataConvertida.toISOString().slice(0, 10) === data;
}

function idTarefaValido(id) {
  const idConvertido = Number(id);
  return Number.isSafeInteger(idConvertido) && idConvertido > 0;
}

// ============================================================
// BUSCAR TAREFAS DO USUÁRIO
// ============================================================

// Função responsável por buscar as tarefas do usuário autenticado
function buscarTarefas(req, res) {
  // Pega o ID do usuário que foi identificado pelo JWT
  const usuarioId = req.usuario.id;

  // Busca somente as tarefas pertencentes ao usuário logado
  const sql = `
        SELECT
            id,
            titulo,
            data,
            importancia,
            descricao,
            concluida,
            fixada,
            criada_em
        FROM tarefas
        WHERE usuario_id = ?
        ORDER BY data ASC
    `;

  // Executa a consulta no banco de dados
  conexao.query(sql, [usuarioId], (erro, resultados) => {
    // Verifica se aconteceu algum erro
    if (erro) {
      // Mostra o erro no terminal do servidor
      console.error("Erro ao buscar tarefas:", erro.message);

      // Envia uma resposta de erro para o cliente
      return res.status(500).json({
        erro: "Erro ao buscar tarefas",
      });
    }

    // Mantém os campos booleanos estáveis entre MySQL e a API.
    res.json(resultados.map((tarefa) => ({
      ...tarefa,
      concluida: Boolean(tarefa.concluida),
      fixada: Boolean(tarefa.fixada),
    })));
  });
}

// ============================================================
// CRIAR TAREFA
// ============================================================

// Função responsável por criar uma nova tarefa
function criarTarefa(req, res) {
  // Pega o ID do usuário autenticado através do JWT
  const usuarioId = req.usuario.id;

  // Pega os dados enviados pelo cliente
  const { titulo, data, importancia, descricao, concluida, fixada } = req.body;

  // ========================================================
  // VALIDAÇÃO DOS DADOS
  // ========================================================

  // Verifica se a descrição, quando enviada,
  // é realmente um texto
  if (
    descricao !== undefined &&
    descricao !== null &&
    typeof descricao !== "string"
  ) {
    // Bloqueia valores que não sejam texto
    return res.status(400).json({
      erro: "A descrição deve ser um texto",
    });
  }

  // Verifica se a descrição ultrapassa
  // o limite definido para o sistema
  if (typeof descricao === "string" && descricao.length > 500) {
    // Bloqueia descrições excessivamente grandes
    return res.status(400).json({
      erro: "A descrição deve ter no máximo 500 caracteres",
    });
  }

  // Verifica se o título foi enviado
  // e se realmente é um texto com conteúdo
  if (!titulo || typeof titulo !== "string" || titulo.trim() === "") {
    // Bloqueia a criação se o título estiver vazio ou inválido
    return res.status(400).json({
      erro: "O título é obrigatório",
    });
  }

  // Verifica se o título ultrapassa o limite
  // de 255 caracteres definido para a coluna no MySQL
  if (titulo.length > 255) {
    // Bloqueia títulos maiores que o permitido
    return res.status(400).json({
      erro: "O título deve ter no máximo 255 caracteres",
    });
  }

  // Verifica se a data foi enviada
  // e se realmente é um texto
  if (!dataValida(data)) {
    // Bloqueia a criação se a data não estiver presente
    return res.status(400).json({
      erro: "A data é obrigatória",
    });
  }

  // Expressão regular utilizada para verificar
  // se a data possui o formato YYYY-MM-DD
  // Exemplo válido: 2026-09-12
  // Verifica se a importância possui um valor permitido
  if (
    importancia !== undefined &&
    !["baixa", "media", "alta"].includes(importancia)
  ) {
    // Bloqueia valores que não existem no sistema
    return res.status(400).json({
      erro: "A importância deve ser baixa, media ou alta",
    });
  }

  // Verifica se concluida é realmente um booleano
  if (concluida !== undefined && typeof concluida !== "boolean") {
    // Impede valores como "true", "sim" ou 1
    return res.status(400).json({
      erro: "concluida deve ser true ou false",
    });
  }

  // Verifica se fixada é realmente um booleano
  if (fixada !== undefined && typeof fixada !== "boolean") {
    // Impede valores como "true", "sim" ou 1
    return res.status(400).json({
      erro: "fixada deve ser true ou false",
    });
  }

  // ========================================================
  // INSERÇÃO DA TAREFA
  // ========================================================

  // Comando SQL utilizado para criar a tarefa
  const sql = `
        INSERT INTO tarefas (
            usuario_id,
            titulo,
            data,
            importancia,
            descricao,
            concluida,
            fixada
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

  // Executa o comando no banco de dados
  conexao.query(
    sql,
    [
      usuarioId,
      titulo.trim(),
      data,
      importancia ?? "media",
      descricao || null,
      concluida ?? false,
      fixada ?? false,
    ],
    (erro, resultado) => {
      // Verifica se aconteceu algum erro
      if (erro) {
        // Mostra o erro no terminal
        console.error("Erro ao criar tarefa:", erro.message);

        // Envia uma resposta de erro para o cliente
        return res.status(500).json({
          erro: "Erro ao criar tarefa",
        });
      }

      // Informa que a tarefa foi criada
      res.status(201).json({
        mensagem: "Tarefa criada com sucesso!",

        // Retorna o ID gerado pelo MySQL
        id: resultado.insertId,
      });
    },
  );
}

// ============================================================
// ATUALIZAR TAREFA
// ============================================================

// Função responsável por atualizar uma tarefa
// do usuário autenticado
function atualizarTarefa(req, res) {
  // Pega o ID do usuário identificado pelo JWT
  const usuarioId = req.usuario.id;

  // Pega o ID da tarefa enviado pela URL
  const tarefaId = req.params.id;

  if (!idTarefaValido(tarefaId)) {
    return res.status(400).json({ erro: "ID de tarefa inválido" });
  }

  // Pega os novos dados enviados pelo cliente
  const { titulo, data, importancia, descricao, concluida, fixada } = req.body;

  // ========================================================
  // VALIDAÇÃO DOS DADOS
  // ========================================================

  // Verifica se o título foi enviado
  // e se realmente é um texto com conteúdo
  if (!titulo || typeof titulo !== "string" || titulo.trim() === "") {
    // Bloqueia a atualização se o título estiver vazio ou inválido
    return res.status(400).json({
      erro: "O título é obrigatório",
    });
  }

  // Verifica se o título ultrapassa o limite
  // de 255 caracteres definido para a coluna no MySQL
  if (titulo.length > 255) {
    // Bloqueia títulos maiores que o permitido
    return res.status(400).json({
      erro: "O título deve ter no máximo 255 caracteres",
    });
  }

  // Verifica se a data foi enviada
  // e se realmente é um texto
  if (!dataValida(data)) {
    // Bloqueia a atualização se a data não estiver presente
    return res.status(400).json({
      erro: "A data é obrigatória",
    });
  }

  // Expressão regular utilizada para verificar
  // se a data possui o formato YYYY-MM-DD
  // Exemplo válido: 2026-09-12
  // Verifica se a descrição, quando enviada,
  // é realmente um texto
  if (
    descricao !== undefined &&
    descricao !== null &&
    typeof descricao !== "string"
  ) {
    // Bloqueia valores que não sejam texto
    return res.status(400).json({
      erro: "A descrição deve ser um texto",
    });
  }

  // Verifica se a descrição ultrapassa
  // o limite temporário de 500 caracteres
  if (typeof descricao === "string" && descricao.length > 500) {
    // Bloqueia descrições maiores que o limite
    return res.status(400).json({
      erro: "A descrição deve ter no máximo 500 caracteres",
    });
  }

  // Verifica se a importância possui um valor permitido
  if (
    importancia !== undefined &&
    !["baixa", "media", "alta"].includes(importancia)
  ) {
    // Bloqueia valores que não existem no sistema
    return res.status(400).json({
      erro: "A importância deve ser baixa, media ou alta",
    });
  }

  // Verifica se concluida é realmente um booleano
  if (concluida !== undefined && typeof concluida !== "boolean") {
    // Impede valores como "true", "sim" ou 1
    return res.status(400).json({
      erro: "concluida deve ser true ou false",
    });
  }

  // Verifica se fixada é realmente um booleano
  if (fixada !== undefined && typeof fixada !== "boolean") {
    // Impede valores como "true", "sim" ou 1
    return res.status(400).json({
      erro: "fixada deve ser true ou false",
    });
  }

  // ========================================================
  // ATUALIZAÇÃO DA TAREFA
  // ========================================================

  // Comando SQL utilizado para atualizar a tarefa
  const sql = `
        UPDATE tarefas
        SET
            titulo = ?,
            data = ?,
            importancia = ?,
            descricao = ?,
            concluida = ?,
            fixada = ?
        WHERE id = ?
        AND usuario_id = ?
    `;

  // Executa a atualização no banco de dados
  conexao.query(
    sql,
    [
      titulo.trim(),
      data,
      importancia ?? "media",
      descricao || null,
      concluida ?? false,
      fixada ?? false,
      tarefaId,
      usuarioId,
    ],
    (erro, resultado) => {
      // Verifica se aconteceu algum erro
      if (erro) {
        // Mostra o erro no terminal
        console.error("Erro ao atualizar tarefa:", erro.message);

        // Envia uma resposta de erro para o cliente
        return res.status(500).json({
          erro: "Erro ao atualizar tarefa",
        });
      }

      // Verifica se nenhuma tarefa foi encontrada
      if (resultado.affectedRows === 0) {
        const sqlVerificarExistencia = `
          SELECT id
          FROM tarefas
          WHERE id = ? AND usuario_id = ?
        `;

        return conexao.query(sqlVerificarExistencia, [tarefaId, usuarioId], (erroConsulta, tarefas) => {
          if (erroConsulta) {
            console.error("Erro ao confirmar tarefa atualizada:", erroConsulta.message);
            return res.status(500).json({ erro: "Erro ao atualizar tarefa" });
          }

          if (tarefas.length === 0) {
            return res.status(404).json({ erro: "Tarefa não encontrada" });
          }

          return res.json({ mensagem: "Tarefa atualizada com sucesso!" });
        });
      }

      // Informa que a tarefa foi atualizada
      res.json({
        mensagem: "Tarefa atualizada com sucesso!",
      });
    },
  );
}

// ============================================================
// EXCLUIR TAREFA
// ============================================================

// Função responsável por excluir uma tarefa
// do usuário autenticado
function excluirTarefa(req, res) {
  // Pega o ID do usuário identificado pelo JWT
  const usuarioId = req.usuario.id;

  // Pega o ID da tarefa enviado pela URL
  const tarefaId = req.params.id;

  if (!idTarefaValido(tarefaId)) {
    return res.status(400).json({ erro: "ID de tarefa inválido" });
  }

  // Comando SQL utilizado para excluir a tarefa
  const sql = `
        DELETE FROM tarefas
        WHERE id = ?
        AND usuario_id = ?
    `;

  // Executa a exclusão no banco de dados
  conexao.query(sql, [tarefaId, usuarioId], (erro, resultado) => {
    // Verifica se aconteceu algum erro
    if (erro) {
      // Mostra o erro no terminal
      console.error("Erro ao excluir tarefa:", erro.message);

      // Envia uma resposta de erro para o cliente
      return res.status(500).json({
        erro: "Erro ao excluir tarefa",
      });
    }

    // Verifica se nenhuma tarefa foi encontrada
    if (resultado.affectedRows === 0) {
      // Impede que o usuário tente excluir
      // uma tarefa que não pertence a ele
      return res.status(404).json({
        erro: "Tarefa não encontrada",
      });
    }

    // Informa que a tarefa foi excluída
    res.json({
      mensagem: "Tarefa excluída com sucesso!",
    });
  });
}

// ============================================================
// EXPORTAÇÃO
// ============================================================

// Exporta as funções para serem utilizadas pelas rotas
module.exports = {
  buscarTarefas,
  criarTarefa,
  atualizarTarefa,
  excluirTarefa,
};