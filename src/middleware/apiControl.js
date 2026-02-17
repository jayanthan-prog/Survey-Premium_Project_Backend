// Local storage for disabled routes (In production, move this to a Database)
const disabledRoutes = new Set();

module.exports = {
  // 1. The Guard: Add this to your main API router to block traffic
  apiGatekeeper: (req, res, next) => {
    if (disabledRoutes.has(req.path)) {
      return res.status(503).json({ 
        error: "Maintenance", 
        message: "This endpoint is temporarily disabled by the admin." 
      });
    }
    next();
  },

  // 2. Logic to toggle status
  toggleRoute: (path, shouldDisable) => {
    if (shouldDisable) {
      disabledRoutes.add(path);
    } else {
      disabledRoutes.delete(path);
    }
  },

  // 3. Get list for the UI
  getDisabledList: () => Array.from(disabledRoutes)
};