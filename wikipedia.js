// https://en.wikipedia.org/w/api.php
// ?origin=*&action=opensearch&search= // Search
// ?format=json&action=query&prop=pageimages&redirects=1&titles= // Get thumbnail
// ?format=json&action=parse&prop=images&page= // Get all images
// ?action=query&prop=imageinfo&iiprop=url&titles=File: // Get image url

// https://simple.wikipedia.org/w/api.php
// ?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles= // Summary

// https://commons.wikimedia.org/w/api.php
// ?format=json&action=parse&section=1&prop=wikitext&page=File: // Get image info

async function getSearchItems(query) {
	let searchURL = "https://en.wikipedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			origin: "*",
			action: "opensearch",
			search: query,
		});

	let json = await fetch(searchURL).then(req => req.json());

	return json[1] // List of articles
}

async function getSummary(pageName) {
	let summaryURL = "https://en.wikipedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			action: "query",
			prop: "extracts",
			exintro: "",
			explaintext: "",
			redirects: "1",
			titles: pageName,
		});

	console.log(summaryURL)

	let json = await fetch(summaryURL).then(req => req.json());

	let pages = json["query"]["pages"];
	let summary = pages[Object.keys(pages)[0]]["extract"]

	return summary.split("\n")[0].replace(" (listen)", "")
}

async function getThumbnail(pageName) {
	let thumbnailURL = "https://en.wikipedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			action: "query",
			prop: "pageimages",
			redirects: "1",
			titles: pageName,
		});
	
	let json = await fetch(thumbnailURL).then(req => req.json());

	let pages = json["query"]["pages"];
	return pages[Object.keys(pages)[0]]["pageimage"];
}

async function getImages(pageName) {
	let thumbnail = await getThumbnail(pageName)

	let imagesURL = "https://en.wikipedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			action: "parse",
			prop: "images",
			page: pageName,
		});
	
	let json = await fetch(imagesURL).then(req => req.json());

	let imageNames = json["parse"]["images"]
		.filter( elem =>
			elem != thumbnail && (elem.slice(-3) == "png" || elem.slice(-3) == "jpg")
		);
	
	imageNames.unshift(thumbnail); // Make the thumbnail the first element
	
	return imageNames;
}

async function getImageDetails(imageName) {
	imageName = "File:" + imageName;

	let getImageURL = "https://en.wikipedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			action: "query",
			prop: "imageinfo",
			iiprop: "url",
			titles: imageName,
		});
	
	let getDetailsURL = "https://commons.wikimedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			action: "parse",
			section: "1",
			prop: "wikitext",
			page: imageName,
		});	
	
	let imageURLJson = await fetch(getImageURL).then(req => req.json());
	let detailsJson = await fetch(getDetailsURL).then(req => req.json());

	let imageURL = imageURLJson["query"]["pages"]["-1"]["imageinfo"][0]["url"];

	let details = detailsJson["parse"]["wikitext"]["*"]
					.match(/(?<={{en\|1=).*?(?=}})/)[0]
					.replaceAll("[[", "")
					.replaceAll("]]", "");

	return [details, imageURL];
}

function getRecommendedPages(pageName) {

}
