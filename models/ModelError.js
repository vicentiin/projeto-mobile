export default class ModelError extends Error {
    constructor(txtDeErro) {
      super(txtDeErro); // Chama o construtor da superclasse (Error)
      console.log(txtDeErro + '\n\n' + this.stack);
    }
  }
  