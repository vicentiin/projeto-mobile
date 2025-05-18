import ModelError from "./ModelError.js";

export default class Conta {
  constructor(idConta, numMesa, status) {
    this.setIdConta(idConta);
    this.setNumMesa(numMesa);
    this.setStatus(status);
  }

  getIdConta() {
    return this.idConta;
  }

  setIdConta(idConta) {
    if (!idConta || typeof idConta !== "string") {
      throw new ModelError("ID da conta inválido");
    }
    this.idConta = idConta;
  }

  getNumMesa() {
    return this.numMesa;
  }

  setNumMesa(numMesa) {
    if (!Number.isInteger(numMesa) || numMesa <= 0) {
      throw new ModelError("Número da mesa inválido");
    }
    this.numMesa = numMesa;
  }

  getStatus() {
    return this.status;
  }

  setStatus(status) {
    if (!status || typeof status !== "string") {
      throw new ModelError("Status da conta inválido");
    }
    this.status = status;
  }
}
