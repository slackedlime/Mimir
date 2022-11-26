class Trivia {
	constructor(json) {
		this.question = json["question"];
		this.correctAnswer = json["correctAnswer"];
		this.difficulty = json["difficulty"];
		this.options = json["incorrectAnswers"];

		// Add the correct answer to a random index
		let index = Math.floor(Math.random() * 4);
		this.options.splice(index, 0, this.correctAnswer);
	}
}

async function getTrivia(numOfTrivia = 3) {
	let triviaURL = "https://the-trivia-api.com/api/questions?" +
		new URLSearchParams({
			categories: "science,general_knowledge,history",
			limit: numOfTrivia,
		});

	let json = await fetch(triviaURL).then(req => req.json());

	return json.map(question => new Trivia(question))
}

async function getRandomFact() {
	let factsURL = "https://www.thefact.space/random";

	let json = await fetch(factsURL).then(req => req.json());

	return json["text"];
}
