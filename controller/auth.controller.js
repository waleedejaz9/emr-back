const jwt = require("jsonwebtoken");
const BcryptUtil = require("../utils/bcrypt.util");
const config = require("../config");
const { User, Role, Permission, Company } = require("../models/user.model");
const Portal = require("../models/portal.model");
const bcrypt = require("bcrypt");
const authorize = require("../middlewares/authorize.middleware");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const path = require("path");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "junaidmalikk797@gmail.com",
    pass: "aark giht svxh doxy",
  },
});

const sendEmail = async (transporter, mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Sent mail to `);
  } catch (error) {
    console.log(error);
  }
};

const generateRandomPassword = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 6; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
};

const AuthController = {
  async createMhc(req, res) {
    try {
      const { user } = req;
      const {
        companyName,
        companyOfficerName,
        department,
        primaryEmail,
        secondaryEmail,
        mobilePhone,
        companyPhoneNumber,
        extension,
        companyAddress,
        billingAddress,
        eaName,
        eaEmail,
        eaPhoneNumber,
      } = req.body;

      const targetRoleId = new mongoose.Types.ObjectId("662c05660a775f5b72ebe9ba");
      if (!user.roles.equals(targetRoleId)) {
        return res.status(401).json({ success: false, message: "Only Blue Goat can create MHC" });
      }
      const existingUser = await Company.findOne({ primaryEmail });
      if (existingUser) {
        return res.status(400).json({ message: "Company with this email already exists" });
      }
      const eaExistingUser = await User.findOne({ email: eaEmail });
      if (eaExistingUser) {
        return res.status(400).json({ message: "User with EA email already exists" });
      }

      const roleDocument = await Role.findOne({ roleId: 14 });

      const randomPassword = generateRandomPassword();

      const hashedPassword = await BcryptUtil.getHash({ data: randomPassword });

      const company = await Company.create({
        companyName,
        companyOfficerName,
        department,
        primaryEmail,
        secondaryEmail,
        mobilePhone,
        companyPhoneNumber,
        extension,
        companyAddress,
        billingAddress,
        createdBy: user._id,
      });

      const userCreated = await User.create({
        firstName: eaName,
        lastName: "test",
        roles: roleDocument._id,
        password: hashedPassword,
        company: company._id,
        phoneNumber: eaPhoneNumber,
        email: eaEmail,
        status: false,
      });
      const mailOptions = {
        from: { name: "EMR Test", address: "junaidmalikk797@gmail.com" }, // sender address
        to: eaEmail,
        subject: "Welcome to EMR",
        html: `<p>Hello ${eaName},</p><p>Your account has been created successfully.</p><p>Email: ${eaEmail}</p><p>Password: ${randomPassword}</p>`, // HTML body
      };

      await sendEmail(transporter, mailOptions);

      res.status(200).json({ success: true, user: userCreated, company: company });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
  async getAllMhc(req, res) {
    try {
      const users = await Company.find();
      return res.status(200).json({
        success: true,
        length: users.length,
        data: users,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
  async getMhcById(req, res) {
    try {
      const { id } = req.params;
      const mhc = await Company.findById(id);

      if (!mhc) {
        return res.status(404).json({ success: false, message: "MHC not found" });
      }

      return res.status(200).json({ success: true, data: mhc });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
  async updateMhc(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const mhc = await Company.findByIdAndUpdate(id, updateData, { new: true });

      if (!mhc) {
        return res.status(404).json({ success: false, message: "MHC not found" });
      }

      return res.status(200).json({ success: true, data: mhc });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
  async getAllUser(req, res) {
    try {
      const users = await User.find().populate("roles").populate("associatedWith");
      return res.status(200).json({ success: true, length: users.length, data: users });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
  async getUserById(req, res) {
    try {
      const userId = req.params.userId;

      const user = await User.findById(userId).populate("roles");
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
  async signUp(req, res) {
    try {
      const { user } = req;
      const {
        firstName,
        lastName,
        roleId,
        company,
        phoneNumber,
        insuranceProvider,
        insuranceMemberId,
        address,
        insuranceCompanyId,
        email,
        title,
        userName,
        religion,
        ethnicity,
        terms,
        paymentStatus,
        website,
        gender,
        dateOfBirth,
        status,
        permission,
        password,
      } = req.body;

      const existingProfileByEmail = await User.findOne({ email, isDeleted: false });

      if (existingProfileByEmail)
        return res.status(400).json({ success: false, message: "Email already exists." });

      const roleDocument = await Role.findOne({ roleId });

      const superAdminId = new mongoose.Types.ObjectId("662c05660a775f5b72ebe9ba");
      const EAId = new mongoose.Types.ObjectId("663536bb38d98c825d30d4c3");
      const MHCAdminId = new mongoose.Types.ObjectId("662c05970a775f5b72ebe9bd");

      if (user.roles.equals(superAdminId)) {
      } else if (user.roles.equals(EAId)) {
        if (!user.company.equals(company)) {
          return res
            .status(401)
            .json({ success: false, message: "You cannot assign a company other than your own." });
        }
      } else if (user.roles.equals(MHCAdminId)) {
        if (!user.company.equals(company)) {
          return res
            .status(401)
            .json({ success: false, message: "You cannot assign a company other than your own" });
        }
      } else {
        return res.status(401).json({ success: false, message: "Unauthorized." });
      }

      const associatedCompany = await Company.findOne({ _id: company });
      if (!associatedCompany) {
        res.status(400).json({ success: false, message: "No MHC found" });
      }

      if (!roleDocument) {
        throw new Error("Role does not exist");
      }

      const hashedPassword = await BcryptUtil.getHash({ data: password });

      const userCreated = await User.create({
        firstName,
        lastName,
        roles: roleDocument._id,
        password: hashedPassword,
        company,
        phoneNumber,
        insuranceProvider,
        insuranceMemberId,
        address,
        insuranceCompanyId,
        email,
        title,
        userName,
        religion,
        ethnicity,
        terms,
        paymentStatus,
        website,
        gender,
        dateOfBirth,
        status,
      });

      const permissionDetail = permission.map((perm) => ({
        ...perm,
        roleId: roleDocument._id,
        userId: userCreated._id,
      }));

      const permissionData = await Permission.insertMany(permissionDetail);

      const token = jwt.sign({ _id: userCreated._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
      const data = userCreated.toObject();
      delete data.password;
      const mailOptions = {
        from: { name: "EMR Test", address: "junaidmalikk797@gmail.com" }, // sender address
        to: email,
        subject: "Welcome to EMR",
        html: `<p>Hello ${firstName} ${lastName},</p><p>Your account has been created successfully.</p><p>Email: ${email}</p><p>Password: ${password}</p>`, // HTML body
      };

      await sendEmail(transporter, mailOptions);

      return res.status(201).json({ success: true, token, user: data, permission: permissionData });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
  async signIn(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email, isDeleted: false }).select("+password");

      if (!user) {
        console.log("User not found for email:", email);
        return res.status(404).json({ success: false, message: "Email does not exist." });
      }

      const passwordValid = await bcrypt.compare(password, user.password);
      console.log("Password valid:", passwordValid);

      if (!passwordValid) {
        console.log("Incorrect password");
        return res.status(400).json({ success: false, message: "Incorrect password." });
      }
      const permission = await Permission.find({ userId: user._id }).populate("portal");
      await user.populate("roles");
      await user.populate("company");
      const token = jwt.sign({ _id: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
      const data = user.toObject();
      delete data.password;

      return res.status(200).json({
        success: true,
        token,
        user: data,
        permission: {
          length: permission.length,
          data: permission,
        },
      });
    } catch (err) {
      console.error("Error during sign-in:", err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },
  async loginUpdateUser(req, res) {
    try {
      const { user } = req;
      const {
        firstName,
        lastName,
        company,
        phoneNumber,
        insuranceProvider,
        insuranceMemberId,
        address,
        insuranceCompanyId,
        email,
        title,
        religion,
        ethnicity,
        terms,
        paymentStatus,
        website,
        gender,
        dateOfBirth,
        status,
        password,
      } = req.body;

      const userDetail = await User.findById(user._id);

      const companyCheck = Company.findById(company);

      if (!userDetail) {
        return res.status(400).json({ success: false, message: "userDetail not found." });
      }

      if (userDetail.firstTimeLogin) {
        return res.status(400).json({ success: false, message: "user already updated after login." });
      }

      if (!companyCheck) {
        return res.status(400).json({ success: false, message: "company not found." });
      }

      userDetail.firstName = firstName || userDetail.firstName;
      userDetail.lastName = lastName || userDetail.lastName;
      userDetail.company = company || userDetail.company;
      userDetail.phoneNumber = phoneNumber || userDetail.phoneNumber;
      userDetail.insuranceProvider = insuranceProvider || userDetail.insuranceProvider;
      userDetail.insuranceMemberId = insuranceMemberId || userDetail.insuranceMemberId;
      userDetail.address = address || userDetail.address;
      userDetail.insuranceCompanyId = insuranceCompanyId || userDetail.insuranceCompanyId;
      userDetail.title = title || userDetail.title;
      userDetail.religion = religion || userDetail.religion;
      userDetail.ethnicity = ethnicity || userDetail.ethnicity;
      userDetail.terms = terms || userDetail.terms;
      userDetail.paymentStatus = paymentStatus || userDetail.paymentStatus;
      userDetail.website = website || userDetail.website;
      userDetail.gender = gender || userDetail.gender;
      userDetail.dateOfBirth = dateOfBirth || userDetail.dateOfBirth;
      userDetail.status = status || userDetail.status;
      // userDetail.associatedWith = userDetail.associatedWith;

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        userDetail.password = hashedPassword;
      }

      if (!user.firstTimeLogin) {
        userDetail.firstTimeLogin = true;
      }

      await userDetail.save();

      await userDetail.populate("roles");

      const data = userDetail.toObject();
      delete data.password;

      return res
        .status(200)
        .json({ success: true, message: "User profile updated successfully.", user: data });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
  async resetPassword(req, res) {
    try {
      const { user } = req;
      const { newPassword, confirmPassword } = req.body;

      if (newPassword !== confirmPassword) {
        return res
          .status(400)
          .json({ success: false, message: "New password and confirm password do not match." });
      }

      const userDetail = await User.findById(user._id);

      if (userDetail.loginReset) {
        return res.status(400).json({ success: false, message: "Password already updated after login." });
      }

      if (!userDetail) {
        return res.status(400).json({ success: false, message: "User not found." });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      userDetail.password = hashedPassword;
      userDetail.loginReset = true;

      await userDetail.save();

      return res.status(200).json({ success: true, message: "Password reset successfully." });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
  async updateUser(req, res) {
    try {
      const userId = req.params.userId;
      const {
        firstName,
        lastName,
        company,
        phoneNumber,
        insuranceProvider,
        insuranceMemberId,
        address,
        insuranceCompanyId,
        email,
        title,
        religion,
        ethnicity,
        terms,
        paymentStatus,
        website,
        gender,
        dateOfBirth,
        status,
      } = req.body;

      const userDetail = await User.findById(userId);

      if (!userDetail) {
        return res.status(404).json({ success: false, message: "userDetail not found." });
      }

      const associatedCompany = await Company.findOne({ _id: company });
      if (!associatedCompany) {
        res.status(400).json({ success: false, message: "No MHC found" });
      }

      userDetail.firstName = firstName || userDetail.firstName;
      userDetail.lastName = lastName || userDetail.lastName;
      userDetail.company = company || userDetail.company;
      userDetail.phoneNumber = phoneNumber || userDetail.phoneNumber;
      userDetail.insuranceProvider = insuranceProvider || userDetail.insuranceProvider;
      userDetail.insuranceMemberId = insuranceMemberId || userDetail.insuranceMemberId;
      userDetail.address = address || userDetail.address;
      userDetail.insuranceCompanyId = insuranceCompanyId || userDetail.insuranceCompanyId;
      userDetail.title = title || userDetail.title;
      userDetail.religion = religion || userDetail.religion;
      userDetail.ethnicity = ethnicity || userDetail.ethnicity;
      userDetail.terms = terms || userDetail.terms;
      userDetail.paymentStatus = paymentStatus || userDetail.paymentStatus;
      userDetail.website = website || userDetail.website;
      userDetail.gender = gender || userDetail.gender;
      userDetail.dateOfBirth = dateOfBirth || userDetail.dateOfBirth;
      userDetail.status = status || userDetail.status;
      // userDetail.associatedWith = userDetail.associatedWith;

      await userDetail.save();

      await userDetail.populate("roles");
      await userDetail.populate("company");

      const data = userDetail.toObject();
      delete data.password;

      return res
        .status(200)
        .json({ success: true, message: "User profile updated successfully.", user: data });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
  async getUsersByRole(req, res) {
    try {
      const { user } = req;
      const roleId = req.params.roleId;
      const targetRoleId = new mongoose.Types.ObjectId("662c05660a775f5b72ebe9ba");

      if (user.roles.equals(targetRoleId)) {
        const users = await User.find({ roles: roleId }).populate("roles").populate("company");
        return res.json({ success: true, length: users.length, data: users });
      } else {
        const users = await User.find({ roles: roleId, company: user.company })
          .populate("roles")
          .populate("company");
        return res.json({ success: true, length: users.length, data: users });
      }
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ success: false, message: "Failed to get users", error: error.message });
    }
  },
  async searchUser(req, res) {
    try {
      const { mhcId, roleId } = req.body;
      const users = await User.find({ company: mhcId, roles: roleId });
      return res.json({ success: true, length: users.length, data: users });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to get users", error: error.message });
    }
  },
  async signUpRole(req, res) {
    try {
      const { user } = req;
      const targetRoleId = new mongoose.Types.ObjectId("662c05660a775f5b72ebe9ba");
      if (!user.roles.equals(targetRoleId)) {
        return res
          .status(401)
          .json({ success: false, message: "Only Blue Goat can create Role Specific Signup" });
      }

      const { firstName, password, email, roleId, permission, company } = req.body;

      const existingProfileByEmail = await User.findOne({ email, isDeleted: false });

      if (existingProfileByEmail)
        return res.status(400).json({ success: false, message: "Email already exists." });

      const roleDocument = await Role.findOne({ roleId });
      if (!roleDocument) {
        throw new Error("Role does not exist");
      }

      const hashedPassword = await BcryptUtil.getHash({ data: password });

      const userDetail = await User.create({
        firstName,
        company,
        email,
        roles: roleDocument._id,
        password: hashedPassword,
      });

      const permissionDetail = permission.map((perm) => ({
        ...perm,
        roleId: roleDocument._id,
        userId: user._id,
      }));

      const permissionData = await Permission.insertMany(permissionDetail);

      const data = userDetail.toObject();
      delete data.password;

      const mailOptions = {
        from: { name: "EMR Test", address: "junaidmalikk797@gmail.com" }, // sender address
        to: email,
        subject: "Welcome to EMR",
        html: `<p>Hello ${firstName} </p><p>Your account has been created successfully.</p><p>Email: ${email}</p><p>Password: ${password}</p>`, // HTML body
      };

      await sendEmail(transporter, mailOptions);

      return res.status(201).json({
        success: true,
        user: data,
        permission: permissionData,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
};

module.exports = AuthController;
