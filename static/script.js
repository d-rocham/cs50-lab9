//TODO: After adding an entry, its "edit row" button doesn't work because the eventListener isn't added. Reload required. Fix this
//TODO: Sort Table doesn't work with tildes
//TODO: Toggle icons don't toggle when clicked to reflect current status.

/* VARIABLES AND CONSTANTS */
let toggleIcons = document.querySelectorAll(".fa-sort");

const mainCheckboxSelector = document.getElementById("selector--selectAll");
let checkboxes = document.querySelectorAll(".row__selector");

const forms = document.querySelectorAll("form");

let editButtons = document.querySelectorAll(".table__button--edit");
const editionModal = document.querySelector(".modal");
const modalForm = document.querySelector("#entry__edition");
const modalCloseButton = document.querySelector(".modal__closeButton");

/* SORT TABLE */

function sortTable(table, icons, colIndex, asc = true) {
    /*  1)
        2) Creates array of sorted rows
        3) Removes un-sorted HTML row elements.
        4) Adds array of sorted rows
        5) Edits header classes to remember current sort status
    */
    const dirModifier = asc ? 1 : -1; // if asc true, dirModifier = 1, else -1
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.querySelectorAll("tr")); // Array.from guarantees an array of tr's instead of nodelist

    //Sorting rows
    const sortedRows = rows.sort((a, b) => {
        const aColText = a.querySelector(`td:nth-child(${colIndex + 1})`).textContent.trim();
        const bColText = b.querySelector(`td:nth-child(${colIndex + 1})`).textContent.trim();
        
        const dateRe = /\d{1,2}\/\d{1,2}/;
        const idRe = /^[0-9]+$/;

        let compareAndReturn = function(a, b) {
            return a > b ? (1 * dirModifier) : (-1 * dirModifier);
        };

        if (dateRe.test(aColText) && dateRe.test(bColText)) { //if date
            
            return compareAndReturn(new Date(aColText) - new Date(bColText), -1);
        }

        else if (idRe.test(aColText) && idRe.test(bColText)) { //if ID
            return compareAndReturn(Number(aColText), Number(bColText));
        }

        else { // if name
            return compareAndReturn(aColText.toLowerCase(), bColText.toLowerCase());
        }
    });

    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }

    tbody.append(...sortedRows); //spread operator expands the sortedRows array into a list

    //After adding sorted rows, remove previous sort-status classses
    console.log(icons);
    icons.forEach(icon => icon.classList.remove("th-sort-as", "th-sort-desc"));
    
    //Target the column that has been worked on and toggle the right class accordingly
        //-> Targets table headers instead of icons, which are the ones who hold the sort order status
    icons[colIndex].classList.toggle("th-sort-asc", asc);
    icons[colIndex].classList.toggle("th-sort-desc", !asc);
}

toggleIcons.forEach(icon => {//Not working yet
    icon.addEventListener("click", ()=> {
        const table = icon.parentElement.parentElement.parentElement.parentElement;
        const columnIndex = Array.prototype.indexOf.call(icon.parentElement.parentElement.children, icon.parentElement);
        const currentIsAscending = icon.classList.contains("th-sort-asc");

        sortTable(table, toggleIcons, columnIndex, !currentIsAscending)
    })
})

/*SELECT ALL CHECKBOXES*/

mainCheckboxSelector.addEventListener("change", () => {
    checkboxes.forEach(checkbox => {
        mainCheckboxSelector.checked ? checkbox.checked = true : checkbox.checked = false;
    });
})

/* LISTEN TO FORM SUBMIT */

forms.forEach(form => form.addEventListener("submit", (event) => {
    event.preventDefault();
    const submittedForm = new FormData(event.currentTarget);
    switch(event.currentTarget.id) {
        case "entry__creation":
            entryCreationHandler(submittedForm);
            break;
        case "row__deletion":
            entryDeletionHandler(submittedForm);
            break;
        case "entry__edition":
            entryEditionHandler(submittedForm);
            break;
    }
}));

/* FETCH HELPER FUNCTION */

async function fetchData (incomingMethod, data) {
    return await fetch("/", {
        method: incomingMethod,
        body: data,
    })
}

/* ENTRY DELETION */
async function entryDeletionHandler (deletionForm) {
    if (Array.from(deletionForm.getAll("ID")).length == 0) {
        return(alert("Please select at least one row to delete an entry"));
    }

    let response = await fetchData("DELETE", deletionForm);
    
    if (response.ok) {
        let removeRows = function (targets) {
            let rows = Array.from(targets).map(x => x.parentElement.parentElement);
            for (let row of rows) {
                row.remove();
            };
        }(document.querySelectorAll(".row__selector:checked"));
    }
    
    else { //failure case is not working.
        alert("Deletion falied");
    }
    mainCheckboxSelector.checked = false;
}

/* ENTRY CREATION */
async function entryCreationHandler(newEntryForm) {
    let response = await fetchData("POST", newEntryForm);

    if (response.ok) {
        let entryData = await response.json();
        console.log(entryData);

        let addRow = function() {
            let newRow = document.querySelector("tbody").insertRow();
            newRow.id = `row--${entryData.id}`;

            //Manually populated array since incoming JSON order must be altered 
            const entryButton = `<button class="table__button--edit" id="editButton--${entryData.id}"> Edit entry </button>`; // Not comfortable with this
            const entryCheckbox = `<input type="checkbox" form="row__deletion" name="ID" value="${entryData.id}" class="row__selector">`; //Not comfortable with this either
            let rowValues = [entryData.id, entryData.name, `${entryData.month}/${entryData.day}`, entryButton, entryCheckbox];
            
            let i = 0;
            while (i < newRow.previousElementSibling.cells.length) {
                newRow.insertCell();
                i++;
            }

            populateRows(newRow, rowValues);
            //editButtons.push(newRow.querySelector(".table__button--edit"));
        }();
    }
}

function populateRows (row, entryData) {//TODO: this might be useless 
    for (let i = 0; i < entryData.length; i++) {// To use this function for PUT requests, revisit this loop.
        row.cells[i].innerHTML = entryData[i];
    }
}

/* ENTRY EDITION */
editButtons.forEach(button => button.addEventListener("click", (event) => {
    editionModal.classList.toggle("modal--show");
    
    let hiddenInput = document.createElement("input");
    let hiddenInputAttributes = {
        "type": "hidden",
        "name": "ID",
        "value": `${event.target.id.match(/[0-9]+$/)[0]}`,
        "id": "modal__form--ID"
    };

    for (let key in hiddenInputAttributes) {
        hiddenInput.setAttribute(key, hiddenInputAttributes[key]);
    }

    modalForm.appendChild(hiddenInput);
}));

modalCloseButton.addEventListener("click", () => {
    closeModal();
});

function closeModal () {
    editionModal.classList.toggle("modal--show");
    let hidden = document.querySelector("#modal__form--ID");
    modalForm.removeChild(hidden);
}

async function entryEditionHandler(newData) {
    
    //check integrity of user data.
    if (newData.get("name") == "" && newData.get("date") == ""){
        alert("Please edit at least one field");
    }

    //TODO:turn this into a function, replace each fetch() in every method to said function
    let response = await fetchData("PUT", newData);

    //populate rows with object.
    if (response.ok) {
        let updatedInfo = await response.json();
        console.log(updatedInfo);

        let cellData = []
        cellData.push(updatedInfo.name);
        cellData.push(`${updatedInfo.month}/${updatedInfo.day}`);

        let row = document.querySelector(`#row--${updatedInfo.id}`);

        for (let i = 1; i <= cellData.length; i++) { //TODO: populateRows() is redundant and useless
            row.cells[i].innerHTML = cellData[i - 1];
        }
    }
    closeModal();
}