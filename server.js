const express = require("express");
const app = express();
const axios = require("axios");
const path = require("path");
const api = require("./api");

app.use(express.json());

app.use("/api", api);
app.use("/dist", express.static(path.join(__dirname, "dist")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

let loggedInUser = {};
const API = "https://hunter-todo-api.herokuapp.com";

app.get("/", (req, res, next) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/authenticate", async (req, res, next) => {
  loggedInUser.username = req.body.username;
  const check = (await axios.get(`${API}/user`)).data.filter(
    user => user.username === req.body.username
  );
  if (req.body.register) {
    try {
      if (check.length === 0) {
        await axios.post(`${API}/user`, { username: req.body.username });
        res.send({ err: 3 });
      } else {
        res.send({ err: 2 });
      }
    } catch (err) {
      // console.log(err);
    }
  } else {
    if (check.length === 0) {
      res.send({ err: 1 });
    } else {
      res.redirect("/gettodos");
    }
  }
});

app.get("/gettodos", async (req, res, next) => {
  try {
    const token = (
      await axios.post(`${API}/auth`, {
        username: loggedInUser.username,
        headers: { "content-type": "application/json" }
      })
    ).data.token;
    const todos = (
      await axios.get(`${API}/todo-item`, { headers: { Authorization: token } })
    ).data;
    res.send(todos);
  } catch (err) {
    res.send("");
    console.log(err);
  }
});

app.post("/deleteitem", async (req, res, next) => {
  try {
    const token = (
      await axios.post(`${API}/auth`, {
        username: loggedInUser.username,
        headers: { "content-type": "application/json" }
      })
    ).data.token;
    await axios.delete(`${API}/todo-item/${Object.values(req.body)[1]}`, {
      headers: { Authorization: token }
    });
    res.sendStatus(202);
  } catch (err) {
    console.log(err);
  }
});

app.post("/newitem", async (req, res, next) => {
  try {
    const token = (
      await axios.post(`${API}/auth`, {
        username: loggedInUser.username,
        headers: { "content-type": "application/json" }
      })
    ).data.token;
    await axios.post(
      `${API}/todo-item`,
      { content: req.body.item },
      { headers: { Authorization: token } }
    );
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
  }
});

app.post("/complete", async (req, res, next) => {
  try {
    const token = (
      await axios.post(`${API}/auth`, {
        username: loggedInUser.username,
        headers: { "content-type": "application/json" }
      })
    ).data.token;
    const bool = (
      await axios.get(`${API}/todo-item/${req.body.id}`, {
        headers: { Authorization: token }
      })
    ).data.completed;
    await axios.put(
      `${API}/todo-item/${req.body.id}`,
      { completed: !bool },
      { headers: { Authorization: token } }
    );
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
  }
});

app.use((req, res, next) => {
  next({
    status: 404,
    message: `Page not found for ${req.method} ${req.url}`
  });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({
    message: err.message || JSON.stringify(err)
  });
});

app.listen(process.env.PORT || 8080); //, process.env.IP);
