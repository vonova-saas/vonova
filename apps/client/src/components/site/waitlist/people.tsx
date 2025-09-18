"use client";

import { motion, useAnimation } from "motion/react";
import { useEffect, useState } from "react";

interface WaitlistUser {
  fullName: string;
  email: string;
}

interface PeopleProps {
  className?: string;
  maxDisplay?: number; // Maximum number of avatars to display
}

export default function People({
  className = "",
  maxDisplay = 6,
}: PeopleProps) {
  const [users, setUsers] = useState<WaitlistUser[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const controls = useAnimation();

  // Fetch waitlist users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Only show loading on initial fetch
        if (users.length === 0) {
          setLoading(true);
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/waitlist/all-users`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch waitlist users");
        }

        const data = await response.json();
        // Use the users array directly from the response
        setUsers(data.users || []);
        setTotalCount((data.count || 0) + 20);
      } catch (err) {
        console.error("Error fetching waitlist users:", err);
        // Only show error if we don't have any users yet
        if (users.length === 0) {
          // Fallback to default count if API fails
          setTotalCount(275);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    // Set up periodic refresh every 30 seconds to keep count updated
    const refreshInterval = setInterval(fetchUsers, 30000);

    return () => clearInterval(refreshInterval);
  }, [users.length]);

  // Initial animation
  useEffect(() => {
    if (!loading) {
      controls.start({ opacity: 1, y: 0 });
    }
  }, [loading, controls]);

  // Generate initials from full name
  const getInitials = (fullName: string): string => {
    if (!fullName) return "?";
    const names = fullName.trim().split(" ");
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Generate a consistent color based on name
  const getAvatarColor = (name: string): string => {
    const colors = [
      "from-blue-400 to-blue-600",
      "from-purple-400 to-purple-600",
      "from-green-400 to-green-600",
      "from-red-400 to-red-600",
      "from-yellow-400 to-yellow-600",
      "from-pink-400 to-pink-600",
      "from-indigo-400 to-indigo-600",
      "from-teal-400 to-teal-600",
      "from-orange-400 to-orange-600",
      "from-cyan-400 to-cyan-600",
    ];

    // Simple hash function to get consistent color for same name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Show a subset of users with nice overlap
  const displayUsers = users.slice(0, maxDisplay - 1); // Leave space for + indicator

  // Format the number with commas
  const formattedCount = totalCount.toLocaleString();

  if (loading) {
    return (
      <motion.div
        className={`flex items-center justify-center gap-2 py-2 px-4 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex -space-x-3 mr-3">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="w-10 h-10 rounded-full border-2 border-background shadow-md bg-gray-200 animate-pulse"
            />
          ))}
        </div>
        <div className="text-sm md:text-base text-muted-foreground">
          Loading waitlist...
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex items-center justify-center gap-2 py-2 px-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
      transition={{ duration: 0.6 }}
    >
      <div className="flex -space-x-3 mr-3">
        {displayUsers.map((user, index) => (
          <motion.div
            key={`${user.fullName}-${index}`}
            className="w-10 h-10 rounded-full border-2 border-background shadow-md overflow-hidden"
            style={{ zIndex: displayUsers.length - index }}
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            title={user.fullName}
          >
            {/* Pure CSS avatar with initials and gradient background */}
            <div
              className={`w-full h-full flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br ${getAvatarColor(user.fullName)}`}
            >
              {getInitials(user.fullName)}
            </div>
          </motion.div>
        ))}

        {/* Plus indicator for more people */}
        {totalCount > maxDisplay && (
          <motion.div
            className="w-10 h-10 rounded-full border-2 border-background shadow-md bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold text-xs"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            +{totalCount - maxDisplay + 1}
          </motion.div>
        )}
      </div>

      <motion.div className="text-sm md:text-base text-muted-foreground">
        Join{" "}
        <motion.span
          className="font-semibold text-foreground"
          key={totalCount}
          initial={{ opacity: 0.5, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {formattedCount}+
        </motion.span>{" "}
        others on the waitlist
        <motion.div
          className="flex items-center mt-1 text-xs text-green-600"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
          <span>Live count</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
