const Question = require('question'); 

var Questionnaire = function(test) {
    this.test = test;
    this.questions = []; 
};

Questionnaire.prototype.add = function(question) {
    this.questions.push(question);
};


Questionnaire.prototype.equal = function() {
    // <3
};

Questionnaire.prototype.union = function(otherQuestionnaire) {
    let nouveauQuestionnaire = new Questionnaire(this.test);
    nouveauQuestionnaire.questions = [...this.questions];
    for (let question of otherQuestionnaire.questions) {
        if (!nouveauQuestionnaire.questions.some(q => q.equal(question))) {
            nouveauQuestionnaire.questions.push(question);
        }
    }
    return nouveauQuestionnaire;
};

module.exports = Questionnaire;
