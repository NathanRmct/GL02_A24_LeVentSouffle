var question = require('./question');
var questionnaire = require('./questionnaire');
var profil = require('./profil');

var GiftParser = function(sTokenize, sParsedSymb){
// The list of question parsed from the input file.
	this.parsedQuestion = [];
	// this.symb = ["::",""]; 
	this.showTokenize = sTokenize;
	this.showParsedSymbols = sParsedSymb;
	this.errorCount = 0;
}

// tokenize : tranform the data input into a list
// On pense donc à tokenise par CRLF
// et on enlève les commentaires : les lignes qui commencent par '//', ou par "$"
// Enfin, on enlève les données du tableau qui sont vides
GiftParser.prototype.tokenize = function(data){
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
	// A faire : Transformer les données en un questionnaire : ensemble de questions qui seront affichés correctement
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
/* Pas utile pour l'instant.. 
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

// question = ...
GiftParser.prototype.question = function(input){
	if(matched = input[0].match(/::\s*(.*?)\s*::\s*(.+)/)){ // vérfie que l'input commence bien par :: titre :: ...
		var args = this.body(input) // renvoie les différents arguments des différentes valeurs
		var p = new question(args.tit) // , args.ins, args.sent
		this.parsedQuestion.push(p);
		if(input.length > 0){
			this.question(input);
		} 
		/*
		# Exemple avec les POI :
		
		this.expect("START_POI", input);
		var args = this.body(input);
		var p = new POI(args.nm, args.lt, args.lg, []);
		this.note(input, p);
		this.expect("END_POI",input);
		this.parsedPOI.push(p);
		if(input.length > 0){
			this.poi(input);
		} */
		return true;
	}else{
		this.errMsg("Erreur au parseur pour la compréhension des données (titre)", input);
		return false;

	}

}

// Récupère les différentes variables :
GiftParser.prototype.body = function(input){
	// var typ = this.type(input); //à faire plus tard : trouver le type 
	var tit = this.title(input);
	// var ins = this.instruction(input);
	this.next(input);
	// var sent = this.sentence(input);
	// var cor = this.correctAnswer(input); // à faire plus tard : récupérer les réponses correctes
	return { tit: tit}; // ins: ins, sent: sent
}

// titre = “::”  TEXT  “::”
GiftParser.prototype.title = function(input){
	if(matched = input[0].match(/::\s*(.*?)\s*::\s*(.+)/)){
	console.log(matched[1]);
	return matched[1];
	}
	else{
		this.errMsg("Invalid title", input);
	}
}

/*
// ins = tout ce qui est après “::”  TEXT  “::” mais sur la même ligne
GiftParser.prototype.instruction = function(input){
	this.expect("/::\.::/", input)
	
	var curS = this.next(input);
	if(matched = curS.match(/[\wàéèêîù'\s]+/i)){
		return matched[0];
	}else{
		this.errMsg("Invalid name", input);
	}
}

// sent = tout ce qui est après la ligne du titre jusqu'à la prochaine question / fin du fichier
GiftParser.prototype.sentence = function(input){
	this.expect("/::\.::/",input)
	var separator = /"::"/; 
	data = data[0].split(separator)
	if(matched = data.match(/[\wàéèêîù'\s]+/i)){
		return matched[0];
	}else{
		this.errMsg("Invalid name", input);
	}
}
*/
module.exports = GiftParser;