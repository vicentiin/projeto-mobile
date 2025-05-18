import ModelError from "./ModelError.js";

export default class Garcom {
  constructor(nome, idFuncionario) {
    this.setNome(nome);
    this.setIdFunc(idFuncionario);
  }

  getNome() {
    return this.nome;
  }

  setNome(nome) {
    if (!nome || typeof nome !== "string") {
      throw new ModelError("Nome inválido");
    }
    this.nome = nome;
  }

  getIdFunc() {
    return this.idFuncionario;
  }

  setIdFunc(idFuncionario) {
    if (!idFuncionario || typeof idFuncionario !== "string") {
      throw new ModelError("ID do funcionário inválido");
    }
    this.idFuncionario = idFuncionario;
  }
}
