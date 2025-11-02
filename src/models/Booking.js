const db = require('../db');

async function createBooking(data) {
  const {
    name,
    phone,
    email,
    location,
    exact_location,
    package: pkg,
    extra_notes,
    installation_date,
    status,
  } = data;

  // Optional: Debug print
  // console.log("💡 Booking data received:", {
  //   name, phone, email, location, exactLocation, pkg, extraNotes
  // });

  await db.execute(
    `INSERT INTO bookings (name, phone, email, location, exact_location, package, extra_notes, installation_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name ?? null,
      phone ?? null,
      email ?? null,
      location ?? null,
      exact_location ?? null,
      pkg ?? null,
      extra_notes ?? null,
      installation_date ?? null,
      status ?? null
    ]
  );
}

async function getAllBookings() {
  const [rows] = await db.execute("SELECT * FROM bookings ORDER BY created_at DESC");
  return rows;
}

async function deleteBooking(id) {
  await db.execute(`DELETE FROM bookings WHERE id = ?`, [id]);
}

async function updateBooking(id, data) {
  const {
    name,
    phone,
    email,
    location,
    exact_location,
    package: pkg,
    extra_notes,
    installation_date,
    status
  } = data;

  const formattedDate = installation_date ? new Date(installation_date).toISOString().split('T')[0] : null;

  await db.execute(`
    UPDATE bookings SET
      name = ?, phone = ?, email = ?, location = ?, exact_location = ?,
      package = ?, extra_notes = ?, installation_date = ?, status = ?
    WHERE id = ?
  `, [
    name ?? null,
    phone ?? null,
    email ?? null,
    location ?? null,
    exact_location ?? null,
    pkg ?? null,
    extra_notes ?? null,
    formattedDate,
    status ?? null,
    id
  ]);
}

async function updateBookingStatus(id, status) {
  await db.execute(
    `UPDATE bookings SET status = ? WHERE id = ?`,
    [status, id]
  );
}

module.exports = { createBooking, getAllBookings, deleteBooking, updateBooking, updateBookingStatus };
