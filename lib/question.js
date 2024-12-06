var question = function(title, sentence, type, answers = '', correctAnswers ='', commentaire = ''){
	this.title = title;
    this.sentence = sentence; // Liste de String
    this.type = type; // Type de la question
    this.answers = answers; // Liste de réponses
	this.correctAnswers = correctAnswers // String
    this.commentaire = commentaire;
}

// Modification des axiomes du CDC pour que ce soit plus simple
question.prototype.setTitle = function(titre){
    try{
        this.titre = titre;
        return this;
    } catch(e){
        console.log("Erreur dans le changement de titre : " + e);
    }
}

question.prototype.getTitle = function(){
    return this.title || "titre non défini";
}

// Modification des axiomes du CDC pour que ce soit plus simple
question.prototype.setSentence = function(sentence){
    try{
        this.sentence = sentence;
        return this;
    } catch(e){
        console.log("Erreur dans la modification de la question : " + e);
    }
}

question.prototype.getSentence = function(){
    return this.sentence || "question non définie";
}

question.prototype.setAnswer = function(answer){
    this.answer = answer;
}

// Fonction qui récupère les réponses d'une question
// @return -> tableau avec les réponses 
question.prototype.getAnswers = function(){
    try{
        if(length(this.answers) == 0){
            console.log("La question ne possède pas de réponse");
        } else {
            return this.answers
        }
    } catch(e){
        console.log("Erreur dans la récupération des réponses : " + e);
    }
}

// Fonction qui ajoute une réponse à une question
// @param : answers -> tableau
question.prototype.addAnswers = function(answers) {
    try{
        if (!Array.isArray(this.answers)) {
            this.answers = [];
        }
        for (const answer of answers) {
            if (!this.answers.includes(answer)) {
                this.answers.push(answer);
            }
        }
        return this;
    } catch(e){
        console.log("Erreur dans l'ajout de réponses : " + e);
    }
    
};

// Fonction pour modifier les bonnes réponses
// @params : correctAnswers -> tableau
question.prototype.setCorrectAnswers = function(correctAnswers){
    try{
        if (!Array.isArray(this.correctAnswers)){
            this.correctAnswers = [];
        } for (const answer of correctAnswers){
            if(!this.correctAnswers.includes(answer)){
                this.correctAnswers.push(answer);
            }
        }
        return this;
    } catch(e){
        console.log("Erreur dans la modification des bonnes réponses : " + e);
    }
}

// Retourne les bonnes réponses d'une question
question.prototype.getCorrectAnswers = function(){
    try{
        if(!Array.isArray(this.correctAnswers)){
            return("Il n'y a pas de bonnes réponses dans cette question");
        } else {
            return(this.correctAnswers);
        }
    } catch(e){
        console.log("Erreur dans la récupération des bonnes réponses : " + e);
    }
}

/*
question.prototype.averageRatings = function(){
	var total = this.ratings.reduce((acc, elt) => acc + parseInt(elt), 0);
	return total / this.ratings.length;

};
*/

// compare deux question pour voir si elles sont identiques
question.prototype.equal = function(question) {
    return (
        JSON.stringify(this) === JSON.stringify(question)
    );
};

// Retourne le type de la question
question.prototype.getType = function() {
    return this.type || "Type non défini";
};

// Cherche dans les différentes données de la question si la chaîne de caractère y appartient
question.prototype.search = function(input) {
    if( this.title.includes(input)){
        console.log("Trouvé dans le titre de la question: ", this.title);
        return (true);}
    else if(this.sentence.includes(input)){
        console.log("Trouvé dans le texte de la question: ", this.title);
        return (true);
    }
    else{
        // console.log("pas trouvé dans :", this.title);
        return (false);}
}



module.exports = question;