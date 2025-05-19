import Produto from "./Produto.js";
import ModelError from "./ModelError.js";
import { getDatabase, ref, set, get, child } from "firebase/database";

export default class ProdutoViewManager {
  constructor() {
    this.db = getDatabase();
    this.refProdutos = ref(this.db, 'produtos');
  }

  // Cadastra um novo produto no Realtime Database
  async addProduto(id, preco, descricao) {
    try {
      const novoProduto = new Produto(id, preco, descricao);
      const produtoRef = ref(this.db, `produtos/${id}`);
      await set(produtoRef, {
        idProduto: novoProduto.getIdProd(),
        precoAtual: novoProduto.getPrecoAtual(),
        descricao: novoProduto.getDescricao()
      });
    } catch (error) {
      throw new ModelError("Erro ao adicionar produto: " + error.message);
    }
  }

  // Carrega todos os produtos e renderiza em um container
  async renderProdutos(containerId) {
    try {
      const snapshot = await get(this.refProdutos);
      const container = document.getElementById(containerId);
      container.innerHTML = "";

      if (snapshot.exists()) {
        const produtosData = snapshot.val();
        for (let id in produtosData) {
          const produto = produtosData[id];
          const card = document.createElement("div");
          card.classList.add("produto-card");
          card.innerHTML = `
            <h3>${produto.descricao}</h3>
            <p>R$ ${parseFloat(produto.precoAtual).toFixed(2)}</p>
            <button class="adicionar-pedido" data-id="${produto.idProduto}">+ Pedido</button>
          `;
          container.appendChild(card);
        }
      } else {
        container.innerHTML = "<p>Nenhum produto encontrado.</p>";
      }
    } catch (error) {
      throw new ModelError("Erro ao carregar produtos: " + error.message);
    }
  }
}
