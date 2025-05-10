const { fullname, email, password, cnic, mobile, role, vehicle } = req.body;

const captain = await captainService.createCaptain({
    fullname: {
        firstname: fullname.firstname,
        lastname: fullname.lastname
    },
    email,
    password,
    cnic,
    mobile,
    role,
    vehicle
});
