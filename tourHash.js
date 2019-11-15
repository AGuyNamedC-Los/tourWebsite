const fs = require('fs');
const bcrypt = require('bcryptjs');
const users = require('./usersTours.json');
let nRounds = 13;
let hashedUsers = [];
let start = new Date(); // timing code
console.log(`Starting password hashing with nRounds = ${nRounds}, ${start}`);

// Your code here to process the passwords
for(let user of users) {
	let passHash = bcrypt.hashSync(user.password, nRounds);
	let hashedUser = Object.assign({}, user, {passHash: passHash});
	delete hashedUser.password;
	hashedUsers.push(hashedUser);
	let verified = bcrypt.compareSync(user.password, passHash);
	console.log(verified);
}

/*
for(i = 0; i < users.length; i++) {
	let salt = bcrypt.genSaltSync(nRounds); // New salt everytime!
	let passHash = bcrypt.hashSync(`${users[i].password}`, salt);
	let newUser = {"firstName": users[i].firstName, 
				   "lastName": users[i].lastName, 
				   "email": users[i].email, 
				   "hashedPassword": passHash, 
				   "role": users[i].role}
	hashedUsers.push(newUser);
}
*/
let elapsed = new Date() - start; // timing code

console.log(`Finished password hashing, ${elapsed/1000} seconds.`);
fs.writeFileSync("userTourHash.json", JSON.stringify(hashedUsers, null, 2));