const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const UserModel = require("../model/User.model");

const uploadAvatar = (buffer) => {

    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(

            {
                folder: "AfriReadCo/avatars"
            },

            (error, result) => {

                if (error) return reject(error);

                resolve(result);

            }

        );

        streamifier.createReadStream(buffer).pipe(stream);

    });

};



const completeOnboarding = async (req, res) => {

    try {

        let avatarUrl = "";

        if (req.file) {

            const uploadedImage = await uploadAvatar(req.file.buffer);

            avatarUrl = uploadedImage.secure_url;

        }

        const updateData = {
            bio: req.body.bio,
            genres: JSON.parse(req.body.genres),
            favoriteAuthors: JSON.parse(req.body.favoriteAuthors),
            favoriteBooks: JSON.parse(req.body.favoriteBooks),
            readingGoal: req.body.readingGoal,
            location: req.body.location,
            timezone: req.body.timezone,
            onboardingCompleted: true
        };

        if (avatarUrl) {
            updateData.avatar = avatarUrl;
        }

       const updatedUser = await  UserModel.findByIdAndUpdate(
            req.user,
            updateData,
            { returnDocument: "after" }
        );

        // const updatedUser = await UserModel.findByIdAndUpdate(

        //     req.user,

        //     {

        //         avatar: avatarUrl,

        //         bio: req.body.bio,

        //         genres: JSON.parse(req.body.genres),

        //         favoriteAuthors: JSON.parse(req.body.favoriteAuthors),

        //         favoriteBooks: JSON.parse(req.body.favoriteBooks),

        //         readingGoal: req.body.readingGoal,

        //         location: req.body.location,

        //         timezone: req.body.timezone,

        //         onboardingCompleted: true

        //     },

        //     {

        //         returnDocument: "after"

        //     }

        // );

        res.status(200).json({

            success: true,

            message: "Onboarding completed.",

            data: updatedUser

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

module.exports = {
    completeOnboarding,
    uploadAvatar
}