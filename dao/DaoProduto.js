import Produto from "./Produto.js";
import ModelError from "./ModelError.js";
import { getDatabase, ref, set, get, update, remove } from "firebase/database";

export default class DaoProduto {
  constructor() {
    this.db = getDatabase();
    this.refProduto = ref(this.db, 'produtos'); // Ref para a coleção de produtos
  }

  // Adiciona um produto no Firebase
  async adicionarProduto(produto) {
    try {
      const produtoId = produto.getIdProd();
      const produtoRef = ref(this.db, 'produtos/' + produtoId);
      await set(produtoRef, {
        descricao: produto.getDescricao(),
        precoAtual: produto.getPrecoAtual()
      });
      return true;
    } catch (error) {
      throw new ModelError("Erro ao adicionar o produto: " + error.message);
    }
  }

  // Obtem um produto pelo ID
  async obterProdutoPorId(idProduto) {
    try {
      const produtoRef = ref(this.db, 'produtos/' + idProduto);
      const snapshot = await get(produtoRef);
      if (snapshot.exists()) {
        const produtoData = snapshot.val();
        return new Produto(produtoData.idProduto, produtoData.precoAtual, produtoData.descricao);
      } else {
        return null;
      }
    } catch (error) {
      throw new ModelError("Erro ao obter o produto: " + error.message);
    }
  }

  // Obtem todos os produtos
  async obterTodosProdutos() {
    try {
      const snapshot = await get(this.refProduto);
      const produtos = [];
      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          const produtoData = childSnapshot.val();
          produtos.push(new Produto(produtoData.idProduto, produtoData.precoAtual, produtoData.descricao));
        });
      }
      return produtos;
    } catch (error) {
      throw new ModelError("Erro ao obter todos os produtos: " + error.message);
    }
  }

  // Atualiza as informações de um produto
  async atualizarProduto(produto) {
    try {
      const produtoRef = ref(this.db, 'produtos/' + produto.getIdProd());
      await update(produtoRef, {
        descricao: produto.getDescricao(),
        precoAtual: produto.getPrecoAtual()
      });
      return true;
    } catch (error) {
      throw new ModelError("Erro ao atualizar o produto: " + error.message);
    }
  }

  // Exclui um produto
  async excluirProduto(idProduto) {
    try {
      const produtoRef = ref(this.db, 'produtos/' + idProduto);
      await remove(produtoRef);
      return true;
    } catch (error) {
      throw new ModelError("Erro ao excluir o produto: " + error.message);
    }
  }
}
