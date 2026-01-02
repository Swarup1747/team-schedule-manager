import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";

const Navbar = () => {
  const { isSignedIn, user } = useUser();

  return (
    <div style={{ 
      height: '60px', 
      background: '#fff', 
      padding: '0 20px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'fixed',
      width: '100%',
      top: 0,
      zIndex: 1000
    }}>
      <h2 style={{ margin: 0, color: '#4f46e5' }}>TeamSync</h2>
      
      <div>
        {isSignedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontWeight: '500' }}>Hello, {user.firstName}</span>
            {/* UserButton handles Sign Out automatically */}
            <UserButton afterSignOutUrl="/"/>
          </div>
        ) : (
          <SignInButton mode="modal">
            <button style={{ 
              padding: '8px 16px', 
              background: '#4f46e5', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Sign In
            </button>
          </SignInButton>
        )}
      </div>
    </div>
  );
};

export default Navbar;