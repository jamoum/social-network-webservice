const path = require('path');
const Post = require('../model/post').getModel;
var fileSystem = require('fs');
const mongoose = require('mongoose');
const searchService = require('../service/search-service')
const blacklistService = require('./blacklistedpost-service')
const imageUplader = require('../util/imageUploader');



const postService = {
    create: (function (req, res, next) {

        const rootPth = path.dirname(process.mainModule.filename);
        const avatar = req.files.avatar;
        const imagePath = '/images/posts/' + new Date().getTime() + '.jpg'

        
        const post = new Post({
            "user": mongoose.Types.ObjectId('5e87e715dda9d87aaf676720'),
            "content": req.body.content,
            "imageLink": imagePath,
            "audienceCriteria": JSON.parse(req.body.audienceCriteria),
            "audienceLocation": JSON.parse(new String(req.body.audienceLocation).trim()),
            "audienceFollowers": JSON.parse(req.body.audienceFollowers),
            "notifyFollowers": req.body.notifyFollowers,
            "likes": null
        });

        post.createPost().then((data) => {
            saveImage(req, imagePath).then((imageUplader)=>{
                if(imageUplader!=null){
                    res.send(req.body);
                }
                else {
                    data.imageLink=null;
                    data.save();
                }
            })
        }).catch((err) => {
            throw new Error(err);
        })


    }),
    search: (req, res) => {
        let username = req.query.query;
        let limit = parseInt(req.query.limit)
        searchService.search(username, limit, (err, doc) => {
            res.status(200).send(doc)
        })
    },
    getById: (req, res, next) => {
        const id = req.params.postId;
        Post.findById(id).then((data) => {
            res.send(data);
        }).catch((err) => { res.send(err) });
    },
    getAudienceFollowers: (req, res, next) => {
        const id = req.params.postId;
        Post.findById(id).then((data) => {
            if (data == null) {
                res.send(data);
            }
            else
                data.populate('audienceFollowers.user').execPopulate().then((data) => { res.send(data.audienceFollowers) }).catch((err) => console.log(err));
        })
    },
    getAll: async (req, res, next) => {
        const page = new Number(req.query.page);
        const limit = new Number(req.query.limit);
        let posts = await Post.find({})
            .limit(limit).skip(page * limit)
            .sort({ 'createdDate': 1 })
            .exec(function (err, docs) {
                if (err) throw new Error(err)
                res.send(docs);
            });

    },
    getlikes: (req, res, next) => {
        const id = req.params.postId;
        Post.findById(id).then((data) => {

            data.populate('likes.user').execPopulate().then((data) => { console.log(data); res.send(data.likes) }).catch((err) => console.log(err));
        })
    },

}


function ExceedUNhealthyPost(id) {
    Posts.find({ userid: new mongoose.SchemaType.ObjectId(id), healthy: false }).count().then((number) => {
        console.log(number);
    })
}
async function saveImage(req, imagePath) {
    if(req.files!=null&&req.files.avatar!=null){
    const avatar = req.files.avatar;
    imageUplader.upload(imagePath,avatar.mimetype,avatar.data,(cb) => {
      if (cb == -1) {
        return null;
      }
      else if (cb == 1) {
        return imageUplader;
      }
      
    })
  }
  
  return 0;
  }


module.exports = postService;
