import React from "react";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import GlobalAuth from "./components/auth/GlobalAuth";
import useAuthStore from "./store/authStore";

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <GlobalAuth>
      <div className="App">
        <Navbar />
        <main>
          <AppRoutes />
        </main>
        {!isAuthenticated && <Footer />}
      </div>
    </GlobalAuth>
  );
}

export default App;
