import Pedido from "./Pedido.js";
import ModelError from "./ModelError.js";
import { getDatabase, ref, set, get, child, update, remove } from "firebase/database";

export default class DaoPedido {

  constructor() {
    this.db = getDatabase(); // Obtém a instância do Firebase Realtime Database
    this.pedidoRef = ref(this.db, 'pedidos'); // Referência para a coleção de pedidos no DB
  }

  // Método para adicionar um pedido
  async adicionarPedido(pedido) {
    try {
      const newPedidoRef = ref(this.db, 'pedidos/' + pedido.idPedido);
      await set(newPedidoRef, {
        idPedido: pedido.idPedido,
        status: pedido.status,
        precoDia: pedido.precoDia,
        quantidade: pedido.quantidade,
        descricaoProduto: pedido.descricaoProduto,
        precoUnitario: pedido.precoUnitario
      });
      return true;
    } catch (error) {
      throw new ModelError("Erro ao adicionar pedido: " + error.message);
    }
  }

  // Método para obter um pedido pelo id
  async obterPedidoPorId(idPedido) {
    try {
      const pedidoRef = ref(this.db, 'pedidos/' + idPedido);
      const snapshot = await get(pedidoRef);
      if (snapshot.exists()) {
        return new Pedido(
          snapshot.val().idPedido,
          snapshot.val().status,
          snapshot.val().precoDia,
          snapshot.val().quantidade,
          snapshot.val().descricaoProduto,
          snapshot.val().precoUnitario
        );
      } else {
        return null; // Pedido não encontrado
      }
    } catch (error) {
      throw new ModelError("Erro ao obter pedido: " + error.message);
    }
  }

  // Método para obter todos os pedidos
  async obterTodosPedidos() {
    try {
      const pedidosRef = ref(this.db, 'pedidos');
      const snapshot = await get(pedidosRef);
      if (snapshot.exists()) {
        const pedidos = [];
        snapshot.forEach(childSnapshot => {
          const pedido = childSnapshot.val();
          pedidos.push(new Pedido(
            pedido.idPedido,
            pedido.status,
            pedido.precoDia,
            pedido.quantidade,
            pedido.descricaoProduto,
            pedido.precoUnitario
          ));
        });
        return pedidos;
      } else {
        return []; // Nenhum pedido encontrado
      }
    } catch (error) {
      throw new ModelError("Erro ao obter todos os pedidos: " + error.message);
    }
  }

  // Método para atualizar um pedido
  async atualizarPedido(pedido) {
    try {
      const pedidoRef = ref(this.db, 'pedidos/' + pedido.idPedido);
      await update(pedidoRef, {
        status: pedido.status,
        precoDia: pedido.precoDia,
        quantidade: pedido.quantidade,
        descricaoProduto: pedido.descricaoProduto,
        precoUnitario: pedido.precoUnitario
      });
      return true;
    } catch (error) {
      throw new ModelError("Erro ao atualizar pedido: " + error.message);
    }
  }

  // Método para excluir um pedido
  async excluirPedido(idPedido) {
    try {
      const pedidoRef = ref(this.db, 'pedidos/' + idPedido);
      await remove(pedidoRef);
      return true;
    } catch (error) {
      throw new ModelError("Erro ao excluir pedido: " + error.message);
    }
  }
}
