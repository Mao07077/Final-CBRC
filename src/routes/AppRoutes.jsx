import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { routesConfig } from "./component/routesConfig";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import PublicRoute from "../components/layout/PublicRoute";
import AnimatedPage from "../components/layout/AnimatedPage";

const renderRoutes = (routes) => {
  return routes.map((route) => {
    // Conditionally wrap the element with the animation component
    // Dashboard routes handle their own animation within the layout
    const elementToRender = route.isDashboard ? route.element : <AnimatedPage>{route.element}</AnimatedPage>;

    const element = route.isPublic ? (
      <PublicRoute>{elementToRender}</PublicRoute>
    ) : (
      <ProtectedRoute allowedRoles={route.allowedRoles}>
        {elementToRender}
      </ProtectedRoute>
    );

    // If the route has children, recursively render them
    if (route.children) {
      return (
        <Route key={route.path} path={route.path} element={element}>
          {renderRoutes(route.children)}
        </Route>
      );
    }

    // Render a single route
    return <Route key={route.path} path={route.path} element={element} />;
  });
};

const AppRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {renderRoutes(routesConfig)}
        {/* Add fallback and unauthorized routes */}
        <Route path="/unauthorized" element={<AnimatedPage><h1>Unauthorized Access</h1></AnimatedPage>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
