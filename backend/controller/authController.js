const formidable = require('formidable');
const validator = require('validator');
const registerModel = require('../models/authModel');
const path = require('path');

const jwt = require('jsonwebtoken');

const fs = require('fs');
const bcrypt = require('bcrypt');

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

                const token = jwt.sign(
                  {
                    id: userCreate._id,
                    email: userCreate.email,
                    userName: userCreate.userName,
                    image: userCreate.image,
                    registerTime: userCreate.createdAt,
                  },
                  process.env.SECRET,
                  {
                    expiresIn: process.env.TOKEN_EXP,
                  }
                );

                const options = {
                  expires: new Date(
                    Date.now() + process.env.COOKIE_EXP * 24 * 60 * 60 * 1000
                  ),
                };

                res.status(201).cookie('authToken', token, options).json({
                  successMessage: 'Your Register Successful',
                  token,
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

module.exports.userLogin = async (req, res) => {
  const error = [];
  const { email, password } = req.body;
  if (!email) {
    error.push('Please provide your Email');
  }
  if (!password) {
    error.push('Please provide your Passowrd');
  }
  if (email && !validator.isEmail(email)) {
    error.push('Please provide your Valid Email');
  }
  if (error.length > 0) {
    res.status(400).json({
      error: {
        errorMessage: error,
      },
    });
  } else {
    try {
      const checkUser = await registerModel
        .findOne({
          email: email,
        })
        .select('+password');

      if (checkUser) {
        const matchPassword = await bcrypt.compare(
          password,
          checkUser.password
        );

        if (matchPassword) {
          const token = jwt.sign(
            {
              id: checkUser._id,
              email: checkUser.email,
              userName: checkUser.userName,
              image: checkUser.image,
              registerTime: checkUser.createdAt,
            },
            process.env.SECRET,
            {
              expiresIn: process.env.TOKEN_EXP,
            }
          );
          const options = {
            expires: new Date(
              Date.now() + process.env.COOKIE_EXP * 24 * 60 * 60 * 1000
            ),
          };

          res.status(200).cookie('authToken', token, options).json({
            successMessage: 'Your Login Successful',
            token,
          });
        } else {
          res.status(400).json({
            error: {
              errorMessage: ['Your Password not Valid'],
            },
          });
        }
      } else {
        res.status(400).json({
          error: {
            errorMessage: ['Your Email Not Found'],
          },
        });
      }
    } catch {
      res.status(404).json({
        error: {
          errorMessage: ['Internal Sever Error'],
        },
      });
    }
  }
};
