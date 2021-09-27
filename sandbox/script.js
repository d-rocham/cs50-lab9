class BirthdayTable {
    constructor(table) {
        this.table = table;
    }

    test() {
        console.log(this.rows);
    }
}

let MyTable = new BirthdayTable(document.querySelector("tbody"));
MyTable.test();
