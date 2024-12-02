const Question = require('question'); 

var Questionnaire = function(test) {
    this.test = test;
    this.questions = []; 
};

Questionnaire.prototype.add = function(question) {
    this.questions.push(question);
};


Questionnaire.prototype.intersection = function(otherQuestionnaire) {
    //Axiomes
    if(otherQuestionnaire.size()===0) return new Questionnaire(this.test) ;
    if(this.size()===0) return new Questionnaire(this.test);

    //Fonction de base
    let questionnaireIntersection = new Questionnaire(this.test);

    for (let question of this.questions) {
        if (otherQuestionnaire.questions.some(q => q.equal(question))) {
            questionnaireIntersection.add(question);
        }
    }

    return questionnaireIntersection;
};


Questionnaire.prototype.union = function(otherQuestionnaire) {
    //Axiomes
    if(this.size()===0) return otherQuestionnaire;
    if(otherQuestionnaire.size()===0) return this;

    //Fonction de base 
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
    return this.questions.length; //prend déjà en compte les axiomes
}

Questionnaire.prototype.contains=function(question){
    return this.questions.some(q => q.equal(question)) //prend déjà en compte les axiomes
}

module.exports = Questionnaire;
