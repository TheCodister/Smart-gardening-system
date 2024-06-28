"use client";
import { useState, useEffect, useRef } from "react";
import mqtt from "mqtt";

export default function Home() {
  const [airHumidity, setAirHumidity] = useState("--");
  const [soilHumidity, setSoilHumidity] = useState("--");
  const [temperature, setTemperature] = useState("--");
  const [lightLevel, setLightLevel] = useState("--");
  const [pumpState, setPumpState] = useState(false);
  const [temperatureChange, setTemperatureChange] = useState({ line1: 'Change vs 1hr ago:', line2: '-- (was -- °C)' });

  const temperatureHistoryRef = useRef([]);
  const currentTemperatureRef = useRef("--");
  const currentTimeRef = useRef("Loading...");
  const prevTemperatureRef = useRef("--");

  function storeTemperatureData(temperature, time) {
    temperatureHistoryRef.current.push({ temperature, time });
    if (temperatureHistoryRef.current.length > 24) {
      temperatureHistoryRef.current.shift();
    }
  }

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(
        "http://localhost:3005/data"
        // "https://smart-gardening-system.onrender.com/data"
      );
      const data = await response.json();
      setAirHumidity(data.airHumidity);
      setSoilHumidity(data.soilHumidity);

      // Update temperature
      currentTemperatureRef.current = data.temperature;
      currentTimeRef.current = new Date().toLocaleTimeString();

      setTemperature(String(currentTemperatureRef.current));

      // Get the temperature from one hour ago
      const oneHourAgo = new Date(
        new Date().getTime() - 60000 // Get 1 minute to test
      ).toLocaleTimeString();
      const prevTemperatureData = temperatureHistoryRef.current.find(
        (entry) => entry.time === oneHourAgo
      );

      if (prevTemperatureData) {
        const tempChange = currentTemperatureRef.current - prevTemperatureData.temperature;
        const tempChangeSign = tempChange > 0 ? "+" : "";
        
        setTemperatureChange({
          line1: 'Change vs 1hr ago:',
          line2: `${tempChangeSign}${tempChange} °C (was ${prevTemperatureData.temperature} °C)`
        });

        prevTemperatureRef.current = prevTemperatureData.temperature;
      } else {
        setTemperatureChange({
          line1: 'Change vs 1hr ago:',
          line2: `-- (was ${prevTemperatureRef.current} °C)`
        });
      }

      // Store the current temperature for the next hour
      storeTemperatureData(currentTemperatureRef.current, currentTimeRef.current);

      setLightLevel(data.light);
    }

    fetchData();
    const interval = setInterval(fetchData, 60000); // Fetch each minute

    const client = mqtt.connect("wss://test.mosquitto.org:8081");

    client.on("connect", () => {
      console.log("Connected to MQTT broker");
    });

    client.on("error", (err) => {
      console.error("Connection error: ", err);
    });

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handlePumpSwitch = () => {
    const client = mqtt.connect("wss://test.mosquitto.org:8081");
    const state = pumpState ? "OFF" : "ON";
    client.publish(
      "https://smart-gardening-system.onrender.com/control/pump",
      state
    );
    setPumpState(!pumpState);
    client.end(); // Properly clean up the MQTT client connection
  };

  return (
    <div className="flex flex-col justify-center items-center font-sans">
      <div className="container mt-5">
        <h1 className="text-4xl font-bold text-center">
          Environmental Monitoring Dashboard
        </h1>

        <div className="container flex justify-center xl:h-[60vh] xl:items-center min-[320px]:h-[70vh] min-[320px]:mt-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-[80vw] h-[20vh]">
            <div className="card bg-white p-4 shadow-lg rounded-md">
              <div className="flex justify-between items-center mb-3">
                <h5 className="card-title text-xl">Air Humidity</h5>
                <div className="badge bg-blue-500 text-white rounded-full px-2 py-1">
                  %
                </div>
              </div>
              <div className="card-body text-center">
                <h1 className="text-4xl">{airHumidity}</h1>
              </div>
            </div>

            <div className="card bg-white p-4 shadow-lg rounded-md">
              <div className="flex justify-between items-center mb-3">
                <h5 className="card-title text-xl">Soil Humidity</h5>
                <div className="badge bg-blue-500 text-white rounded-full px-2 py-1">
                  %
                </div>
              </div>
              <div className="card-body text-center">
                <h1 className="text-4xl">{soilHumidity}</h1>
              </div>
            </div>

            <div className="card bg-white p-4 shadow-lg rounded-md">
              <div className="flex justify-between items-center mb-3">
                <h5 className="card-title text-xl">Temperature</h5>
                <div className="badge bg-blue-500 text-white rounded-full px-2 py-1">
                  &deg;C
                </div>
              </div>
              <div className="card-body text-center">
                <h1 className="text-4xl">{temperature}</h1>
                <div>
                  <div>{temperatureChange.line1}</div>
                  <div>{temperatureChange.line2}</div>
                </div>
              </div>
            </div>

            <div className="card bg-white p-4 shadow-lg rounded-md">
              <div className="flex justify-between items-center mb-3">
                <h5 className="card-title text-xl">Light Level</h5>
                <div className="badge bg-blue-500 text-white rounded-full px-2 py-1">
                  %
                </div>
              </div>
              <div className="card-body text-center">
                <h1 className="text-4xl">{lightLevel}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center card bg-white p-4 shadow-lg rounded-md">
        <h2 className="text-2xl mb-4 font-bold">Control Pump</h2>
        <label className="switch">
          <input
            type="checkbox"
            checked={pumpState}
            onChange={handlePumpSwitch}
            className="hidden"
          />
          <span
            className={`slider round bg-gray-300 block w-14 h-8 rounded-full relative cursor-pointer ${
              pumpState ? "bg-green-500" : ""
            }`}
          >
            <span
              className={`absolute bg-white w-6 h-6 rounded-full top-1 left-1 transition-transform ${
                pumpState ? "transform translate-x-6" : ""
              }`}
            ></span>
          </span>
        </label>
      </div>
    </div>
  );
}
