//Done with the help of TRAVERSY MEDIAs Tutorial
//Check him out: http://www.traversymedia.com

const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
var multerS3 = require('multer-s3');


const MongoClient = require('mongodb').MongoClient;

var db;
MongoClient.connect('mongodb://193.196.52.59:27017', (err, client) => {
    if (err) return console.log(err);
    db = client.db('CADStorage')
});



var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'recipeblogbucket',
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            cb(null, 'public/uploads/'+ file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    }),
    limits:{fileSize: 1000000},
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('myImage');

// Check File Type
function checkFileType(file, cb){
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null,true);
    } else {
        cb('Error: Images Only!');
    }
}

// Init app
const app = express();

// EJS
app.set('view engine', 'ejs');

// Public Folder
app.use(express.static('./public'));

app.get('/', (req, res) => res.render('index'));


app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if(err){
            res.render('index', {
                msg: err
            });
        } else {
            if(req.file === undefined){
                res.render('index', {
                    msg: 'Error: No File Selected!'
                });
            } else {


                const data = { recipeName: req.body.recipeName, recipeIngredients: req.body.recipeIngredients, recipeDescription: req.body.recipeDescription, imageUrl: req.file.location};
                db.collection('Recipes').save(data, (err, result) => {
                    if (err) return console.log(err);
                    console.log('saved to database');
                    res.render('index', {
                        msg: 'File Uploaded!',
                        file: `${req.file.location}`
                    });
                });
            }
        }
    });
});

app.get('/view', (req, res) => {
    db.collection('Recipes').find().toArray((err, result) => {
        if (err) return console.log(err);
        res.render('view.ejs', {recipes: result})
    })
});
const port = 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));
