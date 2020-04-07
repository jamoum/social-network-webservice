
const ObjectId = require('mongodb').ObjectId
const User = require('../model/user').getModel;

const bcrypt = require('../util/bcrypt')
const jwt = require('../util/jwt')
const path = require('path');
const imageUplader = require('../util/imageUploader');

const fservice = require('../service/filestorage-service');
const uploadPath = require('../public/upload-path').getPath;

exports.login = (function(req,res) {
    const username = req.body.username;
    const password = req.body.password;
    UserModel.findOne({$or : [{username: {$eq: username}},{email: {$eq: username}}]},function (err,user) {
      if(err) res.statusCode(403)
      let comparePassword = bcrypt.compareSync(password,user.password) 
      if(comparePassword){
        jwt.sign(user,(err,token) => {
          if(err) {
              res.status(500).send('Unable to sign token')
          }else{ 
            res.status(200).send({access_token: token})
          }
        })
      }else{
        res.sendStatus(403)
      }
    })
})

//update profile 
exports.updateProfilePic = (function (req, res, next) {
  console.log(req.files)
  let postImages = req.files.images instanceof Array ? req.files.images : [req.files.images]

  const imageName = new Date().getTime();
                try {
                    let names = fservice.prepareFiles(postImages).renameAs(new String(imageName)).upload().getNames();
                    if(names[0]!=null){
                    User.findById(req.params.userId).then((user)=>{
                      user.profilePicture = names[0];
                      console.log(imageName + " " + names[0])
                      user.save().then(()=>{
                        res.send({ data: req.body, imageUpload: { eror: true, message: "User profile picture updated succesfully" } });
                      })
                    })
                  }
                } catch (e) {
                    throw new Error(e);
                }

})

// Post to Follow  user 
exports.followUser = async function (req, res, next) {
  let userId = req.params.userId;
  let followId = req.params.followerId;
  var flag = false;

  let user = await User.findOne({ _id: userId });
  if (!user) {
    return Promise.reject('User not found');
  }

  for (let f of user.followers) {
    if (f == followId) {
      flag = true;
      break;
    }
  }
  if (flag == true) {
    res.status(200).send('following is not success');
  }
  else {
    if (userId === followId) {
      return Promise.reject('Operation denied');
    }

    User.findOne({ _id: followId }, (err, follower) => {
      if (err) {
        res.status(404).send('Unable to follow');
      }

      User.findOne({ _id: userId }, (err, user) => {
        if (err) throw err;
        user.followers.push(new ObjectId(followId));
        user.save();
      });
    });

    res.status(200).send('following  successfully');
  }

}

exports.signUp = (function (req, res, next) {
  const imagePath = new Date().getTime();

  validateUser(req.body).then((data) => {
    console.log("data " , data);
    console.log("inside vlaidate user return promise", data);
    if (data != null) {
      if (data.err == true) {
        res.send(data);
      }
      else {


        const pass = bcrypt.encodeSync(req.body.password)
       let user =  new User({
          username: req.body.username,
          email: req.body.email,
          password: pass,
          age: req.body.age,
          isActive: true,
          location: req.body.location,
          totalVoilation: 0,
          followers: [],
         profilePicture : null

        });
        
        if(req.files!=null){
        let postImages = req.files.images instanceof Array ? req.files.images : [req.files.images]

         
            try {
              let names = fservice.prepareFiles(postImages).renameAs(new String(imagePath)).upload().getNames();
              if(names[0]!=null){
                user.profilePicture= imagePath;
            }
            
          } catch (e) {
              throw new Error(e);
          }
        }
          user.save().then((err)=>{
           
              res.sendStatus(201);
            
          })
        
      }

    }
  }).catch((err) => {
    throw new Error(err);
  })
})
// Post to Unfollow  user 
exports.unfollowUser = async function (req, res, next) {
  let userId = req.params.userId;
  let followId = req.params.followerId;
  var flag = true;

  let user = await User.findOne({ _id: userId });
  if (!user) {
    return Promise.reject('User not found');
  }
  for (let f of user.followers) {
    if (f == followId) {
      flag = false;
      break;
    }
  }
  if (flag == true) {
    res.status(200).send('unfollowing is not success');
  }
  else {
    if (userId === followId) {
      return Promise.reject('Operation denied');
    }

    User.findOne({ _id: followId }, (err, follower) => {
      if (err) {
        res.status(404).send('Unable to follow');
      }

      User.findOne({ _id: userId }, (err, user) => {
        if (err) throw err;
        user.followers.remove(followId);
        user.save();
      });
    });

    res.status(200).send('unfollowing  successfully');
  }

}
exports.login = (function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({ $or: [{ username: { $eq: username } }, { email: { $eq: username } }] }, function (err, user) {
      if (err) res.statusCode(403)
      let comparePassword = bcrypt.compareSync(password, user.password)
      if (comparePassword) {
        jwt.sign(user, (err, token) => {
          if (err) {
            res.status(500).send('Unable to sign token')
          } else {
            res.status(200).send({ access_token: token })
          }
        })
      } else {
        res.sendStatus(403)
      }
    }).catch((err) => {
      throw new Error(err);
    })
  })

 async function validateUser(user) {
    const email = user.email;
    const password = user.password;
    const username = user.username;
    let result = {};
    let err = false;

    
  result.userExist = await User.findOne({ email: email }).then((data) => {
      console.log("message...........................",data)
      if (data != null) {
        result.emailExist = true;
        err = true;
      }

    })

   result.usrNameExist =  await User.findOne({ username: username }).then((data) => {
      if (data != null) {
        result.usernameTaken = true;
        err = true;
      }
    })
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email) == false) {
      result.email = { error: true, message: "you have entered invalid Email" }
      err = true;
    }

    if (password.length < 8) {
      result.password = { error: true, message: "password must be 8 or above" }
      err = true;
    }

    
  return result;  
  }


  async function saveImage(req, imagePath) {

    console.log(req.files);
    if (req.files != null && req.files.avatar != null) {
      const avatar = req.files.avatar;
      imageUplader.upload(imagePath, avatar.mimetype, avatar.data, (cb) => {
        console.log(avatar);
        if (cb == -1) {
          return -1;
        }
        else if (cb == 1) {
          return 1;
        }

      })
    }

    return 0;
  }



// delete Account
exports.deleteAccount = (req, res, next) => {
  user.remove({ _id: req.params.userId })
    .exec()
    .then(result => {
      res.status(200).json({
        message: "User deleted"
      });
    })
    .catch(err => {
      console.log(err);
     
      res.status(500).json({
        error: err
      });
    });
}
