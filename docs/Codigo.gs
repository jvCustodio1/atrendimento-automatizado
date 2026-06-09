function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);
    var planilha = SpreadsheetApp.openById("100qIoa9egXFkIY2nEPg6StSZGE_7hPfMBaViuTyF_Do").getSheets()[0];
    planilha.appendRow([
      dados.numeroPedido, dados.nome, dados.telefone, dados.bairro,
      dados.endereco, dados.tamanho, dados.data, dados.horario, dados.status
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (e.parameter && e.parameter.nome) {
    var planilha = SpreadsheetApp.openById("100qIoa9egXFkIY2nEPg6StSZGE_7hPfMBaViuTyF_Do").getSheets()[0];
    planilha.appendRow([
      e.parameter.numeroPedido || "-", e.parameter.nome, e.parameter.telefone,
      e.parameter.bairro || "-", e.parameter.endereco, e.parameter.tamanho,
      e.parameter.data, e.parameter.horario, e.parameter.status || "Novo"
    ]);
    return ContentService.createTextOutput("ok").setMimeType(ContentService.MimeType.TEXT);
  }
  return ContentService.createTextOutput("sem dados").setMimeType(ContentService.MimeType.TEXT);
}