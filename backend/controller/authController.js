const formidable = require('formidable');
const validator = require('validator');
const registerModel = require('../models/authModel');
const path = require('path');

const fs = require('fs');
const bcrypt = require('bcrypt');
const { exit } = require('process');

module.exports.userRegister = (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    const { userName, email, password, confirmPassword } = fields;
    const normalizedUserName = Array.isArray(userName) ? userName[0] : userName;
    const normalizedEmail = Array.isArray(email) ? email[0] : email;
    const normalizedPassword = Array.isArray(password) ? password[0] : password;
    const normalizedConfirmPassword = Array.isArray(confirmPassword)
      ? confirmPassword[0]
      : confirmPassword;

    const { image } = files;
    const error = [];

    if (!normalizedUserName) {
      error.push('Please provide your user name');
    }
    if (!normalizedEmail) {
      error.push('Please provide your Email');
    }

    if (!normalizedEmail && !validator.isEmail(normalizedEmail)) {
      error.push('Please provide a valid Email');
    }

    if (!normalizedPassword) {
      error.push('Please provide your Password');
    }
    if (!confirmPassword) {
      error.push('Please provide your confirm Password');
    }
    if (
      normalizedPassword &&
      normalizedConfirmPassword &&
      normalizedPassword !== normalizedConfirmPassword
    ) {
      error.push('Passwords do not match');
    }
    if (normalizedPassword && normalizedPassword.length < 6) {
      error.push('Password must be at least 6 characters long');
    }

    if (Object.keys(files).length === 0) {
      error.push('Please provide user image');
    }

    if (error.length > 0) {
      res.status(400).json({
        error: {
          errorMessage: error,
        },
      });
    } else {
      // const getImageName = files.image[0].originalFilename; // Use files.image[0] since it's an array
      // const randNumber = Math.floor(Math.random() * 99999);
      // const newImageName = randNumber + getImageName;
      // files.image[0].originalFilename = newImageName;

      // const newPath = path.join(
      //   __dirname,
      //   '/frontend/public/image/',
      //   files.image[0].originalFilename
      // );

      // const newPath = `/Users/likan/Documents/Learn Code/project/messenger/backend/controller/frontend/public/image/${files.image[0].originalFilename}`;
      try {
        const checkUser = await registerModel.findOne({
          email: normalizedEmail,
        });

        if (checkUser) {
          res.status(404).json({
            error: {
              errorMessage: ['Your email already exists'],
            },
          });
        } else {
          // Check if the image filepath is defined before using fs.copyFile
          if (files.image && files.image[0].filepath) {
            //file copy change to s3 later
            //  fs.copyFile(files.image[0].filepath, newPath, async (error) => {

            if (error.length === 0) {
              try {
                // Create user after successful file copy

                const userCreate = await registerModel.create({
                  userName: normalizedUserName,
                  email: normalizedEmail,
                  password: await bcrypt.hash(normalizedPassword, 10),
                  image: 'abcd',
                });

                console.log('User created successfully:', userCreate);
              } catch (error) {
                console.error('Error creating user:', error);
                res.status(500).json({
                  error: {
                    errorMessage: ['Internal Server Error'],
                    details: error.message,
                  },
                });
              }
            }
            //  });
          } else {
            // Handle the case where files.image or files.image[0].filepath is undefined
            res.status(400).json({
              error: {
                errorMessage: ['Image file is missing in the form data'],
              },
            });
          }
        }
      } catch (error) {
        res.status(500).json({
          error: {
            errorMessage: ['Internal Server Error'],
            details: error.message,
          },
        });
      }
    }
  });
};
