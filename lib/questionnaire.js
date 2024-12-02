const Question = require('question'); 

var Questionnaire = function(test) {
    this.test = test;
    this.questions = []; 
};

Questionnaire.prototype.add = function(question) {
    this.questions.push(question);
};


Questionnaire.prototype.intersection = function(otherQuestionnaire) {
    let questionnaireIntersection = new Questionnaire(this.test);

    for (let question of this.questions) {
        if (otherQuestionnaire.questions.some(q => q.equal(question))) {
            questionnaireIntersection.add(question);
        }
    }
    return intersectionQuestionnaire;
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

Questionnaire.prototype.size=function(){
    return this.questions.length;
}

Questionnaire.prototype.contains=function(question){
    return this.questions.some(q => q.equal(question))
}

module.exports = Questionnaire;
