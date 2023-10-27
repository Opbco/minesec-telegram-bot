const fetch = require("node-fetch");
const fs = require("fs");
const MINESEC_BASE_URL = "https://minesecdrh.cm/api/";

const getListAvailableFiles = () => {
  let myFiles;
  try {
    myFiles = fs.readdirSync("./avancements").join("\n");
    fs.writeFile(
      "./files/avancement.txt",
      myFiles,
      { encoding: "utf8" },
      (err) => {
        if (err) throw err;
      }
    );
  } catch (err) {
    console.log(err);
  }
};

const getListAvailableAvancement = (message) => {
  let myFiles;
  try {
    const matricule = message.toUpperCase();
    let result = matricule.match(
      "^([0-9]{6}-[A-Za-z]{1}|[A-Za-z]{1}-[0-9]{6}|EC-[0-9]{6})$"
    );

    if (result) {
      myFiles = avancementFiles.filter((filename) =>
        filename.includes(matricule)
      );
      return myFiles?.length > 0
        ? myFiles.map((file) => `${__dirname}/avancements/${file}`)
        : `No advancement available for ${matricule}. we are still numerising advancements be patient.`;
    }
    return "Matricule non valide, \n\n Envoyer: *!advancement matricule*";
  } catch (err) {
    console.log(err);
    return "Server error, please try again later or contact the administrator";
  }
};

const getCompositionDossier = async (type_folder) => {
  try {
    const criterias = type_folder.split(" ");

    const commande = criterias.shift();

    const request = await fetch(
      `${MINESEC_BASE_URL}demandes/${criterias.join(" ")}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (request.status >= 400) {
      return "Server error (Bad request), \n\n Envoyer: *!dossier [type de dossier]* ou *!file [type de dossier]* (pour connaitre la composition d'un dossier)";
    }

    const response = await request.json();
    return response["data"].join("\n\n");
  } catch (err) {
    console.log(err);
    return "Server error, please try again later or contact the administrator";
  }
};

const getResetMinesecAccount = async (message) => {
  try {
    const matricule = message.slice(-8);
    let result = matricule.match(
      "^([0-9]{6}-[A-Za-z]{1}|[A-Za-z]{1}-[0-9]{6}|EC-[0-9]{6})$"
    );

    if (result) {
      const request = await fetch(
        `${MINESEC_BASE_URL}accounts/reset/${matricule}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (request.status >= 400) {
        return "Server error (Bad request), \n\n Envoyer: *reset minesecdrh matricule*";
      }

      const response = await request.json();

      return response.message;
    }
    return "Matricule non valide, \n\n Envoyer: *reset minesecdrh matricule*";
  } catch (err) {
    console.log(err);
    return "Server error, please try again later or contact the administrator";
  }
};

module.exports = {
  getCompositionDossier,
  getResetMinesecAccount,
  getListAvailableAvancement,
  getListAvailableFiles,
};
