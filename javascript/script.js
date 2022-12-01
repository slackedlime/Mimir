import * as wiki from "./wikipedia.js";

const websiteName = document.location.origin;

const search = document.getElementById("search");
const autoComplete = document.getElementById("auto-complete");

const summaryTitle = document.getElementById("title");
const summaryParagraph = document.getElementById("summary");
const thumbnail = document.getElementById("thumbnail");
const thumbnailExplaination = document.getElementById("thumbnail-explaination");

function loadPage(event) {
	let pageName = event.target.textContent;
	autoComplete.style.display = "none";

	thumbnailExplaination.textContent = "Fetching Image";
	thumbnail.src = "images/loading.gif";

	summaryTitle.textContent = pageName;

	wiki.getSummary(pageName).then(summary => {
		summaryParagraph.innerHTML = summary.replaceAll("\n", "<br><br>");
	});

	wiki.getThumbnail(pageName).then(details => {
		thumbnail.src = details[0];
		thumbnailExplaination.innerHTML = details[1];
	});
}

async function closeSearch() {
	await new Promise(r => setTimeout(r, 200));

	if (!autoComplete.contains(document.activeElement)) {
		autoComplete.style.display = "none";
	}
}

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
			list.role = "button";
			list.tabIndex = "0"

			list.addEventListener("click", loadPage);
			list.addEventListener("focusout", closeSearch);

			list.appendChild(document.createTextNode(item));
			autoComplete.appendChild(list);
		}
	});
});

search.addEventListener("focusin", () => {
	autoComplete.style.display = "block";
});

search.addEventListener("focusout", closeSearch);

document.onkeydown = (event) => {
	event = event || window.event;
	
	if (event.code == "Escape") {
		autoComplete.style.display = "none";
	}

	if (event.code != "Enter") {
		return;
	}

	if (document.activeElement == search) {
		loadPage({target: autoComplete.firstChild});

	} else if (autoComplete.contains(document.activeElement)) {
		loadPage({target: document.activeElement});
	}

};

document.onkeyup = (event) => {
	event = event || window.event;

	if (event.code == "Slash") {
		search.focus();
	}
}

let params = new URLSearchParams(window.location.search);
let page = params.has("page") ? params.get("page") : "Mimir";

loadPage({target: {textContent: page}});