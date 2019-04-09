//Done by following TRAVERSY MEDIAs Tutorial
//https://www.youtube.com/watch?v=9Qzmri1WaaE
//Check him out: http://www.traversymedia.com

const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');



const MongoClient = require('mongodb').MongoClient;

var db;
MongoClient.connect('mongodb://localhost:27017', (err, client) => {
    if (err) return console.log(err);
    db = client.db('CADStorage') // whatever your database name is
});

// Set The Storage Engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb){
        cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init Upload
const upload = multer({
    storage: storage,
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

                console.log(req.body);


                const data = { recipeName: req.body.recipeName, recipeIngredients: req.body.recipeIngredients, recipeDescription: req.body.recipeDescription, imageUrl: "uploads/" + req.file.filename };
                db.collection('Recipes').save(data, (err, result) => {
                    if (err) return console.log(err);
                    console.log('saved to database');
                    res.render('index', {
                        msg: 'File Uploaded!',
                        file: `uploads/${req.file.filename}`
                    });
                });
            }
        }
    });
});

app.get('/view', (req, res) => {
    db.collection('Recipes').find().toArray((err, result) => {
        if (err) return console.log(err);
        // renders index.ejs
        console.log(result);
        res.render('view.ejs', {recipes: result})
    })
});

const port = 3000;

app.listen(port, () => console.log(`Server started on port ${port}`));