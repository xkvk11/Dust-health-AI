import React, { useState, useEffect } from "react";

function DustPrediction() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dust/predict/")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setData(data))
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);
  
  return (
    <div>
      <h1>Dust Prediction</h1>
      {data ? (
        <div>
          <h2>Predicted Data:</h2>
          <ul>
            {data.future_dates.map((date, index) => (
              <li key={index}>
                {date}: {data.predictions[index]}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default DustPrediction;
