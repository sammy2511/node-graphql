const graphql = require('graphql');
const webToken = require('jsonwebtoken');
const _ = require('lodash');
var bcrypt = require('bcryptjs');
const Note = require('../model/note');
const User = require('../model/user');
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLSchema,
    GraphQLID,
    GraphQLList,
    GraphQLBoolean,
    GraphQLDate
} = graphql;

const NoteType = new GraphQLObjectType({
    name: 'Note',
    fields: ( ) => ({
        id: { type: GraphQLID },
        text: { type: GraphQLString },
        createdOn: { type: GraphQLString },
        lastModifiedOn : { type: GraphQLString },
        isActive: { type: GraphQLBoolean },
        createdBy: { type: GraphQLID }
    })
});

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: ( ) => ({
        email: { type: GraphQLString },
        token : { type: GraphQLString }
    })
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        note: {
            type: NoteType,
            description:'Get Single note of Logged in User',
            args: { id: { type: GraphQLID } },
            resolve(parent, args,context){

                if(!context.user){
                    return new Error('User not authorized');
                }

                return Note.find({_id:args.id,createdBy:context.user.id});
            }
        },
        notes: {
            type: new GraphQLList(NoteType),
            description: 'Get all Notes of Logged in user',
            resolve(parent, args,context){

                
                if(!context.user){
                    return new Error('User not authorized');
                }

                return Note.find({isActive:true,createdBy: context.user.id});
            }
        },

        me: {
            type: UserType,
            description: 'Get Logged in User',
            resolve(parent, args ,context){
                
                if(!context.user){
                    return new Error('User not authorized');
                }

                return context.user;
            }
        }
    }
});

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addNote: {
            type: NoteType,
            description:'Add new note',
            args: {
                text: { type: GraphQLString },
            },
            resolve(parent, args,context){

                if(!context.user){
                    return new Error('User not authorized');
                }
               
                let note = new Note({
                    text: args.text,
                    createdOn: new Date(),
                    lastModifiedOn: new Date(),
                    isActive : true,
                    createdBy: context.user.id
                });
                return note.save();
            }
        },
        updateNote: {
            type: NoteType,
            description: 'Update existing note by Id',
            args: {
                id: { type : GraphQLID },
                text: { type: GraphQLString },
            },
            resolve(parent, args,context){
                //update note

                
                if(!context.user){
                    return new Error('User not authorized');
                }
               
                return Note.findOneAndUpdate({
                    _id:args.id,
                    isActive:true,
                    createdBy:context.user.id
                  },{$set:{text:args.text,lastModifiedOn:new Date()}});
            }
        },
        deleteNote: {
            type: NoteType,
            description: 'Delete note by Id',
            args: {
                id: { type : GraphQLID }
            },
            resolve(parent, args,context){
                return Note.findOneAndUpdate({
                    _id:args.id,
                    isActive:true,
                    createdBy:context.user.id
                  },{$set:{isActive:false}});
            }
        },

        signup: {
            type : UserType,
            description:'Signs up a new user by takin email and password',
            args : {
                email : { type : GraphQLString },
                password : { type : GraphQLString }
            },
            resolve: async (parent,args)=> {
                //insert user into db
                const user = new User({
                    email: args.email,
                    password: args.password
                });

                user.password = await bcrypt.hash(user.password,12);
                
                return user.save();
            }
        },

        login: {
            type: UserType,
            description: 'Login user and returns a autorization token',
            args : {
                email : { type : GraphQLString },
                password : { type : GraphQLString }
            },
            resolve: async(parent,args,{SECRET})=>{
             
                
                

                const user = await User.findOne({
                    email:args.email
                });

                
                if(!user){
                    throw new Error('User not Found');
                }
                
                //verify password
                const valid = await bcrypt.compare(args.password, user.password);
                if(!valid){
                    throw new Error('Incorrect Password');
                }
             
                //sign new Token
                const token = webToken.sign(
                    {
                      user: _.pick(user, ['id', 'email']),
                    },
                    SECRET,
                    {
                      expiresIn: '1h',
                    },
                  );

                  user.token = token;

                  
                  
              return user.save();
            }
        },

        logout:{

            type: UserType,
            description: 'Delete Auth token',
            resolve: async (parent,args,context)=>{

                return User.findOneAndUpdate({
                    email: context.user.email
                },{$set:{token:null}});

            }
        }
        
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});