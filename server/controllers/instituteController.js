const Institute = require("../models/Institute");

exports.createInstitute = async (req, res) => {
  try {
    const { name, code, address, contactEmail, contactPhone } = req.body;
    if (!name || !code)
      return res.status(400).json({ message: "Name and code are required" });

    const existing = await Institute.findOne({ code: code.toUpperCase() });
    if (existing)
      return res.status(400).json({ message: "Institute code already exists" });

    const institute = await Institute.create({
      name,
      code,
      address,
      contactEmail,
      contactPhone,
      createdBy: req.user._id,
    });
    res.status(201).json(institute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.find().sort({ createdAt: -1 });
    res.json(institutes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateInstitute = async (req, res) => {
  try {
    const institute = await Institute.findById(req.params.id);
    if (!institute)
      return res.status(404).json({ message: "Institute not found" });

    const { name, address, contactEmail, contactPhone, isActive } = req.body;
    if (name) institute.name = name;
    if (address !== undefined) institute.address = address;
    if (contactEmail !== undefined) institute.contactEmail = contactEmail;
    if (contactPhone !== undefined) institute.contactPhone = contactPhone;
    if (typeof isActive === "boolean") institute.isActive = isActive;

    const updated = await institute.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteInstitute = async (req, res) => {
  try {
    const institute = await Institute.findById(req.params.id);
    if (!institute)
      return res.status(404).json({ message: "Institute not found" });
    await institute.deleteOne();
    res.json({ message: "Institute deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
