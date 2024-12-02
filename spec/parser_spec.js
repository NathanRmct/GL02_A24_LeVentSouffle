const question = require('../lib/question');

describe("Program Syntactic testing of VpfParser", function(){
	
	beforeAll(function() {
		const question = require('../lib/question');

		const GiftParser = require('../GiftParser');
		this.analyzer = new GiftParser();
		
		this.q = new question("Question test",["Description", "phrase 1", "phrase 2", "Answer 1", "Answer 2"], "type1",["Answer 1", "Answer 2"] , "Answer 2");

	});
	
	it("can read a title from a simulated input", function(){
		
		let input = [":: Titre de Test :: Texte qui suit"];
		expect(this.analyzer.title(input)).toBe("Titre de Test");
		
	});

	it ("can tokenize correctly a text and create a question from its own description", function(){
		let input = ":: Titre de Test :: Texte qui suit \r\n Phrase 1 \r\n //texte  \r\n Phrase 2";
		let data = this.analyzer.tokenize(input);
		expect(this.analyzer.question(data)).toBeTrue();
	});
	
	
});