require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI);

const itemSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("Item", itemSchema);


const pageSchema = new mongoose.Schema({
    name: String,
    pageItems: [itemSchema]
});
const Page = mongoose.model("Page", pageSchema);

let defaultItems = []
async function run () {
    try{
        const item1 = new Item({
            name: "Welcome to your todolist"
        });
        const item2 = new Item({
            name: "Hit + to add new items"
        });
        const item3 = new Item({
            name: "<-- hit this to delete an item"
        });
        defaultItems = [item1, item2, item3];
        await Item.insertMany(defaultItems);
        console.log("new items added successfully");

        
    } catch(err) {
        console.log(err);
    }
    
}


app.get("/", function(req, res){
    async function runHome(){
        try {
            const list = await Item.find()
            if (list.length == 0){
                run();
                res.redirect("/");
            } else {
                res.render("temp", {today: "Today", newItems: list});
            }
            
        } catch (error) {
            console.log(error);
        }
    }
    runHome();       
});



app.get("/:query", function(req, res){
    let queryName = _.capitalize(req.params.query);
    
    async function newPage (){
        try {
            const pageQuery = await Page.findOne({name: queryName});
            
            if (pageQuery == null) {
                const startingItems = await Item.find();
                const pageX = new Page({
                    name: queryName,
                    pageItems: startingItems
                 });
                await pageX.save();
                res.render("temp", {today: queryName, newItems: startingItems});
            }
            else if (queryName == pageQuery.name) {
                let startingItems = await Page.findOne({name: queryName});
                startingItems = startingItems.pageItems;
                res.render("temp", {today: queryName, newItems: startingItems});
            } else {
                const startingItems = await Item.find();
                const pageX = new Page({
                    name: queryName,
                    pageItems: startingItems
                 });
                await pageX.save();
                res.render("temp", {today: queryName, newItems: startingItems});
            }
            
        } catch (error) {
            console.log(error);
        }
        
    }
    newPage();
    

});

app.get("/about", function(req, res){
    res.render("about")
});

app.post("/", function(req, res){
    var itemNew = req.body.new;
    var pageTitle = req.body.button;
    async function newItem (){
        try {
            const itemX = new Item({
                name: itemNew
            });
            if (pageTitle == "Today") {
                await itemX.save();
                res.redirect("/");
            } else {
                const newPageItem = await Page.findOne({name: pageTitle});
                newPageItem.pageItems.push(itemX);
                await newPageItem.save();
                res.redirect("/" + pageTitle);
            }
            
        } catch (error) {
            console.log(error);
        }
    }
    newItem();
    
    
});

app.post("/delete", function(req, res){
    const itemToDelete = req.body.checkbox;
    const pageName = req.body.pageName;
    async function itemDelete(){
        try {
            if (pageName == "Today") {
                await Item.findByIdAndRemove(itemToDelete)
                console.log("successfully deleted");
                res.redirect("/");
            } else {
                await Page.findOneAndUpdate({name: pageName}, {$pull: {pageItems: {_id: itemToDelete}}});
                res.redirect("/" + pageName);
            }
            
        } catch (error) {
            console.log(error);
        }
    }
    itemDelete();
    
})



app.listen(process.env.PORT || 3000, function(){
    console.log("server started at port 3000");
});