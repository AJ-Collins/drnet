const db = require('../db');

async function saveContact(name, email, message) {
  await db.execute(
    "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)",
    [name, email, message]
  );
}

module.exports = { saveContact };
