const { Permission, Role, User } = require("../models/user.model");

const PermissionController = {
  async grantPermission(req, res) {
    try {
      const { user } = req;
      const { portalId } = req.params.portalId;
      const { readOnly, writePermission } = req.body;

      const userRoles = await Role.findById(user.roles);

      let permission = await Permission.findOne({ user: user._id, portal: portalId });

      if (permission) {
        permission.readOnly = readOnly;
        permission.writePermission = writePermission;
        await permission.save();
        return res
          .status(200)
          .json({ success: true, message: "Permission updated successfully.", permission });
      } else {
        permission = await Permission.create({
          role: user.roles,
          user: user._id,
          portal: portalId,
          readOnly,
          writePermission,
        });
        const updatedUser = await User.findById(user._id);

        return res.status(201).json({
          success: true,
          message: "Permission granted.",
          permission,
          user: updatedUser,
        });
      }
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async getGrantedPermission(req, res) {
    try {
      const { user } = req;

      const permissions = await Permission.find({ userId: user._id }).populate("portal");
      if (!permissions) {
        return res.status(401).json({ success: false, message: "Permissions not found." });
      }
      return res.status(200).json({ success: true, permissions });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
};

module.exports = PermissionController;
