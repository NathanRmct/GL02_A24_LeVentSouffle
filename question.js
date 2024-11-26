var question = function(type, title, sentence, answers, correctAnswers){
	this.type = type; 
	this.title = title;	
	this.sentence = sentence; // String
	this.answers = answers; // Liste de String
	this.correctAnswers = correctAnswers // String

	// ATTENTION : Que faire si c'est une question à rédiger, sans correctAnswers attendues ?
}
	
/*
question.prototype.averageRatings = function(){
	var total = this.ratings.reduce((acc, elt) => acc + parseInt(elt), 0);
	return total / this.ratings.length;

};
*/
question.prototype.equal=function(){
    //<3
}

var test = "ceci est un test";

module.exports = question;