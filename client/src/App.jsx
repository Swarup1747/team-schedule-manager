import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

// Components
import Sidebar from './components/Sidebar';
import UserSync from './components/UserSync'; // Ensure you created this file above
import Navbar from './components/Navbar';

// Pages
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import EmployeeMonitoring from './pages/EmployeeMonitoring';

function App() {
  return (
    <Router>
      {/* 1. Sync Component: Runs invisibly when user is signed in */}
      <SignedIn>
        <UserSync />
      </SignedIn>

      {/* 2. Top Navigation */}
      <Navbar />

      <div className="app-container" style={{ marginTop: '60px' }}>

        {/* 3. Sidebar (Only visible when signed in) */}
        <SignedIn>
          <div>
            <Sidebar />
          </div>
        </SignedIn>

        {/* 4. Main Content Area */}
        <main>
          <Routes>
            <Route path="/" element={
              <>
                <SignedIn><Dashboard /></SignedIn>
                <SignedOut><RedirectToSignIn /></SignedOut>
              </>
            } />

            <Route path="/meetings" element={
              <>
                <SignedIn><Meetings /></SignedIn>
                <SignedOut><RedirectToSignIn /></SignedOut>
              </>
            } />

            <Route path="/tasks" element={
              <>
                <SignedIn><Tasks /></SignedIn>
                <SignedOut><RedirectToSignIn /></SignedOut>
              </>
            } />

            <Route path="/projects" element={
              <>
                <SignedIn><Projects /></SignedIn>
                <SignedOut><RedirectToSignIn /></SignedOut>
              </>
            } />
            <Route path="/monitor" element={
              <>
                <SignedIn><EmployeeMonitoring /></SignedIn>
                <SignedOut><RedirectToSignIn /></SignedOut>
              </>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;