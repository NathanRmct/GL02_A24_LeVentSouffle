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

	// search : vérifie si le document est compatible et affiche les données parsed (voir tokenisef si besoin)
	.command('search', 'Check question that contains a particular string in a file or directory')
	.argument('<file>', 'The file or the directory to check with Gift parser')
	.argument('<string>', 'The text to look for in the different questions')
	.action(async ({ args, options, logger }) => {
		var questionsFiltered = await search(args.file, options, logger, args.string);
		logger.info("%s", JSON.stringify(questionsFiltered, null, 2));

	})


	// crerGift : permet de visualiser les question, d'en sélectionner une ou plusieurs et de les ajouter à la liste des questions de l'examen en préparation
	.command('search', 'Check question that contains a particular string in a file or directory')
	.argument('<file>', 'The file or the directory to check with Gift parser')
	.argument('<string>', 'The text to look for in the different questions')
	.action(async ({ args, options, logger }) => {
		var questionsFiltered = await search(args, options, logger);
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
	.command('createGift', 'Génère au format gift un texte prédéfinit dans caporal ')
	.argument('<file>', 'The name of the future file in gift')
	.argument('<test>', 'The file to take the data from')
	.action(({ args, options, logger }) => {

		
		// on peut enlever la lecture, puisque c'est les questions déterminé par l'utilisateur qui vont être choisi
		fs.readFile(args.test, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}
			// la variable questionnaire est à garder : c'est ce que l'on va ensuite transformer en gift
			var questionnaire;

			// A enlever et remplacer par la nouvelle conception du formulaire
			var analyzer = new GiftParser(options.showTokenize, options.showSymbols);
			questionnaire = analyzer.parse(data);
			

			// transformation de la variable questionnaire en fichier gift (changer la variable questionnaire en le questionnaire adéquat)
			var giftContent = '';
			// pour chaque question, on recopie le titre et la variable sentence
			questionnaire.questions.forEach(q => {
				giftContent += `::${q.title}:: \n`;
				q.sentence.forEach(sentence => giftContent += `${sentence} \n`)
				giftContent += ' \n';});
			fs.writeFileSync(`${args.file}.gift`, giftContent, "utf8");
			console.log(`Fichier GIFT généré : ${args.file}.gift`);
	})
		
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
	for (const file of files) {
		const fullPath = path.join(file, file);
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