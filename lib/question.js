var question = function(title, sentence, type, answers = '', correctAnswers =''){
	this.title = title;
    this.sentence = sentence; // Liste de String
    this.type = type; // Type de la question
    this.answers = answers; // Liste de réponses
	this.correctAnswers = correctAnswers // String
}

question.prototype.setTitle = function(titre){
	this.titre = titre;
}

question.prototype.getTitle = function(){
    return this.title;
}

question.prototype.setSentence = function(sentence){
    this.sentence = sentence;
}

question.prototype.getSentence = function(){
    return this.sentence;
}

question.prototype.setAnswer = function(answer){
    this.answer = answer;
}

question.prototype.getAnswer = function(){
    return this.answers
}

question.prototype.setCorrectAnswers = function(answers){
    this.correctAnswers = answers;
}

question.prototype.getCorrectAnswers = function(){
    return this.correctAnswers;
    // à implémenter 
}
/*
question.prototype.averageRatings = function(){
	var total = this.ratings.reduce((acc, elt) => acc + parseInt(elt), 0);
	return total / this.ratings.length;

};
*/

// compare deux question pour voir si elles sont identiques
question.prototype.equal = function(question1, question2) {
    return (
        question1.title === question2.title &&
        JSON.stringify(question1.sentence) === JSON.stringify(question2.sentence) &&
        question1.type === question2.type &&
        question1.answers === question2.answers &&
        question1.correctAnswers === question2.correctAnswers
    );
};

// Retourne le type de la question
question.prototype.getType = function() {
	return this.type;
}



module.exports = question;