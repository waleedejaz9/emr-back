const { Role } = require("../models/user.model");

const RoleController = {
  async createRole(req, res) {
    try {
      const { role, roleId } = req.body;

      const existingRole = await Role.findOne({ role });
      if (existingRole) {
        return res.status(400).json({ message: "Role with this name already exists" });
      }

      const newRole = await Role.create({ role, roleId });

      res.status(201).json(newRole);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getRoles(req, res) {
    try {
      const roles = await Role.find({ isDeleted: false });

      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateRole(req, res) {
    try {
      const roleId = req.params.roleId;
      const { role } = req.body;

      const existingRole = await Role.findOne({ _id: roleId, isDeleted: false });

      if (!existingRole) {
        return res.status(404).json({ message: "Role not found" });
      }

      const updatedRole = await Role.findByIdAndUpdate(roleId, { role }, { new: true });

      res.json(updatedRole);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async deleteRole(req, res) {
    try {
      const roleId = req.params.roleId;

      const role = await Role.findById(roleId);

      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (role.isDeleted) {
        return res.status(400).json({ message: "Role is already deleted" });
      }

      role.isDeleted = true;
      await role.save();

      res.json({ message: "Role soft deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = RoleController;
