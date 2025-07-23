import mongoose from 'mongoose' // import mongoose

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            uppercase: true
        },
        password: {
            type: String,
            required: true,
            min: [8, "Password should contain 8 letter"],
            max: [28, "Password should under 28 letter"],
        },

    },
    {
        timestamps: true
    }
); // created userSchema

export const User = mongoose.model('User', userSchema); // created User model and exported it