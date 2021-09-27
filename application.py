import re
import sqlite3
import os
from sqlite3.dbapi2 import Row, connect
from flask import Flask, flash, jsonify, redirect, render_template, request, session


# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
# app.config["TEMPLATES_AUTO_RELOAD"] = True -- What is this for?


def dict_Factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


# Set up database
con = sqlite3.connect("birthdays.db", check_same_thread=False)
con.row_factory = dict_Factory
cur = con.cursor()

"""
def SQL(query):
    dbCursor.execute(query)
    dbCursor.commit()
"""

# main
@app.route("/", methods=["GET", "POST", "DELETE", "PUT"])
def index():
    if request.method == "GET":
        cur.execute("SELECT * FROM birthdays")
        BIRTHDAYS = cur.fetchall()
        return render_template("index.html", birthdays=BIRTHDAYS, order="desc")

    elif request.method == "POST":
        newEntry = request.form
        datestring = newEntry.get("date")

        cur.execute(
            "INSERT INTO birthdays (name, month, day) VALUES (?, ?, ?)",
            (newEntry.get("name"), datestring[5:7], datestring[8:]),
        )
        con.commit()
        cur.execute("SELECT * FROM birthdays WHERE name = ?", [newEntry.get("name")])
        ENTRY = (
            cur.fetchone()
        )  # its returning the previous ID with equally named entries

        return jsonify(ENTRY)

    elif request.method == "PUT":
        updatedData = request.form
        date = updatedData.get("date")
        name = updatedData.get("name")
        id = updatedData.get("ID")

        print(id)
        print(type(id))

        if name:
            cur.execute("UPDATE birthdays SET name = ? WHERE id = ?", (name, id))
        if date:
            cur.execute(
                "UPDATE birthdays SET month = ?, day = ? WHERE id = ?",
                (date[5:7], date[8:], id),
            )

        con.commit()
        cur.execute("SELECT * FROM birthdays WHERE id = ?", [id])
        NEWDATA = cur.fetchone()
        print(NEWDATA)

        return jsonify(NEWDATA)

    elif request.method == "DELETE":
        targets = request.form.getlist("ID")
        for item in targets:
            cur.execute("DELETE FROM birthdays WHERE id = ?", [item])
        con.commit()
        return ("", 204)
