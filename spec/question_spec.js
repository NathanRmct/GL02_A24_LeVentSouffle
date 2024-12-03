const question = require('../lib/question');

describe("Program testing of question", function(){
	
	beforeAll(function() {

		this.q = new question("Question test",["Description", "phrase 1", "phrase 2", "Answer 1", "Answer 2"], "type1",["Answer 1", "Answer 2"] , "Answer 2");

	});
	
	it("can create a new question", function(){
		
		expect(this.q).toBeDefined();
		expect(this.q.title).toBe("Question test");
		expect(this.q).toEqual(jasmine.objectContaining({sentence: ["Description", "phrase 1", "phrase 2", "Answer 1", "Answer 2"]}));
		expect(this.q.type).toBe("type1");
		expect(this.q).toEqual(jasmine.objectContaining({answers: ["Answer 1", "Answer 2"]}));
		expect(this.q.correctAnswers).toBe("Answer 2");
	});

	it("can create search in a question", function(){
		search = "Descri";
		expect(this.q.search(search)).toBeTrue();

	});

	it("can say if 2 questions are equal", function(){
		var q2 = new question("Question test",["Description", "phrase 1", "phrase 2", "Answer 1", "Answer 2"], "type1",["Answer 1", "Answer 2"] , "Answer 2");
		expect(this.q.equal(q2)).toBeTrue();
	})
	
	
});