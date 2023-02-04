const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    users: async () => {
      return await User.find({}).populate('savedBooks');
    },
    user: async (parent, args, context) => {
      if (!context.user) throw new AuthenticationError('Not logged in');
      return await User.findById(context.user._id);
    },
  },

  // Define the functions that will fulfill the mutations
  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      // Create and return the new User object
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user with this email found!');
        // TODO: throw new AuthenticationError('Invalid Credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect password!');
        // TODO: throw new AuthenticationError('Invalid Credentials');
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, args, context) => {
      if (!context.user) throw new AuthenticationError('Not logged in');
      const user = await User.findById(context.user._id);
      user.savedBooks.push({ ...args });
      await user.save();
      return user;
    },
    deleteBook: async (parent, { bookId }, context) => {
      if (!context.user) throw new AuthenticationError('Not logged in');
      const user = await User.findById(context.user._id);

      for (let i = 0; i < user.savedBooks.length; i++) {
        if (user.savedBooks[i].bookId === bookId) {
          user.savedBooks.splice(i, 1);
          await user.save();
          return user;
        }
      }
    },
  },
};

module.exports = resolvers;
