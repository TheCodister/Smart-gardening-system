const mqtt = require("mqtt");
const express = require("express");
const cors = require("cors");

const client = mqtt.connect("mqtt://test.mosquitto.org", {
  // username: 'DADN',
  // password: '12345',
  // port: 1883,
});

const app = express();
const PORT = process.env.PORT || 3005;
app.use(cors());

const appData = {
  temperature: 0,
  airHumidity: 0,
  soilHumidity: 0,
  light: 0,
};

client.on("connect", () => {
  console.log("Connected to MQTT broker.");
  for (const topic of Object.keys(appData)) {
    client.subscribe(topic, (err) => {
      if (!err) {
        console.log(`Subscribed to topic: ${topic}`);
      } else {
        console.error("Error subscribing to topic:", err);
      }
    });
  }
});

client.on("message", (topic, message) => {
  const value = parseFloat(message.toString());
  console.log(`Received message on ${topic}: ${value}`);
  appData[topic] = value;
});

client.on("error", (err) => {
  console.error("Error:", err);
});

client.on("close", () => {
  console.log("Disconnected from MQTT broker.");
});

app.get("/data", (req, res) => {
  res.send(appData);
});

app.post("/control/pump", (req, res) => {
  const { state } = req.body;
  client.publish("control/pump", state);
  res.send({ success: true });
});

app.listen(PORT, () => {
  console.log("Server started on port 3005");
});
