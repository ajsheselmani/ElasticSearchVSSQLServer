import { Outlet, useLocation } from "react-router-dom";
import { CONFIG } from "../../global-config";
import { useState } from "react";
import { Button } from "@mui/material";

// ----------------------------------------------------------------------

const metadata = { title: `Ballina - ${CONFIG.appName}` };

export default function Page() {
  const { pathname } = useLocation();
  const kibanaUrl =
    "http://localhost:5601/app/dashboards#/view/85dd4324-a0e8-4025-811c-21973109ec37?embed=true&_g=(refreshInterval:(pause:!t,value:60000),time:(from:now-15y,to:now))&show-query-input=false&show-filter-bar=false";
  const k6ReportUrl = "../../tests/k6/reports/index.html";

  const [view, setView] = useState(kibanaUrl);
  const isDashboardBase =
    pathname.includes("/sql") || pathname.includes("/elastic");
  console.log(isDashboardBase, "isDashboardBase");
  // const kibanaUrl =
  //   "http://localhost:5601/app/dashboards#/view/85dd4324-a0e8-4025-811c-21973109ec37?embed=true&_g=%28refreshInterval%3A%28pause%3A%21t%2Cvalue%3A60000%29%2Ctime%3A%28from%3Anow-15y%2Cto%3Anow%29%29&hide-filter-bar=true";

  return (
    <>
      <title>{metadata.title}</title>
      {/* {isDashboardBase ? (
        <>
          <div style={{ padding: "10px", textAlign: "center" }}>
            <Button
              onClick={() => setView(kibanaUrl)}
              style={{ marginRight: "10px" }}
            >
              Live Stats (Kibana)
            </Button>
            <Button onClick={() => setView(k6ReportUrl)}>
              Test Results (k6)
            </Button>
          </div>
          <div style={{ width: "100%", height: "calc(100vh - 150px)" }}>
            <iframe
              src={view === "kibana" ? kibanaUrl : k6ReportUrl}
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          </div>
        </>
      ) : (
        <Outlet />
      )} */}
      <Outlet />
    </>
  );
}

{
  /* <div
  style={{
    width: "100%",
    height: "calc(100vh - 100px)",
    overflow: "hidden",
  }}
>
  <iframe
    src={kibanaUrl}
    height="100%"
    width="100%"
    title="Electronics Stats"
    style={{
      border: "none",
      overflow: "hidden",
      display: "block",
    }}
    scrolling="no"
  ></iframe>
</div> */
}
// <Outlet />
