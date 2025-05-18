import ModelError from "./ModelError.js";

export default class Produto {
  constructor(idProduto, precoAtual, descricao) {
    this.setIdProd(idProduto);
    this.setPrecoAtual(precoAtual);
    this.setDescricao(descricao);
  }

  getIdProd() {
    return this.idProduto;
  }

  setIdProd(idProduto) {
    if (!idProduto || typeof idProduto !== "string") {
      throw new ModelError("ID do produto inválido");
    }
    this.idProduto = idProduto;
  }

  getPrecoAtual() {
    return this.precoAtual;
  }

  setPrecoAtual(precoAtual) {
    if (isNaN(precoAtual) || precoAtual < 0) {
      throw new ModelError("Preço inválido");
    }
    this.precoAtual = precoAtual;
  }

  getDescricao() {
    return this.descricao;
  }

  setDescricao(descricao) {
    if (!descricao || typeof descricao !== "string") {
      throw new ModelError("Descrição inválida");
    }
    this.descricao = descricao;
  }
}
