import ModelError from "./ModelError.js";
import Produto from "./Produto.js";
import Garcom from "./Garcom.js";

export default class Pedido {
  constructor(idPedido, status, precoDia, quantidade, produto, garcom)
  //Quando faz setProduto(produto), eu já puxo descricaoProduto e precoUnitario diretamente do Produto para o Pedido.//
   {
    this.setIdPedido(idPedido);
    this.setStatus(status);
    this.setPrecoDia(precoDia);
    this.setQuantidade(quantidade);
    this.setProduto(produto);
    this.setGarcom(garcom);
  }

  getIdPedido() {
    return this.idPedido;
  }

  setIdPedido(idPedido) {
    if (!idPedido || typeof idPedido !== "string") {
      throw new ModelError("ID do pedido inválido");
    }
    this.idPedido = idPedido;
  }

  getStatus() {
    return this.status;
  }

  setStatus(status) {
    if (!status || typeof status !== "string") {
      throw new ModelError("Status inválido");
    }
    this.status = status;
  }

  getPrecoDia() {
    return this.precoDia;
  }

  setPrecoDia(precoDia) {
    if (isNaN(precoDia) || precoDia < 0) {
      throw new ModelError("Preço do dia inválido");
    }
    this.precoDia = precoDia;
  }

  getQuantidade() {
    return this.quantidade;
  }

  setQuantidade(quantidade) {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw new ModelError("Quantidade inválida");
    }
    this.quantidade = quantidade;
  }

  getProduto() {
    return this.produto;
  }

  setProduto(produto) {
    if (!(produto instanceof Produto)) {
      throw new ModelError("Produto inválido");
    }
    this.produto = produto;
    this.descricaoProduto = produto.getDescricao();
    this.precoUnitario = produto.getPrecoAtual();
  }

  getGarcom() {
    return this.garcom;
  }

  setGarcom(garcom) {
    if (!(garcom instanceof Garcom)) {
      throw new ModelError("Garçom inválido");
    }
    this.garcom = garcom;
  }

  getDescricaoProduto() {
    return this.descricaoProduto;
  }

  getPrecoUnitario() {
    return this.precoUnitario;
  }
}
