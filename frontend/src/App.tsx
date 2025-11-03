import { Route, Routes } from "react-router-dom";
import InitializePage from "./pages/init";
import ReauthPage from "./pages/reauth";
import PortalPage from "./pages/portal";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PortalPage />} />
      <Route path="/init" element={<InitializePage />} />
      <Route path="/reauth" element={<ReauthPage />} />
    </Routes>
  );
}

export default App;
