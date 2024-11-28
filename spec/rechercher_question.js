const fs = require("fs");
const path = require("path");
const readline = require("readline");
const GiftParser = require('../GiftParser');

function rechercher_question() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question("Souhaitez-vous rechercher par mot clé (1) ou par type de question (2) ? ", (reponse) => {
        if (reponse === "1") {
            const cheminFichier = "./SujetB_data/EM-U4-p32_33-Review.gift";
            fs.readFile(cheminFichier, 'utf8', (erreur, data) => {
                if (erreur) {
                    console.error("Erreur lors de la lecture du fichier :", erreur);
                    rl.close();
                    return;
                }

                const parser = new GiftParser(false, false);
                parser.parse(data);

                if (parser.errorCount === 0) {
                    console.log("Le fichier .gift est valide.");
                    rl.close();
                } else {
                    console.error("Le fichier contient des erreurs de syntaxe.");
                    rl.close();
                }
            });
        } else if (reponse === "2") {
            console.log("Recherche par type de question non encore implémentée.");
            rl.close();
        } else {
            console.log("Réponse non prise en charge, réessayez.");
            rl.close();
        }
    });
}

// Appeler la fonction
rechercher_question();