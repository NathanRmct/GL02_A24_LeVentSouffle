const fs = require('fs');
const colors = require('colors');
const VpfParser = require('./GiftParser.js');
const vg = require('vega');
const vegalite = require('vega-lite');
const cli = require("@caporal/core").default;

cli
    .version('vpf-parser-cli')
    .version('0.01')

    .command('test', 'test si la relation de base fonctionne')
    .action(({logger}) => {
    logger.info ("ça fonctionne")
    
    })

cli.run(process.argv.slice(2));