import Garcom from "./Garcom.js";
import ModelError from "./ModelError.js";
import { getDatabase, ref, set, get, update, remove } from "firebase/database";

export default class DaoGarcom {
  constructor() {
    this.db = getDatabase();
    this.refGarcom = ref(this.db, 'garcons'); // Ref para a coleção de garçons
  }

  // Adiciona um garçom no Firebase
  async adicionarGarcom(garcom) {
    try {
      const garcomId = garcom.getIdFunc();
      const garcomRef = ref(this.db, 'garcons/' + garcomId);
      await set(garcomRef, {
        nome: garcom.getNome(),
        idFuncionario: garcom.getIdFunc()
      });
      return true;
    } catch (error) {
      throw new ModelError("Erro ao adicionar o garçom: " + error.message);
    }
  }

  // Obtem um garçom pelo ID
  async obterGarcomPorId(idFuncionario) {
    try {
      const garcomRef = ref(this.db, 'garcons/' + idFuncionario);
      const snapshot = await get(garcomRef);
      if (snapshot.exists()) {
        const garcomData = snapshot.val();
        return new Garcom(garcomData.nome, garcomData.idFuncionario);
      } else {
        return null;
      }
    } catch (error) {
      throw new ModelError("Erro ao obter o garçom: " + error.message);
    }
  }

  // Obtem todos os garçons
  async obterTodosGarcons() {
    try {
      const snapshot = await get(this.refGarcom);
      const garcons = [];
      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          const garcomData = childSnapshot.val();
          garcons.push(new Garcom(garcomData.nome, garcomData.idFuncionario));
        });
      }
      return garcons;
    } catch (error) {
      throw new ModelError("Erro ao obter todos os garçons: " + error.message);
    }
  }

  // Atualiza as informações de um garçom
  async atualizarGarcom(garcom) {
    try {
      const garcomRef = ref(this.db, 'garcons/' + garcom.getIdFunc());
      await update(garcomRef, {
        nome: garcom.getNome()
      });
      return true;
    } catch (error) {
      throw new ModelError("Erro ao atualizar o garçom: " + error.message);
    }
  }

  // Exclui um garçom
  async excluirGarcom(idFuncionario) {
    try {
      const garcomRef = ref(this.db, 'garcons/' + idFuncionario);
      await remove(garcomRef);
      return true;
    } catch (error) {
      throw new ModelError("Erro ao excluir o garçom: " + error.message);
    }
  }
}
