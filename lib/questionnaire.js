var Questionnaire = function (question = [], name) {
    this.questions = question;
    this.name = name;
};

Questionnaire.prototype.intersection = function (otherQuestionnaire) {
    //Axiomes
    if (otherQuestionnaire.size() === 0) return new Questionnaire(this.test);
    if (this.size() === 0) return new Questionnaire(this.test);

    //Fonction de base
    let questionnaireIntersection = new Questionnaire(this.test);

    for (let question of this.questions) {
        if (otherQuestionnaire.questions.some(q => q.equal(question))) {
            questionnaireIntersection.add(question);
        }
    }

    return questionnaireIntersection;
};


Questionnaire.prototype.union = function (otherQuestionnaire) {
    //Axiomes
    if (this.size() === 0) return otherQuestionnaire;
    if (otherQuestionnaire.size() === 0) return this;

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

Questionnaire.prototype.size = function () {
    return this.questions.length; //prend déjà en compte les axiomes
}

Questionnaire.prototype.contains = function (question) {
    return this.questions.some(q => q.equal(question)) //prend déjà en compte les axiomes
}

// Enlève tout les doublons de la liste de question et la renvoie (en plus de la mettre comme nouvelle valeur)
Questionnaire.prototype.doublon = function () {
    var uniqueQuestions = [];
    for (let i = 0; i < this.questions.length; i++) {
        let isDuplicate = false;
        // vérifie par rapport à la banque de donnée unique
        for (let unique of uniqueQuestions) {
            // Vérifie si une question est égale à une autre
            if (this.questions[i].equal(unique)) {
                isDuplicate = true;
                console.log(this.questions[i].title, "est un doublon");
                break; // Doublon trouvé
            }
        }

        if (!isDuplicate) {
            uniqueQuestions.push(this.questions[i]);
        }

    }
    this.questions = uniqueQuestions;
    return this.questions;// Nouvel liste sans doublon
}

module.exports = Questionnaire;
