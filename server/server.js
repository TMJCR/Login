require('./config/config')

const express = require('express');
const _ = require('lodash');
const hbs = require('hbs');
const axios = require('axios');
const cookieParser = require('cookie-parser')

const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {authenticate} = require('./middleware/authenticate')

const app = express();
const port = process.env.PORT || 3000;

hbs.registerPartials(__dirname + '../../views/partials');
hbs.registerHelper('getCurrentYear', () => {
    return new Date().getFullYear();
});

app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser())
app.use(express.static(__dirname + "../../public"));


app.get('/home', authenticate, (req,res)=>{
    var user = req.user
    res.render('home.hbs',{
        user: user
    })
})

app.get('/signup', (req, res) => {
    res.render('signup.hbs', {
        pageTitle: 'Home Page',
        welcomeMessage: 'Welcome to my site'
    });
});

app.get('/login', (req, res) => {
    res.render('login.hbs');
});

app.get('/users/me',authenticate, (req,res)=>{
    var test = req.user;
    res.render('page.hbs', {
        pageTitle: 'Page',
        welcomeMessage: test
    });
})


app.post('/signup',(req,res)=>{
    var body = _.pick(req.body,['password','firstName','lastName','email']);
    var user = new User(body);

    user.save().then(()=>{
        return user.generateAuthToken();
        }).then((token)=>{
        res.cookie('x-auth',token);
        res.redirect('/home')
        })
});


app.post('/login',(req,res)=>{
    var body = _.pick(req.body,['password','email']);
    User.findByCredentials(body.email,body.password).then((user)=>{
        console.log("hi",user)
        user.deleteToken().then((user)=>{
            console.log("hi2",user)
            user.generateAuthToken().then((token)=>{
                res.cookie('x-auth',token).redirect('home');   
            });
            console.log("hi3",user)
        })

    }).catch((e)=>{
res.status(400).send();
    });

 
});

app.delete('/logout',authenticate, (req,res)=>{
req.user.removeToken(req.token).then(()=>{
    res.status(200).send();
},()=>{
    res.status(400).send();
})
});

app.listen(port, ()=>{
    console.log(`Server Running on Port ${port}`);
})
