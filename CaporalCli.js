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
const open = require('open'); // version 8.4.2 pour pouvoir être utilisé en require : npm i open@8.4.2
// const { forEach } = require('vega-lite/build/src/encoding.js');
const readline = require('readline');

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
			logger.info(`Fichier GIFT généré : ${args.name}.gift`);

			// Ouverture du fichier .gift créé
			open(`./${args.name}.gift`);
		}
		else{
			logger.info("Aucune questions choisies, pas de fichier créé");
		}
	
		
	})

	// createVcard : création du fichier vcard pour l'enseignant
	// bibliothèques utilisées :
	//	- vcards-js (https://www.npmjs.com/package/vcards-js): création et exportation de vcards
	// 	- prompt-sync (https://www.npmjs.com/package/prompt-sync?activeTab=readme) : demander et lire l'input de l'utilisateur
	// 	- open version 8.4.2 (https://www.npmjs.com/package/open/v/8.4.2) : permet d'ouvrir le fichier .vcf à la fin de la commande
	// 	- FileSystem (fs) : suppression de la vCard
	.command('createVcard', 'Créé un fichier vcard pour le profil de l\'enseignant')
	.argument('<file>', 'Nom du fichier vcard')
	.action(({args, options, logger}) =>{
		// création de l'objet vCard
		var vCard = vCardsJS();

		// Remplissage des informations : Prénom, nom, email, numéro de téléphone, organisation, adresse (numéro, rue, code postal, ville, pays)
		// Gestion des erreurs : Le prénom, le nom et l'email sont obligatoires
		logger.info("Veuillez entrer vos informations : \nNote : Les champs prénom, nom et email sont obligatoires et ne peuvent pas être vides.\n");
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
		/*console.log(`vCard "${args.file}.vcf" créée :`);
		console.log(vCard.getFormattedString());*/
		logger.info(`La vCard "${args.file}.vcf" a été générée. \nElle est enregistrée dans le dossier "vCard"`);

		// Ouverture et suppression du fichier en asynchrone
		openDeleteVcard(`./vCard/${args.file}.vcf`).then(r => {
			if (r){
				logger.info("Le fichier a bien été supprimé.");
			}
			else {
				logger.warn("Erreur : le fichier n'a pas pu être supprimé conformément aux directives RPGD. Veuillez prendre manuellement les mesures nécessaires.");
			}
		})

	})

	// examChart : création d'un histogramme sous le format .svg représentant le profil d'un examen
	// bibliothèques utilisées :
	// 	- FileSystem (fs) : lecture du fichier gift et exportation sous le format .svg
	// 	- vega (vg) : création de l'histogramme, adaptation au format .svg
	// 	- open version 8.4.2 (https://www.npmjs.com/package/open/v/8.4.2) : permet d'ouvrir le fichier .svg à la fin de la commande
	.command('examChart', 'Créé un fichier .svg permettant de visualiser le profil d\'un examen')
	.argument('<file>', 'Le fichier correspondant à l\'examen')
	.action(({args, options, logger}) => {

		// Lecture du fichier
		fs.readFile(args.file, 'utf8', function (err,data) {
			if (err) {
				return logger.warn(err);
			}

			// Création d'un nouveau parseur
			var analyzer = new GiftParser();

			// Transformation des données du fichier gift en objet questionnaire
			var questionsParsed = analyzer.parse(data);

			if(analyzer.errorCount === 0){

				// création du graphique : on extrait directement l'attribut "type" des questions de l'objet questionsParsed
				// on calcule le pourcentage par agrégation
				var examChart = {
					"title": "Profil de l'examen "+args.file+"",
					"data" : {
							"values" : questionsParsed.questions
					},
					"transform": [
						{ "joinaggregate" : [{
								"op" : "count",
								"as" : "total"
							}]
						},
						{"calculate": "1/datum.total", "as": "perc"},
					],
					"mark" : "bar",
					"encoding" : {
						"x" : {"field" : "type", "type" : "nominal",
								"axis" : {"title" : "Type de question"}
							},
						"y" : {"field" : "perc", "type" : "quantitative",
								"axis" : {"title" : "Pourcentage d'utilisation"}
							}
					}
				}
				
				const myChart = vegalite.compile(examChart).spec;
				
				// Création du fichier SVG
				var runtime = vg.parse(myChart);
				var view = new vg.View(runtime).renderer('svg').run();
				var mySvg = view.toSVG();
				mySvg.then(function(res){
					fs.writeFileSync("./chart/examChart.svg", res)
					view.finalize();
					//logger.info("%s", JSON.stringify(myChart, null, 2));
					logger.info("Histogramme créé. \nVous pouvez le retrouver dans le dossier \"chart\" sous le nom examChart.svg");
				});

				// Ouverture du fichier
				open('./chart/examChart.svg');
				
			}else{
				logger.info("Le fichier .gift contient une erreur.".red);
			}
		});
	})	

	// globalChart : création d'un histogramme sous le format .svg représentant la comparaison entre le profil d'un examen et le profil des examens de la banque nationale 
	// bibliothèques utilisées :
	// 	- FileSystem (fs) : lecture du fichier gift, du dossier des examens gift et exportation sous le format .svg
	// 	- vega (vg) : création de l'histogramme, adaptation au format .svg
	// 	- open version 8.4.2 (https://www.npmjs.com/package/open/v/8.4.2) : permet d'ouvrir le fichier .svg à la fin de la commande
	.command('globalChart', 'Créé un fichier .svg permettant de visualiser la comparaison entre le profil de l\'examen choisi et le profil moyen des examens de la banque nationale')
	.argument('<file>', 'Le fichier correspondant à l\'examen que l\'on veut comparer')
	.argument('<directory>', 'Le dossier contenant les questions de la banque nationale')
	.action(({args, options, logger}) => {

		// Lecture du fichier examen
		var data = fs.readFileSync(args.file, 'utf8', function (err,data){
			if (err) {
				return logger.warn(err);
			}
		})

		// Création d'un nouveau parseur
		var analyzerExam = new GiftParser();

		analyzerExam.parse(data);


		if (analyzerExam.errorCount === 0){
			// Création de la liste qui va contenir toutes les questions
			var questionList = analyzerExam.parsedQuestion.map(q => {
				q["groupe"] = "examen choisi"; // les questions font partie de l'examen choisi
				return q;
			})
		}else{
			logger.info("Le fichier .gift contient une erreur.".red);
		}

		// Lecture du dossier contenant les questions de la banque nationale
		var compteur = 0;
		const directory = fs.readdirSync(args.directory); 
		for (const openfile of directory) {
			const fullPath = path.join(args.directory, openfile);
			if (fs.lstatSync(fullPath).isFile()) {
				try {
				   	let data = fs.readFileSync(fullPath, 'utf8');
					
					// Parseur pour les questions de la banque nationale
					var analyzerNational = new GiftParser();
					analyzerNational.parse(data);
					var nationalExam = analyzerNational.parsedQuestion.map(q => {
						q["groupe"] = "profil moyen"; // les questions font partie de la banque nationale
						return q;
					})
					// on ajoute les questions de la banque nationale à la liste contenant toutes les questions
					nationalExam.forEach((question) => questionList.push(question));
	
				}
			catch (err) {
				logger.warn(`Erreur lors de la lecture de ${fullPath} :`, err);
			  }
			}
		};

		// Création du graphique : on extrait directement l'attribut "type" des objets question contenus dans la liste questionList
		// On sépare les données selon leur groupe, puis on calcule le pourcentage des types de question par agrégation
		var globalChart = {
			"title": "Comparaison entre le profil de l'examen "+args.file+" et le profil moyen (banque nationale)",
			"data" : {
					"values" : questionList
			},
			"transform": [
				{
				  "joinaggregate": [{
					"op": "count",
					"as": "total"
				  }],
				  "groupby": ["groupe"]
				},
			  {
				"calculate": "1/datum.total",
				"as" : "Percent"
			  }],
			"mark" : "bar",
			"encoding" : {
				"x" : {"field" : "type", "type" : "nominal",
						"axis" : {"title" : "Type de question"}
					},
				"y" : {"field" : "Percent", "type" : "quantitative",
						"axis" : {"title" : "Pourcentage d'utilisation"}
					},
				"xOffset": {"field": "groupe"},
				"color": {"field": "groupe"}
			}
		}

		const myChart = vegalite.compile(globalChart).spec;
				
		// Création du fichier SVG
		var runtime = vg.parse(myChart);
		var view = new vg.View(runtime).renderer('svg').run();
		var mySvg = view.toSVG();
		mySvg.then(function(res){
			fs.writeFileSync("./chart/globalChart.svg", res)
			view.finalize();
			logger.info("Histogramme créé. \nVous pouvez le retrouver dans le dossier \"chart\" sous le nom globalChart.svg");
		});

		// Ouverture du fichier
		open('./chart/globalChart.svg');

	})

	//Simuler un examen
	.command('modeExam', "Permet de simuler la passation d'un examen")
	.argument('<file>', "Fichier de l'examen à simuler")
	.option('-t, --timeLimit <time>', "Limite de temps en minutes", {
    		validator: cli.NUMBER,
    		default: null
	})
	.action(async ({ args, options, logger }) => {
    		const filePath = args.file;
    		const timeLimit = options.timeLimit ? options.timeLimit * 60000 : null; // ms

    		// Vérifier que le fichier existe
    		if (!fs.existsSync(filePath)) {
        		return logger.error(`Le fichier ${filePath} n'existe pas.`);
    		}

    		// Charger le fichier d'examen
    		let examData;
    		try {
        		const fileContent = fs.readFileSync(filePath, 'utf8');
        		const parser = new GiftParser();
        		examData = parser.parse(fileContent);
    		} catch (err) {
        		return logger.error(`Erreur lors de la lecture ou de l'analyse du fichier : ${err.message}`);
    		}

    		if (!examData.questions || examData.questions.length === 0) {
        		return logger.error("Aucune question valide trouvée dans le fichier d'examen.");
    		}

    		// Afficher la consigne avant le début de l'examen
    		const consigne = examData.questions[0].sentence[0].replace(/\{.*?\}/g, '...'); // Remplacer les accolades par "..."
    		logger.info(`Consigne de l'examen :\n${consigne}\n`);

    		// Début de la simulation d'examen
    		logger.info(`Simulation de l'examen : ${filePath}`);
    		const userAnswers = [];
    		const startTime = Date.now();

    		// Interface readline pour capturer les réponses utilisateur
    		const rl = readline.createInterface({
        		input: process.stdin,
        		output: process.stdout,
    		});

    		// Fonction pour poser les questions de manière synchrone
    		for (let index = 1; index < examData.questions.length; index++) { // Commence à partir de la première question (1.1)
        		if (timeLimit && Date.now() - startTime > timeLimit) {
            		logger.warn("Temps limite dépassé. Fin de la simulation.");
            		break;
        		}

        		const question = examData.questions[index];

        		// Extraire et afficher le texte de la question
        		if (question.sentence && question.sentence.length > 0) {
				let questionText = question.sentence[0];
				
				// Remplacer les réponses proposées entre {~enough~=so~too~very} par "enough, so, too, very"
            			questionText = questionText.replace(/{~([^}]*)~}/g, (match, options) => {
					// Remplacer '=' par '~' dans les options
					const answers = options
						.split('~') // Séparer par '~'
                    				.map(opt => opt.replace('=', '~').trim()) // Remplacer '=' par '~' et enlever les espaces inutiles
                    				.join(' ~ '); // Joindre les options avec ' ~ '
					return `${answers}`; // Retourner les options
				});
				
				// Pose une question et capture la réponse
				await new Promise((resolve) => {
					rl.question(`Q${index}: ${questionText}\nVotre réponse : `, (userAnswer) => {
						userAnswers.push({ question, userAnswer });
						resolve(); 
					});
				})
			} else {
				// Si question.sentence est vide ou undefined, afficher une question générique
				await new Promise((resolve) => {
					rl.question(`Q${index}: Question ${index + 1}\nVotre réponse : `, (userAnswer) => {
						userAnswers.push({ question, userAnswer });
                    				resolve(); 
					});
				});
        		}
    		}

    		rl.close();

    		// Calculer les résultats avec la bonne réponse extraite
    		const bilan = userAnswers.map(({ question, userAnswer }) => {
        		// Extraction de la bonne réponse (la première option correcte entre = et ~ ou = et })
        		const correctAnswer = (question.sentence[0].match(/=([^~}]+)/) || [])[1] || "Non définie"; // Récupère la première réponse correcte entre = et ~ ou = et }

        		return {
            		"Réponse correcte": correctAnswer, // Affiche la réponse correcte
            		"Votre réponse": userAnswer, // Affiche la réponse donnée par l'utilisateur
        		};
    		});

    		// Générer et afficher le rapport final
    		const rapport = {
        		examen: filePath,
        		date: new Date(),
        		bilan,
        		tempsUtilise: `${(Date.now() - startTime) / 1000} secondes`,
        		tempsLimite: timeLimit ? `${timeLimit / 60000} minutes` : "Non défini",
    		};

    		logger.info("Rapport final :");
    		console.log(JSON.stringify(rapport, null, 2));
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

// Ouverture et suppresion de la vCard en asynchrone
async function openDeleteVcard(path){
	// Ouverture de la vCard
	await open(path);

	// Suppression de la vCard : SPEC_NF_01 (respect des RGPD)
	var response = "";
	while ((response != "Y") && (response != "y")){
		console.log("Afin de respecter les RGPD, le fichier vcard sera supprimé à la fin de l'exécution de cette commande. Vous pouvez le copier afin de conserver son contenu.");
		response = prompt("Suppression du fichier ? [Y] ");
	}
	try {
		await fs.promises.unlink(path);
		return true;
	} catch (err){
		console.error(err);
		return false;
	}
}
