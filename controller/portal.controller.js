const Portal = require("../models/portal.model");

const PortalController = {
  async createPortal(req, res) {
    try {
      const { portalName } = req.body;

      const existingPortal = await Portal.findOne({ portalName });
      if (existingPortal) {
        return res.status(400).json({ message: "Portal with this name already exists" });
      }

      const newPortal = await Portal.create({ portalName });

      res.status(201).json(newPortal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getPortal(req, res) {
    try {
      const portals = await Portal.find({ isDeleted: false });

      res.json(portals);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updatePortal(req, res) {
    try {
      const portalId = req.params.portalId;
      const { portalName } = req.body;

      const existingRole = await Portal.findOne({ _id: portalId, isDeleted: false });

      if (!existingRole) {
        return res.status(404).json({ message: "Portal not found" });
      }

      const updatedPortal = await Portal.findByIdAndUpdate(portalId, { portalName }, { new: true });

      res.json(updatedPortal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async deletePortal(req, res) {
    try {
      const portalId = req.params.portalId;

      const portal = await Portal.findById(portalId);

      if (!portal) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (portal.isDeleted) {
        return res.status(400).json({ message: "Role is already deleted" });
      }

      portal.isDeleted = true;
      await portal.save();

      res.json({ message: "Portal soft deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = PortalController;
