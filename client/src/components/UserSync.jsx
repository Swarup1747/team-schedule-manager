import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

const UserSync = () => {
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    const syncUserToBackend = async () => {
      if (isSignedIn && user) {
        try {
          await axios.post('https://team-schedule-manager-1.onrender.com/api/users/sync', {
            clerkId: user.id,
            email: user.primaryEmailAddress.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            photo: user.imageUrl,
          });
          // console.log("User Synced to MongoDB");
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      }
    };

    syncUserToBackend();
  }, [isSignedIn, user]);

  return null; // This component renders nothing, it just runs logic
};

export default UserSync;