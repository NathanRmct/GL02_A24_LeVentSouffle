var question = require('./question');

var VpfParser = function(sTokenize, sParsedSymb){
// The list of question parsed from the input file.
	this.parsedquestion = [];
	this.symb = []; // a remplir
	this.showTokenize = sTokenize;
	this.showParsedSymbols = sParsedSymb;
	this.errorCount = 0;
}

// premier tests à faire : le tokenize
// tokenize : tranform the data input into a list
// <eol> = CRLF
VpfParser.prototype.tokenize = function(data){
	var separator = /(\r\n|: )/; // quels sont les séparateurs ?
	data = data.split(separator);
	data = data.filter((val, idx) => !val.match(separator)); 					
	return data;
}

// parse : analyze data by calling the first non terminal rule of the grammar
VpfParser.prototype.parse = function(data){
	var tData = this.tokenize(data);
	if(this.showTokenize){
		console.log(tData);
	}
	this.listPoi(tData);
}
/* A voir plus tard
// Parser operand

VpfParser.prototype.errMsg = function(msg, input){
	this.errorCount++;
	console.log("Parsing Error ! on "+input+" -- msg : "+msg);
}

// Read and return a symbol from input
VpfParser.prototype.next = function(input){
	var curS = input.shift();
	if(this.showParsedSymbols){
		console.log(curS);
	}
	return curS
}


// accept : verify if the arg s is part of the language symbols.
VpfParser.prototype.accept = function(s){
	var idx = this.symb.indexOf(s);
	// index 0 exists
	if(idx === -1){
		this.errMsg("symbol "+s+" unknown", [" "]);
		return false;
	}

	return idx;
}*/