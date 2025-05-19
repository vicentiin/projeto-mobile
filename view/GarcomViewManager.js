import Garcom from "./Garcom.js";
import ModelError from "./ModelError.js";
import { db } from "./firebaseInit.js";
import { ref, set, get } from "firebase/database";

export default class GarcomViewManager {
  constructor() {
    this.refGarcom = ref(db, "garcons");
  }

  async addGarcom(nome, idFuncionario) {
    try {
      const garcom = new Garcom(nome, idFuncionario);
      await set(ref(db, `garcons/${idFuncionario}`), {
        nome: garcom.getNome(),
        idFuncionario: garcom.getIdFunc()
      });
    } catch (error) {
      throw new ModelError("Erro ao cadastrar garçom: " + error.message);
    }
  }

  async renderGarcons(containerId) {
    const container = document.getElementById(containerId);
    const snapshot = await get(this.refGarcom);
    container.innerHTML = "";

    if (snapshot.exists()) {
      const garcons = snapshot.val();
      for (let id in garcons) {
        const g = garcons[id];
        const div = document.createElement("div");
        div.classList.add("garcom-card");
        div.innerHTML = `
          <h3>${g.nome}</h3>
          <p>ID: ${g.idFuncionario}</p>
        `;
        container.appendChild(div);
      }
    } else {
      container.innerHTML = "<p>Nenhum garçom encontrado.</p>";
    }
  }
}
