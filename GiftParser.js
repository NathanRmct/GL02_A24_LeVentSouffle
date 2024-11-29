var question = require('./lib/question');
var questionnaire = require('./lib/questionnaire');
var profil = require('./lib/profil');
const { array } = require('vega');

var GiftParser = function(sTokenize, sParsedSymb){
// La liste récupéré des objets questions, récupérer par le parser
	this.parsedQuestion = []; 
	this.showTokenize = sTokenize;
	this.showParsedSymbols = sParsedSymb;
	this.errorCount = 0;
}

// tokenize : tranform the data input into a list
// On pense donc à tokenise par CRLF
// et on enlève les commentaires : les lignes qui commencent par '//', ou par "$"
// Enfin, on enlève les données du tableau qui sont vides
GiftParser.prototype.tokenize = function(data){
	// Pour MacOS
	// var separator = /(\n\n)/; 
	// Pour Windows
	 var separator = /(\r\n)/; 
	data = data.split(separator);
	data = data.filter((val, idx) => !val.match(separator)); 
	data = data.filter((val, idx) => !val.startsWith('//'));
	data = data.filter((val, idx) => !val.startsWith('$'));
	data = data.filter((val, idx) => val !== ''); // Remove de tout les commentaires du fichier
	return data;
}

// parse : analyze data by calling the first non terminal rule of the grammar
GiftParser.prototype.parse = function(data){
	var tData = this.tokenize(data);
	if(this.showTokenize){
		console.log(tData);
	}
	this.questionnaire(tData);
}

// errMsg : Parser operand error message

GiftParser.prototype.errMsg = function(msg, input){
	this.errorCount++;
	console.log("Parsing Error ! on "+input+" -- msg : "+msg);
}

// next : Read and return a symbol from input
GiftParser.prototype.next = function(input){
	var curS = input.shift();
	if(this.showParsedSymbols){
		console.log(curS);
	}
	return curS
}

/* Pas utile (pottentiellement à supprimer)
// accept : verify if the arg s is part of the language symbols.
GiftParser.prototype.accept = function(s){
	var idx = this.symb.indexOf(s);
	// index 0 exists
	if(idx === -1){
		this.errMsg("symbol "+s+" unknown", [" "]);
		return false;
	}

	return idx;
}

// check : check whether the arg elt is on the head of the list
GiftParser.prototype.check = function(s, input){
	if(this.accept(input[0]) == this.accept(s)){
		return true;	
	}
	return false;
}

 */

// expect : expect the next symbol to be s.
GiftParser.prototype.expect = function(s, input){
	if(s == this.next(input)){
		//console.log("Reckognized! "+s)
		return true;
	}else{
		this.errMsg("symbol "+s+" doesn't match", input);
	}
	return false;
}

// Parser rules

// gift-file  =  1*((commentary / question) CRLF)
GiftParser.prototype.questionnaire = function(input){
	this.question(input);
	new questionnaire(this.parsedQuestion);
}

// question = créer une liste de question et les met dans le parsedQuestion en fonction de l'input (qui respecte l'ABNF)
GiftParser.prototype.question = function(input){
	if (!input || input.length === 0 || !input[0]) {
        console.error("Erreur : Input vide ou ligne invalide détectée.");
        return false;
    }

	if(matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)){ // vérfie que l'input commence bien par :: titre :: texte (ou rien)
		var args = this.body(input) // renvoie les différentes valeurs récupérer du parsing
		var p = new question(args.tit, args.sent)
		// il manque les ans (answers) à déduire des sentences et à trier entre bonnes réponses et réponses ainsi que le type de question (à déduire)
		this.parsedQuestion.push(p);
		if(input.length > 0){
			this.question(input);
		}
		return true;
	}else{
		this.errMsg("Erreur au parseur pour créer la question", input);
		return false;
	}
}

// Récupère les différentes variables :
GiftParser.prototype.body = function(input){
	// var typ = this.type(input); //à faire plus tard : trouver le type 
	var tit = this.title(input);
	var sent = this.sentence(input);
	// var cor = this.correctAnswer(sent); // à faire plus tard : récupérer les réponses correctes
	// Idée le faire à partir des sentence ? (les enlever pour ensuite les mettre)
	return { tit: tit, sent: sent}; 
}

// titre = “::”  TEXT  “::”
GiftParser.prototype.title = function(input){
	if(matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)){
	return matched[1];
	}
	else{
		this.errMsg("Invalid title", input);
	}
}


// sent = tout ce qui est après “::”  TEXT  “::”, sur la même ligne et ce jusqu'à la prochaine question / fin du fichier
GiftParser.prototype.sentence = function(input){
	let texte = [];
	if(matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)){
		if(matched[2]){
			texte.push(matched[2]);
			}
		}
		else{
			this.errMsg("Invalid title (for sentence)", input);
		}
	this.next(input);
	if (input.length > 0) {
	while(input.length > 0){
		if(matched = input[0].match(/::\s*(.*?)\s*::\s*(.*)?/)){
		break;
		}
		texte.push(input[0]);
		this.next(input);
	}
	}
	return(texte);
}



module.exports = GiftParser;