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
	.argument('<file>', 'The file to check with Gift parser')
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

	// search : vérifie si le document est compatible et affiche les données parsed (voir tokenisef si besoin)
	.command('search', 'Check question that contains a particular string')
	.argument('<file>', 'The file to check with Gift parser')
	.argument('<string>', 'The text to look for in the different questions')
	.action(({ args, options, logger }) => {

		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			var analyzer = new GiftParser(options.showTokenize, options.showSymbols);
			analyzer.parse(data);
			var filtered = analyzer.parsedQuestion.filter(q => q.search(args.string));
			logger.info("%s", JSON.stringify(filtered, null, 2));

		});
	})

	// ajouterQuestion : permet de vusialiser les question, d'en sélectionner une ou plusieurs et de les ajouter à la liste des questions de l'examen en préparation
	.command('ajouterQuestion', 'Ajoute une question à un examen à préparer')
	.argument('<file>', 'The file to check with Gift parser')
	.argument('<string>', 'The text to look for in the different questions')
	.action(({ args, options, logger }) => {

		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			var analyzer = new GiftParser(options.showTokenize, options.showSymbols);
			analyzer.parse(data);
			var filtered = analyzer.parsedQuestion.filter(q => q.search(args.string));
			logger.info("%s", JSON.stringify(filtered, null, 2));

		});
	})


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