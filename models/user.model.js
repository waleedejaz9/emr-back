const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    unique: true,
  },

  isDeleted: {
    default: false,
    type: Boolean,
  },
  roleId: {
    type: String,
    required: true,
    unique: true,
  },
});

const permissionSchema = new mongoose.Schema({
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  portal: { type: mongoose.Schema.Types.ObjectId, ref: "Portal" },
  permission: { type: Boolean, required: true },
});

var userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: false },
    roles: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    imagePath: { type: String },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    phoneNumber: { type: String, required: false },
    insuranceProvider: { type: String },
    insuranceMemberId: { type: String },
    address: { type: String },
    insuranceCompanyId: { type: String },
    email: { type: String, required: true },
    title: { type: String },
    userName: { type: String, unique: false },
    password: { type: String, required: true, select: false },
    religion: { type: String },
    ethnicity: { type: String },
    terms: { type: String },
    paymentStatus: { type: Boolean, required: true, default: false },
    website: { type: String },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    dateOfBirth: { type: Date },
    status: { type: Boolean },
    firstTimeLogin: {
      type: Boolean,
      default: false,
    },
    loginReset: {
      type: Boolean,
      default: false,
    },
    profilePicture: { type: String },
  },
  { timestamps: true }
);

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    companyOfficerName: { type: String },
    department: { type: String },
    primaryEmail: { type: String },
    secondaryEmail: { type: String },
    mobilePhone: { type: String },
    companyPhoneNumber: { type: String },
    extension: { type: String },
    companyAddress: {
      type: String,
    },
    billingAddress: {
      type: String,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ceo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const imageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  imagePath: { type: String, required: true },
});

const User = mongoose.model("user", userSchema);
const Role = mongoose.model("Role", roleSchema);
const Permission = mongoose.model("Permission", permissionSchema);
const Company = mongoose.model("Company", companySchema);
const Image = mongoose.model("Image", imageSchema);

module.exports = { User, Role, Permission, Company, Image };
