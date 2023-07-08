// const crypto = require("crypto");

// const name = "nihal.codes@gmail.com";
// const hash = crypto.createHash("md5").update(name).digest("hex");

// console.log("hash : ", hash);

// const { encodeJWT, decodeJWT } = require("../src/utils/jwt");

// console.log(
//   "encode : ",
//   encodeJWT(
//     {
//       email: "nihal9ns@gmail.com"
//     },
//     { expiresIn: "1h" }
//   )
// );

// console.log(
//   "decode : ",
//   decodeJWT(
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im5paGFsOW5zQGdtYWlsLmNvbSIsImlhdCI6MTYyOTkxMjE1OSwiZXhwIjoxNjI5OTE1NzU5fQ.6b7SdobJPPPwlDaoFXMJ0F2UHeigz7O7w-rjcJQxyus"
//   )
// );

// decode :  { email: 'nihal9ns@gmail.com', iat: 1629912159, exp: 1629915759 }

// console.log("expired : ", Date.now() >= 1629915759 * 1000);

// if (Date.now() >= exp * 1000) {
//     return false;
//   }
