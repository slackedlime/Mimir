import * as wiki from "./wikipedia.js";

const search = document.getElementById("search");
const autoComplete = document.getElementById("auto-complete")

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
			list.appendChild(document.createTextNode(item));
			autoComplete.appendChild(list);
		}
	});
});

search.addEventListener("focusin", () =>{
	autoComplete.style.display = "block";
});

search.addEventListener("focusout", () =>{
	autoComplete.style.display = "none";
});