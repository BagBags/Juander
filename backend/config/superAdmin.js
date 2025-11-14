const SUPER_ADMIN_EMAILS = [
  "aaronbagain@gmail.com",
  "sophiamikhaela.fabian.cics@ust.edu.ph"
];

const isSuperAdmin = (email) => {
  return SUPER_ADMIN_EMAILS.includes(email);
};

module.exports = {
  SUPER_ADMIN_EMAIL: "aaronbagain@gmail.com", // Keep for backward compatibility
  SUPER_ADMIN_EMAILS,
  isSuperAdmin,
};
