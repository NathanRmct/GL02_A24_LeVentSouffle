const fs = require('fs');
const colors = require('colors');
const GiftParser = require('./GiftParser.js');
const vg = require('vega');
const vegalite = require('vega-lite');
const cli = require("@caporal/core").default;
const Question = require('./lib/question.js');


cli
	.version('vpf-parser-cli')
	.version('0.01')

	// test : vérifie si l'interface répond à une demande de base
	.command('test', 'test si la relation de base fonctionne')
	.action(({ logger }) => {
		logger.info("ça fonctionne")

	})

	// checkGift : vérifie si le document est compatible et affiche les données parsed (voir tokenisef si besoin)
	.command('checkGift', 'Check if <file> is a valid gift file')
	.argument('<file>', 'The file to check with Vpf parser')
	.option('-s, --showSymbols', 'log the analyzed symbol at each step', { validator: cli.BOOLEAN, default: false })
	.option('-t, --showTokenize', 'log the tokenization results', { validator: cli.BOOLEAN, default: false })
	.action(({ args, options, logger }) => {

		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			var analyzer = new GiftParser(options.showTokenize, options.showSymbols);
			analyzer.parse(data);

			if (analyzer.errorCount === 0) {
				logger.info("The .gift file is a valid gift file".green);
			} else {
				logger.info("The .gift file contains error".red);
			}
			logger.info("%s", JSON.stringify(analyzer.parsedQuestion, null, 2));

		});
	})

	// creer : créer une question
	.command('creer', 'Créer une question')
	.argument('<type>', 'Type de la question')
	.action(({ args, logger }) => {
		const question = new Question(null, null, args.type, null, null);
		logger.info(`La question de type ${question.type} a été créée avec succès.`.green);
	})

	// equal : compare deux questions et retourne si elles sont identiques ou non
	.command('equal', 'Compare deux questions')
    .argument('<titre1>', 'Titre de la première question')
    .argument('<sentence1>', 'Sentence(s) de la première question', { validator: cli.STRING })
    .argument('<titre2>', 'Titre de la deuxieme question')
    .argument('<sentence2>', 'Sentence(s) de la deuxieme question', { validator: cli.STRING })
    .action(({ args, logger }) => {
        const q1 = new Question(args.titre1, args.sentence1);
        const q2 = new Question(args.titre1, args.sentence2);

        if (q1.equal(q1, q2)) {
            logger.info("Les deux questions sont identiques.".green);
        } else {
            logger.warn("Les deux questions sont différentes.".red);
        }
    })

	// getType : retourne le type d'une question
	.command('getType', 'Retourne le type d\'une question')
	.argument('<titre>', 'Titre de la question')
	.argument('<sentence>', 'Contenu de la question', { validator: cli.STRING })
	.argument('[type]', 'Type de la question')
	.action(({ args, logger }) => {
		if (!args.type) {
			logger.error("Le type de la question est manquant.".red);
			return;
		}	
		const question = new Question(args.title, args.sentence, args.type);
		const questionType = question.getType();
		logger.info(`Le type de la question est : ${questionType}`.green);
	})

	// setTitle : modifier ou ajouter le titre d'une question
	/*
	.command('setTitle', 'Modifier ou ajouter le titre d\'une question')
	.argument('<type>', 'Type de la question')
	.action(({ args, logger }) => {
		const question = new Question(args.type);
		question.setTitle(question, args.newTitle);
		logger.info(`Le titre de la question a été mis à jour avec succès.`.green);
		logger.info(`Nouveau titre : ${question.title}`.yellow);
	})
	*/
	
	// readme
	.command('readme', 'Display the README.txt file')
	.action(({ args, options, logger }) => {
		fs.readFile("./README.txt", 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			logger.info(data);
		});

	})

cli.run(process.argv.slice(2));