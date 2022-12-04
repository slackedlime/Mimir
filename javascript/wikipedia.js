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

	 // Remove any lists
	let searchItems = json[1].filter(item => !item.includes("List of"));

	return searchItems; // A List of all articles
}

async function getSummaryFromType(pageName, type = "en") {
	let summaryURL = `https://${type}.wikipedia.org/w/api.php?` +
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

	return summary;
}

async function getReferPages(pageName) {
	let referURL = `https://en.wikipedia.org/w/api.php?` +
		new URLSearchParams({
			format: "json",
			origin: "*",
			action: "parse",
			redirects: "1",
			page: pageName,
		});
	
	let json = await fetch(referURL).then(req => req.json());
	
	let referPages = `<h2>${pageName} can refer to:</h2>`;
	
	for (let link of json["parse"]["links"]) {
		if (link["ns"] != 0) { continue; } // continue if link is not an article

		let linkName = link["*"];
		referPages += `<li><a href=".?page=${linkName}">${linkName}</a></li>`;
	}

	return referPages;
}

export async function getSummary(pageName) {
	let summaries = await Promise.all([
		getSummaryFromType(pageName, "simple"),
		getSummaryFromType(pageName, "en"),
	]);

	let [simpleSummary, normalSummary] = summaries;

	if (normalSummary.split("\n")[0].substr(-9) == "refer to:") {
		return getReferPages(pageName);
	}

	let summary = simpleSummary ? simpleSummary : normalSummary;
	let summaryType = simpleSummary ? "simple" : "normal";

	if (summaryType == "normal") {
		summary = summary.split("\n")[0]; // Get only the first paragraph
	}

	summary = summary.replace(" (listen)", "").replace(" ()", "");
	summary = summary.replace("(pronunciation )", "");
	summary = summary.replace("(; ", "(").replace(/\)(?=.)/, ") ");
	
	if (summary[summary.length - 1] == ":") {
		summary = summary.replace(/ [\w\s:]+$/, "");
	}

	// Add Line break if a "." follows a capital letter without space
	summary = summary.replaceAll(/\.(?=[A-Z][a-z ])/g, ".<br><br>");

	return summary;
}

export async function getThumbnail(pageName, type = "en") {
	let thumbnailURL = `https://${type}.wikipedia.org/w/api.php?` +
		new URLSearchParams({
			format: "json",
			origin: "*",
			action: "parse",
			section: "0",
			redirects: "1",
			page: pageName,
		});
	
	let json = await fetch(thumbnailURL).then(req => req.json());

	if (!json["parse"]) {
		return null;
	}

	let thumbnail = "images/default.jpg";
	let caption = json["parse"]["title"];

	let contents = json["parse"]["text"]["*"];
	
	let thumbnails = contents.match(/(?<=(infobox|thumbinner).*srcset=").*?(?= )/s);
	let thumbnailLowRes = contents.match(/(?<=(infobox|thumbinner).*src=").*?(?=")/s);
	
	if (!thumbnails || thumbnailLowRes["index"] - thumbnails["index"] < 1000) {
		// Lower resolution
		thumbnails = thumbnailLowRes;
	}

	if (thumbnails && thumbnails[0].slice(0, 4) != "http") {
		thumbnail = "https:" + thumbnails[0];
	} else {
		caption = "";

		if (type == "en") {
			let simpleThumbnail = await getThumbnail(pageName, "simple");

			if (simpleThumbnail) {
				return simpleThumbnail;
			}
		}
	}

	let captions = contents.match(
		/(?<=(infobox-caption"(|.*)>|(thumbcaption).*div>)).*?(?=<\/div>)/s
	);

	if (captions && captions["index"] - thumbnails["index"] < 1000) {
		caption = captions[0];

		let matches = caption.match(/<.*?>|&#91;.&#93;/g);

		if (matches) { // Remove HTML tags if any
			matches.map(match => caption = caption.replace(match, ""));
		}
	}

	return [thumbnail, caption];
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
