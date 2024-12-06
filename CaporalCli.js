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
	.action(async ({ args, options, logger }) => {
		try {
			if (!fs.existsSync(args.file) || !fs.lstatSync(args.file).isFile()) {
				return logger.warn('Le chemin spécifié n\'est pas un fichier valide.');
			}
			const data = await fs.promises.readFile(args.file, 'utf8');

			// parser
			const analyzer = new GiftParser(options.showTokenize, options.showSymbols);
			analyzer.parse(data);

			const questionnaire = new Questionnaire(analyzer.parsedQuestion);

			// Vérifie les doublons
			const originalSize = questionnaire.size();
			const questionsWithoutDuplicates = questionnaire.doublon();
			const newSize = questionsWithoutDuplicates.length;

			if (originalSize !== newSize) {
				logger.warn(
					`Doublons détectés : ${originalSize - newSize} questions supprimées.`
				);
			} else {
				logger.info('Aucun doublon détecté.');
			}

			// Vérifie le nombre de questions
			const numberOfQuestions = analyzer.parsedQuestion.length - 1; // enlever la consigne
			let qualiteExamen = true;

			if (numberOfQuestions < 14 || numberOfQuestions > 21) {
				qualiteExamen = false;
				if (numberOfQuestions < 14) {
					logger.warn(`Nombre de questions insuffisant (${numberOfQuestions}), veuillez en rajouter.`);
				} else {
					logger.warn(`Nombre de questions trop élevé (${numberOfQuestions}), veuillez en supprimer.`);
				}
			} else {
				logger.info(`Le nombre de questions (${numberOfQuestions}) est dans la plage acceptable.`);
			}
			if (qualiteExamen) {
				logger.info("L'examen respecte les critères de qualité.");
			}
		} catch (error) {
			logger.error('Une erreur est survenue :', error.message);
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


		if (selectedQuestions.length > 0) {
			// Transformation de la liste de question en questionnaire
			var questionnaireSearched = new Questionnaire(selectedQuestions);
			// transformation de la variable questionnaire en fichier gift (changer la variable questionnaire en le questionnaire adéquat)
			var giftContent = '';
			// pour chaque question, on recopie le titre et la variable sentence
			questionnaireSearched.questions.forEach(q => {
				giftContent += `::${q.title}:: \n`;
				giftContent += `${q.sentence} \n`;
				giftContent += ' \n';
			});
			fs.writeFileSync(`${args.name}.gift`, giftContent, "utf8");
			logger.info(`Fichier GIFT généré : ${args.name}.gift`);

			// Ouverture du fichier .gift créé
			open(`./${args.name}.gift`);
		}
		else {
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
	.action(({ args, options, logger }) => {
		// création de l'objet vCard
		var vCard = vCardsJS();

		// Remplissage des informations : Prénom, nom, email, numéro de téléphone, organisation, adresse (numéro, rue, code postal, ville, pays)
		// Gestion des erreurs : Le prénom, le nom et l'email sont obligatoires
		logger.info("Veuillez entrer vos informations : \nNote : Les champs prénom, nom et email sont obligatoires et ne peuvent pas être vides.\n");
		vCard.firstName = prompt('Entrez votre prénom : ');
		if (vCard.firstName.replaceAll(" ", "") === "") {
			throw new Error("L'entrée prénom ne peut pas être vide.\n La vCard n'a pas pu être créée.");
		}
		vCard.lastName = prompt('Entrez votre nom : ');
		if (vCard.lastName.replaceAll(" ", "") === "") {
			throw new Error("L'entrée nom ne peut pas être vide.\n La vCard n'a pas pu être créée.");
		}
		vCard.email = prompt('Entrez votre email : ');
		if (vCard.email.replaceAll(" ", "") === "") {
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
			if (r) {
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
	.action(({ args, options, logger }) => {

		// Lecture du fichier
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			// Création d'un nouveau parseur
			var analyzer = new GiftParser();

			// Transformation des données du fichier gift en objet questionnaire
			var questionsParsed = analyzer.parse(data);

			if (analyzer.errorCount === 0) {

				// création du graphique : on extrait directement l'attribut "type" des questions de l'objet questionsParsed
				// on calcule le pourcentage par agrégation
				var examChart = {
					"title": "Profil de l'examen " + args.file + "",
					"data": {
						"values": questionsParsed.questions
					},
					"transform": [
						{
							"joinaggregate": [{
								"op": "count",
								"as": "total"
							}]
						},
						{ "calculate": "1/datum.total", "as": "perc" },
					],
					"mark": "bar",
					"encoding": {
						"x": {
							"field": "type", "type": "nominal",
							"axis": { "title": "Type de question" }
						},
						"y": {
							"field": "perc", "type": "quantitative",
							"axis": { "title": "Pourcentage d'utilisation" }
						}
					}
				}

				const myChart = vegalite.compile(examChart).spec;

				// Création du fichier SVG
				var runtime = vg.parse(myChart);
				var view = new vg.View(runtime).renderer('svg').run();
				var mySvg = view.toSVG();
				mySvg.then(function (res) {
					fs.writeFileSync("./chart/examChart.svg", res)
					view.finalize();
					//logger.info("%s", JSON.stringify(myChart, null, 2));
					logger.info("Histogramme créé. \nVous pouvez le retrouver dans le dossier \"chart\" sous le nom examChart.svg");
				});

				// Ouverture du fichier
				open('./chart/examChart.svg');

			} else {
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
	.action(({ args, options, logger }) => {

		// Lecture du fichier examen
		var data = fs.readFileSync(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}
		})

		// Création d'un nouveau parseur
		var analyzerExam = new GiftParser();

		analyzerExam.parse(data);


		if (analyzerExam.errorCount === 0) {
			// Création de la liste qui va contenir toutes les questions
			var questionList = analyzerExam.parsedQuestion.map(q => {
				q["groupe"] = "examen choisi"; // les questions font partie de l'examen choisi
				return q;
			})
		} else {
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
			"title": "Comparaison entre le profil de l'examen " + args.file + " et le profil moyen (banque nationale)",
			"data": {
				"values": questionList
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
					"as": "Percent"
				}],
			"mark": "bar",
			"encoding": {
				"x": {
					"field": "type", "type": "nominal",
					"axis": { "title": "Type de question" }
				},
				"y": {
					"field": "Percent", "type": "quantitative",
					"axis": { "title": "Pourcentage d'utilisation" }
				},
				"xOffset": { "field": "groupe" },
				"color": { "field": "groupe" }
			}
		}

		const myChart = vegalite.compile(globalChart).spec;

		// Création du fichier SVG
		var runtime = vg.parse(myChart);
		var view = new vg.View(runtime).renderer('svg').run();
		var mySvg = view.toSVG();
		mySvg.then(function (res) {
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
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		try {
			const timeLimit = Number.isFinite(options.timeLimit) ? options.timeLimit * 60000 : 60000;

			if (!fs.existsSync(args.file) || !fs.lstatSync(args.file).isFile()) {
				return logger.warn('Le chemin spécifié n\'est pas un fichier valide.');
			}

			const data = await fs.promises.readFile(args.file, 'utf8');
			const analyzer = new GiftParser(options.showTokenize || false, options.showSymbols || false);
			analyzer.parse(data);

			const userAnswers = [];
			const startTime = Date.now();

			// Gestion des types de questions via une fonction par type
			const questionHandlers = {
				consignes: (question) => {
					logger.info(
						`${question.title || 'Non spécifié'} : ${question.sentence || 'Non spécifié'}\n`
					);
				},
				multipleChoice: async (question, index) => {
					logger.info(
						`Question ${index}:\n` +
						`\tType : ${question.type || 'Non spécifié'}\n` +
						`\t${question.title || 'Non spécifié'} : ${question.sentence.replace(/\{.*?\}/g, "_____") || 'Non spécifié'}\n` +
						`\tOptions :\n\t\t${(question.answers || []).map(option => `• ${option}`).join("\n\t\t") || 'Aucune option spécifiée'}`
					);

					await new Promise((resolve) => {
						rl.question(`Votre réponse : `, (userAnswer) => {
							userAnswers.push({ question, userAnswer });

							// Vérification de la réponse
							const correctAnswers = Array.isArray(question.correctAnswers)
								? question.correctAnswers
								: [question.correctAnswers];
							const isCorrect = correctAnswers.some(answer => answer.trim().toLowerCase() === userAnswer.trim().toLowerCase());

							if (isCorrect) {
								logger.info("✅ Correct !");
							} else {
								logger.info(`❌ Incorrect. La bonne réponse était : ${correctAnswers.join(", ")}`);
							}
							resolve();
						});
					});
				},
				multipleChoiceMC: async (question, index) => {
					logger.info(
						`Question ${index}:\n` +
						`\tType : ${question.type || 'Non spécifié'}\n` +
						`\t${question.title || 'Non spécifié'} : ${question.sentence.replace(/\{.*?\}/g, "_____") || 'Non spécifié'}\n` +
						`\tOptions :\n\t\t${(question.answers || [])
							.map((block, blockIndex) => `Bloc ${blockIndex + 1}:\n\t\t\t${block.map(option => `• ${option}`).join("\n\t\t\t")}`)
							.join("\n\t\t") || 'Aucune option spécifiée'}`
					);

					const userResponsesForBlocks = []; // Stocker les réponses utilisateur pour chaque bloc

					for (let blockIndex = 0; blockIndex < question.answers.length; blockIndex++) {
						await new Promise((resolve) => {
							rl.question(`Votre réponse pour le Bloc ${blockIndex + 1} : `, (userAnswer) => {
								userResponsesForBlocks.push(userAnswer.trim()); // Stocker la réponse pour ce bloc

								// Vérification de la réponse pour ce bloc
								const correctAnswersForBlock = question.answers[blockIndex].filter(option =>
									question.correctAnswers.includes(option)
								);
								const isCorrect = correctAnswersForBlock.some(correct =>
									correct.trim().toLowerCase() === userAnswer.trim().toLowerCase()
								);

								if (isCorrect) {
									logger.info(`✅ Correct pour le Bloc ${blockIndex + 1} !`);
								} else {
									logger.info(
										`❌ Incorrect pour le Bloc ${blockIndex + 1}. La bonne réponse était : ${correctAnswersForBlock.join(", ")}`
									);
								}
								resolve();
							});
						});
					}
				},
				shortAnswer: async (question, index) => {
					const gaps = question.sentence.match(/\{.*?\}/g) || []; // Trouver tous les trous
					const answersByGap = question.correctAnswers || []; // Liste des bonnes réponses
				
					logger.info(
						`Question ${index}:\n` +
						`\tType : ${question.type || 'Non spécifié'}\n` +
						`\t${question.title || 'Non spécifié'} : ${question.sentence.replace(/\{.*?\}/g, "_____") || 'Non spécifié'}\n`
					);
				
					for (let gapIndex = 0; gapIndex < gaps.length; gapIndex++) {
						await new Promise((resolve) => {
							rl.question(`Votre réponse pour le trou ${gapIndex + 1} : `, (userAnswer) => {
								// Stocker la réponse utilisateur
								userAnswers.push({ question, userAnswer, gapIndex });
				
								// Vérification de la réponse pour ce trou
								const correctAnswersForGap = Array.isArray(answersByGap[gapIndex])
									? answersByGap[gapIndex]
									: [answersByGap[gapIndex]];
				
								const isCorrect = correctAnswersForGap.some(answer =>
									answer.trim().toLowerCase() === userAnswer.trim().toLowerCase()
								);
				
								if (isCorrect) {
									logger.info(`✅ Correct pour le trou ${gapIndex + 1} !`);
								} else {
									logger.info(
										`❌ Incorrect pour le trou ${gapIndex + 1}. La bonne réponse était : ${correctAnswersForGap.join(", ")}`
									);
								}
								resolve();
							});
						});
					}
				},
				duo: async (question, index) => {
					logger.info(
						`Question ${index}:\n` +
						`\tType : ${question.type || 'Non spécifié'}\n` +
						`\t${question.title || 'Non spécifié'} : ${question.sentence.replace(/\{.*?\}/g, "_____") || 'Non spécifié'}\n`
					);

					await new Promise((resolve) => {
						rl.question(`Votre réponse : `, (userAnswer) => {
							userAnswers.push({ question, userAnswer });

							// Vérification de la réponse
							const correctAnswers = Array.isArray(question.correctAnswers)
								? question.correctAnswers
								: [question.correctAnswers];
							const isCorrect = correctAnswers.some(answer => answer.trim().toLowerCase() === userAnswer.trim().toLowerCase());

							if (isCorrect) {
								logger.info("✅ Correct !");
							} else {
								logger.info(`❌ Incorrect. La bonne réponse était : ${correctAnswers.join(", ")}`);
							}
							resolve();
						});
					});
				},
				bigFillGap: async (question, index) => {
					logger.info(
						`Question ${index}:\n` +
						`\tType : ${question.type || 'Non spécifié'}\n` +
						`\t${question.title || 'Non spécifié'} : ${question.sentence.replace(/\{.*?\}/g, "_____") || 'Non spécifié'}\n`
					);

					await new Promise((resolve) => {
						rl.question(`Votre réponse : `, (userAnswer) => {
							userAnswers.push({ question, userAnswer });

							// Vérification de la réponse
							const correctAnswers = Array.isArray(question.correctAnswers)
								? question.correctAnswers
								: [question.correctAnswers];
							const isCorrect = correctAnswers.some(answer => answer.trim().toLowerCase() === userAnswer.trim().toLowerCase());

							if (isCorrect) {
								logger.info("✅ Correct !");
							} else {
								logger.info(`❌ Incorrect. La bonne réponse était : ${correctAnswers.join(", ")}`);
							}
							resolve();
						});
					});
				},
				fillGap: async (question, index) => {
					logger.info(
						`Question ${index}:\n` +
						`\tType : ${question.type || 'Non spécifié'}\n` +
						`\t${question.title || 'Non spécifié'} : ${question.sentence.replace(/\{.*?\}/g, "_____") || 'Non spécifié'}\n`
					);

					await new Promise((resolve) => {
						rl.question(`Votre réponse : `, (userAnswer) => {
							userAnswers.push({ question, userAnswer });

							// Vérification de la réponse
							const correctAnswers = Array.isArray(question.correctAnswers)
								? question.correctAnswers
								: [question.correctAnswers];
							const isCorrect = correctAnswers.some(answer => answer.trim().toLowerCase() === userAnswer.trim().toLowerCase());

							if (isCorrect) {
								logger.info("✅ Correct !");
							} else {
								logger.info(`❌ Incorrect. La bonne réponse était : ${correctAnswers.join(", ")}`);
							}
							resolve();
						});
					});
				},
				nombre: async (question, index) => {
					logger.info(
						`Question ${index}:\n` +
						`\tType : ${question.type || 'Non spécifié'}\n` +
						`\t${question.title || 'Non spécifié'} : ${question.sentence.replace(/\{.*?\}/g, "_____") || 'Non spécifié'}\n`
					);

					await new Promise((resolve) => {
						rl.question(`Votre réponse : `, (userAnswer) => {
							userAnswers.push({ question, userAnswer });

							// Vérification de la réponse
							const correctAnswers = Array.isArray(question.correctAnswers)
								? question.correctAnswers
								: [question.correctAnswers];
							const isCorrect = correctAnswers.some(answer => answer.trim().toLowerCase() === userAnswer.trim().toLowerCase());

							if (isCorrect) {
								logger.info("✅ Correct !");
							} else {
								logger.info(`❌ Incorrect. La bonne réponse était : ${correctAnswers.join(", ")}`);
							}
							resolve();
						});
					});
				},
			};

			// Boucle principale pour traiter toutes les questions
			for (const [index, question] of analyzer.parsedQuestion.entries()) {
				const handler = questionHandlers[question.type];
				if (handler) {
					await handler(question, index);
				} else {
					logger.warn(`Type de question inconnu : ${question.type}`);
				}
			}

			// Calcul des résultats globaux
			const correctCount = userAnswers.reduce((count, { question, userAnswer }) => {
				const correctAnswers = Array.isArray(question.correctAnswers)
					? question.correctAnswers
					: [question.correctAnswers];
				return correctAnswers.some(answer => answer.trim().toLowerCase() === userAnswer.trim().toLowerCase())
					? count + 1
					: count;
			}, 0);

			const totalQuestions = userAnswers.length;
			const score = Math.round((correctCount / totalQuestions) * 100);

			const rapport = {
				examen: args.file,
				date: new Date(),
				score: `${score}%`,
				bonnesReponses: correctCount,
				totalQuestions,
				tempsUtilise: `${(Date.now() - startTime) / 1000} secondes`,
				tempsLimite: timeLimit ? `${timeLimit / 60000} minutes` : "Non défini",
			};

			logger.info("\n=== Rapport final ===");
			console.log(JSON.stringify(rapport, null, 2));
		} catch (e) {
			logger.error("Erreur dans le mode examen : ", e);
		} finally {
			rl.close();
		}
	})

cli.run(process.argv.slice(2));

// Fonction de recherche affichant les informations et retournant la liste des questions trouvé en assynchrone
// Elle renvoit la liste de toutes les questions trouvé via un mot clé donné dans args.string
async function search(file, options, logger, string) {
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
				return (resultatSearched);
			}
			else {
				logger.warn(`${string} non trouvé dans les fichiers gift`);
				return (resultatSearched);
			}
		}
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
						compteur++;
						filtered.forEach((question) => resultatSearched.push(question));
					}

				}
				catch (err) {
					logger.warn(`Erreur lors de la lecture de ${fullPath} :`, err);
				}
			}
		};
		if (compteur > 0) {
			return (resultatSearched);
		}
		else {
			logger.warn(`${string} non trouvé dans les fichiers gift`)
			return (resultatSearched);
		}
	}
}

// Ouverture et suppresion de la vCard en asynchrone
async function openDeleteVcard(path) {
	// Ouverture de la vCard
	await open(path);

	// Suppression de la vCard : SPEC_NF_01 (respect des RGPD)
	var response = "";
	while ((response != "Y") && (response != "y")) {
		console.log("Afin de respecter les RGPD, le fichier vcard sera supprimé à la fin de l'exécution de cette commande. Vous pouvez le copier afin de conserver son contenu.");
		response = prompt("Suppression du fichier ? [Y] ");
	}
	try {
		await fs.promises.unlink(path);
		return true;
	} catch (err) {
		console.error(err);
		return false;
	}
}
