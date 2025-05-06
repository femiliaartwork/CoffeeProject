import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "coffee",
  password: "root",
  port: 5432,
});

db.connect()
.then(() => console.log("Connected to the database"))
.catch((err) => console.error("Failed to connect:", err));;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// const hotDrinks = await axios.get("https://api.sampleapis.com/coffee/hot");
// const coldDrinks = await axios.get("https://api.sampleapis.com/coffee/iced");

// const insertDrink = async (drink, temperature) => {
//   await db.query(
//     `INSERT INTO drinks (id, title, description, ingredients, image, price, total_sales, temperature)
//      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//      ON CONFLICT (id, temperature) DO NOTHING`,
//     [
//       drink.id,
//       drink.title,
//       drink.description,
//       drink.ingredients,
//       drink.image,
//       drink.price,
//       drink.totalSales,
//       temperature
//     ]
//   );
// };

// for (const drink of hotDrinks.data) {
//   await insertDrink(drink, "hot");
// }
// for (const drink of coldDrinks.data) {
//   await insertDrink(drink, "cold");
// }

app.get("/", async (req, res) => {

  try {
    const result = await db.query("SELECT * FROM drinks ORDER BY id ASC");
    // console.log(result.rows);

    res.render("index.ejs", { drinks: result.rows });
    // console.log("Rendering successful");
  } catch (err) {

    console.error("Error rendering page:", err);
    res.status(500).send("Error loading drinks.");
  }
  
});

// get all drinks
app.get("/drinks", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM drinks");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get drink via id
app.get("/drinks/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM drinks WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Drink not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new drink
app.post("/drinks", async (req, res) => {
  const { title, description, ingredients, image, price, total_sales, temperature } = req.body;
  try {
    const ingredientArray = ingredients.split(",").map(i => i.trim());
    await db.query(
      `INSERT INTO drinks (title, description, ingredients, image, price, total_sales, temperature)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [title, description, ingredientArray, image, price, total_sales, temperature]
    );
    // res.status(201).json({ message: "Drink added successfully" });
    return res.redirect("/");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Display edit details page on selected coffee id
app.get("/drinks/:id/edit", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM drinks WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).send("Drink not found");
    }

    const drink = result.rows[0];
    res.render("edit.ejs", { drink });
  } catch (err) {
    console.error("Error fetching drink:", err);
    res.status(500).send("Server error");
  }
});

// Update drinks detail based on the edited fields
app.post("/drinks/:id/update", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    ingredients,
    image,
    price,
    totalSales,
    temperature,
  } = req.body;

  try {
    await db.query(
      `UPDATE drinks 
       SET title = $1, description = $2, ingredients = $3, image = $4, price = $5, total_sales = $6, temperature = $7
       WHERE id = $8`,
      [
        title,
        description,
        ingredients.split(",").map(i => i.trim()),
        image,
        parseFloat(price),
        parseInt(totalSales),
        temperature,
        id,
      ]
    );

    res.redirect("/");
  } catch (err) {
    console.error("Error updating drink:", err);
    res.status(500).send("Error updating drink.");
  }
});


// Delete coffee based on the selected id
app.post("/delete-drink/:id", async (req, res) => {
  try {
    const result = await db.query("DELETE FROM drinks WHERE id = $1 RETURNING*", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Drink not found" });
    }
    // res.json({ message: "Drink deleted", deleted: result.rows[0] });
    return res.redirect('/');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
