import { useState } from "react";
import "./App.css";

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <section id="center">
        <div>
          <h1>Project Overview</h1>
          <p>
            This project aims to compare <code>Elasticsearch</code> and{" "}
            <code>SQL Server</code> by analyzing their performance and response
            times when handling data queries. The goal is to understand the
            strengths and limitations of each system and provide insights on
            which is better suited for different types of data workloads.
          </p>
        </div>
      </section>
    </>
  );
}

export default App;
