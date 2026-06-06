import { useEffect } from "react";
import { I18nProvider } from "./lib/i18n";
import { AuthProvider, useAuth } from "./lib/auth";
import { DataProvider } from "./lib/store";
import { useRoute, navigate, segments, setRedirect } from "./lib/router";
import { setCurrentUser } from "./lib/api";
import Landing from "./components/Landing";
import Auth from "./components/Auth";
import JoinProject from "./components/JoinProject";
import AppShell from "./components/app/AppShell";
import Workspace from "./components/app/Workspace";
import AdminConsole from "./components/app/AdminConsole";
import ProjectDashboard from "./components/app/ProjectDashboard";
import ProjectSettings from "./components/app/ProjectSettings";

function appPage(seg) {
  // seg starts with "app"
  if (seg.length === 1) return <Workspace />;
  if (seg[1] === "admin") return <AdminConsole />;
  if (seg[1] === "projects" && seg[2] && seg[3] === "settings") return <ProjectSettings id={seg[2]} />;
  if (seg[1] === "projects" && seg[2]) return <ProjectDashboard id={seg[2]} />;
  return <Workspace />;
}

function Routes() {
  const path = useRoute();
  const { user, isAuthed } = useAuth();

  // Keep the mock API's "current user" in sync before children fetch.
  setCurrentUser(isAuthed ? user : null);

  const seg = segments(path);
  const area = seg[0]; // undefined | "login" | "signup" | "join" | "app"
  const needsAuth = area === "app" || area === "join";

  useEffect(() => {
    if (needsAuth && !isAuthed) {
      setRedirect(path);
      navigate("/login");
    }
    if ((area === "login" || area === "signup") && isAuthed) {
      navigate("/app");
    }
  }, [path, isAuthed, needsAuth, area]);

  // Reset scroll on real route changes (landing in-page anchors have no leading slash).
  useEffect(() => {
    if (path.startsWith("/")) window.scrollTo(0, 0);
  }, [path]);

  if (area === "login") return isAuthed ? null : <Auth mode="login" />;
  if (area === "signup") return isAuthed ? null : <Auth mode="signup" />;
  if (area === "join") return isAuthed ? <JoinProject token={seg[1]} /> : null;
  if (area === "app") return isAuthed ? <AppShell>{appPage(seg)}</AppShell> : null;
  return <Landing />;
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <DataProvider>
          <Routes />
        </DataProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
