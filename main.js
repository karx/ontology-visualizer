let indexedNodes;

async function getSchemaData() {
	let response = await fetch("./schemaorg-current-http.jsonld");
	let schemaData = await response.json();
	updateDOMGotResponse();
	
	console.log(schemaData);
	return schemaData;
}

async function theGo() {
	let schemaData = await getSchemaData();
	console.log(`Got ${schemaData["@graph"].length} total edges`);
	indexedNodes = {};
	indexedNodes = {
		"rdfs:Class": {
			isParentOf: [],
		},
	}; // filling a root node
	schemaData["@graph"].forEach((element) => {
		indexedNodes[element["@id"]] = element;
		indexedNodes[element["@id"]].isParentOf = [];
	});
	let baseClasses = schemaData["@graph"].filter(
		(n) => n["@type"] === "rdfs:Class"
	);
	let propertyClasses = schemaData["@graph"].filter(
		(n) => n["@type"] === "rdf:Property"
	);

	console.log(`Base Classes: ${baseClasses.length}`);
	console.log(`Properties L: ${propertyClasses.length}`);

	let subClassChain = {};
	schemaData["@graph"].forEach((element) => {
		if (element["rdfs:subClassOf"]) {
			if (Array.isArray(element["rdfs:subClassOf"])) {
				element["rdfs:subClassOf"].forEach((n) => {
					let nameOfParentId = n["@id"];
					let nameOfElement = element["@id"];
					// console.log(` ${nameOfParentId} -> ${nameOfElement}`);
					indexedNodes[nameOfParentId].isParentOf.push(nameOfElement);
				});
			} else {
				let nameOfParentId = element["rdfs:subClassOf"]["@id"];
				let nameOfElement = element["@id"];
				// console.log(` ${nameOfParentId} -> ${nameOfElement}`);

				indexedNodes[nameOfParentId].isParentOf.push(nameOfElement);
			}
		}
	});
	console.log(indexedNodes);


	triggerSearch('movie');

}

document.getElementById("search-bar").addEventListener("input", (e) => {
	let searchText = e.target.value.toLowerCase();
	triggerSearch(searchText);
	
});
theGo();

function triggerSearch(searchText) {
	let matchedNodes = Object.keys(indexedNodes).filter((key) => {
		let n = indexedNodes[key];
		if (!n["rdfs:label"]) {
			console.log(n);
			return false;
		} else if (typeof n["rdfs:label"] === "string") {
			// console.log(n["rdfs:label"]);
			return n["rdfs:label"].toLowerCase().indexOf(searchText) >= 0;
		} else {
			// console.log(n);
			return n["rdfs:label"]["@value"].toLowerCase().indexOf(searchText) >= 0;
		}
	});
	console.log(matchedNodes.length);
	resetLabelDOM(matchedNodes);
}

function addToDOM(node) {
	// console.log(node);
	let labelValue =
		typeof node["rdfs:label"] === "string"
			? node["rdfs:label"]
			: node["rdfs:label"]["@value"];

	let subClass = node["rdfs:subClassOf"];
	let herr = [];
	if (!subClass) {
		console.log(subClass);
	} else if (Array.isArray(subClass)) {
		subClass.forEach((n) => {
			let nameOfParentId = n["@id"];
			let nNode = indexedNodes[nameOfParentId];
			herr.push(nNode);
		});
	} else {
		let nameOfParentId = subClass["@id"];
		let nNode = indexedNodes[nameOfParentId];
		herr.push(nNode);
	}

	let nodeDOM = document.createElement("div");
	nodeDOM.classList = `node ${
		node["@type"] === "rdf:Property" ? "each-prop" : "each-node"
	}`;
	nodeDOM.innerHTML = `<h4>${labelValue}</h4>`;
	herr.forEach((herSub) => {
		nodeDOM.innerHTML += `
			<div class="hierarchy">
				${getLabelOfNode(herSub)} > ${labelValue}
			</div>
			`;
	});
	document.getElementById("top-label").appendChild(nodeDOM);
}

function resetLabelDOM(nodeList) {
	document.getElementById("top-label").innerHTML = "";
	nodeList.forEach((eachKey) => {
		addToDOM(indexedNodes[eachKey]);
	});
}

function getLabelOfNode(node) {
	let labelValue =
		typeof node["rdfs:label"] === "string"
			? node["rdfs:label"]
			: node["rdfs:label"]["@value"];
	return labelValue;
}


function updateDOMGotResponse() {
	document.getElementById('fetchingData').classList.add('haveData');
}