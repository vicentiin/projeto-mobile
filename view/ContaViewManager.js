import Conta from "./Conta.js";
import ModelError from "./ModelError.js";
import { getDatabase, ref, set } from "firebase/database";

export default class ContaViewManager {
  constructor() {
    this.db = getDatabase();
    this.refContas = ref(this.db, "contas");
  }

  async addConta(contaData) {
    try {
      const novaConta = new Conta(
        crypto.randomUUID(),
        contaData.numMesa,
        "em preparo",
        0,
        new Date()
      );

      await set(ref(this.db, `contas/${novaConta.getIdConta()}`), {
        idConta: novaConta.getIdConta(),
        numMesa: novaConta.getNumMesa(),
        status: novaConta.getStatus(),
        total: novaConta.getTotal(),
        data: novaConta.getData().toISOString(),
        pedidos: []
      });
    } catch (error) {
      throw new ModelError("Erro ao adicionar conta: " + error.message);
    }
  }
}