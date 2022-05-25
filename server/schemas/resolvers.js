const { User } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');


const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('savedBooks');
                
                    return userData;
            }

            throw new AuthenticationError('No user found')
        }
    },

    Mutation: {
        login: async(parent, { email, password}) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);
            return { token, user }; 

        },
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user};
        },
        saveBook: async (parent, args, context) => {
            console.log(args.input);

            if(context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    {  $addToSet: { savedBooks: { input: args.input } } },
                    { new: true },
                ).populate('savedBooks');

                return updatedUser;
            }

        },
        removeBook: async (parent, args, context) => {
            console.log(args.bookId)
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id},
                    { $pull: { savedBooks: {bookId: args.bookId } } },
                    { new: true }
                    );
                return updatedUser;
            }

        }
    }
};

module.exports = resolvers;