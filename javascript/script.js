import * as wiki from "./wikipedia.js";

const search = document.getElementById("search");
const autoComplete = document.getElementById("auto-complete")

const summaryParagraph = document.getElementById("summary")

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
			autoComplete.appendChild(document.createTextNode("No Results Found"))
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

	wiki.getSummary(pageName).then(summary => {
		summaryParagraph.innerHTML = summary.replaceAll("\n", "<br><br>");
	})
}

search.addEventListener("focusin", () => {
	autoComplete.style.display = "block";
});

search.addEventListener("focusout", async () =>{
	await new Promise(r => setTimeout(r, 150));
	autoComplete.style.display = "none";
});