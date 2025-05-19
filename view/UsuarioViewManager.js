import Usuario from "./Usuario.js";
import ModelError from "./ModelError.js";
import { auth, db } from "./firebaseInit.js";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { ref, set, query, orderByChild, equalTo, get } from "firebase/database";

export default class UsuarioViewManager {
  constructor() {
    this.refUsuarios = ref(db, "usuarios");
  }

  async cadastrarUsuario(email, senha, funcao = "GARCOM") {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const usuario = new Usuario(email, userCredential.user.uid, funcao);
      
      await set(ref(db, `usuarios/${usuario.getUid()}`), {
        email: usuario.getEmail(),
        uid: usuario.getUid(),
        funcao: usuario.getFuncao()
      });
      
      return usuario;
    } catch (error) {
      throw new ModelError(this.getFirebaseError(error.code));
    }
  }

  getFirebaseError(code) {
    const errors = {
      'auth/email-already-in-use': 'E-mail já cadastrado',
      'auth/invalid-email': 'E-mail inválido',
      'auth/weak-password': 'Senha deve ter pelo menos 6 caracteres'
    };
    return errors[code] || 'Erro desconhecido';
  }
}