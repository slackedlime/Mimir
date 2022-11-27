import * as wiki from "./wikipedia.js";

const search = document.getElementById("search");
const autoComplete = document.getElementById("auto-complete");

const summaryTitle = document.getElementById("title");
const summaryParagraph = document.getElementById("summary");
const thumbnail = document.getElementById("thumbnail");
const thumbnailExplaination = document.getElementById("thumbnail-explaination");

search.addEventListener("input", () => {
	if (!search.value) {
		autoComplete.style.display = "none";
		return;
	} else {
		autoComplete.style.display = "block";
	}

	wiki.getSearchItems(search.value).then(items => {
		autoComplete.textContent = "";
		
		if (!items.length) {
			autoComplete.appendChild(document.createTextNode("No Results Found"));
			return;
		}

		for (let item of items) {
			let list = document.createElement("li");
			list.className = "search-items";
			list.addEventListener("click", loadPage)
			list.appendChild(document.createTextNode(item));
			autoComplete.appendChild(list);
		}
	});
});

document.onkeydown = function(event) {
    event = event || window.event;
    if (event.code == "Escape") {
        autoComplete.style.display = "none";
    }
};

function loadPage(event) {
	let pageName = event.target.textContent;
	autoComplete.style.display = "none";

	thumbnailExplaination.textContent = "Fetching Image";
	thumbnail.src = "";

	summaryTitle.textContent = pageName;

	wiki.getSummary(pageName).then(summary => {
		summaryParagraph.innerHTML = summary.replaceAll("\n", "<br><br>");
	});

	wiki.getThumbnail(pageName).then(wiki.getImageDetails).then(details => {
		thumbnailExplaination.textContent = details[0];
		thumbnail.src = details[1];
	});
}

search.addEventListener("focusin", () => {
	autoComplete.style.display = "block";
});

search.addEventListener("focusout", async () =>{
	await new Promise(r => setTimeout(r, 200));
	autoComplete.style.display = "none";
});

loadPage({target: {textContent: "Mimir"}})