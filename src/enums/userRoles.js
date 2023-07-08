const UserRoles = {
  OWNER: "OWNER",
  MEMBER: "MEMBER"
};

const getUserRoles = () => [UserRoles.OWNER, UserRoles.MEMBER];

module.exports = { UserRoles, getUserRoles };
