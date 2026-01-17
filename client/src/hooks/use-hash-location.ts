import { useState, useEffect, useCallback } from "react";

// returns the current hash location (without the # prefix)
const currentLocation = () => {
    const hash = window.location.hash;
    if (hash.startsWith("#")) {
        return hash.replace(/^#/, "") || "/";
    }
    // Fallback if hash is empty
    return "/";
};

export const useHashLocation = () => {
    const [loc, setLoc] = useState(currentLocation());

    useEffect(() => {
        const handler = () => setLoc(currentLocation());

        // subscribe to hash changes
        window.addEventListener("hashchange", handler);
        return () => window.removeEventListener("hashchange", handler);
    }, []);

    const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
        if (options?.replace) {
            window.location.replace("#" + to);
        } else {
            window.location.hash = "#" + to;
        }
    }, []);

    return [loc, navigate] as [string, (to: string, options?: { replace?: boolean }) => void];
};
