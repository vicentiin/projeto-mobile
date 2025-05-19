import Pedido from "./Pedido.js";
import ModelError from "./ModelError.js";
import { db } from "./firebaseInit.js";
import { ref, set } from "firebase/database";

export default class PedidoViewManager {
  constructor() {
    this.refPedidos = ref(db, "pedidos");
  }

  async addPedido(pedido) {
    try {
      const produto = await pedido.getProduto();
      const garcom = await pedido.getGarcom();
      const id = pedido.getIdPedido();

      await set(ref(db, `pedidos/${id}`), {
        idPedido: id,
        status: pedido.getStatus(),
        precoDia: pedido.getPrecoDia(),
        quantidade: pedido.getQuantidade(),
        produtoId: produto.getIdProd(),
        garcomId: garcom.getIdFunc(),
        data: new Date().toISOString()
      });
    } catch (error) {
      throw new ModelError("Erro ao adicionar pedido: " + error.message);
    }
  }

  renderPedidos(pedidos, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = pedidos.map(p => `
      <div class="pedido-item">
        <p>${p.quantidade}x ${p.descricaoProduto || "Produto"}</p>
        <p>R$ ${(p.precoDia * p.quantidade).toFixed(2)}</p>
        <button class="cancelar-pedido" data-id="${p.idPedido}">Cancelar</button>
      </div>
    `).join("");
  }
}
