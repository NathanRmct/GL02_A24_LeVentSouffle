const fs = require('fs');
const colors = require('colors');
const GiftParser = require('./GiftParser.js');
const vg = require('vega');
const path = require('path');
const vegalite = require('vega-lite');
const cli = require("@caporal/core").default;
const Question = require('./lib/question.js');
const Questionnaire = require('./lib/questionnaire.js');
const vCardsJS = require('vcards-js');
const prompt = require('prompt-sync')();
// const { forEach } = require('vega-lite/build/src/encoding.js');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


cli
	.version('vpf-parser-cli')
	.version('0.5')

	// checkGift : vérifie si le document est compatible et affiche les données parsed (voir tokenisef si besoin)
	.command('checkGift', 'Check if <file> is a valid gift file')
	.argument('<file>', 'The file to check with Gift parser')
	.option('-s, --showSymbols', 'log the analyzed symbol at each step', { validator: cli.BOOLEAN, default: false })
	.option('-t, --showTokenize', 'log the tokenization results', { validator: cli.BOOLEAN, default: false })
	.action(({ args, options, logger }) => {

		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			var analyzer = new GiftParser(options.showTokenize, options.showSymbols);
			var questionsParsed = analyzer.parse(data);
			if (analyzer.errorCount === 0) {
				logger.info("The .gift file is a valid gift file".green);
			} else {
				logger.info("The .gift file contains error".red);
			}
			logger.info("%s", JSON.stringify(questionsParsed.questions, null, 2));

		});
	})

	// search : retrouve toutes les questions dans un fichier / répertoire contenant un motclé précis.
	.command('search', 'Check question that contains a particular string in a file or directory')
	.argument('<file>', 'The file or the directory to check with Gift parser')
	.argument('<string>', 'The text to look for in the different questions')
	.action(async ({ args, options, logger }) => {
		var questionsFiltered = await search(args.file, options, logger, args.string);
		logger.info("%s", JSON.stringify(questionsFiltered, null, 2));

	})


	// qualiteExamen : vérifier la qualité d'un examen
	.command('qualiteExamen', 'Vérifie la qualité d\'un examen')
	.argument('<file>', 'The file to check with Gift parser')
	.action(({ args, options, logger }) => {
		if (fs.lstatSync(args.file).isFile()) {
			fs.readFile(args.file, 'utf8', function (err, data) {
				if (err) {
					return logger.warn(err);
				}
				var analyzer = new GiftParser(options.showTokenize, options.showSymbols);
				analyzer.parse(data);

				// Affiche uniquement les titres des questions
				analyzer.parsedQuestion.forEach(question => {
					logger.info(`Titre: ${question.title}\n\tSentence: ${question.sentence.join(' ')}\n\tBonnes réponses: ${question.correctAnswers.join(', ')}`);
				});				
			});
		}
	})

	// Générer au format gift. Il manque la partie où l'on choisit les questions
	.command('createGift', 'Génère au format gift un questionnaire à partir de questions provenant d un autre fichier ou d un dossier de questionnnaires gift')
	.argument('<file>', 'The file or the directory to check with Gift parser')
	.argument('<name>', 'The name of your future file Gift with questions')
	.action(async ({ args, options, logger }) => {
		var selectedQuestions = [];

		while (true) {
			// Récupère le mot clé utilisé dans la recherche
			const keyword = prompt("Entrez un mot-clé pour rechercher des questions : ");
			if (!keyword) {
			  console.log("Mot-clé vide. Réessayez.");
			  continue;
			}
		
			// Effectue la recherche
			const searchResults = await search(args.file, options, logger, keyword);
		
			// Condition si pas de questions trouvées
			if (searchResults.length === 0) {
			  console.log(`Aucune question trouvée pour le mot-clé : ${keyword}`);
			  continue; // permet de passer à la suite
			}
		
			// Affiche les différentes questions trouvées avec un index pour l'utilisateur
			console.log("\n Questions trouvées : \n");
			searchResults.forEach((question, index) => {
			  logger.info(index + 1);
			  logger.info("%s", JSON.stringify(question, null, 2));
			});
		
			// Récupère l'indice choisie par l'utilisateur
			const choice = prompt(
			  "Entrez le numéro de la question à ajouter (ou appuyez sur Entrée pour annuler) : "
			);
		
			// Si l'utilisateur ne choisie pas le bon index, rien n'est ajoutée
			if (!choice || isNaN(choice) || choice < 1 || choice > searchResults.length) {
			  console.log("Aucune question ajoutée.");
			} 
			 
			// Si l'utilisateur a choisie un index qui correspond, on ajoute la question à la liste de questio 
			else {
			  const selectedQuestion = searchResults[Number(choice) - 1];
			  selectedQuestions.push(selectedQuestion);
			  logger.info(`Question ajoutée :`);
			  logger.info("%s", JSON.stringify(selectedQuestion, null, 2));
			}
		
			// Demande si l'utilisateur souhaite continuer
			const continueSearching = prompt(
			  "Voulez-vous continuer à chercher des questions ? (y/n) : "
			).toLowerCase();
		
			if (continueSearching !== "y") {
			  break;
			}
		  }


		if(selectedQuestions.length > 0){
			// Transformation de la liste de question en questionnaire
			var questionnaireSearched = new Questionnaire(selectedQuestions);
			// transformation de la variable questionnaire en fichier gift (changer la variable questionnaire en le questionnaire adéquat)
			var giftContent = '';
			// pour chaque question, on recopie le titre et la variable sentence
			questionnaireSearched.questions.forEach(q => {
				giftContent += `::${q.title}:: \n`;
				q.sentence.forEach(sentence => giftContent += `${sentence} \n`)
				giftContent += ' \n';});
			fs.writeFileSync(`${args.name}.gift`, giftContent, "utf8");
			console.log(`Fichier GIFT généré : ${args.name}.gift`);
		}
		else{
			logger.info("Aucune questions choisies, pas de fichier créé")
		}
	
		
	})

	// createVcard : création du fichier vcard pour l'enseignant
	// bibliothèques utilisées :
	//	- vcards-js (https://www.npmjs.com/package/vcards-js): création et exportation de vcards
	// 	- prompt-sync (https://www.npmjs.com/package/prompt-sync?activeTab=readme) : demander et lire l'input de l'utilisateur
	.command('createVcard', 'Créé un fichier vcard pour le profil de l\'enseignant')
	.argument('<file>', 'Nom du fichier vcard')
	.action(({args, options, logger}) =>{
		// création de l'objet vCard
		var vCard = vCardsJS();

		// Remplissage des informations : Prénom, nom, email, numéro de téléphone, organisation, adresse (numéro, rue, code postal, ville, pays)
		// Gestion des erreurs : Le prénom, le nom et l'email sont obligatoires
		console.log("Veuillez entrer vos informations : \nNote : Les champs prénom, nom et email sont obligatoires et ne peuvent pas être vides.\n")
		vCard.firstName = prompt('Entrez votre prénom : ');
		if (vCard.firstName.replaceAll(" ", "") === ""){
			throw new Error("L'entrée prénom ne peut pas être vide.\n La vCard n'a pas pu être créée.");
		}
		vCard.lastName = prompt('Entrez votre nom : ');
		if (vCard.lastName.replaceAll(" ", "") === ""){
			throw new Error("L'entrée nom ne peut pas être vide.\n La vCard n'a pas pu être créée.");
		}
		vCard.email = prompt('Entrez votre email : ');
		if (vCard.email.replaceAll(" ", "") === ""){
			throw new Error("L'entrée email ne peut pas être vide.\n La vCard n'a pas pu être créée.");
		}
		vCard.workPhone = prompt('Entrez votre numéro de téléphone : ');
		vCard.organization = prompt('Entrez le nom de votre organisation : ');
		console.log('Adresse :');
		vCard.homeAddress.street = prompt('Entrez votre numéro et votre rue : ');
		vCard.homeAddress.postalCode = prompt('Entrez votre code postal : ');
		vCard.homeAddress.city = prompt('Entrez votre ville : ');
		vCard.homeAddress.countryRegion = prompt('Entrez votre Pays : ');
		
		// spécification de la version vCard (version 4.0 conseillée par le cahier des charges)
		vCard.version = '4.0';

		// exportation en fichier .vcf
		vCard.saveToFile(`./vCard/${args.file}.vcf`);

		// Affichage de la vCard dans la console 
		console.log(`vCard "${args.file}.vcf" créée :`);
		console.log(vCard.getFormattedString());
		console.log(`La vCard "${args.file}.vcf" est enregistrée dans le dossier "vCard"`);

	})

	// readme
	.command('readme', 'Display the README.md file')
	.action(({ args, options, logger }) => {
		fs.readFile("./README.md", 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			logger.info(data);
		});

	})

cli.run(process.argv.slice(2));

// Fonction de recherche affichant les informations et retournant la liste des questions trouvé en assynchrone
// Elle renvoit la liste de toutes les questions trouvé via un mot clé donné dans args.string
async function search(file, options, logger, string){
var resultatSearched = [];
// cas fichier unique
if (fs.lstatSync(file).isFile()) {
	try {
		let data = await fs.promises.readFile(file, 'utf8');
		var analyzer = new GiftParser(options.showTokenize, options.showSymbols);
		analyzer.parse(data);
		var filtered = analyzer.parsedQuestion.filter(q => q.search(string));
		if (filtered.length > 0) {
			filtered.forEach((question) => resultatSearched.push(question));
			return(resultatSearched);
		}
		else {
			logger.warn(`${string} non trouvé dans les fichiers gift`);
			return(resultatSearched);
		}}
		catch (err) {
			logger.warn(`Erreur lors de la lecture de ${file} :`, err);
		  }
		
	}
else if (fs.lstatSync(file).isDirectory()) {
	var compteur = 0;
	const files = fs.readdirSync(file); 
	for (const openfile of files) {
		const fullPath = path.join(file, openfile);
		if (fs.lstatSync(fullPath).isFile()) {
			try {
			   let data = await fs.promises.readFile(fullPath, 'utf8');

				var analyzer = new GiftParser(options.showTokenize, options.showSymbols);
				analyzer.parse(data);

				var filtered = analyzer.parsedQuestion.filter(q => q.search(string));

				if (filtered.length > 0) {
					compteur ++;
					filtered.forEach((question) => resultatSearched.push(question));
				}

			}
		catch (err) {
			logger.warn(`Erreur lors de la lecture de ${fullPath} :`, err);
		  }
		}
	};
	if (compteur > 0){
	return(resultatSearched);
	}
	else {
	logger.warn(`${string} non trouvé dans les fichiers gift`)
	return(resultatSearched);
	}
	}
}