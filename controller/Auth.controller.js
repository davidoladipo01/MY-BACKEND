const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const UserModel = require("../model/User.model")
const nodemailer = require("nodemailer")
const { welcomeEmail } = require("../utils/emailTemplates")


let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.APP_MAIL,
        pass: process.env.APP_PASSWORD
    }
});


const registerUser = async (req, res) => {
    const { firstName, lastName, userName, email, password } = req.body

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already exists.",
            });
        }

        const user = await UserModel.create({
            firstName,
            lastName,
            userName,
            email,
            password: hashedPassword,
        });

        let mailOptions = {
            from: process.env.APP_MAIL,
            to: [`${email}`, "davidoladipo2025@gmail.com"],
            subject: 'Welcome to AfriReadCo',
            // html: welcomeEmail(firstName)
            text: `
        Welcome to AfriReadCo!

        Hi ${firstName},
        Thank you for joining our reading community.
        Happy Reading!
        The AfriReadCo Team
        `,

        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.status(201).send({
            success: true,
            message: "User created successfully",
            data: user,
        })

    } catch (error) {
        console.error(error);

        return res.status(400).send({
            message: "User could not be created",
            error: error.message
        })
    }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await UserModel.findOne({ email }).select("+password")


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        const token = await jwt.sign({ id: user._id }, process.env.AUTH_SECRET, { expiresIn: "2h" })

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const { password: dbpassword, ...userWithoutPassword } = user.toObject();

        res.status(200).json({
            success: true, message: "Login Successful", data: userWithoutPassword, token
        })


    } catch (error) {
        console.error(error)

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getCurrentUser = async (req, res) => {
    try {

        const user = await UserModel
            .findById(req.user)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const logoutUser = async (req, res) => {
    try {

        return res.status(200).json({
            success: true,
            message: "Logout successful."
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser
}
