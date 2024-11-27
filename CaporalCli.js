const fs = require('fs');
const colors = require('colors');
const GiftParser = require('./GiftParser.js');
const vg = require('vega');
const vegalite = require('vega-lite');
const cli = require("@caporal/core").default;

cli
    .version('vpf-parser-cli')
    .version('0.01')

    // test : vérifie si l'interface répond à une demande de base
    .command('test', 'test si la relation de base fonctionne')
    .action(({logger}) => {
    logger.info ("ça fonctionne")
    
    })

	// checkGift : vérifie si le document est compatible et affiche les données juste tokenize
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

			logger.debug(analyzer.parsedPOI);

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