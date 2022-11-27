// https://en.wikipedia.org/w/api.php
// ?origin=*&action=opensearch&search= // Search
// ?format=json&action=query&prop=pageimages&redirects=1&titles= // Get thumbnail
// ?format=json&action=parse&prop=images&page= // Get all images
// ?action=query&prop=imageinfo&iiprop=url&titles=File: // Get image url

// https://simple.wikipedia.org/w/api.php
// ?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles= // Summary

// https://commons.wikimedia.org/w/api.php
// ?format=json&action=parse&section=1&prop=wikitext&page=File: // Get image info

export async function getSearchItems(query) {
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

export async function getSummary(pageName) {
	let summaryURL = "https://en.wikipedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			origin: "*",
			action: "query",
			prop: "extracts",
			exintro: "",
			explaintext: "",
			redirects: "1",
			titles: pageName,
		});

	let json = await fetch(summaryURL).then(req => req.json());

	let pages = json["query"]["pages"];
	let summary = pages[Object.keys(pages)[0]]["extract"];

	summary = summary.split("\n")[0]; // Get only the first paragraph
	summary = summary.replace(" (listen)", "").replace(" ()", "");
	
	let matches = summary.match(/\.[A-Z]/g);
	
	if (matches) {  // Add Line break if a "." follows a capital letter without space
		for (let match of matches) {
			summary = summary.replace(match, match[0] + "\n" + match[1])
		};
	}
	
	return summary;
}

export async function getThumbnail(pageName) {
	let thumbnailURL = "https://en.wikipedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			origin: "*",
			action: "query",
			prop: "pageimages",
			redirects: "1",
			titles: pageName,
		});
	
	let json = await fetch(thumbnailURL).then(req => req.json());

	let pages = json["query"]["pages"];
	let thumbnail = pages[Object.keys(pages)[0]]["pageimage"];

	if (thumbnail) {
		return thumbnail;
	}

	return "default";
}

export async function getImages(pageName) {
	let thumbnail = await getThumbnail(pageName)

	let imagesURL = "https://en.wikipedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			origin: "*",
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

export async function getImageDetails(imageName) {
	if (imageName == "default") {
		return ["Mimir Default Image", "https://i.imgur.com/Bnrke6s.jpg"];
	}

	imageName = "File:" + imageName;

	let getImageURL = "https://en.wikipedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			origin: "*",
			action: "query",
			prop: "imageinfo",
			iiprop: "url",
			titles: imageName,
		});
	
	let getDetailsURL = "https://commons.wikimedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			origin: "*",
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

export async function getRecommendedPages(pageName) {
	let sectionsURL = "https://en.wikipedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			origin: "*",
			action: "parse",
			prop: "sections",
			page: pageName,
		});
	
	let sections = await fetch(sectionsURL).then(req => req.json());
	
	let sectionIndex;

	for (let section of sections["parse"]["sections"]) {
		if (section["line"] == "See also") {
			sectionIndex = section["index"];
		}
	}

	if (!sectionIndex) { return [] }

	let seeAlsoURL = "https://en.wikipedia.org/w/api.php?" +
		new URLSearchParams({
			format: "json",
			origin: "*",
			action: "parse",
			prop: "links",
			section: sectionIndex,
			page: pageName,
		});
	
	let seeAlsoJson = await fetch(seeAlsoURL).then(req => req.json());

	let seeAlso = seeAlsoJson["parse"]["links"]
					.filter(json => json["ns"] == 0)
					.map(json => json["*"]);
	
	return seeAlso;
}
