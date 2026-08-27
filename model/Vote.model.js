const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'VoteSession', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true }
}, { timestamps: true });

voteSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

vote = mongoose.model('Vote', voteSchema);

module.exports = vote;