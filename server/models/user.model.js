import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        unique: 'Username already exists',
        required: "Username is required"
    },
    email: {
        type: String,
        trim: true,
        unique: 'Email already exists',
        match: [/.+\@.+\..+/, 'Please fill a valid email address'],
        required: "Email is required"
    },
    image: {
        data: { type: Buffer, default: null },
        contentType: { type: String, default: null }
    },
    admin: {
        type: Boolean,
        default: false
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },
    password: {
        type: String,
        required: "Password is required"
    }
});

UserSchema.pre('save', async function(next) {
    if (this.isModified('password') || this.isNew) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    this.updated = new Date();
    next();
});

UserSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

UserSchema.path('password').validate(function(v) {
    if (this.password && this.password.length < 6) {
        this.invalidate('password', 'Password must be at least 6 characters.');
    }
    if (this.isNew && !this.password) {
        this.invalidate('password', 'Password is required');
    }
}, null);

export default mongoose.model('User', UserSchema);
